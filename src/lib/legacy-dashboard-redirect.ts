export function legacyDashboardDestination(destination:string,searchParams:Record<string,string|string[]|undefined>,defaults:Record<string,string>={}){
 const params=new URLSearchParams();
 for(const [key,value] of Object.entries(searchParams))for(const item of Array.isArray(value)?value:value===undefined?[]:[value])params.append(key,item);
 for(const [key,value] of Object.entries(defaults))params.set(key,value);
 const query=params.toString();return destination+(query?'?'+query:'');
}
