import { useMemo, useState, useEffect, useId } from 'react';
import snapshot from '../../sample_station_information_2023_07_29.json';
import { summary, nearestNeighbours, coverageShare, median, within, countBy, fieldCounts } from './stats.js';

const REPO = 'https://github.com/JesunAhmadUshno/toronto_bikeshare_station_info';
const blob = (p) => `${REPO}/blob/main/${p}`;
const SNAP_FILE = 'sample_station_information_2023_07_29.json';
const FEED = 'https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_information';
const VERCEL = 'https://torontobikesharestationinfo.vercel.app';
const ORIGINAL = 'https://zehuiyin.github.io/toronto_bikeshare_station_info/';

const ST = snapshot.data.stations;
const S = summary(ST);
const NN = nearestNeighbours(ST);
const NN_D = NN.map((x) => x.d);
const NN_MED = median(NN_D);
const NN_MAX = Math.max(...NN_D);
const SNAP_DATE = new Date(snapshot.last_updated * 1000);
const SNAP_LABEL = SNAP_DATE.toLocaleString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'medium', timeStyle: 'short' });
const SNAP_DAY = SNAP_DATE.toLocaleDateString('en-GB', { timeZone: 'America/Toronto', day: 'numeric', month: 'short', year: 'numeric' });

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
const metres = (m) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);

const CFG_COLOR = { REGULAR: 'var(--primary)', SMARTMAPFRAME: 'var(--good)', VAULT: '#8b6fd6', ELECTRICBIKESTATION: 'var(--warn)' };
const cfgColor = (c) => CFG_COLOR[c] || 'var(--muted)';
const CONFIGS = countBy(ST, (s) => s.physical_configuration);

const SECTIONS = [['top', 'Overview', '◎'], ['map', 'Map', '⌖'], ['coverage', 'Coverage', '◍'], ['spacing', 'Spacing', '↔'], ['fleet', 'Fleet', '▥'], ['audit', 'Data quality', '✓'], ['about', 'About', '❯_']];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="menubar" role="banner">
      <span className="apple" aria-hidden="true">◆</span>
      <a className="app" href="#top">Bike Share Stations</a>
      <a className="m" href={blob(SNAP_FILE)}>Snapshot</a>
      <a className="m" href={blob('docs/research-review.md')}>Review</a>
      <a className="m" href={VERCEL}>Live map</a>
      <span className="spacer" />
      <span className="status"><i /> Recorded {SNAP_DAY}</span>
      <a href={REPO}>GitHub ↗</a>
      <span className="clock">{now.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}

function Dock() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dock" aria-label="Sections">
      {SECTIONS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>
          <span className="ico" aria-hidden="true">{icon}</span><span className="lbl">{label}</span>
        </a>
      ))}
    </nav>
  );
}

function Range({ label, value, min, max, step, onChange, show }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label} <span>{show}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

export default function App() {
  useReveal();
  const [sel, setSel] = useState(() => Math.max(0, ST.findIndex((s) => s.name.startsWith('Union Station'))));
  const [r, setR] = useState(300);
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero />
      <StationMap sel={sel} setSel={setSel} r={r} />
      <Coverage sel={sel} setSel={setSel} r={r} setR={setR} />
      <Spacing setSel={setSel} />
      <Fleet />
      <Audit />
      <About />
      <Dock />
      <footer>
        Data: Bike Share Toronto GBFS <code>station_information</code> feed, recorded {SNAP_LABEL} and committed as <code>{SNAP_FILE}</code>. Every number on this page is computed in your browser from that file; nothing here is live.
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <header className="card hero window" id="top" data-title="toronto_bikeshare — README">
      <div className="head">
        <p className="eyebrow">GBFS station snapshot · {SNAP_DAY}</p>
        <span className="pill info">● Recorded snapshot, not live</span>
      </div>
      <h1>Toronto’s {fmt(S.stations)} Bike Share stations hold {fmt(S.docks)} docks, and half sit <em>within {Math.round(NN_MED)} m</em> of another station.</h1>
      <p className="sub">
        A small analysis of one recorded copy of the public GBFS station feed. It asks three plain questions: how dense is the network, where are the gaps, and how clean is the data.
        Distances are great-circle (haversine), recomputed in your browser from the {fmt(S.stations)} station coordinates every time the page loads.
      </p>
      <div className="actions">
        <a className="btn primary" href="#coverage">Try the coverage calculator</a>
        <a className="btn ghost" href={VERCEL}>Open the original live map</a>
        <span className="hint">Feed timestamp <code>{snapshot.last_updated}</code> = {SNAP_LABEL} Toronto time</span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{fmt(S.stations)}</div><div className="cap">Stations in the snapshot</div></div>
        <div className="tile"><div className="num">{fmt(S.docks)}</div><div className="cap">Docks in total</div></div>
        <div className="tile"><div className="num">{S.medianCap}</div><div className="cap">Median docks per station (range {S.minCap} to {S.maxCap})</div></div>
        <div className="tile"><div className="num">{S.charging}</div><div className="cap">E-bike charging stations, {fmt(S.chargingDocks)} docks</div></div>
      </div>
    </header>
  );
}

