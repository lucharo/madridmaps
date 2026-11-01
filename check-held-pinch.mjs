// Only this task's isolated loopback browser; never attach to a user browser.
const endpoint=Bun.argv[2];
if(!endpoint?.startsWith('ws://127.0.0.1:'))throw new Error('Expected owned local CDP endpoint');
const socket=new WebSocket(endpoint),pending=new Map();let next=0;
socket.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}};
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
function call(method,params={},sessionId){return new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>reject(new Error(method+' timed out')),15000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
  const targets=await call('Target.getTargets'),target=targets.targetInfos.find(t=>t.type==='page'&&t.url.startsWith('http://127.0.0.1:18894/'));
  if(!target)throw new Error('Owned test page absent');
  const {sessionId}=await call('Target.attachToTarget',{targetId:target.targetId,flatten:true});
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;};
  await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2},sessionId);
  await evaluate('window.madridViewer.map.setView(window.madridViewer.current.id==="ColubiMadrid"?[40.433,-3.711]:[40.4167,-3.7033],16,{animate:false});true');
  await sleep(500);
  const box=await evaluate('(()=>{const b=document.getElementById("map").getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};})()');
  const touch=async(type,spread)=>call('Input.dispatchTouchEvent',{type,touchPoints:spread===null?[]:[{x:box.x-spread,y:box.y,id:1},{x:box.x+spread,y:box.y,id:2}]},sessionId);
  const read=()=>evaluate('(()=>{const v=window.madridViewer;return{held:v.map.touchZoom._zooming,zoom:v.map.getZoom(),tileZoom:v.historical._tileZoom,loaded:Object.values(v.historical._tiles).filter(t=>t.coords.z===v.historical._tileZoom&&t.el.complete&&t.el.naturalWidth===256).length,badURLs:[...document.querySelectorAll(".leaflet-tile")].some(t=>{const p=new URL(t.src).searchParams;return p.has("tilematrix")?!Number.isInteger(Number(p.get("tilematrix"))):p.get("request")!=="GetMap"||p.get("layers")!==v.current.wmsLayer||p.get("srs")!=="EPSG:3857";})};})()');
  await touch('touchStart',100);await sleep(60);await touch('touchMove',180);
  let zoomed;for(let i=0;i<60;i++){await sleep(100);zoomed=await read();if(zoomed.tileZoom===17&&zoomed.loaded>0)break;}
  console.log(JSON.stringify({phase:'held zoom in',...zoomed}));
  if(!zoomed.held||zoomed.tileZoom!==17||!zoomed.loaded||zoomed.badURLs)throw new Error('Sharper decoded tiles did not load while both fingers remained down');
  await touch('touchMove',101);
  let back;for(let i=0;i<60;i++){await sleep(100);back=await read();if(back.tileZoom===16&&back.loaded>0)break;}
  console.log(JSON.stringify({phase:'held zoom back',...back}));
  if(!back.held||back.tileZoom!==16||!back.loaded)throw new Error('Could not zoom back while fingers remained down');
  await touch('touchEnd',null);await sleep(350);
  console.log(JSON.stringify({released:!(await read()).held}));
}finally{socket.close();}
