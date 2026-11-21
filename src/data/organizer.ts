import type {Dua} from './duas';
export type PersonalDua = Dua & {personal:true};
export const personalDuaLimits = {title: 120, prayer: 4000} as const;
export type Repeat = 'once'|'daily'|'weekdays'|'weekly'|'monthly';
export interface RecurrenceRule {frequency:Repeat; weekdays:number[]}
export type ScheduleTarget = {kind:'dua'|'collection'|'profile';id:string};
export interface DuaCollection {id:string;name:string;createdAt:string}
export interface CollectionMembership {collectionId:string;duaId:string}
export interface ScheduledDua {
  id:string;target:ScheduleTarget;date:string;time:string;recurrence:RecurrenceRule;
  note:string;paused:boolean;createdAt:string;
}
export interface OrganizerData {
  version:2;ids:string[];personal:Dua[];days:Record<string,string[]>;
  savedAt:Record<string,string>;collections:DuaCollection[];
  memberships:CollectionMembership[];schedules:ScheduledDua[];followedProfiles:string[];
}
