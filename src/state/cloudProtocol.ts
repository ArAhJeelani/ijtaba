import type { OrganizerData } from "../data/organizer.ts";

export function hasOrganizerData(data: OrganizerData) {
  return Boolean(data.ids.length || data.personal.length || data.collections.length ||
    data.memberships.length || data.schedules.length || data.followedProfiles.length ||
    Object.values(data.days).some((ids) => ids.length) || Object.keys(data.savedAt).length);
}

export function classifyWrite(mutationId: string, currentMutationId: string | null) {
  return mutationId === currentMutationId ? "saved" : "conflict";
}
