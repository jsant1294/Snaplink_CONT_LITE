export function shouldRevokeFamilyValue(usedAt,revokedAt){return Boolean(usedAt||revokedAt)}
export function hasRequiredScopesValue(grantedScopes,requestedScopes){return requestedScopes.every(s=>grantedScopes.includes(s))}
export function computeUsageInvoiceAmountValue(quantitySum,unitAmountCents){return Math.max(0,Math.trunc(quantitySum))*Math.max(0,Math.trunc(unitAmountCents))}
export function shouldUseLiveProcessorValue(nodeEnv,hasRegisteredProcessor){return nodeEnv==="production"&&hasRegisteredProcessor}
export function isValidBillingPlanInputValue(name,billingPeriod,amountCents){return Boolean(name&&name.trim())&&["monthly","annual","usage"].includes(billingPeriod)&&Number.isInteger(amountCents)&&amountCents>=0}
