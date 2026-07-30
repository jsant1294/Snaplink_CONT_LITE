import"server-only";import{randomBytes}from"node:crypto";import{resolveTxt}from"node:dns/promises";import{and,eq}from"drizzle-orm";import{realEstateAuditEvents,realEstateCustomDomains,realEstateTenantBranding}from"@/lib/db/schema";import{db}from"../repositories";
const uid=(k:string)=>`re_${k}_${crypto.randomUUID()}`,now=()=>new Date().toISOString();
const hex=(v?:string)=>!v||/^#[0-9a-fA-F]{3,8}$/.test(v);
const str=(v:unknown)=>typeof v==="string"&&v.trim()?v.trim().slice(0,300):undefined;
export async function getBranding(scope:{tenantId:string;organizationId:string}){
  return(await db().select().from(realEstateTenantBranding).where(and(eq(realEstateTenantBranding.tenantId,scope.tenantId),eq(realEstateTenantBranding.organizationId,scope.organizationId))).limit(1))[0]||null;
}
export async function saveBranding(scope:{tenantId:string;organizationId:string},membershipId:string,input:Record<string,unknown>){
  for(const field of["primaryColor","secondaryColor","accentColor","pwaThemeColor"])if(!hex(input[field]as string|undefined))throw new Error(`${field} must be a valid hex color`);
  const values={logoUrl:str(input.logoUrl),faviconUrl:str(input.faviconUrl),primaryColor:str(input.primaryColor),secondaryColor:str(input.secondaryColor),accentColor:str(input.accentColor),fontFamily:str(input.fontFamily),emailFromName:str(input.emailFromName),emailLogoUrl:str(input.emailLogoUrl),loginHeadline:str(input.loginHeadline),portalHeadline:str(input.portalHeadline),pwaName:str(input.pwaName),pwaThemeColor:str(input.pwaThemeColor),updatedByMembershipId:membershipId,updatedAt:now()};
  const existing=await getBranding(scope);
  const row=existing?(await db().update(realEstateTenantBranding).set(values).where(eq(realEstateTenantBranding.id,existing.id)).returning())[0]:(await db().insert(realEstateTenantBranding).values({id:uid("branding"),tenantId:scope.tenantId,organizationId:scope.organizationId,...values}).returning())[0];
  await db().insert(realEstateAuditEvents).values({id:uid("audit"),tenantId:scope.tenantId,organizationId:scope.organizationId,actorType:"membership",actorMembershipId:membershipId,action:"branding_updated",resourceType:"tenant_branding",resourceId:row.id,safeMetadata:{}});
  return row;
}
const reservedHosts=new Set(["localhost","snaplink.com","www.snaplink.com"]);
const domainPattern=/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
export async function registerCustomDomain(scope:{tenantId:string;organizationId:string},membershipId:string,domain:string){
  const host=String(domain||"").trim().toLowerCase();
  if(!domainPattern.test(host)||reservedHosts.has(host))throw new Error("A valid, non-reserved domain is required");
  const token=`slk-verify-${randomBytes(16).toString("hex")}`;
  const row=(await db().insert(realEstateCustomDomains).values({id:uid("domain"),tenantId:scope.tenantId,organizationId:scope.organizationId,domain:host,verificationToken:token,createdByMembershipId:membershipId}).onConflictDoNothing().returning())[0];
  if(!row)throw new Error("Domain is already registered");
  await db().insert(realEstateAuditEvents).values({id:uid("audit"),tenantId:scope.tenantId,organizationId:scope.organizationId,actorType:"membership",actorMembershipId:membershipId,action:"custom_domain_registered",resourceType:"custom_domain",resourceId:row.id,safeMetadata:{domain:host}});
  return row;
}
export async function listCustomDomains(scope:{tenantId:string;organizationId:string}){
  return db().select().from(realEstateCustomDomains).where(and(eq(realEstateCustomDomains.tenantId,scope.tenantId),eq(realEstateCustomDomains.organizationId,scope.organizationId)));
}
// Ownership is proven by an authoritative DNS TXT lookup — the caller's claimed verification
// state is never trusted, matching the "never trust client-provided scope" posture used platform-wide.
export async function verifyCustomDomain(scope:{tenantId:string;organizationId:string},id:string){
  const row=(await db().select().from(realEstateCustomDomains).where(and(eq(realEstateCustomDomains.id,id),eq(realEstateCustomDomains.tenantId,scope.tenantId))).limit(1))[0];
  if(!row)throw new Error("Domain unavailable");
  let verified=false;
  try{const records=await resolveTxt(`_snaplink-verify.${row.domain}`);verified=records.flat().some(v=>v.trim()===row.verificationToken);}catch{verified=false}
  return(await db().update(realEstateCustomDomains).set({status:verified?"verified":"failed",verifiedAt:verified?now():null,lastCheckedAt:now(),updatedAt:now()}).where(eq(realEstateCustomDomains.id,id)).returning())[0];
}
