(async()=>{
  const assert=(v,m)=>{if(!v)throw new Error(m);};
  const wait=async f=>{const start=Date.now();while(!f()){if(Date.now()-start>20000)throw new Error('Tiles did not settle');await new Promise(r=>setTimeout(r,100));}};
  const v=window.madridViewer;assert(v,'Viewer missing');
  const select=document.getElementById('map-select');select.value='Texeira';select.dispatchEvent(new Event('change'));document.getElementById('fit').click();await wait(()=>!v.historical.isLoading());
  const zoom=v.map.getZoom();document.querySelector('.leaflet-control-zoom-in').click();await wait(()=>v.map.getZoom()===zoom+1&&!v.map._animatingZoom&&!v.historical.isLoading());
  const before=v.map.getCenter();document.getElementById('map').focus();document.getElementById('map').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',keyCode:39,bubbles:true}));await wait(()=>v.map.getCenter().lng!==before.lng&&!v.map._panAnim?._inProgress);
  const compare=document.getElementById('modern');compare.checked=true;compare.dispatchEvent(new Event('change'));
  const range=document.getElementById('opacity');range.value=35;range.dispatchEvent(new Event('input'));assert(v.historical.options.opacity===.35,'Opacity not applied');
  let layers=[];v.map.eachLayer(l=>{if(l instanceof L.TileLayer)layers.push(l);});assert(layers.length===2,'Comparison did not show exactly two layers');
  compare.checked=false;compare.dispatchEvent(new Event('change'));assert(v.historical.options.opacity===1,'Historical opacity not restored');
  document.getElementById('info-toggle').click();assert(document.getElementById('info').open,'About dialog did not open');document.getElementById('close-info').click();
  v.map.setView([40.8,-4.2],14,{animate:false});select.value='MancelliMadrid';select.dispatchEvent(new Event('change'));assert(document.getElementById('status').textContent==='No historical tiles in view.','Stale status outside bounds');assert(document.getElementById('retry').hidden,'Stale Retry outside bounds');
  document.getElementById('fit').click();await wait(()=>!v.historical.isLoading());assert(document.getElementById('outside').hidden,'Coverage not restored');
  select.value='Texeira';select.dispatchEvent(new Event('change'));document.getElementById('fit').click();await wait(()=>!v.historical.isLoading());
  compare.checked=true;compare.dispatchEvent(new Event('change'));range.value=35;range.dispatchEvent(new Event('input'));
  return{zoom:true,keyboardPan:true,opacity:true,comparison:true,about:true,outsideCoverage:true,recovery:true,hash:location.hash};
})();
