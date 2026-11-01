## tldr
Add the official Colubi 1889 atlas and an illustrated horizontal map timeline with short historical context. Preserve public access, comparison modes and the shared 64 MiB tile limit. Earlier release and DNS records remain below as dated history.

## Colubi and chronology, 1 November 2026

- [x] Verify municipal WMS bounds, EPSG:3857, reuse terms and a real decoded image.
- [x] Add Colubi to browse, gallery and comparisons with provider attribution and the shared bounded cache.
- [x] Add one-sentence context for all twelve historical maps and today's reference.
- [x] Provide actual-thumbnail timeline variants and links to additional archive dates and repeated series.
- [x] Luis selected A, the thumbnail strip. Prototype A/B preserved on `prototype/timeline-layouts` at `6a110a8`; unused option code removed from the selected implementation.
- [x] Live tiles for all thirteen maps, timeline/keyboard, comparisons and shared-cache checks pass; independent review found no correctness issue. Held pinch loads new tiles while fingers remain down for IGN and Colubi.
- [x] Apply Luis's timeline layout choice, publish and verify the public deployment.

Acceptance: thirteen browsable dates including today, stable map IDs and chronology, real Colubi imagery in EPSG:3857, municipal credit and source links, horizontal touch/keyboard navigation and context synchronized with the selected map. Additional archive PDFs must be distinguished from aligned viewer layers. Both providers share the existing six-download queue and 64 MiB cache. Expanded map still fills the viewport.

Release evidence: Cloudflare Worker version `1e858e70-73a9-49f9-b2e8-011072852a48` serves application commit `fcee736` from `feat/colubi-timeline`. Root, app, catalogue, timeline styles and tile worker returned anonymous 200 responses matching local assets. A reloaded production browser passed the complete timeline check with thirteen dates and fifteen decoded Colubi tiles. All thirteen map sources passed live nonblank-image checks. Unit checks: 21 tests, 48 assertions. The shared cache observed a peak of six downloads and 42,214,215 bytes, below 67,108,864 bytes. Colubi/Today slide and overlay comparisons passed. Held-pinch checks passed with decoded tiles while both fingers stayed down, including the mixed-provider pair. At 390px, the dialog stayed within the viewport and the rail scrolled horizontally. Physical-iPad Safari remains a separate device check.

Independent review found no correctness issues. RoboRev 713/714 identified language tagging and a pinch-check false positive; both were reproduced and corrected in `fcee736`. Correction review 717 and final implementation branch review 718 passed, and all reviews were acknowledged and closed. No branch merge was performed.

## Public sharing tasks
- [x] Diagnose DNS resolution and remove the owner sign-in restriction; public and VPN resolvers now answer correctly.
- [x] Retain the 64 MiB limit and add verified cache clearing without an in-flight refill race.
- [x] Check the repository for credentials, update public documentation and publish it.
- [x] Verify anonymous cold-load, live maps/search and cache bounds/clearing; get review and deploy.

## Public sharing acceptance
Anonymous visitors can open the exact domain without an address override or login, and load the real maps and address search. GitHub reports PUBLIC. Existing caching remains bounded to 64 MiB of image bodies per browser, evicts oldest images and can be cleared without old in-flight downloads writing themselves back. No keys or authentication material are published. Native physical-iPad confirmation remains separate from isolated browser QA.

Public rollout evidence: the Tailscale resolver and its AdGuard upstream returned the same cached NXDOMAIN with a decreasing SOA lifetime, while Cloudflare and Google returned the domain's two correct A records and a neighbouring hostname resolved through the VPN. The negative cache should expire around 21:56 Europe/London. No VPN or DNS-provider configuration was changed. Removing only this hostname's Cloudflare Access app changed its edge response from login302 to anonymous200. Gitleaks8.30.1 scanned all13 existing commits with no detected secrets. Nineteen unit tests pass, including manual clearing and preventing old in-flight downloads from refilling storage. A real browser cleared2,211,277 cached image bytes to zero and received the UI acknowledgement. Bounded source review found no concrete issue.

Final public release: GitHub confirms PUBLIC and an anonymous repository read returns200. Cloudflare Worker version bb72e265-4432-4786-9412-d782b1176861 serves application source68a8f09e8baffa26110cfdfbe43b056cb108250d. Root, application scripts and catalogue returned200 and matched local assets byte for byte. Twenty unit tests with41 assertions pass. RoboRev710 identified a request waiting on cache lookup that could refill after clearing; regression failed on442a958 and passes after capturing generation before any await. RoboRev711 and the bounded correction review pass.

DNS follow-through: the initial expiry briefly served another stale negative response. Both authoritative servers, public AdGuard and the tailnet resolver subsequently returned correct A and AAAA records. A normal HTTPS read from Arch returned200. An anonymous isolated browser using Arch's fresh resolver through a temporary SOCKS tunnel loaded the real production origin and decoded21 original IGN tiles, and live address/neighbourhood/street-search checks passed. This Mac retained a negative mDNSResponder result even after upstream recovery; privileged flushing required an unavailable administrator password. Unbound remote control was disabled and Pi-hole's cache-reload CLI reported a readonly-variable error, so neither attempted flush was counted as successful. No DNS configuration was changed. An optional iPad VPN-reconnect/retry panel was sent to Luis; physical-iPad success is not claimed.

## Earlier private-release tasks
- [x] Reproduce held-pinch loading and test a bounded refresh against Leaflet 1.9.4.
- [x] Add live Madrid address suggestions, result selection and a removable pin.
- [x] Replace primary action labels with accessible icons and simplify About.
- [x] Review and test touch, search, comparisons, responsive layout and caching.
- [x] Deploy the exact verified build to Cloudflare at madrid.luischav.es behind owner access.

Published 31 October 2026 at 21:29 Europe/London. Cloudflare Worker version d3c55108-c4f3-4394-9358-005a1926fb0b serves the verified dist from 50cfc3c at https://madrid.luischav.es . Independent public Cloudflare and Google DNS both return the domain's A records. HTTPS and the certificate work; root, app.js, search.js and tile-cache.js all reject anonymous reads with 302 to the existing Cloudflare Access login. The login page returns 200 with an email/PIN form. workers.dev and version previews are disabled. The physical iPad and authenticated Cloudflare browser session were not exercised. The host machine retained an initial negative DNS cache, so edge checks used a one-request address override from the independently verified public DNS answers.

The original owner-private Site was also updated successfully: deployment appgdep_6ae65db1a9c481918f7f39ad443a97ec, source 9cf78f7eb4a9cde6242c7d5eea5a499814a8fb7c, with identical dist assets. The source helper briefly captured Wrangler-generated temporary stub files; they were removed and .wrangler/ is now ignored. Those files did not change either deployed application.

## Earlier private-release acceptance and verification
During an uninterrupted two-finger gesture, pausing for about one second must load decoded tiles at the new integer zoom, then allow zooming back out without lifting either finger. Search must suggest real Madrid streets, addresses and places without an API key; selecting a result must move to its coordinates and show a pin, including resolving street suggestions whose initial coordinates are 0,0. Stale responses must not replace newer searches. Icons retain accessible names, tooltips and 44px touch targets. About uses neutral public descriptions and no internal paths or session identifiers. Custom-domain deployment must serve the same build and reject anonymous access. Native physical-iPad Safari remains unverified.

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
