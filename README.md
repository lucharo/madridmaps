# Madrid, through time

Private map viewer built on 31 October 2026 for the IGN web map supplied by Luis.

## Use

Pick a date to display exactly one historical map. Pan and zoom, or use Fit map to show its full coverage. Compare with today adds IGN's modern raster map underneath, with an opacity slider. All maps opens the chronological catalogue. About contains original metadata and scan-download records. The URL preserves date, position, zoom and comparison state.

Default layout A is compact; `?variant=B` opens the catalogue. Both use the same live data and can be switched with All maps.

## Sources

- Web map: https://nco.ign.es/portal/sharing/rest/content/items/8eda9d617ce540778acf62c0b9fcfed1/data?f=json
- Tile service and bounds: https://www.ign.es/wmts/planos?SERVICE=WMTS&REQUEST=GetCapabilities
- Modern raster: https://www.ign.es/wmts/mapa-raster
- Leaflet 1.9.4, locally vendored with its licence.

The source configuration enables all eleven historical maps. This viewer removes the prior historical layer when the date changes. Images are original IGN PNG tiles. Differently coloured survey sheets and source gaps remain visible, especially in the 1940–1960 mosaic. Approximate georeferencing is inherited from IGN. Attribution: CC BY 4.0 ign.es.

## Verified on 31 October 2026

All eleven dates decoded live tiles; centre samples contained opaque, nonuniform imagery. The single-layer invariant held after every date switch. Browser checks exercised zoom controls, keyboard pan, Fit map, modern comparison, opacity, About, outside-coverage recovery and cold URL restoration. Actual intercepted network failures for historical and modern tiles produced persistent errors and recovered through Retry. Separate code review's three findings were fixed and checked again.

Responsive layout checked at desktop, 1024px tablet at device pixel ratio 2 and 390px phone. No horizontal page overflow. Native iPad Safari and physical pinch gestures have not been exercised. Availability of IGN and CNIG remains outside this viewer's control. CNIG links are record searches, not bundled offline originals.

## Local preview and checks

Run `BROWSER=/usr/bin/true bun preview.mjs` from this directory, then open http://127.0.0.1:18894/. The loopback preview validates Host and Origin and permits read methods only.

With an owned `agent-browser` session open on that URL, run `agent-browser --session <session> eval --stdin < check-browser.js` and `agent-browser --session <session> eval --stdin < check-interactions.js`. The checks use the real tile service. Close the owned browser session afterwards.

Session: 01a193a1-1209-76b0-b5aa-ee6b98dfa3b3. Source: /Users/luis/.local/share/madrid-maps-2026-10-31. Hosted identity: .openai/hosting.json.
