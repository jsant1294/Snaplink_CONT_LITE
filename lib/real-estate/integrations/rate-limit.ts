const windows=new Map<string,{count:number;reset:number}>();
export function allowRequest(key:string,limit=20,windowMs=60_000){const now=Date.now(),current=windows.get(key);if(!current||current.reset<=now){windows.set(key,{count:1,reset:now+windowMs});return true}current.count++;return current.count<=limit}
