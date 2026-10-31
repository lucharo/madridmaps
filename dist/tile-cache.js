// Cache only public IGN images, never application HTML or authentication.
const CACHE='madrid-ign-tiles-v1';
// A sampled 256px PNG is 137 KB: 64 MiB retains roughly ten 48-tile views.
const BUDGET=64*1024*1024;
// Keep upstream work within the common six-connection HTTP/1 browser budget.
const CONCURRENCY=6;
let active=0,generation=0,writeChain=Promise.resolve();
const waiting=[],inflight=new Map(),refreshed=new Set();
const metrics={hits:0,misses:0,retries:0,peak:0};
const storage=caches.open(CACHE).catch(()=>null);
const index=storage.then(async cache=>{
  const entries=new Map();if(cache)for(const key of await cache.keys())entries.set(key.url,Number((await cache.match(key))?.headers.get('X-Madrid-Bytes'))||0);
  return entries;
});
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
async function limited(task,signal){
  if(active>=CONCURRENCY)await new Promise(resolve=>waiting.push(resolve));else active++;
  metrics.peak=Math.max(metrics.peak,active);
  try{if(signal?.aborted)throw new DOMException('Cancelled','AbortError');return await task();}
  finally{const next=waiting.shift();if(next)next();else active--;}
}
async function store(url,response,startedGeneration){
  const cache=await storage;if(!cache)return;
  // Serialize writes and eviction so parallel downloads cannot overrun the budget.
  writeChain=writeChain.catch(()=>{}).then(async()=>{
    try{
      if(startedGeneration!==generation)return;
      const entries=await index;
      const size=Number(response.headers.get('X-Madrid-Bytes'));
      await cache.put(url,response);entries.set(url,size);
      let bytes=[...entries.values()].reduce((a,b)=>a+b,0);
      for(const [key,size] of entries){if(bytes<=BUDGET)break;await cache.delete(key);entries.delete(key);bytes-=size;}
    }catch{/* Storage full or disabled must not prevent viewing. */}
  });
  await writeChain;
}
async function clearTiles(){
  // Invalidate older downloads before waiting for queued writes to finish.
  generation++;
  const cleared=writeChain.catch(()=>{}).then(async()=>{
    const cache=await storage;
    if(cache)for(const key of await cache.keys())await cache.delete(key);
    (await index).clear();refreshed.clear();
    return {ok:true,bytes:0,tiles:0,budget:BUDGET};
  });
  writeChain=cleared;return cleared;
}
function validImage(bytes,type){
  const b=new Uint8Array(bytes);
  if(type.includes('image/png'))return b.length>24&&b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&new DataView(bytes).getUint32(16)===256&&new DataView(bytes).getUint32(20)===256;
  return type.includes('image/jpeg')&&b.length>3&&b[0]===255&&b[1]===216&&b[b.length-2]===255&&b[b.length-1]===217;
}
async function download(url,signal,startedGeneration){
  let failure;
  // One automatic retry for transport errors, 408/429, or upstream 5xx; never loop.
  for(let attempt=0;attempt<2;attempt++){
    try{
      const response=await limited(async()=>{
        const result=await fetch(url,{mode:'cors',credentials:'omit',signal});
        if(!result.ok){const error=new Error(`IGN returned ${result.status}`);error.retryable=result.status===408||result.status===429||result.status>=500;throw error;}
        const type=result.headers.get('Content-Type')||'',bytes=await result.arrayBuffer();
        if(!validImage(bytes,type)){const error=new Error('IGN did not return a map image');error.retryable=false;throw error;}
        let decoded=false;
        if(typeof self.createImageBitmap==='function'){
          try{
            const image=await self.createImageBitmap(new Blob([bytes],{type}));
            const valid=image.width===256&&image.height===256;image.close();
            if(!valid)throw new Error('Wrong tile dimensions');decoded=true;
          }catch{const error=new Error('IGN image could not decode');error.retryable=false;throw error;}
        }
        return new Response(bytes,{headers:{'Content-Type':type,'X-Madrid-Bytes':String(bytes.byteLength),'X-Madrid-Decoded':decoded?'1':'0'}});
      },signal);
      if(response.headers.get('X-Madrid-Decoded')==='1')await store(url,response.clone(),startedGeneration);
      return response;
    }catch(error){failure=error;if(error.name==='AbortError'||error.retryable===false||attempt===1)break;metrics.retries++;}
  }
  throw failure;
}
function fetchTile(url,signal,startedGeneration){
  if(!inflight.has(url)){
    const work=download(url,signal,startedGeneration).finally(()=>inflight.delete(url));inflight.set(url,work);
  }
  return inflight.get(url).then(response=>response.clone());
}
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!=='https://www.ign.es'||!['/wmts/planos','/wmts/mapa-raster'].includes(url.pathname))return;
  // Include requests still waiting for CacheStorage lookup when clearing starts.
  const startedGeneration=generation;
  event.respondWith((async()=>{
    try{
      const cache=await storage,cached=await cache?.match(url.href);
      if(cached?.headers.get('X-Madrid-Decoded')==='1'){
        metrics.hits++;
        // Modern cartography may change. Refresh once per worker lifetime while serving immediately.
        if(url.pathname==='/wmts/mapa-raster'&&!refreshed.has(url.href)){
          refreshed.add(url.href);event.waitUntil(fetchTile(url.href,event.request.signal,startedGeneration).catch(()=>{}));
        }
        return cached;
      }
      metrics.misses++;return await fetchTile(url.href,event.request.signal,startedGeneration);
    }catch{return new Response('IGN map tile unavailable',{status:503});}
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='clear-tiles')event.waitUntil(clearTiles().then(result=>event.ports[0]?.postMessage(result)).catch(()=>event.ports[0]?.postMessage({ok:false})));
  if(event.data?.type==='tile-metrics')event.waitUntil(index.then(entries=>event.ports[0]?.postMessage({...metrics,active,queued:waiting.length,bytes:[...entries.values()].reduce((a,b)=>a+b,0),tiles:entries.size,budget:BUDGET})));
});
