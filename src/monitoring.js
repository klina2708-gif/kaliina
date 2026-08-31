const ERROR_ENDPOINT='https://kaliina.pages.dev/api/client-error';
const MAX_REPORTS_PER_PAGE=5;
let reportsSent=0;
const fingerprints=new Set();

const cleanText=(value,limit)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,limit);
const cleanUrl=value=>{
 try{const url=new URL(value,location.href);return `${url.origin}${url.pathname}`}
 catch{return ''}
};

export function reportClientError(error,context={}){
 if(!import.meta.env.PROD)return;
 if(reportsSent>=MAX_REPORTS_PER_PAGE)return;
 const normalized=error instanceof Error?error:new Error(cleanText(error,500)||'Unknown client error');
 const payload={
  project:'kaliina-site',
  kind:cleanText(context.kind||'javascript',40),
  message:cleanText(normalized.message,500),
  stack:cleanText(normalized.stack,4000),
  source:cleanUrl(context.source||''),
  page:cleanUrl(location.href),
  userAgent:cleanText(navigator.userAgent,300),
  timestamp:new Date().toISOString(),
 };
 const fingerprint=`${payload.kind}|${payload.message}|${payload.source}`;
 if(fingerprints.has(fingerprint))return;
 fingerprints.add(fingerprint);reportsSent+=1;
 const body=JSON.stringify(payload);
 if(navigator.sendBeacon){navigator.sendBeacon(ERROR_ENDPOINT,new Blob([body],{type:'application/json'}));return}
 fetch(ERROR_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,mode:'cors'}).catch(()=>{});
}

export function startClientMonitoring(){
 window.addEventListener('error',event=>reportClientError(event.error||event.message,{kind:'window.error',source:event.filename}));
 window.addEventListener('unhandledrejection',event=>reportClientError(event.reason,{kind:'unhandledrejection'}));
}

