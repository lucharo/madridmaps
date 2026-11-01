import {test,expect,afterEach} from 'bun:test';
import {searchMadrid,resolveResult} from '../dist/search.js';
const original=globalThis.fetch;
afterEach(()=>{globalThis.fetch=original;});
const signal=()=>new AbortController().signal;
const street={id:'280790007456',type:'callejero',muniCode:'28079',address:'CALLE ALCALA, Madrid',lat:0,lng:0};
const portal={id:'portal-28',type:'portal',muniCode:'28079',address:'CALLE GRAN VIA 28, Madrid',lat:40.42022995491958,lng:-3.7019733413068066};
const place={geometry:{coordinates:[-3.7042311,40.4267079]},properties:{name:'Malasaña',city:'Madrid'}};
function services(carto,osm){globalThis.fetch=async url=>Response.json(String(url).includes('cartociudad.es')?carto:osm);}
test('house numbers prefer the authoritative address with the complete result contract',async()=>{
  services([portal],{features:[place]});
  expect(await searchMadrid('gran via 28',signal())).toEqual([
    {label:'CALLE GRAN VIA 28, Madrid',detail:'Dirección · CartoCiudad',lat:portal.lat,lng:portal.lng,id:'portal-28',type:'portal',source:'carto'},
    {label:'Malasaña',detail:'Madrid · OpenStreetMap',lat:40.4267079,lng:-3.7042311,source:'osm'}
  ]);
});
test('place names prefer OSM, reject out-of-area coordinates and deduplicate places',async()=>{
  services([street],{features:[place,place,{...place,geometry:{coordinates:[0,0]}}]});
  expect((await searchMadrid('malasana',signal())).map(r=>r.label)).toEqual(['Malasaña','CALLE ALCALA, Madrid']);
});
test('place search requests the original local names supported by Photon',async()=>{
  let requested;
  globalThis.fetch=async url=>{if(String(url).includes('cartociudad.es'))return Response.json([]);requested=new URL(url);return Response.json({features:[place]});};
  await searchMadrid('malasana',signal());
  expect({origin:requested.origin,path:requested.pathname,query:Object.fromEntries(requested.searchParams)}).toEqual({origin:'https://photon.komoot.io',path:'/api/',query:{q:'malasana',lat:'40.4167',lon:'-3.7033',bbox:'-3.9,40.3,-3.5,40.65',limit:'6',lang:'default'}});
});
test('one unavailable service still returns the other service results',async()=>{
  globalThis.fetch=async url=>String(url).includes('cartociudad.es')?new Response('',{status:503}):Response.json({features:[place]});
  expect((await searchMadrid('malasana',signal())).map(r=>r.label)).toEqual(['Malasaña']);
});
test('both services failing produces an actionable error',async()=>{
  globalThis.fetch=async()=>new Response('',{status:503});
  await expect(searchMadrid('sol',signal())).rejects.toThrow('La búsqueda no está disponible. Inténtalo de nuevo.');
});
test('a stalled provider times out and releases the healthy provider results',async()=>{
  globalThis.fetch=async(url,{signal})=>String(url).includes('cartociudad.es')?new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true})):Response.json({features:[place]});
  expect((await searchMadrid('malasana',signal())).map(r=>r.label)).toEqual(['Malasaña']);
},10000);
test('an aborted search cannot return late provider results',async()=>{
  services([portal],{features:[place]});const controller=new AbortController();controller.abort();
  await expect(searchMadrid('old query',controller.signal)).rejects.toThrow('Aborted');
});
test('a street candidate at 0,0 resolves by exact identity, not a new text search',async()=>{
  let requested;globalThis.fetch=async url=>{requested=new URL(url);return Response.json({lat:40.42,lng:-3.7});};
  expect(await resolveResult({...street,source:'carto'},signal())).toEqual({...street,source:'carto',lat:40.42,lng:-3.7});
  expect({origin:requested.origin,path:requested.pathname,query:Object.fromEntries(requested.searchParams)}).toEqual({origin:'https://www.cartociudad.es',path:'/geocoder/api/geocoder/find',query:{id:'280790007456',type:'callejero'}});
});
test('a precise address needs no additional network request',async()=>{
  globalThis.fetch=async()=>{throw new Error('Unexpected request');};
  expect(await resolveResult(portal,signal())).toEqual(portal);
});
test('an unresolved location cannot send the map to the equator',async()=>{
  globalThis.fetch=async()=>Response.json({lat:0,lng:0});
  await expect(resolveResult({...street,source:'carto'},signal())).rejects.toThrow('No se ha podido localizar este lugar en el mapa.');
});
test('a street lookup deadline is an actionable error rather than silent cancellation',async()=>{
  globalThis.fetch=async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));
  await expect(resolveResult({...street,source:'carto'},signal())).rejects.toThrow('La búsqueda ha tardado demasiado. Inténtalo de nuevo.');
},10000);
