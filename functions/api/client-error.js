const ALLOWED_ORIGINS=new Set([
 'https://kaliiii-na.ru',
 'https://www.kaliiii-na.ru',
 'https://kaliina.pages.dev',
]);

const corsHeaders=origin=>({
 'Access-Control-Allow-Origin':origin,
 'Access-Control-Allow-Methods':'POST, OPTIONS',
 'Access-Control-Allow-Headers':'Content-Type',
 'Access-Control-Max-Age':'86400',
 'Vary':'Origin',
 'Cache-Control':'no-store',
});
const clean=(value,limit)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,limit);
const allowedOrigin=request=>{
 const origin=request.headers.get('Origin')||'';
 return ALLOWED_ORIGINS.has(origin)?origin:'';
};

export async function onRequestOptions({request}){
 const origin=allowedOrigin(request);
 if(!origin)return new Response(null,{status:403});
 return new Response(null,{status:204,headers:corsHeaders(origin)});
}

export async function onRequestPost({request,env}){
 const origin=allowedOrigin(request);
 if(!origin)return new Response(null,{status:403});
 const length=Number(request.headers.get('Content-Length')||0);
 if(length>16384)return new Response(null,{status:413,headers:corsHeaders(origin)});
 let input;
 try{input=await request.json()}catch{return new Response(null,{status:400,headers:corsHeaders(origin)})}
 if(input?.project!=='kaliina-site')return new Response(null,{status:400,headers:corsHeaders(origin)});
 const event={
  event:'client_error',
  kind:clean(input.kind,40),
  message:clean(input.message,500),
  stack:clean(input.stack,4000),
  source:clean(input.source,500),
  page:clean(input.page,500),
  userAgent:clean(input.userAgent,300),
  timestamp:clean(input.timestamp,40),
 };
 if(!env?.ERRORS_DB)return new Response(null,{status:503,headers:corsHeaders(origin)});
 try{
  await env.ERRORS_DB.prepare(`INSERT INTO client_errors
   (kind,message,stack,source,page,user_agent,reported_at)
   VALUES (?,?,?,?,?,?,?)`).bind(
    event.kind,event.message,event.stack,event.source,event.page,event.userAgent,event.timestamp,
   ).run();
 }catch(error){console.error('client_error_storage_failed',error);return new Response(null,{status:500,headers:corsHeaders(origin)})}
 console.error(JSON.stringify(event));
 return new Response(null,{status:204,headers:corsHeaders(origin)});
}

export function onRequest(){return new Response('Method Not Allowed',{status:405,headers:{Allow:'POST, OPTIONS'}})}

