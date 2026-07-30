import"server-only";import{and,desc,eq,gte,lte}from"drizzle-orm";import{realEstateAuditEvents,realEstateBillingInvoices,realEstateBillingPlans,realEstateBillingSubscriptions,realEstateBillingUsageRecords}from"@/lib/db/schema";import{db}from"../repositories";import{opaqueId}from"../enterprise/security";
const uid=(k:string)=>`re_${k}_${crypto.randomUUID()}`,now=()=>new Date().toISOString();
export const BILLING_PERIODS=["monthly","annual","usage"]as const;
export type BillingPeriod=typeof BILLING_PERIODS[number];

// Payment-processor abstraction, mirrored on the ProductionEmailProvider/SmsProvider pattern in
// lib/real-estate/integrations/providers.ts: pluggable client, safe preview fallback outside
// production or when nothing is registered. No processor, contract, or pricing is hardcoded here —
// registerPaymentProcessor() is how a real production integration (out of this phase's scope) plugs in.
export interface PaymentChargeResult{success:boolean;processor:string;externalReference?:string|null;status:"paid"|"pending"|"failed";safeErrorMessage?:string|null}
export interface PaymentProcessor{charge(input:{amountCents:number;currency:string;externalCustomerReference:string|null;idempotencyKey:string}):Promise<PaymentChargeResult>}
class PreviewPaymentProcessor implements PaymentProcessor{async charge(input:{amountCents:number;currency:string;externalCustomerReference:string|null;idempotencyKey:string}):Promise<PaymentChargeResult>{return{success:true,processor:"preview",status:"paid",externalReference:`preview_${input.idempotencyKey}`}}}
let liveProcessor:PaymentProcessor|null=null;
export function registerPaymentProcessor(processor:PaymentProcessor){liveProcessor=processor}
export function unregisterPaymentProcessor(){liveProcessor=null}
function activeProcessor():PaymentProcessor{return process.env.NODE_ENV==="production"&&liveProcessor?liveProcessor:new PreviewPaymentProcessor()}

export async function createBillingPlan(membershipId:string,input:{name:string;billingPeriod:string;amountCents:number;currency?:string;meteredUnit?:string;providerKey?:string}){
  if(!input.name?.trim()||!BILLING_PERIODS.includes(input.billingPeriod as BillingPeriod)||!Number.isInteger(input.amountCents)||input.amountCents<0)throw new Error("Valid name, billing period, and a non-negative integer amountCents are required");
  return(await db().insert(realEstateBillingPlans).values({id:uid("plan"),providerKey:input.providerKey,name:input.name.trim().slice(0,120),billingPeriod:input.billingPeriod,amountCents:input.amountCents,currency:(input.currency||"usd").toLowerCase().slice(0,3),meteredUnit:input.meteredUnit,createdByMembershipId:membershipId}).returning())[0];
}
export async function listBillingPlans(){return db().select().from(realEstateBillingPlans).where(eq(realEstateBillingPlans.isActive,true))}
export async function deactivatePlan(planId:string){return(await db().update(realEstateBillingPlans).set({isActive:false,updatedAt:now()}).where(eq(realEstateBillingPlans.id,planId)).returning())[0]||null}

