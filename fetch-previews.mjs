import {mkdir} from 'node:fs/promises';
const maps=await Bun.file(new URL('dist/maps.json',import.meta.url)).json();
maps.push({id:'Today',bounds:maps.find(m=>m.id==='Texeira').bounds,wmsLayer:'mtn_rasterizado',wmsURL:'https://www.ign.es/wms-inspire/mapa-raster'});
await mkdir(new URL('dist/previews',import.meta.url),{recursive:true});
const mercator=([lat,lng])=>[6378137*lng*Math.PI/180,6378137*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))];
for(const m of maps){
  const lo=mercator(m.bounds[0]),hi=mercator(m.bounds[1]);
  const cx=(lo[0]+hi[0])/2,cy=(lo[1]+hi[1])/2;
  let width=hi[0]-lo[0],height=hi[1]-lo[1];
  if(width/height>1.5)height=width/1.5;else width=height*1.5;
  const query=new URLSearchParams({service:'WMS',version:'1.1.1',request:'GetMap',layers:m.wmsLayer||m.id[0].toLowerCase()+m.id.slice(1),styles:'default',srs:'EPSG:3857',bbox:[cx-width/2,cy-height/2,cx+width/2,cy+height/2].join(','),width:'840',height:'560',format:'image/jpeg'});
  const response=await fetch(`${m.wmsURL||'https://www.ign.es/wms/planos'}?${query}`,{signal:AbortSignal.timeout(30000)});
  if(!response.ok||!response.headers.get('content-type')?.includes('image/jpeg'))throw new Error(`Preview failed: ${m.id} ${response.status}`);
  await Bun.write(new URL(`dist/previews/${m.id}.jpg`,import.meta.url),await response.arrayBuffer());
  console.log(`${m.id}: original IGN preview saved`);
}
