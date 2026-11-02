// Live position on the map, shown only while the visitor is inside the area the maps cover.
// The browser asks for permission on the first tap, never on page load.
const $ = id => document.getElementById(id);
const OUTSIDE = 'Tu ubicación solo se muestra cuando estás en Madrid.';

export function initLocation(map, coverage, notify) {
  const button = $('locate');
  let watch = null, dot = null, ring = null, centred = false;
  const stop = () => {
    if (watch !== null) navigator.geolocation.clearWatch(watch);
    watch = null;dot?.remove();ring?.remove();dot = ring = null;
    button.setAttribute('aria-pressed', 'false');
  };
  const place = position => {
    const here = L.latLng(position.coords.latitude, position.coords.longitude);
    if (!coverage.contains(here)) {stop();notify(OUTSIDE);return;}
    const accuracy = Math.min(position.coords.accuracy || 0, 2000);
    if (!dot) {
      ring = L.circle(here, {radius: accuracy, color: '#1a73e8', weight: 1, fillColor: '#1a73e8', fillOpacity: .12, interactive: false}).addTo(map);
      dot = L.circleMarker(here, {radius: 8, color: '#fff', weight: 3, fillColor: '#1a73e8', fillOpacity: 1, interactive: false}).addTo(map);
    } else {dot.setLatLng(here);ring.setLatLng(here).setRadius(accuracy);}
    if (!centred) {centred = true;map.setView(here, Math.max(map.getZoom(), 16));}
  };
  const failed = error => {
    stop();
    notify(error.code === 1 ? 'No has dado permiso para ver tu ubicación. Puedes activarlo en los ajustes del navegador.' : 'No se ha podido obtener tu ubicación. Inténtalo de nuevo.');
  };
  button.onclick = () => {
    if (watch !== null) {stop();return;}
    if (!navigator.geolocation) {notify('Este navegador no puede mostrar tu ubicación.');return;}
    centred = false;button.setAttribute('aria-pressed', 'true');
    watch = navigator.geolocation.watchPosition(place, failed, {enableHighAccuracy: true, maximumAge: 10000, timeout: 20000});
  };
}
