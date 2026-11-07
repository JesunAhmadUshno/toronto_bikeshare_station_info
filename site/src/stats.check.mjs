// Known-answer check, run by `npm run build`. Pins snapshot facts computed independently
// (Python, same haversine) from ../sample_station_information_2023_07_29.json.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summary, nearestNeighbours, coverageShare, median, within, countBy, fieldCounts } from './stats.js';
const snap = JSON.parse(readFileSync(new URL('../../sample_station_information_2023_07_29.json', import.meta.url)));
const st = snap.data.stations;
assert.equal(snap.last_updated, 1690614324);
assert.deepEqual(summary(st), { stations: 674, docks: 12773, medianCap: 19, minCap: 7, maxCap: 57, charging: 14, chargingDocks: 324 });
const nn = nearestNeighbours(st);
assert.ok(Math.abs(median(nn.map((x) => x.d)) - 206.354) < 0.01, 'median NN');
assert.ok(Math.abs(Math.max(...nn.map((x) => x.d)) - 2119.52) < 0.01, 'max NN');
assert.equal(st[nn.reduce((b, x, i) => (x.d > nn[b].d ? i : b), 0)].name, 'Parkcrest Dr / Kingston Rd');
assert.equal(Math.round(coverageShare(nn, 300) * 1000), 688);
assert.equal(Math.round(coverageShare(nn, 500) * 1000), 889);
assert.deepEqual(within(st, st[0], 0), { stations: 1, docks: st[0].capacity });
const cfg = Object.fromEntries(countBy(st, (s) => s.physical_configuration));
assert.deepEqual([cfg.REGULAR, cfg.SMARTMAPFRAME, cfg.VAULT, cfg.ELECTRICBIKESTATION], [516, 97, 44, 14]);
assert.equal(Object.fromEntries(countBy(st, (s) => s.rental_methods)).CREDITCARD, 532);
const f = Object.fromEntries(fieldCounts(st));
assert.deepEqual([f.post_code, f.is_valet_station, f.cross_street], [378, 15, 62]);
console.log('stats.check: all known answers match');
