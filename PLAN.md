## tldr
Browse all eleven original IGN maps of Madrid in a private, touch-friendly viewer. Show one historical map at a time. Keep source links and download records. Verify actual tile images, date switching, zoom, mobile layout and cold reload before publishing.

## Tasks
- [x] Recover the source web map and WMTS capabilities.
- [x] Build a map-first viewer with A: compact controls and B: expanded catalogue as reviewable layouts.
- [x] Verify original images, interaction and failure reporting on desktop and tablet layouts.
- [x] Publish privately and hand over the live URL.

Published successfully: https://madrid-historical-maps-luis.lucharo-dev.chatgpt.site
Deployment: appgdep_6ae64f32482481918b2e023081a5e050. Deployed application commit: 53a9026798302ef3c53c9bea1362323f95c7d011.

## Design
The map fills the screen. A compact white toolbar and blue selection state leave the historical colours untouched. System sans-serif controls; large dates give the timeline hierarchy. Palette: white #ffffff, ink #182c3b, blue #165a89, pale blue #eaf2f8, grey #667480. Controls align left. A keeps the catalogue in a select; B opens a chronological rail using the same live map.

## Acceptance and checks
All eleven dates come from the provided web map. Layer bounds come from GetCapabilities. Only one historical TileLayer may exist at a time. Errors remain visible and can be retried. Verify every date has decoded, nontransparent original tiles; pan, zoom, reset, opacity, comparison and URL state; inspect 390px phone and 889px tablet layouts. Native iPad gesture behaviour remains unverified without that device.
