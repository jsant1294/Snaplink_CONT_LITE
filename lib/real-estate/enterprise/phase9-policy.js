import{createHash,createHmac,timingSafeEqual}from"node:crypto";
export const NODE_ORDER={franchise:["region"],region:["brokerage"],brokerage:["office"],office:["team"],team:[]};
export function canParentValue(parent,child){return parent===null?child==="franchise":NODE_ORDER[parent]?.includes(child)===true}
export function hashCredentialValue(secret){return createHash("sha256").update(secret).digest("hex")}
export function signWebhookValue(secret,timestamp,body){return`v1=${createHmac("sha256",secret).update(`${timestamp}.${body}`).digest("hex")}`}
export function verifyWebhookValue(secret,timestamp,body,signature,now=Math.floor(Date.now()/1000)){if(Math.abs(now-timestamp)>300)return false;const expected=signWebhookValue(secret,timestamp,body);return expected.length===signature.length&&timingSafeEqual(Buffer.from(expected),Buffer.from(signature))}
export function applyQuotaValue(state,limit,month){const used=state.month===month?state.count:0;if(used>=limit)return{allowed:false,month,count:used};return{allowed:true,month,count:used+1}}
export function previewRowsValue(rows,key){const seen=new Set(),errors=[],duplicates=[];rows.forEach((row,index)=>{const value=String(row[key]||"").trim().toLowerCase();if(!value)errors.push({row:index+1,code:"missing_dedupe_key"});else if(seen.has(value))duplicates.push(index+1);else seen.add(value)});return{total:rows.length,valid:rows.length-errors.length-duplicates.length,errors,duplicates}}
