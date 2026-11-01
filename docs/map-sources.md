# Madrid map sources and dates

Verified 1 November 2026. This is a curated collection, not an inventory of every map ever made of Madrid.

## Maps available in the viewer

The eleven original dates and Spanish catalogue descriptions come from [IGN’s historical web map](https://nco.ign.es/portal/home/webmap/viewer.html?webmap=8eda9d617ce540778acf62c0b9fcfed1). Their geographic extents and tile limits come from [IGN WMTS capabilities](https://www.ign.es/wmts/planos?SERVICE=WMTS&REQUEST=GetCapabilities). The short Spanish contexts and questions summarise those descriptions; they are separate from the preserved source text.

The additional questions and curiosities use those same official layer descriptions, checked against the live WMTS capabilities on 1 November 2026. Madoz's border illustrations and street index are also described in [its IGN catalogue record](https://www.ign.es/web/catalogo-cartoteca/resources/html/001526.html). Colubi's copy date and digitisation credits come from the municipal series record below; the municipal publication supplies the separate 1866 reference. The current-map questions explain the viewer's present-day search and the different dates of the source sheets.

| Date | Map | Context |
| --- | --- | --- |
| 1622 | Mancelli | Earliest printed city plan, delivered to the council. |
| 1656 | Texeira | Twenty sheets combining the street plan and building façades. |
| 1761 | Chalmandrier | Royal commission at the start of Carlos III’s reign. |
| 1769 | Espinosa de los Monteros | Urban cadastral information and 557 numbered blocks. |
| 1785 | Tomás López | Synthesis of earlier surveys and royal urban reforms. |
| 1848 | Madoz and Coello | Official city plan based on an engineering survey of the 1840s. |
| 1875 | Ibáñez Íbero | Detailed urban parcel plan assembled from kilometre sheets. |
| 1889 | Carlos Colubi, copy | Municipal cadastral atlas of land parcels around Madrid. |
| 1900 | Facundo Cañada | Madrid, neighbouring towns and estimated land values. |
| 1910 | Núñez Granés | Municipal public-works mapping using surveys and official records. |
| 1929 | Ayuntamiento de Madrid | Survey supporting the international expansion-planning competition. |
| 1940–1960 | Parcelario de Madrid | Detailed cadastral sheets with planimetry and elevations. |
| Today | IGN raster map | Current reference; survey dates vary by sheet. |

## Colubi: why 1889, rather than 1866?

The [municipal series record](https://geoportal.madrid.es/IDEAM_WBGEOPORTAL/dataset.iam?id=SPA_28079_SERIE_CARTOTECA_1889_Carlos_Colubi_1890) dates the supplied **copy** to 1889. It describes a 36-sheet atlas copied from Colubi’s work, digitised by memoriademadrid and georeferenced by the municipal cartography department. The city’s *Madrid en sus planos* publication also lists Colubi under 1866. The viewer labels the specific georeferenced dataset it serves, rather than treating these as two independent new surveys.

- [WMS capabilities](https://servpub.madrid.es/georaster/CARTOTECA/Carlos_Colubi_1889/ows?service=WMS&request=GetCapabilities&version=1.3.0): layer `Carlos_Colubi_1889`; EPSG:3857, EPSG:25830 and CRS:84 advertised.
- WGS84 extent: longitude −3.748030653495943 to −3.6555804060712753; latitude 40.38098785584194 to 40.46410022176169.
- [Sheet index](https://servpub.madrid.es/fsdescargas/IDEAM_WBGEOPORTAL/CARTOTECA/COLUBI/Malla_Plano_Catastral_Colubi.kml): original municipal polygons.
- Attribution: Ayuntamiento de Madrid / memoriademadrid, 1889. [Reuse conditions](https://datos.madrid.es/pages/condiciones-generales-ayuntamiento-de-madrid) permit reuse with source/date attribution and no implied endorsement.

The atlas chiefly maps land outside the old urban core. Its central gap is real source coverage. WMS images are reprojected by the provider; this application does not invent control points or realign the scans.

## More dates and repeated series

[Madrid en sus planos, nineteenth century](https://www.madrid.es/portales/munimadrid/es/Inicio/Vivienda-urbanismo-y-obras/Urbanismo/Cartografia/Cartoteca/Madrid-en-sus-Planos-1622-2001/?idCapitulo=10754006&vgnextchannel=70efa4200bb73710VgnVCM1000001d4a900aRCRD&vgnextoid=bf6f229e301d4610VgnVCM2000001f4a900aRCRD) provides additional archive PDFs from 1800, 1808, 1812, 1820, 1825, 1830, 1835, 1846, 1847, 1848, 1849, 1852, 1854, 1855, 1860, 1866, 1867, 1868, 1870, 1878, 1879 and 1896. These are additional archive records, not newly integrated comparison layers.

[Castro’s Ensanche plan](https://www.ign.es/web/catalogo-cartoteca/resources/html/001490.html) was signed in 1859 and printed in 1861, with the familiar project associated with 1860. It describes a proposed expansion, so it should not be read as a survey of everything already built.

[The national topographic series (MTN50)](https://www.ign.es/web/catalogo-cartoteca/resources/html/028465.html) is the more systematic counterpart to repeated Ordnance Survey mapping. Work began in 1870; [Madrid sheet 559](https://www.ign.es/web/catalogo-cartoteca/resources/html/036961.html) was first published in 1875. Later editions exist, but the evidence does not establish a fixed annual update interval for every sheet.

[Municipal cartography](https://www.madrid.es/portales/munimadrid/es/Inicio/Vivienda-urbanismo-y-obras/Informacion-Cartografica-y-Callejero/?vgnextchannel=593e31d3b28fe410VgnVCM1000000b205a0aRCRD&vgnextoid=e342a4cea0f6e610VgnVCM2000001f4a900aRCRD) includes successive vector editions from 1995 onward. These are another route for studying more recent change.
