'use strict';
const $ = id => document.getElementById(id);
let maps, map, historical, modern, current, failures = 0, modernFailures = 0, ready = 0;
const params = new URLSearchParams(location.hash.slice(1));
const themes = ['System', 'Light', 'Dark'];
let theme = 'System';
try { theme = localStorage.getItem('madrid-theme') || 'System'; } catch {}
if (!themes.includes(theme)) theme = 'System';
function applyTheme() {
  if (theme === 'System') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme.toLowerCase();
  $('theme').textContent = `Theme: ${theme}`;
}
applyTheme();
$('theme').onclick = () => { theme = themes[(themes.indexOf(theme) + 1) % themes.length]; applyTheme(); try { localStorage.setItem('madrid-theme', theme); } catch {} };
function saveView() {
  if (!map || !current) return;
  const c = map.getCenter();
  const p = new URLSearchParams({map: current.id,lat:c.lat.toFixed(6),lng:c.lng.toFixed(6),z:map.getZoom(),modern:$('modern').checked?'1':'0',opacity:$('opacity').value});
  history.replaceState(null, '', `${location.pathname}${location.search}#${p}`);
}
function updateCoverage() {
  if (current) $('outside').hidden = map.getBounds().intersects(L.latLngBounds(current.bounds));
  updateStatus(historical?.isLoading());
}
function fit() { map.fitBounds(current.bounds, {padding:[24,24],animate:false}); }
function updateStatus(loading = false) {
  $('retry').hidden = failures === 0 && modernFailures === 0;
  const errors = [];
  if(failures)errors.push(`${failures} historical tile request${failures===1?'':'s'} failed`);
  if(modernFailures)errors.push(`${modernFailures} modern tile request${modernFailures===1?'':'s'} failed`);
  const inView = current && map.getBounds().intersects(L.latLngBounds(current.bounds));
  $('status').textContent = errors.length ? `${errors.join('. ')}. Retry to reload.` : !inView ? 'No historical tiles in view.' : loading ? 'Loading original IGN tiles…' : ready ? 'Original IGN tiles loaded' : 'No tiles in view. Use Fit map.';
}
function setOpacity() {
  historical?.setOpacity($('modern').checked ? Number($('opacity').value)/100 : 1);
  $('opacity-value').value = `${$('opacity').value}%`;
}
function setModern() {
  modernFailures = 0;
  if ($('modern').checked) modern.addTo(map); else modern.remove();
  $('opacity-control').hidden = !$('modern').checked;
  setOpacity(); updateStatus(historical?.isLoading()); saveView();
}
function selectMap(id, preserveView = true) {
  current = maps.find(m => m.id === id) || maps[1];
  historical?.remove(); failures = 0; ready = 0;
  const layer = L.tileLayer(current.url, {minZoom:11,maxZoom:20,maxNativeZoom:20,bounds:current.bounds,noWrap:true,attribution:'<a href="https://www.ign.es/">CC BY 4.0 ign.es</a>',updateWhenIdle:true,keepBuffer:2,pane:'historical'});
  historical = layer;
  layer.on('loading', () => { if(historical===layer) updateStatus(true); });
  layer.on('tileload', () => { if(historical===layer) ready++; });
  layer.on('tileerror', () => { if(historical===layer){failures++;updateStatus();} });
  layer.on('load', () => { if(historical===layer) updateStatus(); });
  layer.addTo(map);
  $('map-select').value = current.id;
  $('map-year').textContent = current.year;
  $('map-name').textContent = current.title.replace(/,? \d{4}(?:-\d{4})?$/, '');
  $('info-title').textContent = current.title;
  $('description').textContent = current.description;
  $('metadata').hidden = !current.metadata;
  if (current.metadata) $('metadata').href = current.metadata;
  const record = current.metadata?.match(/\/(\d+)(?:-marc21\.xml|\.html)/);
  $('downloads').href = record ? `https://centrodedescargas.cnig.es/CentroDescargas/busquedaIdProductor.do?Serie=CAANT&idProductor=T${record[1].padStart(7,'0')}` : 'https://centrodedescargas.cnig.es/CentroDescargas/catalogo.do?Serie=CAANT';
  const index = maps.indexOf(current);
  $('previous').disabled = index===0; $('next').disabled = index===maps.length-1;
  document.querySelectorAll('#map-list button').forEach(b => b.setAttribute('aria-current', String(b.dataset.id===current.id)));
  if (!preserveView) fit();
  setOpacity();updateCoverage();saveView();
}
function toggleCatalogue() {
  const open = $('catalogue').hidden;
  $('catalogue').hidden = !open;
  $('catalogue-toggle').setAttribute('aria-expanded',String(open));
  map.invalidateSize({pan:false});
}
async function init() {
  if (!window.L) throw new Error('The map library could not load. Reload this page.');
  const response = await fetch('maps.json'); if(!response.ok)throw new Error('The map catalogue could not load. Reload this page.');
  maps = await response.json();
  const select = $('map-select');
  for (const m of maps) {
    const option = document.createElement('option');option.value=m.id;option.textContent=m.title;select.append(option);
    const button = document.createElement('button');button.dataset.id=m.id;
    const year = document.createElement('strong');year.textContent=m.year;
    const name = document.createElement('span');name.textContent=m.title.replace(/,? \d{4}(?:-\d{4})?$/, '');
    button.append(year,name);button.onclick=()=>{selectMap(m.id);if(innerWidth<=700)toggleCatalogue();};$('map-list').append(button);
  }
  map=L.map('map',{minZoom:11,maxZoom:20,zoomControl:false,fadeAnimation:false});
  map.createPane('historical').style.zIndex=300;
  L.control.zoom({position:'topright'}).addTo(map);
  L.control.scale({imperial:false,position:'bottomright'}).addTo(map);
  modern=L.tileLayer('https://www.ign.es/wmts/mapa-raster?layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&service=WMTS&request=GetTile&version=1.0.0&format=image/jpeg&tilematrix={z}&tilecol={x}&tilerow={y}',{maxZoom:20,noWrap:true,attribution:'Modern map: CC BY 4.0 ign.es'});
  modern.on('tileerror',()=>{if($('modern').checked){modernFailures++;updateStatus(historical?.isLoading());}});
  map.setView([40.41845,-3.706465],14);
  $('modern').checked=params.get('modern')==='1';
  const opacity=Number(params.get('opacity'));if(params.has('opacity')&&Number.isFinite(opacity))$('opacity').value=Math.max(0,Math.min(100,opacity));
  selectMap(params.get('map')||'Texeira',false);
  const lat=Number(params.get('lat')),lng=Number(params.get('lng')),z=Number(params.get('z'));
  if(params.has('lat')&&params.has('lng')&&params.has('z')&&[lat,lng,z].every(Number.isFinite)&&lat>=-85&&lat<=85&&lng>=-180&&lng<=180&&z>=11&&z<=20)map.setView([lat,lng],z,{animate:false});
  setModern();
  map.on('moveend',()=>{saveView();updateCoverage();});
  select.onchange=()=>selectMap(select.value);
  $('previous').onclick=()=>selectMap(maps[maps.indexOf(current)-1].id);
  $('next').onclick=()=>selectMap(maps[maps.indexOf(current)+1].id);
  $('fit').onclick=fit;
  $('modern').onchange=setModern;
  $('opacity').oninput=()=>{setOpacity();saveView();};
  $('retry').onclick=()=>{failures=0;modernFailures=0;ready=0;updateStatus(true);historical.redraw();if($('modern').checked)modern.redraw();};
  $('catalogue-toggle').onclick=toggleCatalogue;
  $('info-toggle').onclick=()=>$('info').showModal();
  $('close-info').onclick=()=>$('info').close();
  if(new URLSearchParams(location.search).get('variant')==='B')toggleCatalogue();
  window.madridViewer={map,get current(){return current;},get historical(){return historical;},get maps(){return maps;}};
}
init().catch(error=>{$('status').textContent=error.message;});
