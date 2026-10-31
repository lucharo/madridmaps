## tldr
Add a visual map gallery, choose any two maps for Slide or Overlay comparison, and add borderless exploration plus browser fullscreen. Open maps at a view that fills the viewport; keep Whole sheet separately. Preserve the private site and all original IGN source links.

## Tasks
- [x] Inspect live site, reconcile source, and retain owner-only access.
- [x] Fetch actual map previews and build gallery with one-map and two-map selection.
- [x] Add Slide, Overlay, Fill screen, Whole sheet, Expand map and Fullscreen.
- [x] Test real images, comparison clipping, pair selection, pointer controls, resizing, URL reloads, fullscreen and errors; get an independent code review.
- [ ] Publish the updated private site and hand over each requested change.

Initial version published at https://madrid-historical-maps-luis.lucharo-dev.chatgpt.site
Initial deployment: appgdep_6ae64f32482481918b2e023081a5e050. Initial application commit: 53a9026798302ef3c53c9bea1362323f95c7d011.

## Design
Keep the existing white and blue controls, system type and map-first layout Luis likes. A full-width gallery dialog shows real 840px IGN map previews, dates and names. Compare opens the same gallery with two labelled selection slots and one clear Compare action. Slide uses a visible divider handle; Overlay uses the existing opacity interaction. Expanded view removes header, toolbar and footer while retaining Exit, map names, attribution and comparison controls.

## Acceptance and checks
All eleven dates come from the provided web map. Layer bounds come from GetCapabilities. Browse mounts exactly one layer; comparison exactly two with distinct sources. Slide clips both layers to opposite sides in the same coordinate space through pan and zoom. Overlay blends A over B without slide clipping. Gallery Cancel retains the previous view; applying a pair fits their shared coverage. Fill uses the viewport-covering bounds zoom with fractional zoom; Whole sheet contains the complete bounds. Test 390px phone and 1024px tablet, pointer dragging and keyboard range changes, true fullscreen plus unavailable/denied fullscreen, cold reload of both comparison modes, retries and out-of-coverage changes. Native iPad Safari remains unverified without that device.
