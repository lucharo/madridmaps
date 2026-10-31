# Madrid, through time

[Explore the maps at madrid.luischav.es](https://madrid.luischav.es)

Browse eleven historical maps of Madrid from 1622 to 1960, compare any two with a sliding divider or overlay, and search for present-day streets, addresses and neighbourhoods. No account is required.

![Madrid's 1929 survey, provided by IGN](dist/previews/AyuntamientoMadrid.jpg)

## Use

The gallery icon opens all maps. The comparison icon lets you choose two dates. Use the magnifier to find an address, the expand icon to explore without page borders, and the fit controls to fill the screen or show the whole sheet.

## Saved tiles

Tiles download directly from IGN as you explore. Each browser saves up to **64 MiB** of image data, discarding older tiles when full. There is no server-side tile archive or bulk download. Up to six new tile downloads run at once.

Saved tiles can survive closing the browser. Use **About → Clear saved tiles** to remove them. Browser storage settings may also clear or disable the cache.

## Sources

Cartography and previews are original [IGN](https://www.ign.es/) images, credited **CC BY 4.0 ign.es**. Geographic alignment comes from IGN and is approximate for older surveys. The 1940–1960 collection contains gaps between sheets.

Search uses [CartoCiudad](https://www.cartociudad.es/) addresses and [OpenStreetMap](https://www.openstreetmap.org/copyright) places through [Photon](https://github.com/komoot/photon). Availability depends on those public services. Leaflet 1.9.4 is vendored with its licence.

<details>
<summary>Development and deployment</summary>

Requires Bun. Run from the repository root:

```sh
BROWSER=/usr/bin/true bun preview.mjs
bun test
```

Open `http://127.0.0.1:18894/`. The preview accepts only local read requests. `roborev init` installs local review hooks after cloning.

Deploy static assets with `bunx wrangler deploy`, using an existing `CLOUDFLARE_API_TOKEN` in the shell. Never commit credentials. `wrangler.jsonc` configures the custom domain; workers.dev and version previews are disabled.

The browser scripts exercise live tiles, gallery/comparisons, address search, cache clearing and held pinch zoom in an isolated browser. `bun test` covers search and the tile worker, including cache bounds, retries and clearing while downloads are in flight. Native physical-iPad Safari remains a separate device check.

The map catalogue comes from [the original IGN web map](https://nco.ign.es/portal/home/webmap/viewer.html?webmap=8eda9d617ce540778acf62c0b9fcfed1) and [WMTS capabilities](https://www.ign.es/wmts/planos?SERVICE=WMTS&REQUEST=GetCapabilities). `bun fetch-previews.mjs` retrieves genuine WMS previews. `PLAN.md` retains the implementation and deployment history.

</details>
