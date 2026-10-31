(async()=>{
  const v=window.madridViewer,wait=async f=>{const start=Date.now();while(!f()){if(Date.now()-start>20000)throw new Error('Navigation did not settle');await new Promise(r=>setTimeout(r,50));}};
  for(const zoom of [15.5,16.2,17.1,15.8,18,16,17.5,14.4]){
    v.map.setZoom(zoom,{animate:false});v.map.panBy([90,30],{animate:false});
    await new Promise(r=>setTimeout(r,60));
  }
  await wait(()=>!v.historical.isLoading());
  const tiles=[...v.historical.getContainer().querySelectorAll('img')];
  const broken=tiles.filter(i=>i.complete&&!i.naturalWidth);
  const invalid=tiles.map(i=>i.src).filter(src=>{if(!src.startsWith('https:'))return false;return !Number.isInteger(Number(new URL(src).searchParams.get('tilematrix')));});
  const result={status:document.getElementById('status').textContent,tiles:tiles.length,broken:broken.length,invalidZooms:invalid.length,updateWhenIdle:v.historical.options.updateWhenIdle};
  if(broken.length||invalid.length)throw new Error(JSON.stringify(result));
  return result;
})();
