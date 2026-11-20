import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { duaProfiles, findDuaProfile, type DuaProfile } from "../data/duaProfiles";
import { useCollection } from "../state/Collection";
import { DuaCard } from "./DuaCard";
import { ScheduleDialog } from "./ScheduleDialog";
import "./dua-profiles.css";


export function DiscoverSections() {
  const { pathname, search } = useLocation();
  const links = [
    ["/discover", "All du’as"],
    ["/discover/prophetic", "Prophetic Du’as"],
    ["/discover/profiles", "Du’a Profiles"],
  ];
  return <nav className="filters" aria-label="Du’a library sections">
    {links.map(([path, label]) => (
      <Link key={path} className="button" to={path + (path === "/discover/profiles" ? "" : search)}
        aria-current={pathname === path || (path === "/discover/profiles" && pathname.startsWith(path + "/")) ? "page" : undefined}>
        {label}
      </Link>
    ))}
  </nav>;
}

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

export function DuaProfilesPage() {
  const { profileId } = useParams();
  const collection = useCollection();
  const profile = profileId ? findDuaProfile(profileId) : undefined;
  const [followedOnly, setFollowedOnly] = useState(false);
  const [scheduling, setScheduling] = useState<DuaProfile>();
  const existingSchedule = (id: string) => collection.data.schedules.find(
    schedule => schedule.target.kind === "profile" && schedule.target.id === id,
  );

  function profileActions(item: DuaProfile, detail = false) {
    const following = collection.data.followedProfiles.includes(item.id);
    return <div className="profile-actions">
      {!detail && <Link className="underlined" to={`/discover/profiles/${item.id}`}>
        View collection <ArrowUpRight size={15} aria-hidden="true" />
      </Link>}
      <button type="button" className="profile-button" onClick={() => setScheduling(item)}>
        <CalendarDays size={16} aria-hidden="true" />
        {existingSchedule(item.id) ? "Edit reminder" : "Add to Calendar"}
      </button>
      <button type="button" className="underlined" aria-pressed={following}
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
      {profileActions(profile, true)}
      {items.length ? <div className="dua-grid">{items.map(dua => <DuaCard key={dua.id} dua={dua} />)}</div>
        : <div className="empty"><h2>This collection is being prepared.</h2>
          <p>Authentic duas for this collection will be added soon.</p></div>}
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
          <p className="profile-meta">{item.categories.join(" · ")} <span>· {count} {count === 1 ? "du’a" : "du’as"}</span></p>
          {profileActions(item)}
        </article>;
      })}</div> : <div className="empty"><p>You haven’t followed any profiles yet.</p>
        <button type="button" className="underlined" onClick={() => setFollowedOnly(false)}>Browse profiles</button></div>}
    </>}
    {scheduling && <ScheduleDialog
      target={{ kind: "profile", id: scheduling.id }}
      initial={existingSchedule(scheduling.id)}
      onClose={() => setScheduling(undefined)}
    />}
  </main>;
}
