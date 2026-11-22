import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, CalendarDays, BookOpen } from "lucide-react";
import { duaProfiles, findDuaProfile, type DuaProfile } from "../data/duaProfiles";
import { useCollection } from "../state/Collection";
import { DuaCard } from "./DuaCard";
import { ScheduleDialog } from "./ScheduleDialog";
import { DiscoverSections } from "./DiscoverSections";

function ProfileIdentity({ profile, detail }: { profile: DuaProfile; detail?: boolean }) {
  const Title = detail ? "h1" : "h2";
  return <div className="profile-identity">
    <img
      className="profile-avatar"
      src={`/assets/dua-profiles/${profile.id}.png`}
      alt=""
      width={160}
      height={160}
      loading={detail ? "eager" : "lazy"}
      decoding="async"
    />
    <div>
      <span className="profile-arabic" lang="ar" dir="rtl">{profile.arabic}</span>
      <Title>{profile.title}</Title>
    </div>
  </div>;
}

function duaCount(count: number) {
  return `${count} ${count === 1 ? "du’a" : "du’as"}`;
}

export function DuaProfilesPage() {
  const { profileId } = useParams();
  const collection = useCollection();
  const profile = profileId ? findDuaProfile(profileId) : undefined;
  const [followedOnly, setFollowedOnly] = useState(false);
  const [scheduling, setScheduling] = useState<DuaProfile>();
  const existingSchedule = (id: string) => collection.data.schedules.find(
    schedule => schedule.target.kind === "profile" && schedule.target.id === id,
  );

  function profileActions(item: DuaProfile, count: number, detail = false) {
    const following = collection.data.followedProfiles.includes(item.id);
    return <div className="profile-actions">
      {!detail && <Link className="underlined" to={`/discover/profiles/${item.id}`}>
        View collection <ArrowUpRight size={15} aria-hidden="true" />
      </Link>}
      <button type="button" className="profile-button" disabled={!count} onClick={() => setScheduling(item)}>
        <CalendarDays size={16} aria-hidden="true" />
        {existingSchedule(item.id) ? "Edit reminder" : "Add to Calendar"}
      </button>
      <button type="button" className="underlined" aria-pressed={following} disabled={!count}
        onClick={() => collection.toggleProfile(item.id)}>
        {following ? "Following" : "Follow"}
      </button>
    </div>;
  }

  const profiles = followedOnly
    ? duaProfiles.filter(item => collection.data.followedProfiles.includes(item.id))
    : duaProfiles;
  const items = profile ? collection.targetItems({ kind: "profile", id: profile.id }) : [];

  return <main className="section page profile-page">
    <div className="section-heading">
      {profile
        ? <><ProfileIdentity profile={profile} detail /><p>{profile.description}</p></>
        : <><h1>Du’a Profiles</h1><p>Find a collection for what you’re going through.</p></>}
    </div>
    <DiscoverSections />
    {profile ? <>
      <Link className="underlined profile-back" to="/discover/profiles">← All profiles</Link>
      <p className="profile-detail-count">{duaCount(items.length)}</p>
      {profileActions(profile, items.length, true)}
      {items.length ? <div className="dua-grid">{items.map(dua => <DuaCard key={dua.id} dua={dua} />)}</div>
        : <section className="profile-coming-soon">
          <BookOpen size={24} aria-hidden="true" />
          <h2>Coming soon</h2>
          <p>This collection is being prepared. Following and calendar reminders will be available when du’as are added.</p>
        </section>}
    </> : profileId ? <div className="empty">
      <h2>Profile unavailable</h2><Link className="underlined" to="/discover/profiles">View all profiles</Link>
    </div> : <>
      <div className="filters profile-filters" aria-label="Filter profiles">
        <button type="button" aria-pressed={!followedOnly} className={!followedOnly ? "selected" : ""} onClick={() => setFollowedOnly(false)}>All profiles</button>
        <button type="button" aria-pressed={followedOnly} className={followedOnly ? "selected" : ""} onClick={() => setFollowedOnly(true)}>Following</button>
      </div>
      {profiles.length ? <div className="profile-grid">{profiles.map(item => {
        const count = collection.targetItems({ kind: "profile", id: item.id }).length;
        return <article className="profile-card" key={item.id}>
          <ProfileIdentity profile={item} />
          <p>{item.description}</p>
          <p className="profile-meta">{item.categories.join(" · ")} <span>· {duaCount(count)}</span></p>
          {count === 0 && <p className="profile-preparing"><strong>Coming soon</strong> · This collection is being prepared.</p>}
          {profileActions(item, count)}
        </article>;
      })}</div> : <div className="empty"><p>{collection.data.followedProfiles.length
        ? "No followed profiles are currently available to browse."
        : "You haven’t followed any profiles yet."}</p>
        <button type="button" className="underlined" onClick={() => setFollowedOnly(false)}>Browse profiles</button></div>}
    </>}
    {scheduling && <ScheduleDialog
      target={{ kind: "profile", id: scheduling.id }}
      initial={existingSchedule(scheduling.id)}
      onClose={() => setScheduling(undefined)}
    />}
  </main>;
}
