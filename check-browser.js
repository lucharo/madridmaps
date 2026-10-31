(async () => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const waitFor = async predicate => { const start=Date.now();while(!predicate()){if(Date.now()-start>20000)throw new Error('Timed out waiting for tiles');await new Promise(r=>setTimeout(r,100));} };
  assert(window.madridViewer,'Viewer did not initialise');
  const results=[];
  for(const m of window.madridViewer.maps){
    const select=document.getElementById('map-select');select.value=m.id;select.dispatchEvent(new Event('change'));
    document.getElementById('fit').click();
    await waitFor(()=>!window.madridViewer.historical.isLoading()&&[...window.madridViewer.historical.getContainer().querySelectorAll('img')].every(i=>i.complete));
    const tiles=[...window.madridViewer.historical.getContainer().querySelectorAll('img')];
    assert(tiles.length>0,`${m.id}: no tiles requested`);
    assert(tiles.every(i=>i.complete&&i.naturalWidth===256),`${m.id}: undecoded tiles`);
    const layers=[];window.madridViewer.map.eachLayer(l=>{if(l instanceof L.TileLayer)layers.push(l._url);});
    assert(layers.length===1,`${m.id}: historical layers stacked`);
    if(m.id==='MadozMadrid'){
      const rejected=Object.assign(L.point(16047,12352),{z:15}),accepted=Object.assign(L.point(16047,12353),{z:15});
      assert(!window.madridViewer.historical._isValidTile(rejected),'Madoz requested the TileOutOfRange edge row');
      assert(window.madridViewer.historical._isValidTile(accepted),'Madoz discarded a valid edge row');
    }
    // Sample an actual image with CORS, not just its successful HTTP status.
    const centre=window.madridViewer.map.getCenter();const z=15,n=2**z;
    const x=Math.floor((centre.lng+180)/360*n),r=centre.lat*Math.PI/180,y=Math.floor((1-Math.asinh(Math.tan(r))/Math.PI)/2*n);
    const image=new Image();image.crossOrigin='anonymous';image.src=m.url.replace('{z}',z).replace('{x}',x).replace('{y}',y);await image.decode();
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,256,256).data;let opaque=0;const shades=new Set();for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]){opaque++;shades.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);}}
    assert(opaque>0&&shades.size>10,`${m.id}: sample is blank`);
    results.push({map:m.id,tiles:tiles.length,opaquePixels:opaque,colours:shades.size,status:document.getElementById('status').textContent});
  }
  return results;
})();
