'use strict';
const $ = id => document.getElementById(id);
const initial = new URLSearchParams(location.hash.slice(1));
const state = {a:initial.get('map')||'Texeira', b:initial.get('b')||'Today', mode:initial.get('mode')||(initial.get('modern')==='1'?'overlay':'browse'),split:50,opacity:70,fit:initial.get('fit')==='whole'?'whole':'fill'};
const themes = ['System','Light','Dark'];
let theme = 'System', maps = [], map, layerA, layerB, expanded = false, nativeRequested = false;
let galleryMode = 'browse', draft = [], slot = 0;
let stats = {a:{errors:0,loaded:0},b:{errors:0,loaded:0}};
for(const key of ['split','opacity']){const n=Number(initial.get(key));if(initial.has(key)&&Number.isFinite(n))state[key]=Math.max(0,Math.min(100,n));}
if(!['browse','slide','overlay'].includes(state.mode))state.mode='browse';
try { theme=localStorage.getItem('madrid-theme')||'System'; } catch {}
if(!themes.includes(theme))theme='System';
function applyTheme(){
  if(theme==='System')delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme=theme.toLowerCase();
  $('theme').textContent=`Theme: ${theme}`;
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
  const errors=active.filter(k=>stats[k].errors).map(k=>`${comparing()?k.toUpperCase()+': ':''}${stats[k].errors} tile request${stats[k].errors===1?'':'s'} failed`);
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
  const layer=new LimitedTiles(m.url,{minZoom:0,minNativeZoom:11,maxZoom:20,maxNativeZoom:20,bounds:m.bounds,limits:m.limits,noWrap:true,updateWhenIdle:true,keepBuffer:2,pane:key==='a'?'mapA':'mapB',attribution:'<a href="https://www.ign.es/">CC BY 4.0 ign.es</a>'});
  layer.on('tileload',()=>{if((key==='a'?layerA:layerB)===layer)stats[key].loaded++;});
  layer.on('tileerror',()=>{if((key==='a'?layerA:layerB)===layer){stats[key].errors++;updateStatus();}});
  layer.on('loading load',()=>{if((key==='a'?layerA:layerB)===layer)updateStatus();});
  return layer;
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
  if(slide&&layerA&&layerB){
    const nw=map.containerPointToLayerPoint([0,0]),se=map.containerPointToLayerPoint(map.getSize());
    const x=nw.x+map.getSize().x*state.split/100;
    layerA.getContainer().style.clip=`rect(${nw.y}px,${x}px,${se.y}px,${nw.x}px)`;
    layerB.getContainer().style.clip=`rect(${nw.y}px,${se.x}px,${se.y}px,${x}px)`;
  }
}
function syncUI(){
  const a=item(state.a),b=item(state.b);
  $('map-select').value=a.id;
  $('pair-a').textContent=`A · ${a.year}`;$('pair-b').textContent=`B · ${b.year}`;
  $('compare-controls').hidden=!comparing();$('browse-picker').hidden=comparing();
  $('comparison-panel').hidden=!comparing();
  $('compare-open').textContent=comparing()?'Change maps':'Compare maps';
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
  stats={a:{errors:0,loaded:0},b:{errors:0,loaded:0}};
  layerA=makeLayer(state.a,'a');layerA.addTo(map);
  if(comparing()){layerB=makeLayer(state.b,'b');layerB.addTo(map);}
  syncUI();if(refit)fitView();saveView();
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
  $('expand').textContent=on?'Exit expanded view':'Expand map';
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
  const coverage=L.latLngBounds(maps.flatMap(m=>m.bounds));
  maps.push({id:'Today',title:'Today’s IGN map',year:'Today',bounds:[[coverage.getSouth(),coverage.getWest()],[coverage.getNorth(),coverage.getEast()]],description:'Current IGN raster cartography. Map survey and publication dates vary by sheet.',metadata:null,url:'https://www.ign.es/wmts/mapa-raster?layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&service=WMTS&request=GetTile&version=1.0.0&format=image/jpeg&tilematrix={z}&tilecol={x}&tilerow={y}'});
  if(!item(state.a))state.a='Texeira';if(!item(state.b)||state.b===state.a)state.b=state.a==='Today'?'Texeira':'Today';
  for(const m of maps){
    const option=document.createElement('option');option.value=m.id;option.textContent=m.title;$('map-select').append(option);
    const button=document.createElement('button');button.className='map-card';button.dataset.id=m.id;button.type='button';
    const image=document.createElement('img');image.src=`previews/${m.id}.jpg`;image.alt='';image.width=840;image.height=560;image.loading='lazy';
    const text=document.createElement('span');text.className='card-text';
    const year=document.createElement('strong');year.textContent=m.year;
    const name=document.createElement('span');name.textContent=shortName(m);
    const badge=document.createElement('span');badge.className='selection-badge';
    text.append(year,name);button.append(image,text,badge);button.onclick=()=>galleryChoose(m.id);$('map-gallery').append(button);
  }
  map=L.map('map',{minZoom:0,maxZoom:20,zoomControl:false,fadeAnimation:false,zoomAnimation:false,zoomSnap:0.1});
  map.createPane('mapA').style.zIndex=300;map.createPane('mapB').style.zIndex=250;
  L.control.zoom({position:'topright'}).addTo(map);L.control.scale({imperial:false,position:'bottomright'}).addTo(map);
  map.setView([40.41845,-3.706465],14);renderLayers(true);
  const lat=Number(initial.get('lat')),lng=Number(initial.get('lng')),z=Number(initial.get('z'));
  if(['lat','lng','z'].every(k=>initial.has(k))&&[lat,lng,z].every(Number.isFinite)&&lat>=-85&&lat<=85&&lng>=-180&&lng<=180&&z>=0&&z<=20)map.setView([lat,lng],z,{animate:false});
  map.on('move zoom resize viewreset',updateComparison);map.on('moveend',()=>{updateStatus();saveView();});
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
  $('expand').onclick=()=>expanded?leaveExpanded():setExpanded(true);$('fullscreen').onclick=fullscreen;
  $('view-note').onclick=()=>{$('view-note').hidden=true;};
  const fullscreenChanged=()=>{if(nativeRequested&&!document.fullscreenElement&&!document.webkitFullscreenElement){nativeRequested=false;setExpanded(false);}resizeMap();};
  document.addEventListener('fullscreenchange',fullscreenChanged);document.addEventListener('webkitfullscreenchange',fullscreenChanged);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&expanded&&!document.querySelector('dialog[open]'))leaveExpanded();});
  new ResizeObserver(resizeMap).observe($('map-stage'));
  wireDivider();syncUI();saveView();
  window.madridViewer={map,state,get current(){return item(state.a);},get historical(){return layerA;},get secondary(){return layerB;},get maps(){return maps;}};
}
init().catch(error=>{$('status').textContent=error.message;});