export async function subscribeTenant(scope:{tenantId:string;organizationId:string},membershipId:string,input:{planId:string;installationId?:string}){
  const plan=(await db().select().from(realEstateBillingPlans).where(and(eq(realEstateBillingPlans.id,input.planId),eq(realEstateBillingPlans.isActive,true))).limit(1))[0];
  if(!plan)throw new Error("Billing plan unavailable");
  const periodEnd=plan.billingPeriod==="annual"?new Date(Date.now()+365*86400_000).toISOString():new Date(Date.now()+30*86400_000).toISOString();
  const row=(await db().insert(realEstateBillingSubscriptions).values({id:uid("sub"),tenantId:scope.tenantId,organizationId:scope.organizationId,planId:plan.id,installationId:input.installationId,status:"active",currentPeriodEnd:periodEnd,createdByMembershipId:membershipId}).returning())[0];
  await db().insert(realEstateAuditEvents).values({id:uid("audit"),tenantId:scope.tenantId,organizationId:scope.organizationId,actorType:"membership",actorMembershipId:membershipId,action:"billing_subscribed",resourceType:"billing_subscription",resourceId:row.id,safeMetadata:{planId:plan.id}});
  return row;
}
export async function listSubscriptions(scope:{tenantId:string;organizationId:string}){
  return db().select().from(realEstateBillingSubscriptions).where(and(eq(realEstateBillingSubscriptions.tenantId,scope.tenantId),eq(realEstateBillingSubscriptions.organizationId,scope.organizationId)));
}
export async function cancelSubscription(scope:{tenantId:string;organizationId:string},membershipId:string,subscriptionId:string){
  const row=(await db().update(realEstateBillingSubscriptions).set({status:"canceled",canceledAt:now(),updatedAt:now()}).where(and(eq(realEstateBillingSubscriptions.id,subscriptionId),eq(realEstateBillingSubscriptions.tenantId,scope.tenantId))).returning())[0];
  if(!row)throw new Error("Subscription unavailable");
  await db().insert(realEstateAuditEvents).values({id:uid("audit"),tenantId:scope.tenantId,organizationId:scope.organizationId,actorType:"membership",actorMembershipId:membershipId,action:"billing_canceled",resourceType:"billing_subscription",resourceId:subscriptionId,safeMetadata:{}});
  return row;
}
export async function recordUsage(tenantId:string,subscriptionId:string,meteredUnit:string,quantity=1){
  return(await db().insert(realEstateBillingUsageRecords).values({id:uid("usage"),tenantId,subscriptionId,meteredUnit,quantity:Math.max(1,Math.trunc(quantity))}).returning())[0];
}
export async function generateInvoice(scope:{tenantId:string},subscriptionId:string){
  const sub=(await db().select().from(realEstateBillingSubscriptions).where(and(eq(realEstateBillingSubscriptions.id,subscriptionId),eq(realEstateBillingSubscriptions.tenantId,scope.tenantId))).limit(1))[0];
  if(!sub)throw new Error("Subscription unavailable");
  const plan=(await db().select().from(realEstateBillingPlans).where(eq(realEstateBillingPlans.id,sub.planId)).limit(1))[0];
  if(!plan)throw new Error("Billing plan unavailable");
  const periodStart=sub.currentPeriodStart,periodEnd=sub.currentPeriodEnd||now();
  const lineItems:Array<Record<string,unknown>>=[{description:plan.name,amountCents:plan.amountCents}];
  let amountDueCents=plan.amountCents;
  if(plan.billingPeriod==="usage"&&plan.meteredUnit){
    const usage=await db().select().from(realEstateBillingUsageRecords).where(and(eq(realEstateBillingUsageRecords.subscriptionId,sub.id),gte(realEstateBillingUsageRecords.occurredAt,periodStart),lte(realEstateBillingUsageRecords.occurredAt,periodEnd)));
    const quantity=usage.reduce((sum,row)=>sum+row.quantity,0);
    amountDueCents=quantity*plan.amountCents;
    lineItems.push({description:`${plan.meteredUnit} usage`,quantity,unitAmountCents:plan.amountCents});
  }
  const invoice=(await db().insert(realEstateBillingInvoices).values({id:uid("invoice"),tenantId:scope.tenantId,subscriptionId:sub.id,externalId:opaqueId("inv"),periodStart,periodEnd,amountDueCents,currency:plan.currency,status:"open",lineItems,issuedAt:now(),dueAt:new Date(Date.now()+7*86400_000).toISOString()}).returning())[0];
  return chargeInvoice(scope.tenantId,invoice.id);
}
export async function chargeInvoice(tenantId:string,invoiceId:string){
  const invoice=(await db().select().from(realEstateBillingInvoices).where(and(eq(realEstateBillingInvoices.id,invoiceId),eq(realEstateBillingInvoices.tenantId,tenantId))).limit(1))[0];
  if(!invoice||invoice.status!=="open")return invoice||null;
  const sub=(await db().select().from(realEstateBillingSubscriptions).where(eq(realEstateBillingSubscriptions.id,invoice.subscriptionId)).limit(1))[0];
  const result=await activeProcessor().charge({amountCents:invoice.amountDueCents,currency:invoice.currency,externalCustomerReference:sub?.externalCustomerReference||null,idempotencyKey:invoice.externalId});
  return(await db().update(realEstateBillingInvoices).set({status:result.success?"paid":"open",paidAt:result.success?now():null}).where(eq(realEstateBillingInvoices.id,invoiceId)).returning())[0];
}
export async function listInvoices(scope:{tenantId:string},subscriptionId?:string){
  return db().select().from(realEstateBillingInvoices).where(and(eq(realEstateBillingInvoices.tenantId,scope.tenantId),subscriptionId?eq(realEstateBillingInvoices.subscriptionId,subscriptionId):undefined)).orderBy(desc(realEstateBillingInvoices.createdAt)).limit(100);
}
