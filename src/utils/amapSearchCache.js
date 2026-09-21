export function createAmapSearchCache({ now=Date.now, ttl=300000, max=100 }={}) {
  const entries=new Map(), pending=new Map();let blockedUntil=0,blockedResult;
  return async (key,load)=>{
    const hit=entries.get(key);if(hit&&hit.until>now())return hit.value;
    if(blockedUntil>now())return blockedResult;
    if(pending.has(key))return pending.get(key);
    const task=Promise.resolve().then(load).then(value=>{
      if(value.status==='1'){
        entries.delete(key);if(entries.size>=max)entries.delete(entries.keys().next().value);
        entries.set(key,{until:now()+ttl,value});
      }else if(['10003','10004','10044','10045'].includes(String(value.infocode))){blockedUntil=now()+60000;blockedResult=value;}
      return value;
    }).finally(()=>pending.delete(key));pending.set(key,task);return task;
  };
}
export const cachedAmapSearch=createAmapSearchCache();
