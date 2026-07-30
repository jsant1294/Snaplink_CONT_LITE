export function isVersionCompatibleValue(installedVersion,catalogVersion){const major=v=>Number(String(v).split(".")[0]||0);return major(installedVersion)===major(catalogVersion)}
export function rolloutBucketValue(tenantId,featureKey){let hash=0;const value=`${featureKey}:${tenantId}`;for(let i=0;i<value.length;i++)hash=(hash*31+value.charCodeAt(i))>>>0;return hash%100}
export function isValidDomainValue(domain){return/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)&&!["localhost","snaplink.com","www.snaplink.com"].includes(domain)}
export function detectSyncConflictValue(incomingUpdatedAt,storedUpdatedAt,hasPriorSync){return Boolean(hasPriorSync&&storedUpdatedAt&&new Date(incomingUpdatedAt)<new Date(storedUpdatedAt))}
export function legacyLicenseDefaultValue(feature){return!["marketplace","enterprise"].includes(feature)}
export function rolloutDecisionValue(strategy,percentage,allowlist,bucket,tenantId){if(strategy==="all")return true;if(strategy==="allowlist")return allowlist.includes(tenantId);if(strategy==="percentage")return bucket<percentage;return false}
