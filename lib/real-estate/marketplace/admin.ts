import"server-only";import{and,desc,eq,gt,isNull,or}from"drizzle-orm";import{realEstateFeatureRollouts,realEstateOperationalIncidents,realEstatePlatformAnnouncements,realEstateTenantLifecycleEvents}from"@/lib/db/schema";import{db}from"../repositories";import{opaqueId}from"../enterprise/security";import{openIncident}from"../integrations/health";import type{RolloutStrategy}from"./types";
const uid=(k:string)=>`re_${k}_${crypto.randomUUID()}`,now=()=>new Date().toISOString();
const LIFECYCLE_EVENTS=["activated","suspended","reinstated","offboarded"]as const;
export async function recordTenantLifecycleEvent(tenantId:string,eventType:typeof LIFECYCLE_EVENTS[number],actorEmail:string,reason?:string){
  if(!LIFECYCLE_EVENTS.includes(eventType))throw new Error("Invalid lifecycle event");
  return(await db().insert(realEstateTenantLifecycleEvents).values({id:uid("lifecycle"),tenantId,eventType,reason,actorEmail,safeMetadata:{}}).returning())[0];
}
export async function tenantLifecycleHistory(tenantId:string){
  return db().select().from(realEstateTenantLifecycleEvents).where(eq(realEstateTenantLifecycleEvents.tenantId,tenantId)).orderBy(desc(realEstateTenantLifecycleEvents.createdAt)).limit(100);
}
export async function openPlatformIncident(input:{key:string;type:string;severity:string;message:string;tenantId?:string|null}){
  return openIncident(input.tenantId??null,input.key,input.type,input.severity,input.message);
}
export async function resolveIncident(incidentId:string){
  return(await db().update(realEstateOperationalIncidents).set({status:"resolved",resolvedAt:now()}).where(and(eq(realEstateOperationalIncidents.id,incidentId),eq(realEstateOperationalIncidents.status,"open"))).returning())[0]||null;
}
export async function listIncidents(tenantId?:string|null){
  return db().select().from(realEstateOperationalIncidents).where(tenantId?or(eq(realEstateOperationalIncidents.tenantId,tenantId),isNull(realEstateOperationalIncidents.tenantId)):undefined).orderBy(desc(realEstateOperationalIncidents.openedAt)).limit(100);
}
export async function setFeatureRollout(membershipId:string,input:{featureKey:string;strategy:RolloutStrategy;rolloutPercentage?:number;allowlistTenantIds?:string[]}){
  if(!input.featureKey?.trim())throw new Error("featureKey is required");
  const percentage=Math.min(100,Math.max(0,Number(input.rolloutPercentage||0)));
  return(await db().insert(realEstateFeatureRollouts).values({id:uid("rollout"),featureKey:input.featureKey.trim(),strategy:input.strategy,rolloutPercentage:percentage,allowlistTenantIds:input.allowlistTenantIds||[],updatedByMembershipId:membershipId}).onConflictDoUpdate({target:[realEstateFeatureRollouts.featureKey],set:{strategy:input.strategy,rolloutPercentage:percentage,allowlistTenantIds:input.allowlistTenantIds||[],updatedByMembershipId:membershipId,updatedAt:now()}}).returning())[0];
}
export async function listFeatureRollouts(){return db().select().from(realEstateFeatureRollouts)}
export function rolloutBucket(tenantId:string,featureKey:string):number{
  let hash=0;const value=`${featureKey}:${tenantId}`;
  for(let i=0;i<value.length;i++)hash=(hash*31+value.charCodeAt(i))>>>0;
  return hash%100;
}
export async function isRolledOut(featureKey:string,tenantId:string):Promise<boolean>{
  const row=(await db().select().from(realEstateFeatureRollouts).where(and(eq(realEstateFeatureRollouts.featureKey,featureKey),eq(realEstateFeatureRollouts.isActive,true))).limit(1))[0];
  if(!row)return false;
  if(row.strategy==="all")return true;
  if(row.strategy==="allowlist")return row.allowlistTenantIds.includes(tenantId);
  if(row.strategy==="percentage")return rolloutBucket(tenantId,row.featureKey)<row.rolloutPercentage;
  return false;
}
export async function publishAnnouncement(membershipId:string,input:{title:string;body:string;severity?:string;audience?:"all"|"tenant";tenantId?:string;expiresAt?:string}){
  if(!input.title?.trim()||!input.body?.trim())throw new Error("Title and body are required");
  return(await db().insert(realEstatePlatformAnnouncements).values({id:uid("announcement"),externalId:opaqueId("announcement"),title:input.title.trim().slice(0,160),body:input.body.trim().slice(0,2000),severity:["info","warning","critical"].includes(input.severity||"")?input.severity:"info",audience:input.audience==="tenant"?"tenant":"all",tenantId:input.audience==="tenant"?input.tenantId:null,expiresAt:input.expiresAt,createdByMembershipId:membershipId}).returning())[0];
}
export async function activeAnnouncements(tenantId:string){
  const timestamp=now();
  return db().select().from(realEstatePlatformAnnouncements).where(and(or(eq(realEstatePlatformAnnouncements.audience,"all"),eq(realEstatePlatformAnnouncements.tenantId,tenantId)),or(isNull(realEstatePlatformAnnouncements.expiresAt),gt(realEstatePlatformAnnouncements.expiresAt,timestamp)))).orderBy(desc(realEstatePlatformAnnouncements.publishedAt)).limit(20);
}
