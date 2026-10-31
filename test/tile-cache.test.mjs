import {test,expect} from 'bun:test';
import vm from 'node:vm';
const source=await Bun.file(new URL('../dist/tile-cache.js',import.meta.url)).text();
// Original IGN CC BY 4.0 tile: ParcelarioMadrid, GoogleMapsCompatible z17 x64187 y49422.
const image=await Bun.file(new URL('fixtures/tile.png',import.meta.url)).arrayBuffer();
const url='https://www.ign.es/wmts/planos?layer=ParcelarioMadrid&tilematrix=17&tilecol=64187&tilerow=49422';
function worker(fetch,{beforeMatch}={}){
  const events={},entries=new Map();
  const cache={async match(key){await beforeMatch?.();return entries.get(typeof key==='string'?key:key.url)?.clone();},async put(key,response){entries.set(String(key),response.clone());},async keys(){return [...entries.keys()].map(url=>new Request(url));},async delete(key){return entries.delete(typeof key==='string'?key:key.url);}};
  const decode=async blob=>{if(blob.size!==image.byteLength)throw new Error('Decoder rejected truncated fixture');return{width:256,height:256,close(){}};};
  vm.runInNewContext(source,{self:{createImageBitmap:decode,addEventListener:(type,fn)=>events[type]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache},fetch,Response,Request,Blob,URL,DOMException,Map,Set,Uint8Array,DataView,Promise});
  return{entries,async message(type){let reply;const work=[];events.message({data:{type},ports:[{postMessage(value){reply=value;}}],waitUntil(p){work.push(p);}});await Promise.all(work);if(!reply)throw new Error('Worker did not acknowledge '+type);return reply;},async request(target=url){let result;const background=[];events.fetch({request:new Request(target),respondWith(p){result=p;},waitUntil(p){background.push(p);}});const response=await result;await Promise.all(background);return response;}};
}
const good=()=>new Response(image.slice(0),{headers:{'Content-Type':'image/png'}});
test('visited historical tile is served without another upstream request',async()=>{
  let calls=0;const w=worker(async()=>{calls++;return good();});
  expect((await w.request()).status).toBe(200);
  expect((await w.request()).headers.get('X-Madrid-Bytes')).toBe(String(image.byteLength));
  expect(calls).toBe(1);
});
test('one transient error is retried; permanent and invalid responses are never cached',async()=>{
  let calls=0;const transient=worker(async()=>++calls===1?new Response('',{status:503}):good());
  expect((await transient.request()).status).toBe(200);expect(calls).toBe(2);
  for(const response of [new Response('',{status:400}),new Response('<ExceptionReport/>',{headers:{'Content-Type':'text/xml'}})]){
    let count=0;const w=worker(async()=>{count++;return response.clone();});
    expect((await w.request()).status).toBe(503);expect(w.entries.size).toBe(0);expect(count).toBe(1);
  }
});
test('terminal upstream failure is bounded and leaves no failed cache entry',async()=>{
  let calls=0;const w=worker(async()=>{calls++;throw new TypeError('offline');});
  expect((await w.request()).status).toBe(503);expect(calls).toBe(2);expect(w.entries.size).toBe(0);
});
test('a plausible PNG header that fails decoding cannot poison the persistent cache',async()=>{
  const bytes=new Uint8Array(25);bytes.set([137,80,78,71]);new DataView(bytes.buffer).setUint32(16,256);new DataView(bytes.buffer).setUint32(20,256);
  let count=0;const w=worker(async()=>{count++;return new Response(bytes,{headers:{'Content-Type':'image/png'}});});
  expect((await w.request()).status).toBe(503);expect(count).toBe(1);expect(w.entries.size).toBe(0);
});
test('parallel tile requests share one download and upstream concurrency stays at six',async()=>{
  let active=0,peak=0,calls=0;const gates=[];
  const w=worker(async()=>{calls++;active++;peak=Math.max(peak,active);await new Promise(r=>gates.push(r));active--;return good();});
  const requests=Array.from({length:14},(_,i)=>w.request(`${url}&test=${i}`));
  const duplicate=w.request(`${url}&test=0`);
  for(let i=0;i<50;i++){await new Promise(r=>setTimeout(r,2));gates.splice(0).forEach(r=>r());if(calls===14&&active===0)break;}
  await Promise.all([...requests,duplicate]);expect(peak).toBe(6);expect(calls).toBe(14);
});
test('oldest stored tiles are evicted when cache reaches its byte budget',async()=>{
  const w=worker(async()=>good());
  w.entries.set(`${url}&old=1`,new Response('old',{headers:{'X-Madrid-Bytes':String(64*1024*1024)}}));
  await w.request();expect([...w.entries.keys()]).toEqual([url]);
});
test('failed modern refresh keeps the last good cached image',async()=>{
  let fail=false;const w=worker(async()=>{if(fail)throw new Error('offline');return good();});
  const modern='https://www.ign.es/wmts/mapa-raster?layer=MTN&tilematrix=17&tilecol=64187&tilerow=49422';
  await w.request(modern);fail=true;
  const response=await w.request(modern);expect(response.status).toBe(200);expect(w.entries.has(modern)).toBe(true);
});
test('clear saved tiles removes stored images and forces the next visit to fetch',async()=>{
  let calls=0;const w=worker(async()=>{calls++;return good();});await w.request();
  expect(w.entries.size).toBe(1);
  expect(await w.message('clear-tiles')).toEqual({ok:true,bytes:0,tiles:0,budget:64*1024*1024});
  expect(w.entries.size).toBe(0);
  await w.request();expect(calls).toBe(2);
});
test('a download already in flight cannot refill tiles after clearing',async()=>{
  let release,started=false;const gate=new Promise(r=>{release=r;});
  const w=worker(async()=>{started=true;await gate;return good();}),pending=w.request();
  for(let i=0;i<20&&!started;i++)await new Promise(r=>setTimeout(r,1));
  expect(started).toBe(true);
  await w.message('clear-tiles');release();await pending;
  expect(w.entries.size).toBe(0);
});
test('a request waiting for its cache lookup cannot refill storage after clearing',async()=>{
  let release,started=false;const gate=new Promise(r=>{release=r;});
  const w=worker(async()=>good(),{beforeMatch:async()=>{started=true;await gate;}}),pending=w.request();
  for(let i=0;i<20&&!started;i++)await new Promise(r=>setTimeout(r,1));
  expect(started).toBe(true);
  await w.message('clear-tiles');release();await pending;
  expect(w.entries.size).toBe(0);
});
