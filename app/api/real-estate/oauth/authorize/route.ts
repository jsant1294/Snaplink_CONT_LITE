import{NextRequest,NextResponse}from"next/server";import{authorizeRealEstate}from"@/lib/real-estate/auth";import{authorizationRequestSummary,issueAuthorizationCode,recordConsent}from"@/lib/real-estate/enterprise/oauth";
const parseScopes=(v:string|null)=>(v||"").split(/[\s,]+/).filter(Boolean);
export async function GET(req:NextRequest){const p=await authorizeRealEstate(req,"settings:manage");if(!p)return NextResponse.json({error:"Access denied"},{status:403});const q=req.nextUrl.searchParams;try{return NextResponse.json(await authorizationRequestSummary({tenantId:p.tenantId},p.membershipId,{clientId:q.get("client_id")||"",redirectUri:q.get("redirect_uri")||"",scopes:parseScopes(q.get("scope"))}))}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid authorization request"},{status:400})}}
export async function POST(req:NextRequest){const p=await authorizeRealEstate(req,"settings:manage");if(!p)return NextResponse.json({error:"Access denied"},{status:403});const body=await req.json(),clientId=String(body.clientId||""),redirectUri=String(body.redirectUri||""),scopes=Array.isArray(body.scopes)?body.scopes:[],state=String(body.state||"");try{
  const summary=await authorizationRequestSummary({tenantId:p.tenantId},p.membershipId,{clientId,redirectUri,scopes});
  const url=new URL(redirectUri);
  if(body.decision!=="approve"){url.searchParams.set("error","access_denied");if(state)url.searchParams.set("state",state);return NextResponse.json({redirectUrl:url.toString()})}
  await recordConsent({tenantId:p.tenantId},p.membershipId,summary.clientId,scopes);
  const code=await issueAuthorizationCode({tenantId:p.tenantId},p.membershipId,{clientId,redirectUri,scopes});
  url.searchParams.set("code",code);if(state)url.searchParams.set("state",state);
  return NextResponse.json({redirectUrl:url.toString()});
}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid authorization decision"},{status:400})}}
