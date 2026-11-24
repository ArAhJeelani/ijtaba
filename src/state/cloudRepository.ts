import type { OrganizerData } from "../data/organizer";
import { duas } from "../data/duas";
import { emptyData } from "./organizerStorage";
import { parseOrganizerBackup, exportOrganizerBackup } from "./organizerBackup";
import { classifyWrite } from "./cloudProtocol";
import { supabase } from "./supabase";

export type CloudSnapshot = { data: OrganizerData; revision: number; mutationId: string | null };

export async function readCloud(owner: string): Promise<CloudSnapshot> {
  const { data, error } = await supabase!.from("organizers")
    .select("payload,revision,mutation_id").eq("owner_id", owner).maybeSingle();
  if (error) throw new Error("Could not load your account data.");
  if (!data) return { data: emptyData(), revision: 0, mutationId: null };
  return {
    data: parseOrganizerBackup(exportOrganizerBackup(data.payload), duas),
    revision: data.revision,
    mutationId: data.mutation_id,
  };
}

export async function writeCloud(owner: string, expected: CloudSnapshot, data: OrganizerData, mutationId: string) {
  const { revision } = expected;
  const changes = { payload: data, mutation_id: mutationId };
  const table = supabase!.from("organizers");
  const query = revision === 0
    ? table.insert({ owner_id: owner, ...changes })
    : table.update({ ...changes, revision: revision + 1 }).eq("owner_id", owner).eq("revision", revision).eq("mutation_id", expected.mutationId!);
  const { data: result, error } = await query.select("revision").maybeSingle();
  if (result && !error) return { status: "saved", revision: result.revision } as const;
  // A timeout can occur after PostgreSQL commits the request.
  const latest = await readCloud(owner);
  const outcome = classifyWrite(mutationId, latest.mutationId);
  if (outcome === "saved") return { status: "saved", revision: latest.revision } as const;
  if (latest.revision !== revision || latest.mutationId !== expected.mutationId) return { status: "conflict" } as const;
  throw new Error("Could not save your changes.");
}
