import { useEffect, useRef, useState } from "react";
import type { OrganizerData } from "../data/organizer";
import { emptyData } from "./organizerStorage";
import { readCloud, writeCloud, type CloudSnapshot } from "./cloudRepository";

type Status = "loading" | "saved" | "syncing" | "load-error" | "write-error" | "conflict";
type Pending = { data: OrganizerData; mutationId: string };
type Recovery = { confirmed: CloudSnapshot; desired: OrganizerData; pending: Pending | null };
const recoveryByOwner = new Map<string, Recovery>();

export function useCloudOrganizer(owner: string | undefined) {
  const [data, setData] = useState(emptyData);
  const [state, setState] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const confirmed = useRef<CloudSnapshot | null>(null);
  const desired = useRef(data);
  const pending = useRef<Pending | null>(null);
  const running = useRef(false);
  const active = useRef(false);
  const blocked = useRef(false);

  useEffect(() => {
    if (!owner) return;
    let current = true;
    active.current = true;
    confirmed.current = null;
    pending.current = null;
    blocked.current = false;
    setState("loading");
    const recovery = recoveryByOwner.get(owner);
    if (recovery) {
      confirmed.current = recovery.confirmed;
      desired.current = recovery.desired;
      pending.current = recovery.pending;
      setData(recovery.desired);
      setState("write-error");
    } else readCloud(owner).then(snapshot => {
      if (!current) return;
      confirmed.current = snapshot;
      desired.current = snapshot.data;
      setData(snapshot.data);
      setState("saved");
    }, () => {
      if (current) setState("load-error");
    });
    return () => {
      current = false;
      active.current = false;
    };
  }, [owner, attempt]);

  const hasPending = desired.current !== confirmed.current?.data && confirmed.current !== null;
  useEffect(() => {
    if (!hasPending) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = true; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasPending]);

  async function flush() {
    if (!owner || !confirmed.current || running.current || blocked.current) return;
    running.current = true;
    setState("syncing");
    try {
      while (active.current && desired.current !== confirmed.current.data) {
        const previous = confirmed.current;
        const write: Pending = pending.current ?? { data: desired.current, mutationId: crypto.randomUUID() };
        pending.current = write;
        recoveryByOwner.set(owner, { confirmed: previous, desired: desired.current, pending: write });
        const result = await writeCloud(owner, previous, write.data, write.mutationId);
        if (!active.current) return;
        if (result.status === "conflict") {
          blocked.current = true;
          setState("conflict");
          return;
        }
        confirmed.current = { data: write.data, revision: result.revision, mutationId: write.mutationId };
        pending.current = null;
        if (write.data === desired.current) recoveryByOwner.delete(owner);
        else recoveryByOwner.set(owner, { confirmed: confirmed.current, desired: desired.current, pending: null });
      }
      if (active.current) setState("saved");
    } catch {
      if (active.current) setState("write-error");
    } finally {
      running.current = false;
    }
  }

  function update(change: (current: OrganizerData) => OrganizerData) {
    if (!owner || !confirmed.current || blocked.current) return false;
    const next = change(desired.current);
    if (next === desired.current) return true;
    desired.current = next;
    recoveryByOwner.set(owner, { confirmed: confirmed.current, desired: next, pending: pending.current });
    setData(next);
    void flush();
    return true;
  }

  return {
    owner, data, state, update, ready: confirmed.current !== null && !blocked.current,
    hasPending,
    canImport: confirmed.current?.revision === 0,
    retry: () => void flush(),
    discardRecovery: () => { if (owner) recoveryByOwner.delete(owner); },
    reload: () => {
      if (!running.current) {
        if (owner) recoveryByOwner.delete(owner);
        const empty = emptyData();
        desired.current = empty;
        setData(empty);
        setAttempt(value => value + 1);
      }
    },
  };
}
