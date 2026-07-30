import"server-only";import{and,eq,isNull}from"drizzle-orm";import{realEstateIntegrationInstallations,realEstateMlsEntityMappings,realEstateMlsSyncCursors}from"@/lib/db/schema";import{db}from"../repositories";import type{MlsSyncType}from"./types";
const uid=(k:string)=>`re_${k}_${crypto.randomUUID()}`,now=()=>new Date().toISOString();
export interface MlsChangeRecord{externalId:string;updatedAt:string;data:Record<string,unknown>}
export interface MlsSyncAdapter{fetchChanges(cursor:string|null):Promise<{records:MlsChangeRecord[];nextCursor:string|null}>}
// Provider-neutral: no vendor-specific scraping ships here. An installation whose provider has no
// registered adapter (the default) falls back safely to a no-op sync — zero records, cursor unchanged.
const NULL_ADAPTER:MlsSyncAdapter={async fetchChanges(){return{records:[],nextCursor:null}}};
const adapters=new Map<string,MlsSyncAdapter>();
export function registerMlsAdapter(providerKey:string,adapter:MlsSyncAdapter){adapters.set(providerKey,adapter)}
export function unregisterMlsAdapter(providerKey:string){adapters.delete(providerKey)}

async function cursorRow(tenantId:string,organizationId:string,installationId:string,providerKey:string,syncType:MlsSyncType){
  const existing=(await db().select().from(realEstateMlsSyncCursors).where(and(eq(realEstateMlsSyncCursors.tenantId,tenantId),eq(realEstateMlsSyncCursors.installationId,installationId),eq(realEstateMlsSyncCursors.syncType,syncType))).limit(1))[0];
  if(existing)return existing;
  return(await db().insert(realEstateMlsSyncCursors).values({id:uid("mlscursor"),tenantId,organizationId,installationId,providerKey,syncType,status:"idle"}).onConflictDoNothing().returning())[0]||(await db().select().from(realEstateMlsSyncCursors).where(and(eq(realEstateMlsSyncCursors.tenantId,tenantId),eq(realEstateMlsSyncCursors.installationId,installationId),eq(realEstateMlsSyncCursors.syncType,syncType))).limit(1))[0];
}

export async function runIncrementalSync(tenantId:string,installationId:string,syncType:MlsSyncType){
  const installation=(await db().select().from(realEstateIntegrationInstallations).where(and(eq(realEstateIntegrationInstallations.id,installationId),eq(realEstateIntegrationInstallations.tenantId,tenantId),isNull(realEstateIntegrationInstallations.deletedAt))).limit(1))[0];
  if(!installation)throw new Error("Integration installation unavailable");
  const cursor=await cursorRow(tenantId,installation.organizationId,installationId,installation.providerKey,syncType);
  const adapter=adapters.get(installation.providerKey)||NULL_ADAPTER;
  await db().update(realEstateMlsSyncCursors).set({status:"running",lastRunAt:now(),updatedAt:now()}).where(eq(realEstateMlsSyncCursors.id,cursor.id));
  try{
    const{records,nextCursor}=await adapter.fetchChanges(cursor.cursor);
    let conflicts=0;
    for(const record of records){
      const mapped=(await db().select().from(realEstateMlsEntityMappings).where(and(eq(realEstateMlsEntityMappings.tenantId,tenantId),eq(realEstateMlsEntityMappings.installationId,installationId),eq(realEstateMlsEntityMappings.entityType,syncType),eq(realEstateMlsEntityMappings.externalId,record.externalId))).limit(1))[0];
      const conflict=Boolean(mapped?.lastSyncedAt&&mapped.externalUpdatedAt&&new Date(record.updatedAt)<new Date(mapped.externalUpdatedAt));
      if(conflict)conflicts++;
      await db().insert(realEstateMlsEntityMappings).values({id:uid("mlsmap"),tenantId,installationId,entityType:syncType,internalId:mapped?.internalId||`unmapped:${record.externalId}`,externalId:record.externalId,externalUpdatedAt:record.updatedAt,conflictStatus:conflict?"detected":"none",conflictDetails:conflict?{incoming:record.updatedAt,stored:mapped?.externalUpdatedAt}:{},lastSyncedAt:now()}).onConflictDoUpdate({target:[realEstateMlsEntityMappings.tenantId,realEstateMlsEntityMappings.installationId,realEstateMlsEntityMappings.entityType,realEstateMlsEntityMappings.externalId],set:{externalUpdatedAt:record.updatedAt,conflictStatus:conflict?"detected":"none",lastSyncedAt:now(),updatedAt:now()}});
    }
    await db().update(realEstateMlsSyncCursors).set({status:"idle",cursor:nextCursor,recordsProcessed:cursor.recordsProcessed+records.length,lastSuccessAt:now(),lastErrorCode:null,lastErrorMessage:null,updatedAt:now()}).where(eq(realEstateMlsSyncCursors.id,cursor.id));
    return{processed:records.length,conflicts,nextCursor};
  }catch(error){
    const message=error instanceof Error?error.message.slice(0,300):"Sync failed";
    await db().update(realEstateMlsSyncCursors).set({status:"error",lastErrorCode:"sync_failed",lastErrorMessage:message,updatedAt:now()}).where(eq(realEstateMlsSyncCursors.id,cursor.id));
    throw error;
  }
}
export async function listSyncState(tenantId:string,installationId:string){
  return db().select().from(realEstateMlsSyncCursors).where(and(eq(realEstateMlsSyncCursors.tenantId,tenantId),eq(realEstateMlsSyncCursors.installationId,installationId)));
}
export async function listConflicts(tenantId:string,installationId:string){
  return db().select().from(realEstateMlsEntityMappings).where(and(eq(realEstateMlsEntityMappings.tenantId,tenantId),eq(realEstateMlsEntityMappings.installationId,installationId),eq(realEstateMlsEntityMappings.conflictStatus,"detected")));
}
export async function resolveConflict(tenantId:string,mappingId:string,internalId:string){
  return(await db().update(realEstateMlsEntityMappings).set({internalId,conflictStatus:"resolved",updatedAt:now()}).where(and(eq(realEstateMlsEntityMappings.id,mappingId),eq(realEstateMlsEntityMappings.tenantId,tenantId))).returning())[0]||null;
}
