export type SnapLinkApiError={errors:Array<{status:string;code:string;title:string}>;meta:{requestId:string;apiVersion:string}};
export type SnapLinkList<T>={data:Array<{type:string;id:string;attributes:T}>;links:{next:string|null};meta:{count:number;requestId:string;apiVersion:string}};
export class SnapLinkRealEstateClient{
 constructor(private readonly options:{baseUrl:string;apiKey:string;fetch?:typeof fetch}){}
 async list<T>(resource:string,input:{cursor?:string;limit?:number;sort?:string;fields?:string[]}={}):Promise<SnapLinkList<T>>{const url=new URL(`/api/v1/${resource}`,this.options.baseUrl);if(input.cursor)url.searchParams.set("page[cursor]",input.cursor);if(input.limit)url.searchParams.set("page[limit]",String(input.limit));if(input.sort)url.searchParams.set("sort",input.sort);if(input.fields?.length)url.searchParams.set(`fields[${resource}]`,input.fields.join(","));const response=await(this.options.fetch||fetch)(url,{headers:{authorization:`Bearer ${this.options.apiKey}`}}),body=await response.json();if(!response.ok)throw Object.assign(new Error(body.errors?.[0]?.title||"SnapLink API request failed"),{response:body as SnapLinkApiError});return body}
}
