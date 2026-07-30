import"server-only";import{and,desc,eq,isNull}from"drizzle-orm";import{realEstateIntegrationInstallations,realEstateProviderHealthChecks}from"@/lib/db/schema";import{db}from"../repositories";import{PROVIDER_CATALOG}from"./types";
const uid=(k:string)=>`re_${k}_${crypto.randomUUID()}`,now=()=>new Date().toISOString();
export function findProviderDefinition(key:string){return PROVIDER_CATALOG.find(p=>p.key===key)||null}
export function isVersionCompatible(installedVersion:string,catalogVersion:string){const major=(v:string)=>Number(String(v).split(".")[0]||0);return major(installedVersion)===major(catalogVersion)}
export async function recordProviderHealth(providerKey:string,tenantId:string|null,status:"healthy"|"degraded"|"unconfigured"|"error",input:{latencyMs?:number;safeFailureCode?:string;safeFailureMessage?:string}={}){
  return(await db().insert(realEstateProviderHealthChecks).values({id:uid("health"),tenantId,provider:providerKey,status,latencyMs:input.latencyMs??0,lastSuccessAt:status==="healthy"?now():null,lastFailureAt:status==="error"?now():null,safeFailureCode:input.safeFailureCode,safeFailureMessage:input.safeFailureMessage}).returning())[0];
}
// Safe fallback: an installation without a live registered adapter/credential is reported
// "unconfigured" rather than attempting an unauthenticated network call to a third-party endpoint.
export async function checkInstallationHealth(tenantId:string,installationId:string){
  const installation=(await db().select().from(realEstateIntegrationInstallations).where(and(eq(realEstateIntegrationInstallations.id,installationId),eq(realEstateIntegrationInstallations.tenantId,tenantId),isNull(realEstateIntegrationInstallations.deletedAt))).limit(1))[0];
  if(!installation)return recordProviderHealth("unknown",tenantId,"error",{safeFailureCode:"installation_not_found",safeFailureMessage:"Integration installation was not found"});
  const definition=findProviderDefinition(installation.providerKey);
  if(!definition)return recordProviderHealth(installation.providerKey,tenantId,"error",{safeFailureCode:"unknown_provider",safeFailureMessage:"Provider is not registered in the catalog"});
  if(installation.status!=="configured")return recordProviderHealth(installation.providerKey,tenantId,"unconfigured");
  const installedVersion=String((installation.safeConfiguration as Record<string,unknown>)?._version||"0.0.0");
  if(!isVersionCompatible(installedVersion,definition.version))return recordProviderHealth(installation.providerKey,tenantId,"degraded",{safeFailureCode:"version_incompatible",safeFailureMessage:"Installed configuration version no longer matches the provider catalog"});
  return recordProviderHealth(installation.providerKey,tenantId,installation.credentialReference?"healthy":"unconfigured");
}
export async function listProviderHealth(tenantId:string){
  return db().select().from(realEstateProviderHealthChecks).where(eq(realEstateProviderHealthChecks.tenantId,tenantId)).orderBy(desc(realEstateProviderHealthChecks.checkedAt)).limit(50);
}
// Additive observability surface for Phase 10: writes into the same generic health-check table
// Phase 6 integration providers already use, so /api/real-estate/enterprise/[operation=observability]
// (provider_health bucket) covers marketplace installations without any Phase 6/9 code changing.
export async function refreshMarketplaceHealth(scope:{tenantId:string;organizationId:string}){
  const installations=await db().select().from(realEstateIntegrationInstallations).where(and(eq(realEstateIntegrationInstallations.tenantId,scope.tenantId),eq(realEstateIntegrationInstallations.organizationId,scope.organizationId),isNull(realEstateIntegrationInstallations.deletedAt)));
  const rows=[];for(const installation of installations)rows.push(await checkInstallationHealth(scope.tenantId,installation.id));
  return rows;
}
