export const ENTERPRISE_NODE_TYPES=["franchise","region","brokerage","office","team"]as const;
export type EnterpriseNodeType=typeof ENTERPRISE_NODE_TYPES[number];
export const PUBLIC_API_RESOURCES=["properties","leads","buyers","sellers","transactions","documents","appointments","messages","tasks","contacts"]as const;
export type PublicApiResource=typeof PUBLIC_API_RESOURCES[number];
export const OUTBOUND_EVENTS=["transaction.created","transaction.updated","offer.accepted","closing.completed","document.uploaded","portal.invitation","ai.review.completed"]as const;
export const API_SCOPES=PUBLIC_API_RESOURCES.flatMap(r=>[`${r}:read`,`${r}:write`]);
export type ApiPrincipal={tenantId:string;organizationId:string;scopes:string[];apiKeyId?:string;oauthGrantId?:string};
