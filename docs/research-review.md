# Research and engineering review

Scope: this repository as of the `site/live-dashboard` branch. It started as a single-page MapLibre web map of the live Bike Share Toronto GBFS feed (original work by Zehui Yin, MIT) plus one recorded feed file, `sample_station_information_2023_07_29.json` (`last_updated` 1690614324, 674 stations). It is a product app with a small descriptive analysis added, not a study, so it is graded on both axes and the research grades are deliberately strict.

Grades: 1 = absent, 3 = adequate, 5 = publication grade.

| Dimension | Before | Now | Notes |
|---|---|---|---|
| Research question | 1 | 3 | None before. Now three descriptive questions: how dense is the network, where are the spatial gaps, how clean is the feed. |
| Hypotheses | 1 | 1 | Descriptive only; nothing is tested against a prediction. |
| Method | 1 | 3 | Haversine nearest-neighbour distances, coverage-within-r curve, counts and field completeness, all in `site/src/stats.js`. |
| Baselines / comparison | 1 | 1 | No comparison to another city, another date or a random point pattern. |
| Statistics / uncertainty | 1 | 2 | Full-population counts from one file, so sampling error does not apply; but there is no temporal uncertainty because there is one snapshot. |
| Reproducibility | 2 | 4 | One committed input; `npm run build` runs a known-answer check (`site/src/stats.check.mjs`) that pins 674 stations, 12,773 docks, median nearest-neighbour 206.35 m, max 2,119.52 m, coverage 68.8% at 300 m, and the field counts. Python recomputation agreed. |
| Threats to validity | 1 | 3 | Listed on the dashboard and below. |
| Related work | 1 | 1 | None cited. |
| Limitations stated | 1 | 3 | Single date, no station_status, straight-line distance, no demand layer. |
| Engineering (product app) | 2 | 3 | Before: one inline-script HTML file, no build, tests or CI. Now: pinned Vite build, a check that runs on every build, a Pages workflow, README run steps. The legacy map itself is unchanged apart from its credit line. |

## Fixed in this pass (cheap)

- Added a pure stats module and a node assert known-answer check, run by `npm run build` and `npm test`.
- Added the dashboard (`site/`) with a station explorer, live coverage calculator, spacing histogram with an isolated-stations table, fleet mix and a computed data-quality audit. Every number is derived from the snapshot file at build or run time and labelled as recorded on 29 Jul 2023.
- Added `.github/workflows/pages.yml` and `.gitignore` entries for site build output.
- Attribution: README now states the project derives from Zehui Yin's MIT map and keeps the copyright line; the legacy map's title box credited only "Jesun" with a broken link (`https://jesunahmadushno`) and now credits the original author with working links.
- README copy error "bus markers" corrected to "station markers"; run-locally steps added.
- Data quirks documented on the dashboard, computed from the data: post_code missing on 296 stations, is_valet_station present on 15, altitude 0.0 or null on all but two stations (662 at 0.0, 10 null; Church St / Wood St reads 102.08 and Oak St / Sackville St reads 10.0), and nearby_distance values of 16,093.4 m (6 stations) and 17,702.74 m (1), which are about 10 and 11 miles.

## Threats to validity

- Temporal: one snapshot. Station count and capacity change over time, so nothing here describes the current network.
- Construct: "gap" means distance to the nearest station, not unmet demand. Without population, jobs or trip data it says nothing about equity or need.
- Measurement: haversine distance understates walking distance across barriers such as the Don Valley, rail corridors and highways.
- Data: the feed is self-reported by the operator; capacity is the configured dock count, not working docks.

## Remaining gaps and what each needs

| Gap | What it needs |
|---|---|
| No time series, availability or utilisation | Poll `station_status` and `station_information` (free, public GBFS) on a schedule, e.g. every 15 minutes for 4+ weeks, committed as compressed snapshots; a few hundred MB. |
| No demand or equity question | Bike Share Toronto ridership data from the City of Toronto open data portal (public, free) plus Statistics Canada 2021 census dissemination-area population; a point-in-polygon join. |
| No baseline for spacing | A complete spatial randomness (Poisson) simulation over the city boundary (City of Toronto open data shapefile) to compare the observed nearest-neighbour distribution; seconds of CPU. |
| Walking distance instead of straight line | An OpenStreetMap Toronto extract and a routing engine (e.g. OSRM) run locally; under an hour of CPU. |
| Related work | A short literature section on bike-share station siting and catchment (walking-distance) studies, with citations checked against the sources. |
| Legacy map engineering | Rotate or domain-restrict the MapTiler key hardcoded in `index.html` (owner action in the MapTiler console); replace the jQuery 1.9.1 CDN load with one `innerHTML` line; add fetch error handling and accessible labels. Left untouched here because the map runs in production on Vercel. |
