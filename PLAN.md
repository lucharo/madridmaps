## tldr
Fix tile failures and zoom blinking, cache visited tiles on the device, and load ahead during panning. Verify the 1940–1960 source against detailed originals and make its first view useful. Preserve gallery, comparison, fullscreen and private access.

## Tasks
- [x] Inspect live site, reconcile source, and retain owner-only access.
- [x] Reproduce accumulated failure counts; inspect rapid zoom and uncached repeat navigation. Exact physical-iPad failure cause remains unproven.
- [x] Add bounded persistent caching and responsive loading without changing the chosen map.
- [x] Verify detailed 1940–1960 originals and improve its initial view and gallery preview.
- [x] Exercise offline revisits, transient failures, rapid zoom/pan and comparisons, and get review.
- [x] Publish and explain client versus server loading with measured verification limits.

Loading update published successfully on 31 October 2026 at 21:10 Europe/London. Deployment appgdep_6ae6593ed8048191af9deab5a18afe2e serves commit bf4b3515080adf2183d0f70586e4faf85e356517 with owner-only access. Authenticated production reads returned200 and expected v3 JavaScript for app.js and tile-cache.js. Browser/source verification limits and offline-cache evidence are recorded in README.md.

Updated private publication succeeded on 31 October 2026 at 20:43 Europe/London. Deployment appgdep_6ae652de6e648191b7c4c80e8a3284b4 serves commit 216651da344a316f843c526f2f7070851e333299. The native Sites operation confirmed success and retained owner-only access.

Initial version published at https://madrid-historical-maps-luis.lucharo-dev.chatgpt.site
Initial deployment: appgdep_6ae64f32482481918b2e023081a5e050. Initial application commit: 53a9026798302ef3c53c9bea1362323f95c7d011.

## Design
Keep the existing white and blue controls, system type and map-first layout Luis likes. A full-width gallery dialog shows real 840px IGN map previews, dates and names. Compare opens the same gallery with two labelled selection slots and one clear Compare action. Slide uses a visible divider handle; Overlay uses the existing opacity interaction. Expanded view removes header, toolbar and footer while retaining Exit, map names, attribution and comparison controls.

## Acceptance and checks
All eleven dates come from the provided web map. Layer bounds come from GetCapabilities. Browse mounts exactly one layer; comparison exactly two with distinct sources. Slide clips both layers to opposite sides in the same coordinate space through pan and zoom. Overlay blends A over B without slide clipping. Gallery Cancel retains the previous view; applying a pair fits their shared coverage. Fill uses the viewport-covering bounds zoom with fractional zoom; Whole sheet contains the complete bounds. Test 390px phone and 1024px tablet, pointer dragging and keyboard range changes, true fullscreen plus unavailable/denied fullscreen, cold reload of both comparison modes, retries and out-of-coverage changes. Native iPad Safari remains unverified without that device.
