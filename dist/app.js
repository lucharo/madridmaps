'use strict';
const $ = id => document.getElementById(id);
// Small inline symbols keep the controls usable without an icon font or network request.
const glyphs={
  maps:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  compare:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 2v20M6 12h3m6 0h3"/>',
  fullscreen:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M9 9 3 3m12 6 6-6M9 15l-6 6m12-6 6 6"/>',
  collapse:'<path d="M3 9h6V3m6 0v6h6M9 21v-6H3m12 6v-6h6M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  theme:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none"/>',
  fill:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m8 10-4-4m0 4V6h4m8 8 4 4m0-4v4h-4"/>',
  whole:'<path d="M3 8V3h5m8 0h5v5M3 16v5h5m13-5v5h-5"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
  left:'<path d="m15 5-7 7 7 7"/>',right:'<path d="m9 5 7 7-7 7"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  retry:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1"/>'
};
function iconAction(id,glyph,label){const button=$(id);button.classList.add('icon-button');button.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[glyph]}</svg>`;button.setAttribute('aria-label',label);button.title=label;}
for(const [id,glyph,label] of [
  ['catalogue-toggle','maps','All maps'],['compare-open','compare','Compare maps'],['fullscreen','fullscreen','Browser fullscreen'],['info-toggle','info','About the maps'],
  ['previous','left','Previous map'],['next','right','Next map'],['fit','fill','Fill screen'],['whole','whole','Whole sheet'],['end-compare','close','Exit comparison'],
  ['expand','expand','Expand map'],['expanded-maps','maps','All maps'],['expanded-compare','compare','Compare maps'],['gallery-close','close','Cancel'],['close-info','close','Close map information'],
  ['search-toggle','search','Search Madrid'],['search-submit','search','Search'],['search-close','close','Close search'],['retry','retry','Retry tiles']
])iconAction(id,glyph,label);
const initial = new URLSearchParams(location.hash.slice(1));
const state = {a:initial.get('map')||'Texeira', b:initial.get('b')||'Today', mode:initial.get('mode')||(initial.get('modern')==='1'?'overlay':'browse'),split:50,opacity:70,fit:initial.get('fit')==='whole'?'whole':'fill'};
const themes = ['System','Light','Dark'];
let theme = 'System', maps = [], map, layerA, layerB, expanded = false, nativeRequested = false;
let galleryMode = 'browse', draft = [], slot = 0;
const emptyStats=()=>({a:{failed:new Map()},b:{failed:new Map()}});
let stats=emptyStats();
for(const key of ['split','opacity']){const n=Number(initial.get(key));if(initial.has(key)&&Number.isFinite(n))state[key]=Math.max(0,Math.min(100,n));}
if(!['browse','slide','overlay'].includes(state.mode))state.mode='browse';
try { theme=localStorage.getItem('madrid-theme')||'System'; } catch {}
if(!themes.includes(theme))theme='System';
function applyTheme(){
  if(theme==='System')delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme=theme.toLowerCase();
  iconAction('theme','theme',`Theme: ${theme}`);
}
applyTheme();
$('theme').onclick=()=>{theme=themes[(themes.indexOf(theme)+1)%themes.length];applyTheme();try{localStorage.setItem('madrid-theme',theme);}catch{}};
const item = id => maps.find(m=>m.id===id);
const shortName = m => m.title.replace(/,? \d{4}(?:-\d{4})?$/,'');
const comparing = () => state.mode!=='browse';
function saveView(){
  if(!map||!layerA)return;
  const c=map.getCenter();
  const p=new URLSearchParams({map:state.a,b:state.b,mode:state.mode,split:state.split,opacity:state.opacity,fit:state.fit,lat:c.lat.toFixed(6),lng:c.lng.toFixed(6),z:map.getZoom()});
  history.replaceState(null,'',`${location.pathname}${location.search}#${p}`);
}
function viewBounds(cover){
  let bounds=L.latLngBounds(item(state.a).bounds);
  if(!comparing()||state.b==='Today')return bounds;
  const other=L.latLngBounds(item(state.b).bounds);
  if(!cover)return bounds.extend(other);
  const south=Math.max(bounds.getSouth(),other.getSouth()),west=Math.max(bounds.getWest(),other.getWest());
  const north=Math.min(bounds.getNorth(),other.getNorth()),east=Math.min(bounds.getEast(),other.getEast());
  return south<north&&west<east?L.latLngBounds([south,west],[north,east]):bounds;
}
function fitView(kind=state.fit){
  state.fit=kind;
  if(kind==='fill'&&item(state.a).detailView){
    const view=item(state.a).detailView;map.stop();map.setView(view.center,view.zoom,{animate:false});
    syncFitButtons();updateStatus();saveView();return;
  }
  const bounds=viewBounds(kind==='fill');
  const zoom=Math.max(map.getMinZoom(),Math.min(map.getMaxZoom(),map.getBoundsZoom(bounds,kind==='fill')));
  map.stop();map.setView(bounds.getCenter(),zoom,{animate:false});
  syncFitButtons();updateStatus();saveView();
}
function syncFitButtons(){
  $('fit').setAttribute('aria-pressed',String(state.fit==='fill'));
  $('whole').setAttribute('aria-pressed',String(state.fit==='whole'));
}
function updateStatus(){
  if(!layerA)return;
  const active=['a',...(comparing()?['b']:[])];
  const errors=active.map(k=>{
    const layer=k==='a'?layerA:layerB;
    const count=[...stats[k].failed.values()].filter(coords=>map.getBounds().intersects(layer._tileCoordsToBounds(coords))).length;
    return count?`${comparing()?k.toUpperCase()+': ':''}${count} visible tile${count===1?'':'s'} could not load`:null;
  }).filter(Boolean);
  const outside=active.filter(k=>!map.getBounds().intersects(L.latLngBounds(item(state[k]).bounds)));
  const loading=layerA.isLoading()||(comparing()&&layerB?.isLoading());
  $('retry').hidden=!errors.length;
  $('status-bar').classList.toggle('has-error',!!errors.length);
  $('outside').hidden=!outside.length;
  $('outside').textContent=outside.length?`${comparing()?'Map '+outside.map(k=>k.toUpperCase()).join(' and ')+' is':'You are'} outside its coverage. Use Fill screen.`:'';
  $('status').textContent=errors.length?`${errors.join('. ')}. Retry to reload.`:loading?'Loading original IGN tiles…':outside.length?'No map tiles in part of this view.':'Original IGN tiles loaded';
}
function makeLayer(id,key){
  const m=item(id);
  // Leaflet 1.9.4 GridLayer's validity hook also enforces IGN's advertised tile limits.
  // Some WGS84 bounds include tiles that the WMTS itself rejects with TileOutOfRange.
  const LimitedTiles=L.TileLayer.extend({_isValidTile(coords){
    if(!L.TileLayer.prototype._isValidTile.call(this,coords))return false;
    const limit=this.options.limits?.[coords.z];
    return !limit||(coords.x>=limit[0]&&coords.x<=limit[1]&&coords.y>=limit[2]&&coords.y<=limit[3]);
  }});
  const layer=new LimitedTiles(m.url,{minZoom:0,minNativeZoom:11,maxZoom:20,maxNativeZoom:20,bounds:m.bounds,limits:m.limits,noWrap:true,updateWhenIdle:false,updateWhenZooming:true,keepBuffer:2,pane:key==='a'?'mapA':'mapB',attribution:'<a href="https://www.ign.es/">CC BY 4.0 ign.es</a>'});
  layer.on('tileload tileunload tileabort',event=>{if((key==='a'?layerA:layerB)===layer){stats[key].failed.delete(event.tile);updateStatus();}});
  layer.on('tileerror',event=>{if((key==='a'?layerA:layerB)===layer){stats[key].failed.set(event.tile,event.coords);updateStatus();}});
  layer.on('loading load',()=>{if((key==='a'?layerA:layerB)===layer)updateStatus();});
  return layer;
}
function updateClip(){
  if(state.mode!=='slide'||!layerA||!layerB)return;
  const nw=map.containerPointToLayerPoint([0,0]),se=map.containerPointToLayerPoint(map.getSize());
  const x=nw.x+map.getSize().x*state.split/100;
  layerA.getContainer().style.clip=`rect(${nw.y}px,${x}px,${se.y}px,${nw.x}px)`;
  layerB.getContainer().style.clip=`rect(${nw.y}px,${se.x}px,${se.y}px,${x}px)`;
}
function updateComparison(){
  const slide=state.mode==='slide';
  $('swipe').hidden=!slide;
  $('overlay-control').hidden=state.mode!=='overlay';
  $('split-range').value=state.split;
  $('split-range').setAttribute('aria-valuetext',`${state.split}% of the view shows map A`);
  $('swipe-handle').setAttribute('aria-valuenow',String(Math.round(state.split)));
  $('opacity').value=state.opacity;
  $('opacity-value').value=`${state.opacity}%`;
  $('swipe').style.left=`${state.split}%`;
  layerA?.setOpacity(state.mode==='overlay'?state.opacity/100:1);
  for(const l of [layerA,layerB])if(l?.getContainer())l.getContainer().style.clip='';
  updateClip();
}
function syncUI(){
  const a=item(state.a),b=item(state.b);
  $('map-select').value=a.id;
  $('pair-a').textContent=`A · ${a.year}`;$('pair-b').textContent=`B · ${b.year}`;
  $('compare-controls').hidden=!comparing();$('browse-picker').hidden=comparing();
  $('comparison-panel').hidden=!comparing();
  iconAction('compare-open','compare',comparing()?'Change maps':'Compare maps');
  $('end-compare').hidden=!comparing();
  $('mode-slide').setAttribute('aria-pressed',String(state.mode==='slide'));
  $('mode-overlay').setAttribute('aria-pressed',String(state.mode==='overlay'));
  $('map-year').textContent=comparing()?`A · ${a.year}`:a.year;
  $('map-name').textContent=shortName(a);
  $('caption-b').hidden=!comparing();$('year-b').textContent=`B · ${b.year}`;$('name-b').textContent=shortName(b);
  const index=maps.indexOf(a);
  $('previous').disabled=index===0;$('next').disabled=index===maps.length-1;
  $('info-title').textContent=a.title;$('description').textContent=a.description;
  $('metadata').hidden=!a.metadata;if(a.metadata)$('metadata').href=a.metadata;
  const record=a.metadata?.match(/\/(\d+)(?:-marc21\.xml|\.html)/);
  $('downloads').href=record?`https://centrodedescargas.cnig.es/CentroDescargas/busquedaIdProductor.do?Serie=CAANT&idProductor=T${record[1].padStart(7,'0')}`:'https://centrodedescargas.cnig.es/CentroDescargas/catalogo.do?Serie=CAANT';
  syncFitButtons();updateComparison();updateStatus();
}
function renderLayers(refit=false){
  layerA?.remove();layerB?.remove();layerB=null;
  stats=emptyStats();
  layerA=makeLayer(state.a,'a');layerA.addTo(map);
  if(comparing()){layerB=makeLayer(state.b,'b');layerB.addTo(map);}
  syncUI();if(refit)fitView();
  saveView();
}
function choosePrimary(id,preserve=true){
  state.a=id;
  if(state.b===id)state.b=id==='Today'?'Texeira':'Today';
  renderLayers(!preserve||!map.getBounds().intersects(L.latLngBounds(item(id).bounds)));
}
function refreshGallery(){
  const pair=galleryMode==='compare';
  $('gallery-title').textContent=pair?'Choose two maps':'Explore the maps';
  $('gallery-hint').textContent=pair?'Choose A and B, then open the comparison.':'Pick a map to explore it.';
  $('selection').hidden=!pair;$('gallery-apply').hidden=!pair;
  $('gallery-apply').disabled=!draft[0]||!draft[1]||draft[0]===draft[1];
  [0,1].forEach(i=>{const m=item(draft[i]);$(`slot-${i}`).textContent=`${i===0?'A':'B'} · ${m?m.year+' '+shortName(m):'Choose a map'}`;$(`slot-${i}`).setAttribute('aria-pressed',String(slot===i));});
  document.querySelectorAll('.map-card').forEach(button=>{
    const id=button.dataset.id,n=draft.indexOf(id);
    button.setAttribute('aria-pressed',String(pair?n!==-1:id===state.a));
    button.querySelector('.selection-badge').textContent=pair&&n!==-1?(n===0?'A':'B'):!pair&&id===state.a?'Viewing':'';
  });
}
function openGallery(mode='browse',target){
  galleryMode=mode;draft=mode==='compare'?[state.a,comparing()?state.b:null]:[state.a];slot=target??(mode==='compare'&&!comparing()?1:0);
  refreshGallery();$('gallery').showModal();
}
function galleryChoose(id){
  if(galleryMode==='browse'){state.mode='browse';choosePrimary(id,false);$('gallery').close();return;}
  const other=1-slot;
  if(draft[other]===id)draft[other]=draft[slot]||null;
  draft[slot]=id;slot=other;refreshGallery();
}
function resizeMap(){requestAnimationFrame(()=>{map.invalidateSize({pan:false});updateComparison();updateStatus();});}
function setExpanded(on){
  expanded=on;document.body.classList.toggle('expanded',on);
  if(!on)$('view-note').hidden=true;
  iconAction('expand',on?'collapse':'expand',on?'Exit expanded view':'Expand map');
  $('expand').setAttribute('aria-pressed',String(on));resizeMap();
}
async function leaveExpanded(){
  if(document.fullscreenElement)await document.exitFullscreen();
  else if(document.webkitFullscreenElement)document.webkitExitFullscreen();
  nativeRequested=false;setExpanded(false);
}
async function fullscreen(){
  if(document.fullscreenElement||document.webkitFullscreenElement){await leaveExpanded();return;}
  setExpanded(true);
  $('view-note').hidden=true;
  try{
    const root=document.documentElement;
    if(root.requestFullscreen){nativeRequested=true;await root.requestFullscreen();}
    else if(root.webkitRequestFullscreen){nativeRequested=true;await root.webkitRequestFullscreen();}
    else throw new Error('Unavailable');
  }catch{nativeRequested=false;$('view-note').textContent='Expanded view is on. Browser fullscreen is unavailable here.';$('view-note').hidden=false;}
}
function wireDivider(){
  const handle=$('swipe-handle');let pointer=null,wasDragging=false;
  const position=event=>{const box=$('map-stage').getBoundingClientRect();state.split=Math.max(0,Math.min(100,(event.clientX-box.left)/box.width*100));updateComparison();};
  handle.onpointerdown=event=>{if(event.button!==0||pointer!==null)return;event.preventDefault();event.stopPropagation();pointer=event.pointerId;wasDragging=map.dragging.enabled();map.dragging.disable();handle.setPointerCapture(pointer);position(event);};
  handle.onpointermove=event=>{if(event.pointerId===pointer)position(event);};
  const release=event=>{if(event.pointerId!==pointer)return;pointer=null;if(wasDragging)map.dragging.enable();saveView();};
  handle.onpointerup=release;handle.onpointercancel=release;handle.onlostpointercapture=release;
  handle.onkeydown=event=>{let value=state.split;if(event.key==='ArrowLeft')value-=1;else if(event.key==='ArrowRight')value+=1;else if(event.key==='Home')value=0;else if(event.key==='End')value=100;else return;event.preventDefault();state.split=Math.max(0,Math.min(100,value));updateComparison();saveView();};
  $('split-range').oninput=()=>{state.split=Number($('split-range').value);updateComparison();saveView();};
}
async function init(){
  if(!window.L)throw new Error('The map library could not load. Reload this page.');
  const response=await fetch('maps.json');if(!response.ok)throw new Error('The map catalogue could not load. Reload this page.');
  maps=await response.json();
  // Only public IGN tile images enter this cache. Application files are never cached here.
  if('serviceWorker' in navigator){
    try{
      const registration=await navigator.serviceWorker.register('tile-cache.js');
      const worker=registration.installing||registration.waiting||registration.active;
      if(worker&&!['activated','redundant'].includes(worker.state))await new Promise(resolve=>worker.addEventListener('statechange',()=>{if(['activated','redundant'].includes(worker.state))resolve();}));
    }catch{/* A browser that disables service workers can still browse directly. */}
  }
  const coverage=L.latLngBounds(maps.flatMap(m=>m.bounds));
  maps.push({id:'Today',title:'Today’s IGN map',year:'Today',bounds:[[coverage.getSouth(),coverage.getWest()],[coverage.getNorth(),coverage.getEast()]],description:'Current IGN raster cartography. Map survey and publication dates vary by sheet.',metadata:null,url:'https://www.ign.es/wmts/mapa-raster?layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&service=WMTS&request=GetTile&version=1.0.0&format=image/jpeg&tilematrix={z}&tilecol={x}&tilerow={y}'});
  if(!item(state.a))state.a='Texeira';if(!item(state.b)||state.b===state.a)state.b=state.a==='Today'?'Texeira':'Today';
  for(const m of maps){
    const option=document.createElement('option');option.value=m.id;option.textContent=m.title;$('map-select').append(option);
    const button=document.createElement('button');button.className='map-card';button.dataset.id=m.id;button.type='button';
    const image=document.createElement('img');image.src=`previews/${m.preview||m.id}.jpg`;image.alt='';image.width=840;image.height=560;image.loading='lazy';
    const text=document.createElement('span');text.className='card-text';
    const year=document.createElement('strong');year.textContent=m.year;
    const name=document.createElement('span');name.textContent=m.detailView?`${shortName(m)} · detail preview`:shortName(m);
    const badge=document.createElement('span');badge.className='selection-badge';
    text.append(year,name);button.append(image,text,badge);button.onclick=()=>galleryChoose(m.id);$('map-gallery').append(button);
  }
  map=L.map('map',{minZoom:0,maxZoom:20,zoomControl:false,fadeAnimation:true,zoomAnimation:true,zoomSnap:0.1});
  map.createPane('mapA').style.zIndex=300;map.createPane('mapB').style.zIndex=250;
  L.control.zoom({position:'topright'}).addTo(map);L.control.scale({imperial:false,position:'bottomright'}).addTo(map);
  map.setView([40.41845,-3.706465],14);
  const lat=Number(initial.get('lat')),lng=Number(initial.get('lng')),z=Number(initial.get('z'));
  if(['lat','lng','z'].every(k=>initial.has(k))&&[lat,lng,z].every(Number.isFinite)&&lat>=-85&&lat<=85&&lng>=-180&&lng<=180&&z>=0&&z<=20)map.setView([lat,lng],z,{animate:false});
  else fitView();
  // Establish the requested camera before mounting tiles, avoiding discarded startup requests.
  renderLayers();
  map.on('move zoom resize viewreset',updateClip);map.on('moveend',()=>{updateStatus();saveView();});
  $('map-select').onchange=()=>choosePrimary($('map-select').value);
  $('previous').onclick=()=>choosePrimary(maps[maps.indexOf(item(state.a))-1].id);
  $('next').onclick=()=>choosePrimary(maps[maps.indexOf(item(state.a))+1].id);
  $('fit').onclick=()=>fitView('fill');$('whole').onclick=()=>fitView('whole');
  $('catalogue-toggle').onclick=()=>openGallery();$('expanded-maps').onclick=()=>openGallery();
  $('compare-open').onclick=()=>openGallery('compare');$('expanded-compare').onclick=()=>openGallery('compare');
  $('pair-a').onclick=()=>openGallery('compare',0);$('pair-b').onclick=()=>openGallery('compare',1);
  $('gallery-close').onclick=()=>$('gallery').close();
  $('slot-0').onclick=()=>{slot=0;refreshGallery();};$('slot-1').onclick=()=>{slot=1;refreshGallery();};
  $('gallery-apply').onclick=()=>{if(!draft[0]||!draft[1]||draft[0]===draft[1])return;[state.a,state.b]=draft;if(state.mode==='browse')state.mode='slide';$('gallery').close();renderLayers(true);};
  $('mode-slide').onclick=()=>{state.mode='slide';syncUI();saveView();};
  $('mode-overlay').onclick=()=>{state.mode='overlay';syncUI();saveView();};
  $('end-compare').onclick=()=>{state.mode='browse';renderLayers();};
  $('opacity').oninput=()=>{state.opacity=Number($('opacity').value);updateComparison();saveView();};
  // Recreate at the same view: Leaflet 1.9.4 redraw() can request fractional tile z (#9930).
  $('retry').onclick=()=>renderLayers();
  $('info-toggle').onclick=()=>$('info').showModal();$('close-info').onclick=()=>$('info').close();
  $('clear-tiles').onclick=async()=>{
    const button=$('clear-tiles'),status=$('cache-status');button.disabled=true;status.textContent='Clearing saved tiles…';
    try{
      const worker=navigator.serviceWorker?.controller||(await navigator.serviceWorker?.getRegistration())?.active;
      if(!worker){status.textContent='This browser is not saving map tiles.';return;}
      const result=await new Promise((resolve,reject)=>{
        const channel=new MessageChannel();
        const timeout=setTimeout(()=>{channel.port1.close();reject(new Error('Clearing took too long. Try again.'));},5000);
        channel.port1.onmessage=event=>{clearTimeout(timeout);channel.port1.close();resolve(event.data);};
        worker.postMessage({type:'clear-tiles'},[channel.port2]);
      });
      status.textContent=result.ok?'Saved map tiles cleared.':'Could not clear saved tiles. Try again.';
    }catch(error){status.textContent=error.message;}
    finally{button.disabled=false;}
  };
  $('expand').onclick=()=>expanded?leaveExpanded():setExpanded(true);$('fullscreen').onclick=fullscreen;
  $('view-note').onclick=()=>{$('view-note').hidden=true;};
  const fullscreenChanged=()=>{if(nativeRequested&&!document.fullscreenElement&&!document.webkitFullscreenElement){nativeRequested=false;setExpanded(false);}resizeMap();};
  document.addEventListener('fullscreenchange',fullscreenChanged);document.addEventListener('webkitfullscreenchange',fullscreenChanged);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&expanded&&!document.querySelector('dialog[open]'))leaveExpanded();});
  new ResizeObserver(resizeMap).observe($('map-stage'));
  wireDivider();syncUI();saveView();
  const {initSearch}=await import('./search.js');initSearch(map);
  window.madridViewer={map,state,get current(){return item(state.a);},get historical(){return layerA;},get secondary(){return layerB;},get maps(){return maps;}};
}
init().catch(error=>{$('status').textContent=error.message;});
