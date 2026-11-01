# Viewer questions

The map-specific historical questions appear in **Información** in the [viewer](https://madrid.luischav.es/?timeline=1). These answers explain the sources and application.

## Which maps and archive dates are available?

**Short answer:** The viewer has twelve historical maps plus today's reference. The Colubi update added one aligned layer, the municipal 1889 copy; the other eleven historical maps were already included.

For repeated national mapping comparable to historical Ordnance Survey collections, start with MTN50 and Madrid sheet 559. IGN and the municipal Cartoteca also preserve individual city plans. Later editions exist, but these sources do not establish an annual update interval.

For the early-1800s references, open **Información → Más fechas y colecciones** below the timeline. Individual links include 1808 and 1825; the wider municipal collection includes more dates. These are archive scans, rather than extra aligned comparison layers.

Sources: [map catalogue and repeated series](../map-sources.md), [archive links](../../dist/index.html).

_Created: 2026-11-01 · Updated: 2026-11-01 · Verified: 2026-11-01_

## How can all the maps align?

**Short answer:** The providers supply georeferenced imagery, and the viewer displays it in a shared coordinate system instead of aligning the scans itself.

Colubi's municipal WMS supplies images in EPSG:3857; IGN supplies its maps on the compatible web-map tile grid. Older surveys are approximate, so small differences against present-day streets do not necessarily indicate a viewer bug.

Sources: [source and projection details](../map-sources.md#colubi-why-1889-rather-than-1866), [layer construction](../../dist/app.js).

_Created: 2026-11-01 · Updated: 2026-11-01 · Verified: 2026-11-01_

## Why did the 1940–1960 map look blocky?

**Short answer:** Its overview was coarse; sharper detail comes from higher zoom levels of the same IGN service.

The viewer opens this collection at a more detailed view and uses a detail preview. Its mosaic of 939 sheets still contains genuine coverage gaps. The improvement changes the view and requested detail, rather than replacing it with a different historical survey.

Sources: [catalogue description and preview settings](../../dist/maps.json), [initial view](../../dist/app.js), [map-source distinctions](../map-sources.md).

_Created: 2026-11-01 · Updated: 2026-11-01 · Verified: 2026-11-01_

## Can tiles load while my fingers remain down?

**Short answer:** Yes: the viewer can request sharper tiles during a held pinch, before both fingers lift.

The isolated browser check verifies decoded images at the new zoom, including an IGN/Colubi comparison. Actual physical-iPad Safari was not exercised in those checks, so browser-specific touch behaviour remains a device-verification limit.

Sources: [held-pinch browser check](../../check-held-pinch.mjs), [layer options](../../dist/app.js), [recorded acceptance checks](../../PLAN.md).

_Created: 2026-11-01 · Updated: 2026-11-01 · Verified: 2026-11-01 · Scope: isolated browser verification_

## Which address and place search services does the viewer use?

**Short answer:** CartoCiudad supplies present-day addresses, and Photon/OpenStreetMap supplies place suggestions, without an API key.

Results are restricted to the Madrid area. Availability depends on the public services. The search is a current-address reference for comparing locations with old maps; it is not a historical-address index.

Sources: [search implementation](../../dist/search.js), [provider links](../../README.md#sources).

_Created: 2026-11-01 · Updated: 2026-11-01 · Verified: 2026-11-01_

## Why does Colubi have a central gap and load slowly?

**Short answer:** Its 36 sheets map surrounding land parcels, leaving a real gap over the old city; the images also come from a different municipal service.

An uncached three-request comparison on 1 November 2026 observed slower municipal responses than the sampled IGN responses, before the viewer's loading queue. Revisits used browser caching. This small development sample is not a general speed ratio or a claim about present service performance; repeat comparable uncached requests before attributing a new delay.

Sources: [municipal coverage and WMS](../map-sources.md#colubi-why-1889-rather-than-1866), [shared image cache](../../dist/tile-cache.js). The timing statement is a dated development observation, not a service guarantee.

_Created: 2026-11-01 · Updated: 2026-11-01 · Verified: 2026-11-01 · Scope: dated source-response sample_

## Could the tiles be hosted on Cloudflare?

**Short answer:** Yes, but pre-rendering and rehosting would be a separate tile-archive project; the decision for this viewer was to retain the provider services.

That project would need coverage and zoom selection, image preparation, storage and an update policy. The viewer currently downloads images as people explore and stores at most 64 MiB of image data per browser, evicting older images. **Información → Borrar imágenes guardadas** clears that managed cache. It can otherwise survive closing the browser.

Sources: [saved tiles](../../README.md#saved-tiles), [cache limits and clearing](../../dist/tile-cache.js), [clear-during-download regression checks](../../test/tile-cache.test.mjs).

_Created: 2026-11-01 · Updated: 2026-11-01 · Verified: 2026-11-01_
