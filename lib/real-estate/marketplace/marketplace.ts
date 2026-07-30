import"server-only";import{and,eq,isNull}from"drizzle-orm";import{realEstateAuditEvents,realEstateIntegrationInstallations}from"@/lib/db/schema";import{db}from"../repositories";import{opaqueId}from"../enterprise/security";import{encryptSecret}from"../integrations/crypto";import{findProviderDefinition,isVersionCompatible}from"./providers";import{PROVIDER_CATALOG}from"./types";
const uid=(k:string)=>`re_${k}_${crypto.randomUUID()}`,now=()=>new Date().toISOString();
export function marketplaceCatalog(){return PROVIDER_CATALOG}
export function permissionReview(providerKey:string){const definition=findProviderDefinition(providerKey);return definition?{providerKey,category:definition.category,capabilities:definition.capabilities,requiredScopes:definition.requiredScopes}:null}
export function checkVersionCompatibility(providerKey:string,installedVersion:string){const definition=findProviderDefinition(providerKey);return definition?isVersionCompatible(installedVersion,definition.version):false}
export async function listInstallations(scope:{tenantId:string;organizationId:string}){
  return db().select().from(realEstateIntegrationInstallations).where(and(eq(realEstateIntegrationInstallations.tenantId,scope.tenantId),eq(realEstateIntegrationInstallations.organizationId,scope.organizationId),isNull(realEstateIntegrationInstallations.deletedAt)));
}
export async function installProvider(scope:{tenantId:string;organizationId:string},membershipId:string,input:{providerKey:string;scopes:string[];configuration?:Record<string,unknown>;apiKey?:string}){
  const definition=findProviderDefinition(input.providerKey);
  if(!definition)throw new Error("Unknown marketplace provider");
  const scopes=(Array.isArray(input.scopes)?input.scopes:[]).filter(s=>definition.requiredScopes.includes(s));
  if(!scopes.length)throw new Error("At least one valid provider scope is required");
  const configuration:Record<string,unknown>={};
  for(const field of definition.configFields)if(input.configuration&&typeof input.configuration[field]==="string")configuration[field]=input.configuration[field];
  const key=process.env.REAL_ESTATE_INTEGRATION_ENCRYPTION_KEY;
  const credentialReference=input.apiKey&&key?encryptSecret(input.apiKey,key):undefined;
  const row=(await db().insert(realEstateIntegrationInstallations).values({id:uid("install"),tenantId:scope.tenantId,organizationId:scope.organizationId,externalId:opaqueId("install"),providerKey:definition.key,displayName:definition.displayName,status:"configured",scopes,safeConfiguration:{...configuration,_version:definition.version},credentialReference,createdByMembershipId:membershipId}).onConflictDoUpdate({target:[realEstateIntegrationInstallations.tenantId,realEstateIntegrationInstallations.organizationId,realEstateIntegrationInstallations.providerKey],set:{status:"configured",scopes,safeConfiguration:{...configuration,_version:definition.version},credentialReference,deletedAt:null,updatedAt:now()}}).returning())[0];
  await db().insert(realEstateAuditEvents).values({id:uid("audit"),tenantId:scope.tenantId,organizationId:scope.organizationId,actorType:"membership",actorMembershipId:membershipId,action:"integration_installed",resourceType:"integration_installation",resourceId:row.id,safeMetadata:{providerKey:definition.key,scopes}});
  return{...row,credentialReference:undefined};
}
export async function configureInstallation(scope:{tenantId:string;organizationId:string},membershipId:string,installationId:string,input:{configuration?:Record<string,unknown>;scopes?:string[]}){
  const existing=(await db().select().from(realEstateIntegrationInstallations).where(and(eq(realEstateIntegrationInstallations.id,installationId),eq(realEstateIntegrationInstallations.tenantId,scope.tenantId),isNull(realEstateIntegrationInstallations.deletedAt))).limit(1))[0];
  if(!existing)throw new Error("Integration installation unavailable");
  const definition=findProviderDefinition(existing.providerKey);
  const configuration:Record<string,unknown>={...existing.safeConfiguration};
  if(input.configuration&&definition)for(const field of definition.configFields)if(typeof input.configuration[field]==="string")configuration[field]=input.configuration[field];
  const scopes=input.scopes&&definition?input.scopes.filter(s=>definition.requiredScopes.includes(s)):existing.scopes;
  const row=(await db().update(realEstateIntegrationInstallations).set({safeConfiguration:configuration,scopes,updatedAt:now()}).where(and(eq(realEstateIntegrationInstallations.id,installationId),eq(realEstateIntegrationInstallations.tenantId,scope.tenantId))).returning())[0];
  await db().insert(realEstateAuditEvents).values({id:uid("audit"),tenantId:scope.tenantId,organizationId:scope.organizationId,actorType:"membership",actorMembershipId:membershipId,action:"integration_configured",resourceType:"integration_installation",resourceId:installationId,safeMetadata:{scopes}});
  return{...row,credentialReference:undefined};
}
export async function setInstallationEnabled(scope:{tenantId:string;organizationId:string},membershipId:string,installationId:string,enabled:boolean){
  const row=(await db().update(realEstateIntegrationInstallations).set({status:enabled?"configured":"disabled",updatedAt:now()}).where(and(eq(realEstateIntegrationInstallations.id,installationId),eq(realEstateIntegrationInstallations.tenantId,scope.tenantId),isNull(realEstateIntegrationInstallations.deletedAt))).returning())[0];
  if(!row)throw new Error("Integration installation unavailable");
  await db().insert(realEstateAuditEvents).values({id:uid("audit"),tenantId:scope.tenantId,organizationId:scope.organizationId,actorType:"membership",actorMembershipId:membershipId,action:enabled?"integration_enabled":"integration_disabled",resourceType:"integration_installation",resourceId:installationId,safeMetadata:{}});
  return{...row,credentialReference:undefined};
}
export async function uninstallProvider(scope:{tenantId:string;organizationId:string},membershipId:string,installationId:string){
  const row=(await db().update(realEstateIntegrationInstallations).set({status:"disabled",deletedAt:now(),updatedAt:now()}).where(and(eq(realEstateIntegrationInstallations.id,installationId),eq(realEstateIntegrationInstallations.tenantId,scope.tenantId),isNull(realEstateIntegrationInstallations.deletedAt))).returning())[0];
  if(!row)throw new Error("Integration installation unavailable");
  await db().insert(realEstateAuditEvents).values({id:uid("audit"),tenantId:scope.tenantId,organizationId:scope.organizationId,actorType:"membership",actorMembershipId:membershipId,action:"integration_uninstalled",resourceType:"integration_installation",resourceId:installationId,safeMetadata:{providerKey:row.providerKey}});
  return true;
}
