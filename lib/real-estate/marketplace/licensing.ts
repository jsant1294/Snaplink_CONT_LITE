import"server-only";import{and,eq}from"drizzle-orm";import{realEstateAuditEvents,realEstateTenantLicenses}from"@/lib/db/schema";import{db}from"../repositories";import{LICENSE_FEATURES,type LicenseFeature}from"./types";
const uid=(k:string)=>`re_${k}_${crypto.randomUUID()}`,now=()=>new Date().toISOString();
// Features that predate Phase 10 licensing stay usable for existing tenants unless explicitly
// revoked. Newly gated platform surfaces (marketplace, enterprise admin) default to off until granted.
export function legacyLicenseDefault(feature:string){return!["marketplace","enterprise"].includes(feature)}
export async function listLicenses(tenantId:string){
  const rows=await db().select().from(realEstateTenantLicenses).where(eq(realEstateTenantLicenses.tenantId,tenantId));
  const byFeature=new Map(rows.map(r=>[r.feature,r]));
  return LICENSE_FEATURES.map(feature=>byFeature.get(feature)||{id:null,tenantId,feature,isEnabled:legacyLicenseDefault(feature),limits:{},updatedAt:null});
}
export async function hasFeature(tenantId:string,feature:LicenseFeature):Promise<boolean>{
  const row=(await db().select().from(realEstateTenantLicenses).where(and(eq(realEstateTenantLicenses.tenantId,tenantId),eq(realEstateTenantLicenses.feature,feature))).limit(1))[0];
  return row?row.isEnabled:legacyLicenseDefault(feature);
}
export async function setLicense(scope:{tenantId:string;organizationId:string},membershipId:string,feature:string,input:{isEnabled:boolean;limits?:Record<string,number>}){
  if(!LICENSE_FEATURES.includes(feature as LicenseFeature))throw new Error("Unknown feature");
  const limits=input.limits&&typeof input.limits==="object"?input.limits:{};
  const row=(await db().insert(realEstateTenantLicenses).values({id:uid("license"),tenantId:scope.tenantId,feature,isEnabled:input.isEnabled,limits,grantedByMembershipId:membershipId}).onConflictDoUpdate({target:[realEstateTenantLicenses.tenantId,realEstateTenantLicenses.feature],set:{isEnabled:input.isEnabled,limits,grantedByMembershipId:membershipId,updatedAt:now()}}).returning())[0];
  await db().insert(realEstateAuditEvents).values({id:uid("audit"),tenantId:scope.tenantId,organizationId:scope.organizationId,actorType:"membership",actorMembershipId:membershipId,action:"license_changed",resourceType:"tenant_license",resourceId:row.id,safeMetadata:{feature,isEnabled:input.isEnabled}});
  return row;
}
