import { and, eq, isNull, sql } from "drizzle-orm";
import { realEstateJobs, realEstateNotifications, realEstateOperationalIncidents, realEstateProviderHealthChecks } from "@/lib/db/schema";
import type { DataScope } from "../access";
import { db } from "../repositories";
import { safeIntegrationStatus } from "./config";
const id=(k:string)=>`re_${k}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`,now=()=>new Date().toISOString();
export async function refreshIntegrationHealth(scope:DataScope){
  const safe=safeIntegrationStatus(),providers=[["resend",safe.emailProvider==="resend"&&safe.emailConfigured],["sendgrid",safe.emailProvider==="sendgrid"&&safe.emailConfigured],["twilio",safe.smsProvider==="twilio"&&safe.smsConfigured],["google_calendar",safe.googleConfigured],["microsoft_calendar",safe.microsoftConfigured],["webhooks",safe.webhookReady],["job_processor",safe.jobsReady]] as const;
  const rows=[];for(const[provider,configured]of providers)rows.push((await db().insert(realEstateProviderHealthChecks).values({id:id("health"),tenantId:scope.tenantId,provider,status:configured?"healthy":"unconfigured",lastSuccessAt:configured?now():null,latencyMs:0}).returning())[0]);
  const dead=(await db().select({count:sql<number>`count(*)::int`}).from(realEstateJobs).where(and(eq(realEstateJobs.tenantId,scope.tenantId),eq(realEstateJobs.status,"dead_letter"),isNull(realEstateJobs.deletedAt))))[0]?.count||0;
  if(dead>=Number(process.env.REAL_ESTATE_DEAD_LETTER_ALERT_THRESHOLD||5))await openIncident(scope.tenantId,"dead_letter_threshold","dead_letter","critical",`${dead} jobs require dead-letter review`);
  return rows;
}
export async function openIncident(tenantId:string|null,key:string,type:string,severity:string,message:string){const existing=(await db().select().from(realEstateOperationalIncidents).where(and(eq(realEstateOperationalIncidents.incidentKey,key),eq(realEstateOperationalIncidents.status,"open"))).limit(1))[0];if(existing)return existing;const incident=(await db().insert(realEstateOperationalIncidents).values({id:id("incident"),tenantId,incidentKey:key,type,severity,safeMessage:message,lastNotifiedAt:now()}).returning())[0];if(tenantId)await db().insert(realEstateNotifications).values({id:id("notification"),tenantId,type:"system",priority:severity==="critical"?"high":"normal",title:"Integration reliability alert",message,href:"/real-estate/settings/integrations"});return incident;}
