// Connect only to this task's isolated agent-browser session, never a user browser.
const endpoint=Bun.argv[2];
if(!endpoint?.startsWith('ws://127.0.0.1:'))throw new Error('Expected the owned local browser CDP endpoint');
const socket=new WebSocket(endpoint),pending=new Map();let next=0;
socket.onmessage=event=>{const message=JSON.parse(event.data);const p=pending.get(message.id);if(p){pending.delete(message.id);clearTimeout(p.timer);message.error?p.reject(new Error(message.error.message)):p.resolve(message.result);}};
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
function call(method,params={},sessionId){return new Promise((resolve,reject)=>{const id=++next;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`${method} timed out`));},15000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
try{
  const targets=await call('Target.getTargets');
  const target=targets.targetInfos.find(t=>t.type==='page'&&t.url.startsWith('http://127.0.0.1:18894/'));
  if(!target)throw new Error('Owned viewer page not found');
  const {sessionId}=await call('Target.attachToTarget',{targetId:target.targetId,flatten:true});
  const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value;};
  await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2},sessionId);
  await evaluate(`document.getElementById('compare-open').click();document.querySelector('[data-id="Today"]').click();document.getElementById('gallery-apply').click();`);
  const box=await evaluate(`(()=>{const b=document.getElementById('swipe-handle').getBoundingClientRect(),s=document.getElementById('map-stage').getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2,left:s.left,width:s.width};})()`);
  const destination=box.left+box.width*.72;
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x,y:box.y,id:1}]},sessionId);
  await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:destination,y:box.y,id:1}]},sessionId);
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]},sessionId);
  const divider=await evaluate(`({split:window.madridViewer.state.split,dragging:window.madridViewer.map.dragging.enabled()})`);
  if(Math.abs(divider.split-72)>.5||!divider.dragging)throw new Error('Real touch divider did not move or release map dragging');
  // Touch pan elsewhere in the map proves divider handling did not disable normal gestures.
  const before=await evaluate('window.madridViewer.map.getCenter().lng');
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:500,id:1}]},sessionId);
  await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:280,y:500,id:1}]},sessionId);
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]},sessionId);
  await new Promise(resolve=>setTimeout(resolve,500));
  const after=await evaluate('window.madridViewer.map.getCenter().lng');
  if(before===after)throw new Error('Touch pan did not move the map');
  const startZoom=await evaluate('window.madridViewer.map.getZoom()');
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:350,y:550,id:1},{x:550,y:550,id:2}]},sessionId);
  await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:250,y:550,id:1},{x:650,y:550,id:2}]},sessionId);
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]},sessionId);
  await new Promise(resolve=>setTimeout(resolve,500));
  const endZoom=await evaluate('window.madridViewer.map.getZoom()');
  if(endZoom<=startZoom)throw new Error('Touch pinch did not zoom');
  console.log(JSON.stringify({touchDivider:true,touchPan:true,touchPinch:true,split:divider.split,zoomBefore:startZoom,zoomAfter:endZoom}));
}finally{socket.close();}