// Equirectangular projection scaled by cos(43.7°): distortion is small at city scale.
// Used for drawing only; every distance on the page is haversine.
const LATS = ST.map((s) => s.lat), LONS = ST.map((s) => s.lon);
const BOX = { lat0: Math.min(...LATS), lat1: Math.max(...LATS), lon0: Math.min(...LONS), lon1: Math.max(...LONS) };
const KX = Math.cos((43.7 * Math.PI) / 180);
const MW = 960, MPAD = 16;
const MSCALE = (MW - 2 * MPAD) / ((BOX.lon1 - BOX.lon0) * KX);
const MH = Math.round((BOX.lat1 - BOX.lat0) * MSCALE + 2 * MPAD);
const px = (s) => MPAD + (s.lon - BOX.lon0) * KX * MSCALE;
const py = (s) => MPAD + (BOX.lat1 - s.lat) * MSCALE;
const M_PER_DEG_LAT = 111195; // metres per degree of latitude on the mean sphere

function StationMap({ sel, setSel, r }) {
  const [charging, setCharging] = useState(false);
  const [cfg, setCfg] = useState('all');
  const [card, setCard] = useState('any');
  const [hover, setHover] = useState(null);
  const ids = { charging: useId(), cfg: useId(), card: useId() };
  const shown = useMemo(() => ST.map((s, i) => [s, i]).filter(([s]) =>
    (!charging || s.is_charging_station) && (cfg === 'all' || s.physical_configuration === cfg) &&
    (card === 'any' || (card === 'yes') === s.rental_methods.includes('CREDITCARD'))), [charging, cfg, card]);
  const docks = shown.reduce((t, [s]) => t + s.capacity, 0);
  const focus = ST[hover ?? sel];
  return (
    <section id="map" className="card window reveal" data-title="stations.geojson — recorded snapshot">
      <div className="head">
        <div>
          <p className="eyebrow">Station explorer</p>
          <h2>The network is dense downtown and thins out toward the edges.</h2>
          <p className="sub">Each dot is a station, sized by dock count and coloured by hardware type. Click a dot to inspect it and to centre the coverage calculator on it. The ring shows the current walking radius ({r} m).</p>
        </div>
        <span className="pill info">{fmt(shown.length)} stations · {fmt(docks)} docks</span>
      </div>
      <div className="controls">
        <div className="field"><label htmlFor={ids.cfg}>Hardware type</label>
          <select id={ids.cfg} value={cfg} onChange={(e) => setCfg(e.target.value)}>
            <option value="all">All types</option>
            {CONFIGS.map(([k, n]) => <option key={k} value={k}>{k} ({n})</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor={ids.card}>Credit card rental</label>
          <select id={ids.card} value={card} onChange={(e) => setCard(e.target.value)}>
            <option value="any">Any</option><option value="yes">Accepts credit card</option><option value="no">No credit card</option>
          </select>
        </div>
        <div className="field"><label htmlFor={ids.charging}>E-bike charging</label>
          <select id={ids.charging} value={charging ? 'yes' : 'any'} onChange={(e) => setCharging(e.target.value === 'yes')}>
            <option value="any">Any station</option><option value="yes">Charging stations only</option>
          </select>
        </div>
      </div>
      <svg className="chart" viewBox={`0 0 ${MW} ${MH}`} role="img" aria-label={`Map of ${shown.length} Bike Share Toronto stations by latitude and longitude`} onMouseLeave={() => setHover(null)}>
        <rect x="0" y="0" width={MW} height={MH} rx="14" fill="var(--primary-pale)" />
        <circle cx={px(ST[sel])} cy={py(ST[sel])} r={(r / M_PER_DEG_LAT) * MSCALE} fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeDasharray="4 3" />
        {shown.map(([s, i]) => (
          <circle key={s.station_id} cx={px(s)} cy={py(s)} r={1.2 + Math.sqrt(s.capacity) * 0.55} fill={cfgColor(s.physical_configuration)}
            fillOpacity={i === sel ? 1 : 0.7} stroke={i === sel ? 'var(--text)' : 'none'} strokeWidth="2" style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHover(i)} onClick={() => setSel(i)} />
        ))}
        <text x={MW - MPAD - 6} y={MH - MPAD - 6} textAnchor="end">↑ N · equirectangular at 43.7° N</text>
      </svg>
      <div className="legend">
        {CONFIGS.slice(0, 4).map(([k]) => <span key={k}><i style={{ background: cfgColor(k) }} />{k}</span>)}
        <span><i style={{ background: 'var(--muted)' }} />other frames</span>
      </div>
      <div className="tip" aria-live="polite">
        <b>{focus.name}</b> · #{focus.station_id} · {focus.capacity} docks · {focus.physical_configuration}{focus.is_charging_station ? ' · charging' : ''} · pays by {focus.rental_methods.map((m) => m.toLowerCase()).join(', ')}{focus.post_code ? ` · ${focus.post_code}` : ''} · nearest station {metres(NN[hover ?? sel].d)}
      </div>
    </section>
  );
}

const RADII = Array.from({ length: 96 }, (_, i) => 50 + i * 10);

function Coverage({ sel, setSel, r, setR }) {
  const share = coverageShare(NN, r);
  const near = within(ST, ST[sel], r);
  const t0 = performance.now();
  const curve = useMemo(() => RADII.map((x) => [x, coverageShare(NN, x)]), []);
  const ms = performance.now() - t0;
  const sorted = useMemo(() => ST.map((s, i) => [s.name, i]).sort((a, b) => a[0].localeCompare(b[0])), []);
  const id = useId();
  const W = 460, H = 230, pad = { l: 40, r: 10, t: 10, b: 24 };
  const cx = (v) => pad.l + ((v - 50) / 950) * (W - pad.l - pad.r);
  const cy = (v) => pad.t + (1 - v) * (H - pad.t - pad.b);
  return (
    <section id="coverage" className="card window reveal" data-title="coverage.calc — live haversine">
      <p className="eyebrow">Walking-coverage calculator · computed live</p>
      <h2>At {r} m, {pct(share)} of stations have another one in reach.</h2>
      <p className="sub">
        Drag the radius to see how much of the network has a backup station within walking distance (useful when a dock is full or empty).
        The right-hand tiles count stations and docks within the same radius of the selected station, using haversine distance across all {fmt(S.stations)} stations.
      </p>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div>
          <div className="controls" style={{ gridTemplateColumns: '1fr' }}>
            <Range label="Walking radius" value={r} min={50} max={1000} step={10} onChange={setR} show={`${r} m`} />
            <div className="field"><label htmlFor={id}>Centre on station</label>
              <select id={id} value={sel} onChange={(e) => setSel(+e.target.value)}>
                {sorted.map(([n, i]) => <option key={i} value={i}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="tiles" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 0 }}>
            <div className="tile"><div className="num">{pct(share, 1)}</div><div className="cap">of stations have a neighbour within {r} m</div></div>
            <div className="tile"><div className="num">{fmt(near.docks)}</div><div className="cap">docks at {near.stations} station{near.stations === 1 ? '' : 's'} within {r} m of {ST[sel].name}</div></div>
          </div>
        </div>
        <div>
          <h3>Share of stations with a neighbour within r</h3>
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Coverage curve: share of stations with a neighbour within the walking radius">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => <g key={t}><line className="axis" x1={pad.l} x2={W - pad.r} y1={cy(t)} y2={cy(t)} /><text x={pad.l - 6} y={cy(t) + 4} textAnchor="end">{pct(t)}</text></g>)}
            <polyline fill="none" stroke="var(--primary)" strokeWidth="2.5" points={curve.map(([x, v]) => `${cx(x)},${cy(v)}`).join(' ')} />
            <line x1={cx(r)} x2={cx(r)} y1={pad.t} y2={H - pad.b} stroke="var(--warn)" strokeDasharray="5 4" />
            <circle cx={cx(r)} cy={cy(share)} r="5" fill="var(--primary)" stroke="var(--surface-strong)" strokeWidth="2" />
            <text x={pad.l} y={H - 4}>50 m</text><text x={W - pad.r} y={H - 4} textAnchor="end">1,000 m</text>
          </svg>
          <p className="hint">{RADII.length} radii evaluated in {ms.toFixed(1)} ms on first render; nearest-neighbour distances are precomputed once on load.</p>
        </div>
      </div>
    </section>
  );
}

function Spacing({ setSel }) {
  const BIN = 50, MAXB = 1000;
  const bins = useMemo(() => {
    const b = Array(MAXB / BIN + 1).fill(0);
    for (const d of NN_D) b[Math.min(b.length - 1, Math.floor(d / BIN))]++;
    return b;
  }, []);
  const isolated = useMemo(() => NN.map((x, i) => ({ ...x, i })).sort((a, b) => b.d - a.d).slice(0, 8), []);
  const W = 960, H = 240, pad = { l: 40, r: 10, t: 14, b: 26 };
  const top = Math.max(...bins);
  const bw = (W - pad.l - pad.r) / bins.length;
  const y = (v) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  return (
    <section id="spacing" className="card window reveal" data-title="nearest_neighbour.svg">
      <p className="eyebrow">Spacing and gaps</p>
      <h2>Median gap {Math.round(NN_MED)} m; the loneliest station is {metres(NN_MAX)} from its nearest neighbour.</h2>
      <p className="sub">Distance from every station to its closest other station, in {BIN} m bins. The last bar collects everything at {fmt(MAXB)} m or more. The table lists the most isolated stations, which are candidates for infill. Click a row to show it on the map.</p>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Histogram of nearest-neighbour distances between stations" style={{ marginTop: 12 }}>
        {[0, Math.round(top / 2), top].map((t) => <g key={t}><line className="axis" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} /><text x={pad.l - 6} y={y(t) + 4} textAnchor="end">{t}</text></g>)}
        {bins.map((n, i) => (
          <rect key={i} x={pad.l + i * bw + 1} width={bw - 2} y={y(n)} height={y(0) - y(n)} rx="3" fill={i === bins.length - 1 ? 'var(--warn)' : 'var(--primary)'} opacity="0.85"><title>{i === bins.length - 1 ? `≥ ${MAXB} m` : `${i * BIN}–${(i + 1) * BIN} m`}: {n} stations</title></rect>
        ))}
        <line x1={pad.l + (NN_MED / BIN) * bw} x2={pad.l + (NN_MED / BIN) * bw} y1={pad.t} y2={H - pad.b} stroke="var(--text)" strokeDasharray="4 3" />
        <text x={pad.l + (NN_MED / BIN) * bw + 6} y={pad.t + 10} style={{ fill: 'var(--text)' }}>median {Math.round(NN_MED)} m</text>
        {[0, 250, 500, 750, 1000].map((m) => <text key={m} x={pad.l + (m / BIN) * bw} y={H - 6} textAnchor="middle">{m} m</text>)}
      </svg>
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table>
          <thead><tr><th>Station</th><th>Docks</th><th>Nearest station</th><th>Gap</th></tr></thead>
          <tbody>
            {isolated.map((x) => (
              <tr key={x.i} onClick={() => { setSel(x.i); document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>
                <td>{ST[x.i].name}</td><td>{ST[x.i].capacity}</td><td>{ST[x.j].name}</td><td className="no">{metres(x.d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Bars({ rows, total, color }) {
  const top = rows[0][1];
  return (
    <div className="bars" style={{ marginTop: 12 }}>
      {rows.map(([k, v]) => (
        <div className="bar-row" key={k}>
          <div className="lab"><span>{k}</span><b>{fmt(v)} <span className="hint">({pct(v / total)})</span></b></div>
          <div className="track"><div className="fill" style={{ width: `${(v / top) * 100}%`, background: color ? color(k) : 'var(--primary)' }} /></div>
        </div>
      ))}
    </div>
  );
}

function Fleet() {
  const methods = countBy(ST, (s) => s.rental_methods);
  const noCard = ST.filter((s) => !s.rental_methods.includes('CREDITCARD')).length;
  const caps = useMemo(() => {
    const b = new Map();
    for (const s of ST) { const k = Math.floor(s.capacity / 5) * 5; b.set(k, (b.get(k) || 0) + 1); }
    return [...b.entries()].sort((a, c) => a[0] - c[0]);
  }, []);
  const W = 460, H = 220, pad = { l: 34, r: 8, t: 10, b: 24 };
  const top = Math.max(...caps.map((c) => c[1]));
  const bw = (W - pad.l - pad.r) / caps.length;
  const y = (v) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  return (
    <section id="fleet" className="card window reveal" data-title="station_types.svg">
      <p className="eyebrow">Fleet mix</p>
      <h2>Most stations are standard docks; {noCard} of {fmt(S.stations)} do not take credit cards.</h2>
      <p className="sub">Counts straight from the snapshot. Every station accepts keys, transit cards and phones; credit card readers are the one method that varies.</p>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div>
          <h3>Hardware type</h3>
          <Bars rows={CONFIGS} total={S.stations} color={cfgColor} />
          <h3 style={{ marginTop: 20 }}>Rental methods accepted</h3>
          <Bars rows={methods} total={S.stations} />
        </div>
        <div>
          <h3>Docks per station</h3>
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Histogram of dock capacity per station">
            {[0, top].map((t) => <g key={t}><line className="axis" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} /><text x={pad.l - 6} y={y(t) + 4} textAnchor="end">{t}</text></g>)}
            {caps.map(([k, n], i) => (
              <g key={k}><rect x={pad.l + i * bw + 2} width={bw - 4} y={y(n)} height={y(0) - y(n)} rx="4" fill="var(--primary)" opacity="0.85"><title>{k}–{k + 4} docks: {n} stations</title></rect>
                <text x={pad.l + (i + 0.5) * bw} y={H - 6} textAnchor="middle">{k}</text></g>
            ))}
          </svg>
          <p className="hint">Bins of 5 docks, labelled by their lower edge. Median {S.medianCap}, range {S.minCap} to {S.maxCap}.</p>
        </div>
      </div>
    </section>
  );
}

function Audit() {
  const fields = fieldCounts(ST);
  const nearby = countBy(ST, (s) => s.nearby_distance);
  const odd = nearby.filter(([v]) => v > 5000);
  const altZero = ST.filter((s) => s.altitude === 0).length, altNull = ST.filter((s) => s.altitude == null).length;
  const sparse = fields.filter(([, n]) => n < S.stations);
  return (
    <section id="audit" className="card window reveal" data-title="gbfs_audit.txt — computed from the snapshot">
      <p className="eyebrow">Data quality</p>
      <h2>The feed is complete where it matters and patchy everywhere else.</h2>
      <p className="sub">
        Every station has an id, name, coordinates and capacity, which is all the analysis above needs. Optional GBFS fields are uneven, and two fields carry values that look like defaults or unit slips.
        Computed from the recorded snapshot, so it describes that file only.
      </p>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <h3>Fields present on fewer than {fmt(S.stations)} stations</h3>
          <table>
            <thead><tr><th>Field</th><th>Present</th><th>Missing</th></tr></thead>
            <tbody>
              {sparse.map(([k, n]) => <tr key={k}><td className="mono">{k}</td><td>{n}</td><td className="no">{S.stations - n} ({pct((S.stations - n) / S.stations)})</td></tr>)}
            </tbody>
          </table>
          <p className="hint">{fields.length - sparse.length} of {fields.length} fields are present on every station.</p>
        </div>
        <div>
          <h3>Suspicious values</h3>
          <ul className="steps" style={{ listStyle: 'none', padding: 0 }}>
            <li><span className="n">1</span><div><b>nearby_distance outliers</b><div className="hint">{odd.map(([v, n]) => `${n} × ${v.toFixed(2)} m`).join(', ')}. Most stations use round values ({nearby.slice(0, 3).map(([v, n]) => `${v} m on ${n}`).join(', ')}). 1,609.34 m is one mile and 16,093.4 m is ten, so these look like a unit or default setting, not a walking distance.</div></div></li>
            <li><span className="n">2</span><div><b>altitude is a placeholder</b><div className="hint">{altZero} stations report exactly 0.0 m and {altNull} report null, leaving {S.stations - altZero - altNull} with a real value. Toronto is not at sea level, so elevation cannot be used.</div></div></li>
            <li><span className="n">3</span><div><b>Groups and valet flags are sparse</b><div className="hint">{ST.filter((s) => s.groups.length === 0).length} stations have an empty groups list; is_valet_station appears on only {fields.find(([k]) => k === 'is_valet_station')?.[1] ?? 0}.</div></div></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function About() {
  const docs = [
    [SNAP_FILE, 'Snapshot', 'The recorded GBFS file this page reads'],
    ['docs/research-review.md', 'Research review', 'Grades, fixes made, gaps left'],
    ['site/src/stats.js', 'Stats module', 'Haversine, spacing, coverage, counts'],
    ['site/src/stats.check.mjs', 'Known-answer check', 'Runs before every build'],
    ['index.html', 'Original map', 'MapLibre map of the live feed'],
    ['LICENSE', 'Licence', 'MIT, Zehui Yin 2023'],
  ];
  return (
    <section id="about" className="card window reveal" data-title="Terminal — npm run build">
      <p className="eyebrow">Provenance, limits and reproduction</p>
      <h2>One file in, every number out. Here is what it can and cannot tell you.</h2>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div>
          <h3>Where it comes from</h3>
          <p className="hint" style={{ fontSize: 13 }}>
            The data is the public GBFS v1 <a href={FEED}>station_information</a> feed, recorded once at {SNAP_LABEL}. The original live web map (MapLibre GL JS) was built by Zehui Yin and is MIT licensed; this repository derives from <a href={ORIGINAL}>that project</a> (credited in the README), and the live map still runs at <a href={VERCEL}>Vercel</a>. This dashboard adds the analysis and does not call the live feed.
          </p>
          <h3 style={{ marginTop: 16 }}>Limits</h3>
          <ul className="hint" style={{ fontSize: 13, paddingLeft: 18 }}>
            <li>One snapshot from {SNAP_DAY}. The network has changed since, so none of this describes today.</li>
            <li>No station_status data: nothing here says how full or used any station is.</li>
            <li>Straight-line distance understates real walking distance across rail lines, rivers and highways.</li>
            <li>Station counts only: no population, demand or equity layer, so “gap” means spatial gap, not unmet need.</li>
          </ul>
        </div>
        <div>
          <h3>Rebuild it</h3>
          <ol className="steps">
            <li><span className="n">1</span><div><b>Clone</b><div className="hint"><code>git clone {REPO}.git</code></div></div></li>
            <li><span className="n">2</span><div><b>Check and build</b><div className="hint"><code>cd site && npm ci && npm run build</code> runs the known-answer check first, which fails the build if any pinned snapshot fact changes.</div></div></li>
            <li><span className="n">3</span><div><b>Preview</b><div className="hint"><code>npm run preview</code></div></div></li>
          </ol>
        </div>
      </div>
      <div className="docs" style={{ marginTop: 20 }}>
        {docs.map(([p, t, d]) => <a key={p} href={blob(p)}><b>{t}</b><small>{d}</small></a>)}
      </div>
    </section>
  );
}
