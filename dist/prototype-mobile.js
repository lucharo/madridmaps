// PROTOTYPE, throwaway: three phone layouts on the real viewer, switched with ?variant=a|b|c.
// Loaded only from 127.0.0.1. The chosen layout is rewritten properly; this file never ships.
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const keys = ['a', 'b', 'c'], names = {a: 'Barra inferior', b: 'Solo botones flotantes', c: 'Cabecera compacta'};
const variant = keys.includes(params.get('variant')) ? params.get('variant') : 'a';
document.body.classList.add('proto', `v-${variant}`);
Object.assign(glyphs, {
  locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'
});
const style = document.createElement('link');style.rel = 'stylesheet';style.href = 'prototype-mobile.css';document.head.append(style);

function button(id, glyph, label, onclick) {
  const b = document.createElement('button');b.id = id;b.type = 'button';document.body.append(b);
  iconAction(id, glyph, label);b.onclick = onclick;return b;
}
// Minimal live location for the prototype: one fix, a dot, nothing if outside the maps.
let dot;
function locate() {
  const status = $('proto-toast');
  navigator.geolocation.getCurrentPosition(position => {
    const here = L.latLng(position.coords.latitude, position.coords.longitude);
    const madrid = L.latLngBounds(window.madridViewer.maps.flatMap(m => m.bounds));
    dot?.remove();dot = null;
    if (!madrid.contains(here)) {status.textContent = 'Estás fuera de Madrid';status.hidden = false;setTimeout(() => status.hidden = true, 4000);return;}
    dot = L.circleMarker(here, {radius: 9, color: '#fff', weight: 3, fillColor: '#1a73e8', fillOpacity: 1}).addTo(window.madridViewer.map);
    window.madridViewer.map.setView(here, Math.max(window.madridViewer.map.getZoom(), 16));
  }, () => {status.textContent = 'No se ha podido obtener tu ubicación';status.hidden = false;setTimeout(() => status.hidden = true, 4000);});
}
const toast = document.createElement('div');toast.id = 'proto-toast';toast.hidden = true;$('map-stage').append(toast);

// "Más" sheet shared by all three layouts.
const sheet = document.createElement('dialog');sheet.id = 'proto-more';sheet.innerHTML = '<h2>Más opciones</h2><div class="proto-more-grid"></div>';document.body.append(sheet);
const grid = sheet.querySelector('.proto-more-grid');
for (const [id, glyph, label, target] of [
  ['more-info', 'info', 'Información', 'info-toggle'], ['more-fill', 'fill', 'Llenar pantalla', 'fit'],
  ['more-whole', 'whole', 'Plano completo', 'whole'], ['more-theme', 'theme', 'Cambiar tema', 'theme'], ['more-close', 'close', 'Cerrar', null]
]) {const b = button(id, glyph, label, () => {sheet.close();if (target) $(target).click();});grid.append(b);}
sheet.onclick = event => {if (event.target === sheet) sheet.close();};
const openMore = () => sheet.showModal();

const actions = [
  ['maps', 'maps', 'Mapas', () => $('catalogue-toggle').click()],
  ['compare', 'compare', 'Comparar', () => $('compare-open').click()],
  ['search', 'search', 'Buscar', () => $('search-toggle').click()],
  ['locate', 'locate', 'Ubicación', locate],
  ['more', 'more', 'Más', openMore]
];
if (variant === 'a') {
  const bar = document.createElement('nav');bar.id = 'proto-tabbar';bar.setAttribute('aria-label', 'Acciones');
  for (const [id, glyph, label, run] of actions) bar.append(button(`tab-${id}`, glyph, label, run));
  document.body.append(bar);
}
if (variant === 'b') {
  const column = document.createElement('nav');column.id = 'proto-fabs';column.setAttribute('aria-label', 'Acciones');
  for (const [id, glyph, label, run] of actions) column.append(button(`fab-${id}`, glyph, label, run));
  $('map-stage').append(column);
}
if (variant === 'c') {
  const more = button('head-more', 'more', 'Más', openMore);$('compare-open').after(more);
  const loc = button('head-locate', 'locate', 'Mi ubicación', locate);$('search-toggle').after(loc);
}

// Floating switcher, visually separate from the design under review.
if (!params.has('shot')) {
  const bar = document.createElement('div');bar.id = 'proto-switcher';
  const go = step => {params.set('variant', keys[(keys.indexOf(variant) + step + keys.length) % keys.length]);location.search = params.toString();};
  bar.innerHTML = `<button aria-label="Anterior">‹</button><span>${variant.toUpperCase()} · ${names[variant]}</span><button aria-label="Siguiente">›</button>`;
  bar.children[0].onclick = () => go(-1);bar.children[2].onclick = () => go(1);
  document.body.append(bar);
  document.addEventListener('keydown', event => {if (event.target.closest('input,textarea,select,[contenteditable]')) return;if (event.key === 'ArrowLeft') go(-1);if (event.key === 'ArrowRight') go(1);});
}
window.dispatchEvent(new Event('resize'));
