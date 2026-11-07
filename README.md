# Bike Share Toronto Real Time Station Info

Live dashboard: https://jesunahmadushno.github.io/toronto_bikeshare_station_info/

This web map shows the latest information about the bikeshare Toronto stations, such as their address and capacity. The data comes from the [GBFS](https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_information), a public API that provides standardized bike-sharing information. The map does not have an auto-refresh feature, because the API does not update very often. However, you can refresh the web page manually to get the most current data from the API.

To access the web map, open the [live map on Vercel](https://torontobikesharestationinfo.vercel.app) or the original author's [copy](https://zehuiyin.github.io/toronto_bikeshare_station_info/). You can zoom in and out, pan around, and click on the station markers to see more information in pop-ups.

Created by Zehui Yin with <i>MapLibre GL JS</i> and <i>Maptiler</i>. This repository derives from that MIT-licensed project (see `LICENSE`, copyright Zehui Yin 2023).

## Station dashboard

`site/` is a small analysis of the recorded snapshot `sample_station_information_2023_07_29.json` (GBFS `last_updated` 1690614324, 29 July 2023): a station explorer, a walking-coverage calculator, nearest-neighbour spacing, fleet mix and a data-quality audit. Every number is computed in the browser from that one file, and it describes that day only, not today's network.

Run locally:

```sh
cd site && npm ci && npm test && npm run build && npm run preview
```

`npm test` (also run by `npm run build`) is a known-answer check that pins the snapshot facts. The research review is in `docs/research-review.md`.
