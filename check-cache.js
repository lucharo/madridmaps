(async()=>{
  if(!navigator.serviceWorker.controller)throw new Error('Tile cache is not controlling this page');
  const tiles=[...window.madridViewer.historical.getContainer().querySelectorAll('img')].filter(i=>i.naturalWidth===256);
  if(!tiles.length)throw new Error('No actual tiles to check');
  const sizes=[];
  for(const tile of tiles){
    const response=await fetch(tile.src,{cache:'no-store'});
    if(!response.headers.has('X-Madrid-Bytes'))throw new Error('Tile did not come through the persistent cache');
    const image=await createImageBitmap(await response.blob());
    if(image.width!==256||image.height!==256)throw new Error('Cached tile did not decode');
    sizes.push(Number(response.headers.get('X-Madrid-Bytes')));image.close();
  }
  const metrics=await new Promise(resolve=>{const c=new MessageChannel();c.port1.onmessage=e=>{c.port1.close();resolve(e.data);};navigator.serviceWorker.controller.postMessage({type:'tile-metrics'},[c.port2]);});
  if(metrics.hits<tiles.length||metrics.peak>6)throw new Error(JSON.stringify(metrics));
  return{decodedCachedTiles:sizes.length,imageBytes:sizes.reduce((a,b)=>a+b,0),metrics};
})();
