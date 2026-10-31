const endpoint=Bun.argv[2];if(!endpoint?.startsWith('ws://127.0.0.1:'))throw new Error('Use only the owned isolated browser');
const socket=new WebSocket(endpoint),pending=new Map();let id=0,session;
function call(method,params={},sessionId=session){return new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});socket.send(JSON.stringify({id:next,method,params,...(sessionId?{sessionId}:{})}));});}
socket.onmessage=event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}else if(m.method==='Fetch.requestPaused')call('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'}).catch(()=>{});};
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
try{
  const {targetInfos}=await call('Target.getTargets',{},null),target=targetInfos.find(t=>t.type==='page'&&t.url.startsWith('http://127.0.0.1:18894/'));
  if(!target)throw new Error('Owned viewer page missing');
  session=(await call('Target.attachToTarget',{targetId:target.targetId,flatten:true},null)).sessionId;
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;};
  const settle=`async()=>{const start=Date.now();while(window.madridViewer.historical.isLoading()){if(Date.now()-start>20000)throw new Error('Tile timeout');await new Promise(r=>setTimeout(r,50));}}`;
  await call('Network.enable');await call('Network.setBypassServiceWorker',{bypass:true});await call('Network.setCacheDisabled',{cacheDisabled:true});
  await call('Fetch.enable',{patterns:[{urlPattern:'https://www.ign.es/wmts/planos?*',requestStage:'Request'}]});
  await evaluate(`window.madridViewer.map.setView([40.419,-3.705],17,{animate:false});true`);
  await evaluate(`(${settle})()`);
  const before=await evaluate(`document.getElementById('status').textContent`);
  if(!before.includes('could not load'))throw new Error('Failure canary did not produce visible failed tiles');
  await call('Fetch.disable');await call('Network.setBypassServiceWorker',{bypass:false});await call('Network.setCacheDisabled',{cacheDisabled:false});
  await evaluate(`window.madridViewer.map.setView([40.411,-3.718],17,{animate:false});true`);await evaluate(`(${settle})()`);
  const after=await evaluate(`document.getElementById('status').textContent`);
  if(after.includes('could not load'))throw new Error('Old failures persisted after panning to valid imagery');
  const duringPan=await evaluate(`(async()=>{const v=window.madridViewer;let moving=false,started=0;const start=()=>moving=true,end=()=>moving=false,tile=()=>{if(moving)started++;};v.map.on('movestart',start).on('moveend',end);v.historical.on('tileloadstart',tile);v.map.panBy([500,0],{animate:true,duration:.6});await new Promise(r=>setTimeout(r,800));v.map.off('movestart',start).off('moveend',end);v.historical.off('tileloadstart',tile);return started;})()`);
  if(!duringPan)throw new Error('No incoming tiles started while panning');
  console.log(JSON.stringify({before,after,tileRequestsStartedDuringPan:duringPan}));
}finally{
  if(session){await call('Fetch.disable').catch(()=>{});await call('Network.setBypassServiceWorker',{bypass:false}).catch(()=>{});await call('Network.setCacheDisabled',{cacheDisabled:false}).catch(()=>{});}
  socket.close();
}
