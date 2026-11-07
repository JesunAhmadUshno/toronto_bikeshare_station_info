// Pure helpers shared by the page and the node known-answer check (src/stats.check.mjs).
const R = 6371008.8; // mean Earth radius in metres (IUGG)
const rad = (d) => (d * Math.PI) / 180;

export function haversine(a, b) {
  const dp = rad(b.lat - a.lat), dl = rad(b.lon - a.lon);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// O(n^2) nearest neighbour: 674 stations is ~450k pairs, a few ms in a browser.
// ponytail: brute force; use a k-d tree if the station list grows past ~20k.
export function nearestNeighbours(st) {
  return st.map((a, i) => {
    let best = Infinity, j = -1;
    for (let k = 0; k < st.length; k++) if (k !== i) { const d = haversine(a, st[k]); if (d < best) { best = d; j = k; } }
    return { d: best, j };
  });
}

// Share of stations that have another station within r metres.
export const coverageShare = (nn, r) => nn.filter((x) => x.d <= r).length / nn.length;

// Stations and docks within r metres of a point.
export function within(st, p, r) {
  const hits = st.filter((s) => haversine(p, s) <= r);
  return { stations: hits.length, docks: hits.reduce((t, s) => t + s.capacity, 0) };
}

export function countBy(xs, f) {
  const m = new Map();
  for (const x of xs) for (const k of [].concat(f(x))) m.set(k, (m.get(k) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function summary(st) {
  const caps = st.map((s) => s.capacity);
  const charging = st.filter((s) => s.is_charging_station);
  return {
    stations: st.length,
    docks: caps.reduce((a, b) => a + b, 0),
    medianCap: median(caps), minCap: Math.min(...caps), maxCap: Math.max(...caps),
    charging: charging.length, chargingDocks: charging.reduce((t, s) => t + s.capacity, 0),
  };
}

// Field completeness: how many stations carry each key at all.
export function fieldCounts(st) {
  const keys = [...new Set(st.flatMap((s) => Object.keys(s)))];
  return keys.map((k) => [k, st.filter((s) => s[k] !== undefined).length]).sort((a, b) => a[1] - b[1]);
}
