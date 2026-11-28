import { useState } from "react";
import { Link } from "react-router-dom";
import { useCollection } from "../state/Collection";
import { hasOrganizerData } from "../state/cloudProtocol";
import { readOrganizerStorage } from "../state/organizerBackup";
import { duas } from "../data/duas";
import "./account.css";

const migrationOwnerKey = "ijabah.organizer.migration-owner";

const messages = {
  loading: "Loading your account organizer…",
  saved: "Organizer saved to your account.",
  syncing: "Syncing changes to your account…",
  "load-error": "Could not load your account organizer. Try again to enable editing.",
  "write-error": "Changes are still in this tab. Retry syncing or export a backup before closing it.",
  conflict: "Another device changed your organizer. Export your changes before loading the newer account copy.",
};

export function CloudOrganizerStatus() {
  const { cloud } = useCollection();
  const [declined, setDeclined] = useState(false);
  const [problem, setProblem] = useState("");
  const [guest] = useState(() => {
    if (!cloud) return null;
    try {
      const owner = localStorage.getItem(migrationOwnerKey);
      if (owner && owner !== cloud.owner) return null;
    } catch { return null; }
    return readOrganizerStorage(() => localStorage, duas);
  });
  if (!cloud) return null;
  let browserOwner: string | null;
  try { browserOwner = localStorage.getItem(migrationOwnerKey); }
  catch { browserOwner = null; }
  const showOffer = (!browserOwner || browserOwner === cloud.owner) && !declined && guest?.status === "ready" && hasOrganizerData(guest.data) && cloud.state === "saved";
  const emptyCloud = cloud.canImport;

  function importGuest() {
    if (!cloud || cloud.state !== "saved" || !cloud.canImport || guest?.status !== "ready") return;
    setProblem("");
    const latest = readOrganizerStorage(() => localStorage, duas);
    if (latest.status !== "ready" || latest.raw !== guest.raw) {
      setProblem("Browser data changed since this offer opened. Reload to review the current copy.");
      return;
    }
    try {
      const previous = localStorage.getItem(migrationOwnerKey);
      if (previous && previous !== cloud.owner) {
        setProblem("This browser organizer was already assigned to another account.");
        return;
      }
      if (!cloud.owner) return;
      localStorage.setItem(migrationOwnerKey, cloud.owner);
      if (cloud.update(() => latest.data)) setDeclined(true);
    } catch {
      setProblem("Browser storage is unavailable. Export your guest organizer before trying again.");
    }
  }

  return <aside className="cloud-organizer" aria-label="Account synchronization">
    <p role="status">{messages[cloud.state]}</p>
    {cloud.state === "write-error" && <button className="underlined" onClick={cloud.retry}>Retry sync</button>}
    {(cloud.state === "load-error" || cloud.state === "conflict") && <button className="underlined" onClick={() => {
      if (!cloud.hasPending || window.confirm("Load the account copy and discard the unsynced changes in this tab?")) cloud.reload();
    }}>{cloud.state === "conflict" ? "Load account copy" : "Retry loading"}</button>}
    {cloud.hasPending && <p><Link to="/my-duas#organizer-backup-heading">Export a recovery backup</Link></p>}
    {showOffer && <>
      <h2>Save your existing du’as to your account</h2>
      <p>{guest.data.ids.length} saved du’as, {guest.data.personal.length} personal du’as, {guest.data.collections.length} collections, and {guest.data.schedules.length} schedules. Calendar selections and followed profiles are included.</p>
      <p>Your original stays in this browser. {emptyCloud
        ? "Confirm to upload this copy to Supabase."
        : "Your account already has an organizer. Both copies are preserved. To export the browser copy, sign out and open Backup & recovery in My Du’as."}</p>
      {emptyCloud && <button className="button" onClick={importGuest}>Save to my account</button>}
      <button className="underlined" onClick={() => setDeclined(true)}>Not now</button>
    </>}
    {problem && <p role="alert">{problem}</p>}
  </aside>;
}
