// Search public present-day data. Queries are sent only while this panel is used.
const area={west:-3.90,south:40.30,east:-3.50,north:40.65};
const located=(lat,lng)=>Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=area.south&&lat<=area.north&&lng>=area.west&&lng<=area.east;
const normal=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
// Healthy sampled requests complete well below a second; a stalled service gets 5 seconds.
async function json(url,signal){
  const controller=new AbortController(),abort=()=>controller.abort();
  if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;abort();},5000);
  try{const r=await fetch(url,{signal:controller.signal,credentials:'omit'});if(!r.ok)throw new Error('El servicio de búsqueda no está disponible.');return await r.json();}
  catch(error){if(timedOut&&!signal.aborted)throw new Error('La búsqueda ha tardado demasiado. Inténtalo de nuevo.');if(signal.aborted)throw error;throw new Error('No se pudo consultar el servicio de búsqueda. Inténtalo de nuevo.');}
  finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
}
export async function searchMadrid(query,signal){
  const official=new URL('https://www.cartociudad.es/geocoder/api/geocoder/candidates');
  official.search=new URLSearchParams({q:query,municipio_filter:'Madrid',limit:'6'});
  const osm=new URL('https://photon.komoot.io/api/');
  osm.search=new URLSearchParams({q:query,lat:'40.4167',lon:'-3.7033',bbox:`${area.west},${area.south},${area.east},${area.north}`,limit:'6',lang:'default'});
  const data=await Promise.allSettled([json(official,signal),json(osm,signal)]);
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  if(data.every(r=>r.status==='rejected'))throw new Error('La búsqueda no está disponible. Inténtalo de nuevo.');
  const carto=data[0].status==='fulfilled'&&Array.isArray(data[0].value)?data[0].value.filter(r=>r.muniCode==='28079'&&r.id&&r.address).map(r=>({label:r.address,detail:r.type==='portal'?'Dirección · CartoCiudad':'Calle o lugar · CartoCiudad',lat:r.lat,lng:r.lng,id:r.id,type:r.type,source:'carto'})):[];
  const photon=data[1].status==='fulfilled'?(data[1].value.features||[]).flatMap(f=>{
    const p=f.properties||{},[lng,lat]=f.geometry?.coordinates||[];
    if(!located(lat,lng))return [];
    const address=[p.street,p.housenumber].filter(Boolean).join(' '),label=p.name||address;
    if(!label)return [];
    return [{label,detail:[address!==label?address:null,p.locality,p.district,p.city,'OpenStreetMap'].filter(Boolean).join(' · '),lat,lng,source:'osm'}];
  }):[];
  // House-number searches prefer authoritative portals; neighbourhood searches prefer OSM places.
  const ordered=/\d/.test(query)?[...carto,...photon]:[...photon,...carto],seen=new Set();
  return ordered.filter(r=>{const key=normal(r.label);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,8);
}
export async function resolveResult(result,signal){
  if(located(result.lat,result.lng))return result;
  if(result.source!=='carto')throw new Error('No se ha podido localizar este lugar en el mapa.');
  const url=new URL('https://www.cartociudad.es/geocoder/api/geocoder/find');url.search=new URLSearchParams({id:result.id,type:result.type});
  const found=await json(url,signal);
  if(!located(found.lat,found.lng))throw new Error('No se ha podido localizar este lugar en el mapa.');
  return {...result,lat:found.lat,lng:found.lng};
}
export function initSearch(map){
  const $=id=>document.getElementById(id),panel=$('map-search'),input=$('search-input'),list=$('search-results'),status=$('search-status');
  let timer,request,sequence=0,marker;
  function cancel(){clearTimeout(timer);request?.abort();sequence++;}
  function close(){cancel();panel.hidden=true;$('search-toggle').setAttribute('aria-expanded','false');$('search-toggle').focus({preventScroll:true});}
  function open(){panel.hidden=false;$('search-toggle').setAttribute('aria-expanded','true');input.focus();}
  $('search-toggle').onclick=()=>panel.hidden?open():close();$('search-close').onclick=close;
  // Keep gestures and keystrokes in the panel out of the map handlers.
  L.DomEvent.disableClickPropagation(panel);L.DomEvent.disableScrollPropagation(panel);
  panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){close();$('search-toggle').focus();}if(e.key==='ArrowDown'&&e.target===input){e.preventDefault();list.querySelector('button')?.focus();}});
  $('search-clear-pin').onclick=()=>{marker?.remove();marker=null;$('search-clear-pin').hidden=true;};
  async function choose(result){
    cancel();const current=sequence;request=new AbortController();status.textContent='Localizando este lugar…';
    try{
      const point=await resolveResult(result,request.signal);if(current!==sequence)return;
      marker?.remove();
      const text=document.createElement('span');text.textContent=point.label;
      marker=L.marker([point.lat,point.lng],{title:point.label,alt:'Ubicación encontrada',icon:L.divIcon({className:'search-pin',html:'<span></span>',iconSize:[26,36],iconAnchor:[13,36]})}).addTo(map).bindTooltip(text,{direction:'top',offset:[0,-34]});
      map.stop();map.setView([point.lat,point.lng],17,{animate:false});
      input.value=point.label;list.replaceChildren();status.textContent=point.label;$('search-clear-pin').hidden=false;close();
    }catch(error){if(error.name!=='AbortError'&&current===sequence)status.textContent=error.message;}
  }
  async function run(){
    cancel();list.replaceChildren();const query=input.value.trim();
    if(query.length<3){status.textContent='Escribe al menos 3 letras. La búsqueda utiliza los nombres actuales.';return;}
    const current=sequence;request=new AbortController();status.textContent='Buscando en Madrid…';
    try{
      const results=await searchMadrid(query,request.signal);if(current!==sequence)return;
      status.textContent=results.length?'Elige un resultado.':'No hay resultados. Prueba con una calle o un lugar cercano.';
      for(const result of results){
        const button=document.createElement('button');button.type='button';button.className='search-result';
        const label=document.createElement('strong'),detail=document.createElement('span');label.textContent=result.label;detail.textContent=result.detail;button.append(label,detail);button.onclick=()=>choose(result);list.append(button);
        button.onkeydown=event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const next=event.key==='ArrowDown'?button.nextElementSibling:button.previousElementSibling;(next||input).focus();}};
      }
    }catch(error){if(error.name!=='AbortError'&&current===sequence)status.textContent=error.message;}
  }
  input.oninput=()=>{cancel();list.replaceChildren();status.textContent=input.value.trim().length<3?'Escribe al menos 3 letras.':'Buscando en Madrid…';timer=setTimeout(run,500);};
  $('search-form').onsubmit=event=>{event.preventDefault();run();};
}
