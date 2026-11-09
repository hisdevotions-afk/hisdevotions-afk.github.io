/* Atlas demo: the real Atlas interface (markup + CSS) driven by a fictional city.
   Every name and number here is invented. */
(() => {
const ICONS = window.__ICONS || {};
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const standalone = window.top === window;
const nf = n => Math.round(n).toLocaleString('pt-BR');
const p1 = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const ease = t => 1 - Math.pow(1 - t, 4);
const lerp = (a, b, t) => a + (b - a) * t;
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* ---------------- geometry ---------------- */
function clipHalf(poly, a, b) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = b[0] - a[0], ny = b[1] - a[1];
  const side = p => (p[0] - mx) * nx + (p[1] - my) * ny, out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], sp = side(p), sq = side(q);
    if (sp <= 0) out.push(p);
    if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out;
}
function voronoi(seeds, bound, maxR) {
  return seeds.map((s, i) => {
    let poly = bound;
    for (let j = 0; j < seeds.length && poly.length >= 3; j++) {
      if (i === j) continue; const o = seeds[j];
      if (maxR && Math.hypot(o[0] - s[0], o[1] - s[1]) > maxR) continue;
      poly = clipHalf(poly, s, o);
    }
    return poly;
  });
}
function centroid(poly) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], f = p[0] * q[1] - q[0] * p[1]; a += f; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f; }
  a *= .5; return a ? [cx / (6 * a), cy / (6 * a), Math.abs(a)] : [poly[0][0], poly[0][1], 0];
}
function inPoly(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j];
    if (((a[1] > pt[1]) !== (b[1] > pt[1])) && (pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0])) c = !c; }
  return c;
}
function clipSeg(p, q, poly, c) {
  let t0 = 0, t1 = 1; const d = [q[0] - p[0], q[1] - p[1]];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    let n = [-(b[1] - a[1]), b[0] - a[0]];
    if (n[0] * (c[0] - a[0]) + n[1] * (c[1] - a[1]) < 0) n = [-n[0], -n[1]];
    const num = n[0] * (p[0] - a[0]) + n[1] * (p[1] - a[1]), den = n[0] * d[0] + n[1] * d[1];
    if (den === 0) { if (num < 0) return null; continue; }
    const t = -num / den; if (den > 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  return [[p[0] + d[0] * t0, p[1] + d[1] * t0], [p[0] + d[0] * t1, p[1] + d[1] * t1]];
}
const bbox = poly => poly.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [1e9, 1e9, -1e9, -1e9]);

/* ---------------- fictional city ---------------- */
const CITY = 'Nova Aurora';
const NAMES = ['Vila Aurora', 'Jardim das Acácias', 'Alto da Serra', 'Parque da Lagoa', 'Centro', 'Bela Vista Sul',
  'Morro Azul', 'Jardim Primavera', 'Recanto Verde', 'Vila Esperança', 'Portal do Sol', 'Chácara dos Ipês'];
const OUTER = ['Campo Alegre', 'Vale do Sol', 'Santa Luzia', 'Boa Vista', 'Monte Claro', 'Jardim Imperial', 'Três Pontes',
  'Vila Rica', 'Pedra Branca', 'Lagoa Seca', 'Serra Verde', 'Nova Era', 'Pinheiral', 'São Lucas', 'Bom Retiro', 'Planalto'];
const BOUND = [[-260, -260], [1260, -260], [1260, 960], [-260, 960]];
const inner = [], outer = [];
const CX = 520, CY = 350;
for (let i = 0; i < NAMES.length; i++) {
  const a = i / NAMES.length * Math.PI * 2 + rnd() * .4, r = i === 4 ? 0 : (i % 2 ? .52 : .9) * (0.85 + rnd() * .25);
  inner.push([CX + Math.cos(a) * 250 * r + (rnd() - .5) * 30, CY + Math.sin(a) * 175 * r + (rnd() - .5) * 30]);
}
for (let i = 0; i < OUTER.length; i++) {
  const a = i / OUTER.length * Math.PI * 2 + rnd() * .3, rr = 1.75 + rnd() * .5;
  outer.push([CX + Math.cos(a) * 250 * rr, CY + Math.sin(a) * 180 * rr]);
}
const seedsN = inner.concat(outer);
const MACRO = voronoi(seedsN, BOUND); // street patterns only
const HOODS = inner.map((s, i) => ({ i, name: NAMES[i], seed: s, edges: [] }));
const OUTS = outer.map((s, i) => ({ name: OUTER[i], c: centroid(MACRO[inner.length + i]) }));

// existing units (fictional) and hotspots of demand
const UNITS = [[CX - 150, CY - 10], [CX + 120, CY + 135]];
const HOT = [{ x: CX + 175, y: CY - 105, s: 95, w: 1 }, { x: CX - 205, y: CY + 95, s: 85, w: .8 }, { x: CX + 30, y: CY - 175, s: 70, w: .55 }];
const KM = 52; // world units per km
// one tessellation of "census tracts"; neighborhoods are unions of tracts, so their borders come out jagged
const warp = (x, y) => [x + 11 * (Math.sin(y / 31) + Math.sin(x / 47 + 1.3)), y + 11 * (Math.cos(x / 37) + Math.sin(y / 23 + 2.1))];
const inCity = (x, y) => Math.hypot((x - CX) / 300, (y - CY) / 212) + .07 * (Math.sin(x / 41) + Math.cos(y / 33) + Math.sin((x + y) / 57)) < 1;
const SP = 21, tractSeeds = [];
for (let y = CY - 270; y < CY + 270; y += SP) for (let x = CX - 380; x < CX + 380; x += SP) tractSeeds.push([x + rnd() * SP, y + rnd() * SP]);
const AREA = [[CX - 400, CY - 290], [CX + 400, CY - 290], [CX + 400, CY + 290], [CX - 400, CY + 290]];
const SECT = [], OUTSIDE = [];
voronoi(tractSeeds, AREA, 60).forEach(poly => {
  if (poly.length < 3) return;
  const c = centroid(poly);
  if (!inCity(c[0], c[1])) { OUTSIDE.push(poly); return; }
  const w = warp(c[0], c[1]);
  let hood = 0, bd = 1e12; inner.forEach((sd, i) => { const d = (w[0] - sd[0]) ** 2 + (w[1] - sd[1]) ** 2; if (d < bd) { bd = d; hood = i; } });
  const pot = HOT.reduce((a, g) => a + g.w * Math.exp(-((c[0] - g.x) ** 2 + (c[1] - g.y) ** 2) / (2 * g.s * g.s)), 0) + rnd() * .09;
  SECT.push({ poly, c, hood, pot, bb: bbox(poly), a: 0, d: Math.hypot(c[0] - CX, c[1] - CY) });
});
// borders: tract edges whose two sides belong to different neighborhoods (or to the outside)
const VID = new Map(); let vcount = 0;
const vkey = p => { const gx = Math.round(p[0] * 10), gy = Math.round(p[1] * 10);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const k = (gx + dx) + ',' + (gy + dy); if (VID.has(k)) return VID.get(k); }
  const id = vcount++; VID.set(gx + ',' + gy, id); return id; };
const EDGES = new Map();
const addEdges = (poly, owner) => poly.forEach((p, k) => { const q = poly[(k + 1) % poly.length], a = vkey(p), b = vkey(q); if (a === b) return;
  const key = a < b ? a + '_' + b : b + '_' + a, e = EDGES.get(key); if (e) e.o.push(owner); else EDGES.set(key, { p, q, o: [owner] }); });
SECT.forEach(t => addEdges(t.poly, t.hood)); OUTSIDE.forEach(poly => addEdges(poly, -1));
EDGES.forEach(e => { const a = e.o[0], b = e.o.length > 1 ? e.o[1] : -1; if (a === b) return; if (a >= 0) HOODS[a].edges.push([e.p, e.q]); if (b >= 0) HOODS[b].edges.push([e.p, e.q]); });
HOODS.forEach(h => { const ss = SECT.filter(t => t.hood === h.i); let A = 0, x = 0, y = 0; ss.forEach(t => { A += t.c[2]; x += t.c[0] * t.c[2]; y += t.c[1] * t.c[2]; });
  h.c = A ? [x / A, y / A] : h.seed.slice(); h.bb = ss.reduce((b, t) => [Math.min(b[0], t.bb[0]), Math.min(b[1], t.bb[1]), Math.max(b[2], t.bb[2]), Math.max(b[3], t.bb[3])], [1e9, 1e9, -1e9, -1e9]); });
// percentile within the city
[...SECT].sort((a, b) => a.pot - b.pot).forEach((s, i, arr) => s.q = i / (arr.length - 1));
const maxPot = Math.max(...SECT.map(s => s.pot));

// neighborhood scores
HOODS.forEach(h => {
  const ss = SECT.filter(s => s.hood === h.i).sort((a, b) => b.pot - a.pot);
  h.sect = ss; h.best = ss.slice(0, Math.max(1, Math.ceil(ss.length / 4))).sort((a, b) => Math.hypot(a.c[0] - h.c[0], a.c[1] - h.c[1]) - Math.hypot(b.c[0] - h.c[0], b.c[1] - h.c[1]))[0];
  const top = ss.slice(0, Math.max(1, Math.ceil(ss.length / 2)));
  h.raw = top.reduce((a, s) => a + s.pot, 0) / top.length / maxPot;
  const du = Math.min(...UNITS.map(u => Math.hypot(u[0] - h.c[0], u[1] - h.c[1]))) / KM;
  h.distKm = du; h.cover = Math.max(0, Math.min(.85, (3 - du) / 3 * .95));
  h.adj = .86 + rnd() * .34;
  h.kids = Math.round(ss.reduce((a, s) => a + s.pot, 0) * (180 + rnd() * 60));
  h.kids04 = Math.round(h.kids / (.42 + rnd() * .22));
  h.ab = 38 + rnd() * 32; h.apt = Math.round(30 + rnd() * 70); h.withKids = Math.round(38 + rnd() * 16);
  h.renda = Math.round(7200 + h.raw * 6800 + rnd() * 1500); h.schools = 2 + Math.floor(rnd() * 9); h.seats = Math.round(140 + rnd() * 520);
  h.f = [h.raw, .25 + rnd() * .7, .2 + rnd() * .8, 1 - h.cover, .2 + rnd() * .75];
});
const maxScore = Math.max(...HOODS.map(h => h.raw * (1 - h.cover) * h.adj));
HOODS.forEach(h => { h.score = Math.round(h.raw * (1 - h.cover) * h.adj / maxScore * 88); h.rawScore = Math.round(Math.min(99, h.raw * 86)); });
let RANK = [...HOODS].sort((a, b) => b.score - a.score);
RANK.forEach((h, k) => h.pos = k + 1);

/* ---------------- canvas + camera ---------------- */
const cv = $('cv'), ctx = cv.getContext('2d'), mapEl = $('map');
const DPR = Math.min(devicePixelRatio || 1, 2);
let W = 0, H = 0;
const cam = { x: CX, y: CY, s: 1 }, camFrom = { ...cam }, camTo = { ...cam }; let camT0 = 0, camDur = 1;
const K = 2.2; // static layer resolution (px per world unit)
const VIEW = [-120, -100, 1120, 800];
let staticSat, staticPlain, sat = true;

function buildStatic(withTexture) {
  const c = document.createElement('canvas'), w = VIEW[2] - VIEW[0], h = VIEW[3] - VIEW[1];
  c.width = w * K; c.height = h * K; const g = c.getContext('2d');
  g.scale(K, K); g.translate(-VIEW[0], -VIEW[1]);
  g.fillStyle = '#0E1219'; g.fillRect(VIEW[0], VIEW[1], w, h);
  let s2 = 99; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
  if (withTexture) {
    const tones = ['#141a23', '#1a212b', '#11161e', '#1f262f', '#171d26', '#232a33'];
    for (let n = 0; n < 52000; n++) { g.fillStyle = tones[(r2() * tones.length) | 0]; const sz = .6 + r2() * 2.6; g.fillRect(VIEW[0] + r2() * w, VIEW[1] + r2() * h, sz, sz * (.6 + r2())); }
    g.fillStyle = 'rgba(18,30,24,0.55)';
    for (let n = 0; n < 26; n++) { g.beginPath(); g.ellipse(VIEW[0] + r2() * w, VIEW[1] + r2() * h, 10 + r2() * 40, 6 + r2() * 24, r2() * 3, 0, 7); g.fill(); }
  } else {
    g.fillStyle = '#111620';
    MACRO.forEach(poly => { g.beginPath(); poly.forEach((p, k) => g[k ? 'lineTo' : 'moveTo'](p[0], p[1])); g.closePath(); g.fill(); });
  }
  // river
  g.strokeStyle = '#151C27'; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 20;
  g.beginPath(); g.moveTo(-120, 690); g.bezierCurveTo(120, 640, 160, 560, 90, 470); g.bezierCurveTo(40, 400, -20, 360, -120, 330); g.stroke();
  // local streets
  MACRO.forEach(poly => {
    const hh = { poly }, th = r2() * Math.PI, sp = 7 + r2() * 5, c = centroid(poly), R = 420;
    for (const ang of [th, th + Math.PI / 2 + (r2() - .5) * .25]) {
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
      for (let o = -R; o <= R; o += sp * (ang === th ? 1 : 1.5)) {
        const p = [c[0] + nx * o - dx * R, c[1] + ny * o - dy * R], q = [c[0] + nx * o + dx * R, c[1] + ny * o + dy * R];
        const seg = clipSeg(p, q, hh.poly, c); if (!seg) continue;
        g.strokeStyle = 'rgba(232,238,247,0.09)'; g.lineWidth = .5; g.beginPath(); g.moveTo(...seg[0]); g.lineTo(...seg[1]); g.stroke();
      }
    }
  });
  // arterials and highways
  const art = [[[-120, 120], [300, 200], [650, 90], [1120, 160]], [[-120, 520], [380, 470], [700, 560], [1120, 520]],
    [[250, -100], [330, 300], [260, 520], [320, 800]], [[760, -100], [700, 330], [820, 560], [760, 800]], [[-120, 330], [520, 350], [1120, 300]]];
  art.forEach((pts, k) => {
    g.strokeStyle = k > 3 ? 'rgba(232,238,247,0.26)' : 'rgba(232,238,247,0.17)'; g.lineWidth = k > 3 ? 2.4 : 1.5;
    g.beginPath(); g.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; g.quadraticCurveTo(a[0] + (b[0] - a[0]) * .5 + 30, a[1] + (b[1] - a[1]) * .5 - 20, b[0], b[1]); }
    g.stroke();
  });
  return c;
}

function resize() {
  const r = mapEl.getBoundingClientRect(); W = r.width; H = r.height;
  cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  if (!camT0) Object.assign(cam, fitCity(), { }), Object.assign(camTo, cam);
  draw(performance.now());
}
const SHEET_H = () => ($('sheet').hidden ? 0 : $('sheet').getBoundingClientRect().height || 340);
function fitBox(b, padTop = 100, padBottom = 40) {
  const avH = H - padTop - padBottom, avW = W - 140;
  const s = Math.min(avW / (b[2] - b[0]), avH / (b[3] - b[1]));
  return { x: (b[0] + b[2]) / 2, y: (b[1] + b[3]) / 2 - ((padTop - padBottom) / 2) / s, s };
}
const cityBox = () => HOODS.reduce((b, h) => [Math.min(b[0], h.bb[0]), Math.min(b[1], h.bb[1]), Math.max(b[2], h.bb[2]), Math.max(b[3], h.bb[3])], [1e9, 1e9, -1e9, -1e9]);
const fitCity = () => fitBox(cityBox(), 96, 40);
function fly(to, dur = 1100) {
  Object.assign(camFrom, cam); Object.assign(camTo, to); camT0 = performance.now(); camDur = reduce ? 1 : dur; kick();
}
const toScreen = (x, y) => [(x - cam.x) * cam.s + W / 2, (y - cam.y) * cam.s + H / 2];
const toWorld = (x, y) => [(x - W / 2) / cam.s + cam.x, (y - H / 2) / cam.s + cam.y];

/* ---------------- state ---------------- */
const S = { sel: null, isolate: true, hover: -1, t0: 0, revealed: false, circle: 0, circleT0: 0, list: 'bairros', far: false, top: 25 };
const RAMP = ['#FFE08A', '#F9C440', '#F59A2C', '#EA6A27', '#D93B26', '#A61E2A'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const HOTQ = .62;
function heat(q) {
  const t = (q - HOTQ) / (1 - HOTQ) * (RAMP.length - 1), i = Math.min(RAMP.length - 2, Math.floor(t)), f = t - i, a = RAMP[i], b = RAMP[i + 1];
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`;
}

/* ---------------- draw ---------------- */
let raf = 0, playing = !standalone ? false : true;
function kick() { if (!raf) raf = requestAnimationFrame(draw); }
function draw(now) {
  raf = 0;
  // camera tween
  let moving = false;
  if (camT0) { const t = Math.min(1, (now - camT0) / camDur), e = ease(t); cam.x = lerp(camFrom.x, camTo.x, e); cam.y = lerp(camFrom.y, camTo.y, e); cam.s = lerp(camFrom.s, camTo.s, e); moving = t < 1; }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  const img = sat ? staticSat : staticPlain;
  const [sx, sy] = toScreen(VIEW[0], VIEW[1]);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, (VIEW[2] - VIEW[0]) * cam.s, (VIEW[3] - VIEW[1]) * cam.s);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(cam.s, cam.s); ctx.translate(-cam.x, -cam.y);
  // sectors
  let anim = moving;
  const el = now - S.t0;
  for (const s of SECT) {
    const target = !S.revealed ? 0 : 1;
    const delay = s.d * 2.2;
    const r = reduce ? target : Math.max(0, Math.min(1, (el - delay) / 650));
    s.a = S.revealed ? ease(r) : 0;
    if (S.revealed && r < 1) anim = true;
    if (s.a <= 0) continue;
    const dim = S.sel != null && S.isolate && s.hood !== S.sel.i;
    const hot = s.q >= HOTQ;
    ctx.globalAlpha = s.a * (dim ? (hot ? .09 : .3) : (hot ? .82 : 1));
    ctx.beginPath(); s.poly.forEach((p, k) => ctx[k ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath();
    ctx.fillStyle = hot ? heat(s.q) : 'rgba(200,212,230,0.16)'; ctx.fill();
    const inSel = S.sel && s.hood === S.sel.i;
    ctx.globalAlpha = s.a * (inSel ? .55 : .9);
    ctx.lineWidth = (inSel ? .9 : .5) / cam.s; ctx.strokeStyle = inSel ? '#ffffff' : 'rgba(7,11,18,0.35)'; ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // hover sector
  if (S.hover >= 0) { const s = SECT[S.hover]; ctx.beginPath(); s.poly.forEach((p, k) => ctx[k ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath(); ctx.lineWidth = 2 / cam.s; ctx.strokeStyle = '#fff'; ctx.stroke(); }
  // neighborhood outlines
  const ob = S.revealed ? Math.min(1, el / 900) : 0;
  HOODS.forEach(h => {
    const isSel = S.sel && S.sel.i === h.i;
    ctx.globalAlpha = ob * (S.sel && !isSel ? .75 : 1);
    ctx.beginPath(); h.edges.forEach(([p, q]) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); });
    ctx.lineCap = 'round'; ctx.lineWidth = (isSel ? 3 : 1.4) / cam.s; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  });
  ctx.globalAlpha = 1;
  // radius circle (2 km) around the best point of the selected neighborhood
  if (S.sel) {
    const b = S.sel.best.c, R = 2 * KM, t = reduce ? 1 : Math.min(1, (now - S.circleT0) / 900);
    if (t < 1) anim = true;
    ctx.beginPath(); ctx.arc(b[0], b[1], R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ease(t));
    ctx.setLineDash([7 / cam.s, 6 / cam.s]); ctx.lineWidth = 1.6 / cam.s; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
  // units
  UNITS.forEach(u => {
    const [x, y] = toScreen(u[0], u[1]);
    ctx.globalAlpha = ob; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = '#07152b'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 4, y + 3); ctx.lineTo(x - 4, y - 1); ctx.lineTo(x, y - 4.5); ctx.lineTo(x + 4, y - 1); ctx.lineTo(x + 4, y + 3); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
  });
  // selected point pin
  if (S.sel) {
    const t = reduce ? 1 : Math.min(1, (now - S.circleT0 - 250) / 500);
    if (t < 1) anim = true;
    if (t > 0) { const [x, y0] = toScreen(...S.sel.best.c), y = y0 - (1 - ease(t)) * 26; ctx.globalAlpha = Math.min(1, t * 2);
      ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#07152b'; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fillStyle = '#07152b'; ctx.fill(); ctx.globalAlpha = 1; }
  }
  // labels
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  const label = (txt, x, y, size, weight, color, alpha) => {
    ctx.globalAlpha = alpha; ctx.font = `${weight} ${size}px Nunito, sans-serif`;
    const lines = txt.length > 16 && cam.s < 2.2 ? txt.split(' ').reduce((acc, w) => { const l = acc[acc.length - 1]; if (l && (l + ' ' + w).length <= 14) acc[acc.length - 1] = l + ' ' + w; else acc.push(w); return acc; }, []) : [txt];
    lines.forEach((l, k) => { const yy = y + (k - (lines.length - 1) / 2) * (size + 1);
      ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(7,21,43,0.85)'; ctx.strokeText(l, x, yy); ctx.fillStyle = color; ctx.fillText(l, x, yy); });
  };
  OUTS.forEach(h => { const [x, y] = toScreen(h.c[0], h.c[1]); if (x > -60 && x < W + 60 && y > -20 && y < H + 20) label(h.name, x, y, 11, 600, '#A9B8CE', .8); });
  HOODS.forEach(h => { const [x, y] = toScreen(h.c[0], h.c[1]); label(h.name, x, y + 4, 12.5, 800, '#EEF3FA', ob * (S.sel && S.sel.i !== h.i ? .85 : 1)); });
  { const [x, y] = toScreen(40, 455); ctx.font = 'italic 600 11px Nunito, sans-serif'; ctx.globalAlpha = .9; ctx.fillStyle = '#A9B8CE'; ctx.fillText('Rio Claro', x, y); }
  ctx.globalAlpha = 1; ctx.textAlign = 'start';
  if (anim) kick();
}

/* ---------------- panel list ---------------- */
const rankEl = $('rank');
function rowsData() {
  let rows = RANK.filter(h => !S.far || h.cover <= .3);
  if (S.top) rows = rows.slice(0, S.top);
  return rows;
}
function renderList(stagger) {
  const rows = rowsData(), max = Math.max(...RANK.map(h => h.score));
  $('lhN').textContent = rows.length; $('lhT').textContent = HOODS.length;
  rankEl.innerHTML = rows.map(h => `<li><button aria-current="${S.sel && S.sel.i === h.i}" data-i="${h.i}"><span class="rank__pos num">${h.pos}</span><span class="rank__name" title="${h.name}"><span>${h.name}</span></span><span class="rank__score num">${h.score}</span><span class="rank__bar"><i style="width: ${h.score / max * 100}%;"></i></span><span class="rank__meta num"><span class="rank__lines"><span>${nf(h.kids)} crianças de renda alta</span></span></span></button></li>`).join('');
  if (stagger && !reduce) [...rankEl.children].forEach((li, k) => li.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: k * 45, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
}
rankEl.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) { user(); select(HOODS[+b.dataset.i]); } });
const panelBody = document.querySelector('.panel__body');
document.querySelector('.toolbar select').addEventListener('change', e => { S.top = +e.target.value; renderList(true); });
document.querySelector('.toolbar .toggle').addEventListener('click', e => { S.far = !S.far; e.currentTarget.setAttribute('aria-pressed', S.far); renderList(true); });
document.querySelectorAll('.levels button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.levels button').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
const scopeBack = document.querySelector('.scope__back'); if (scopeBack) scopeBack.addEventListener('click', () => { user(); close(); });

/* ---------------- head + isolate ---------------- */
function setHead() {
  const h1 = document.querySelector('#head h1'), meta = document.querySelectorAll('#head .head__meta span');
  h1.innerHTML = S.sel
    ? `<button class="crumb" data-go="br">Brasil /</button><button class="crumb" data-go="city">${CITY} /</button><span>${S.sel.name}</span>`
    : `<button class="crumb" data-go="br">Brasil /</button><span>${CITY}</span>`;
  meta[0].textContent = `${HOODS.length} bairros com potencial · Potencial de expansão`;
  meta[1].textContent = 'Cidade fictícia · dados de exemplo';
  const iso = $('isolate');
  iso.hidden = !S.sel;
  if (S.sel) { const bs = iso.querySelectorAll('button'); bs[0].innerHTML = `${ICONS.iso1 || ''} <span>Só ${S.sel.name}</span>`; bs[1].innerHTML = `${ICONS.iso2 || ''} <span>Cidade toda</span>`;
    bs[0].setAttribute('aria-pressed', S.isolate); bs[1].setAttribute('aria-pressed', !S.isolate); }
  document.querySelector('.head .back').hidden = !S.sel;
}
$('head').addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { user(); close(); } if (e.target.closest('.back')) { user(); close(); } });
$('isolate').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; user(); S.isolate = b === $('isolate').querySelectorAll('button')[0]; setHead(); kick(); });
document.querySelectorAll('.head .modes button').forEach(b => b.addEventListener('click', () => document.querySelectorAll('.head .modes button').forEach(x => x.setAttribute('aria-pressed', x === b))));

/* ---------------- tools + rail ---------------- */
const toolBtns = document.querySelectorAll('.tools .pill button');
toolBtns.forEach(b => b.addEventListener('click', () => {
  const lab = b.getAttribute('aria-label') || ''; user();
  if (/Aproximar/.test(lab)) fly({ x: cam.x, y: cam.y, s: Math.min(cam.s * 1.5, 9) }, 450);
  else if (/Afastar/.test(lab)) fly({ x: cam.x, y: cam.y, s: Math.max(cam.s / 1.5, .35) }, 450);
  else if (/Enquadrar/.test(lab)) fly(S.sel ? hoodView(S.sel) : fitCity(), 700);
  else if (/satélite/.test(lab)) { sat = !sat; b.setAttribute('aria-pressed', sat); kick(); }
}));
const shell = $('shell') || document.querySelector('.shell');
document.querySelectorAll('.rail__tab').forEach((b, k) => b.addEventListener('click', () => {
  if (k !== 0) return;
  const open = shell.dataset.panel !== 'open'; shell.dataset.panel = open ? 'open' : 'closed'; b.dataset.current = open; b.setAttribute('aria-pressed', open);
  setTimeout(resize, 340);
}));
document.querySelectorAll('.rail__act').forEach(b => b.addEventListener('click', () => { if (/Brasil/.test(b.textContent)) { user(); close(); } }));
const collapse = document.querySelector('.panel__head .icon-btn');
if (collapse) collapse.addEventListener('click', () => { shell.dataset.panel = 'closed'; const t = document.querySelector('.rail__tab'); t.dataset.current = false; t.setAttribute('aria-pressed', false); setTimeout(resize, 340); });

/* ---------------- ficha ---------------- */
const sheet = $('sheet'), sbody = $('sbody');
const lab = t => t === 'f' ? '<span class="label label--fact" title="Dado observado na fonte">fato</span>' : '<span class="label label--estimate" title="Estimativa do modelo">estimativa</span>';
const pos5 = v => v > .85 ? 'Entre os melhores' : v > .62 ? 'Acima da maioria' : v > .38 ? 'No meio' : v > .18 ? 'Abaixo da maioria' : 'Entre os piores';
function verdictOf(h) {
  if (h.pos <= 2 && h.cover < .3) return ['ok', `Bom candidato: está entre os ${Math.max(3, Math.round(h.pos / HOODS.length * 100))}% melhores bairros de ${CITY} e longe da rede.`, 'Confirme preço e concorrência e salve como candidato.'];
  if (h.cover >= .3) return ['warn', `Com ressalvas: a rede já atende esta área. A unidade mais próxima fica a ${p1(h.distKm)} km, e por isso a nota cai.`, 'Compare com bairros mais longe da rede antes de decidir.'];
  return ['warn', `Com ressalvas: há demanda e a rede está longe, mas ${h.pos - 1} ${h.pos - 1 === 1 ? 'bairro' : 'bairros'} de ${CITY} têm nota maior.`, 'Veja os bairros acima na lista antes de salvar.'];
}
function fichaHTML(h) {
  const [tone, vtxt, next] = verdictOf(h), chip = h.pos <= 3 ? 'ok' : h.pos <= 7 ? 'warn' : 'risk';
  const bars = RANK.map(x => `<i${x === h ? ' class="is-here"' : ''} data-h="${x.score / RANK[0].score * 100}" style="height: 0%;"></i>`).join('');
  const why = [['Crianças de renda alta na área', h.f[0]], ['Renda do responsável', h.f[1]], ['Demanda potencial por vaga disponível', h.f[2]], ['Longe das unidades atuais (evita sobreposição)', h.f[3]], ['Qualidade urbana do entorno', h.f[4]]];
  const cover = Math.round(h.cover * 100), adj = Math.round((h.adj - 1) * 100);
  const sh = Math.round(h.kids / h.kids04 * 100), ab = h.ab, fam = Math.round(h.renda * 1.58), famAB = Math.round(fam * 1.45), fee = 3100 + (h.i % 4) * 140;
  return `<header class="ficha__head"><h3 title="${h.name} · ${CITY}"><b>${h.name}</b> <span>${CITY}</span></h3><span class="ficha__chip ficha__chip--${chip}"><b class="num">${h.pos}º</b><span class="num">de ${HOODS.length}</span></span><span class="ficha__actions"><button aria-pressed="false" class="notes-btn" data-act="notes" title="Mostra a conta e a nota de método de cada número">${ICONS.notes || ''} <span>Ver contas</span></button><button class="save-btn" data-act="save" data-saved="false" title="Salvar na lista de candidatos">${ICONS.save || ''} <span>Salvar</span></button><button class="notes-btn" data-act="print" title="Imprime só a ficha">${ICONS.print || ''} <span>Imprimir</span></button><span aria-hidden="true" class="ficha__sep"></span><button aria-label="Expandir ficha" class="icon-btn" data-act="expand" title="Expandir">${ICONS.expand || ''}</button><button aria-label="Fechar ficha" class="icon-btn" data-act="close" title="Fechar">${ICONS.close || ''}</button></span><nav aria-label="Seções da ficha" class="ficha__tabs"><button aria-pressed="true" data-tab="resumo">Resumo</button><button aria-pressed="false" data-tab="publico">Público</button><button aria-pressed="false" data-tab="mercado">Mercado</button><button aria-pressed="false" data-tab="rede">Rede</button></nav></header>
<div class="ficha-bands" data-tab="resumo">
<section aria-labelledby="b-veredito" class="band band--verdict"><h4 class="band__title" id="b-veredito">Veredito</h4><div class="decide"><p class="verdict verdict--lead verdict--${tone}">${ICONS.ok || ''}${vtxt}</p><div class="next__act"><h5>Próxima ação recomendada</h5><p>${next}</p><div class="next__btns"><button data-tab-go="mercado">Ver o mercado</button><button class="next__primary" data-act="save">Salvar como candidato</button></div></div></div>
<div class="terr-line" data-livre="${h.cover < .3}"><p><b>${h.cover < .3 ? 'Território livre:' : 'Território próximo da rede:'}</b> ${h.cover < .3 ? 'nenhuma unidade, venda ou reserva cobre este ponto.' : `uma unidade atual fica a ${p1(h.distKm)} km.`}</p><button>${h.cover < .3 ? 'Reservar território' : 'Ver a unidade'}</button></div>
<div class="band__grid"><div class="band__cell"><div class="score"><span class="score__num score__num--${h.pos <= 3 ? 'ok' : 'risk'} num">${h.pos}º</span><span class="score__txt"><span class="score__title"><b>${h.pos <= 3 ? `Entre os melhores de ${CITY}` : `${h.pos}º bairro de ${CITY}`}</b> ${lab('e')}</span><span>de ${HOODS.length} bairros, pelo potencial de expansão</span></span></div><div aria-label="${h.pos}º de ${HOODS.length} bairros pela nota de potencial" class="rankbars" role="img">${bars}</div><p aria-hidden="true" class="rankbars__cap"><span>maior potencial</span><span class="num">${HOODS.length} bairros</span><span>menor</span></p></div>
<div class="band__cell"><div><h5>Por que esta nota ${lab('e')}</h5><div class="why" role="list">${why.map(([t, v]) => `<div class="why__row" role="listitem"><span title="${t}">${t}</span><span class="why__bar" role="img" aria-label="${pos5(v)}"><i data-w="${Math.round(v * 1000) / 10}" style="width: 0%;"></i></span><b>${pos5(v)}</b></div>`).join('')}</div><p class="grid-note note">Como o bairro se sai em cada fator frente aos outros de ${CITY}. A nota final ainda desconta a rede, ao lado.</p></div></div>
<div class="band__cell"><h5>Como a nota é formada ${lab('e')}</h5><ol class="steps"><li><span>Potencial antes das unidades existentes</span><b class="num" data-count="${h.rawScore}">0</b><p>Nota da área sem olhar para a rede atual.</p></li><li><span>Desconto pela rede</span><b class="num">${cover < 3 ? 'sem desconto' : `−${cover}%`}</b><p>${cover < 3 ? 'Quase nenhuma criança de renda alta do raio mora a até 3 km de uma unidade.' : `${cover}% do público do raio já mora a até 3 km de uma unidade.`}</p></li><li><span>Ajuste do entorno</span><b class="num">${adj >= 0 ? '+' : '−'}${Math.abs(adj)}%</b><p>Qualidade urbana e natalidade da área, comparadas às da cidade, ${adj >= 0 ? 'elevam' : 'reduzem'} a nota.</p></li></ol><div><h5>Cenário de uma nova unidade ${lab('e')}</h5><p class="share__cap">${h.cover < .3 ? 'Uma unidade nova aqui quase não tiraria alunos da rede atual: o público viria de famílias que hoje não são atendidas.' : 'Uma unidade nova aqui dividiria público com a unidade mais próxima.'}</p></div></div></div>
<div class="next"><details class="next__meta"><summary>Dados, método e limitações</summary><ul><li>Cidade e números fictícios, gerados para esta demonstração.</li><li>No sistema real, crianças e renda vêm do Censo 2022 e vagas do INEP.</li><li>A nota é relativa: compara bairros da mesma cidade e não prevê matrículas.</li></ul></details></div></section>
<section aria-labelledby="b-publico" class="band"><h4 class="band__title" id="b-publico">Quem mora num raio de 2 km</h4><div class="band__grid"><div class="band__cell"><div class="lead-stat"><b class="num" data-count="${h.kids}">0</b><span>crianças 0–4 de renda alta (A/B) ${lab('e')}</span></div><div class="share" role="img" aria-label="${sh}% das crianças de 0 a 4 anos"><i data-w="${sh}" style="width: 0%;"></i></div><p class="share__cap"><b class="num">${sh}%</b> das <span class="num">${nf(h.kids04)}</span> crianças de 0 a 4 anos ${lab('f')}</p><p class="grid-note" style="margin-top: 10px;"><b>${ab > 55 ? 'Renda alta predominante.' : 'Renda mista.'}</b> <span class="num">${p1(ab)}%</span> dos domicílios da área são A/B. ${lab('f')}</p><div class="perfil"><h5>Domicílios ${lab('f')}</h5><div class="split"><div class="split__bar" role="img"><i data-i="0" style="flex-grow: ${h.apt};"></i><i data-i="1" style="flex-grow: ${100 - h.apt};"></i></div><ul class="split__key"><li><i data-i="0"></i><b class="num">${h.apt}%</b> apartamentos</li><li><i data-i="1"></i><b class="num">${100 - h.apt}%</b> casas</li></ul></div><div class="split"><div class="split__bar" role="img"><i data-i="0" style="flex-grow: ${h.withKids};"></i><i data-i="1" style="flex-grow: 24;"></i><i data-i="2" style="flex-grow: ${96 - h.withKids - 24};"></i><i data-i="rest" style="flex-grow: 4;"></i></div><ul class="split__key"><li><i data-i="0"></i><b class="num">${h.withKids}%</b> com filhos</li><li><i data-i="1"></i><b class="num">24%</b> casais sem filhos</li><li><i data-i="2"></i><b class="num">${96 - h.withKids - 24}%</b> moram sozinhos</li><li><i data-i="rest"></i><b class="num">4%</b> outros</li></ul></div></div></div>
<div class="band__cell"><h5>Renda e mensalidade</h5><div class="calc"><dl><div class="calc__row"><dt>Renda do responsável ${lab('f')}</dt><dd class="num">R$ ${nf(h.renda)}</dd><p class="note">Mediana dos responsáveis pelo domicílio no raio.</p></div><div class="calc__row"><dt>Renda familiar do domicílio ${lab('e')}</dt><dd class="num">R$ ${nf(fam)}</dd><p class="note">Responsável × 1,58, o fator família ÷ responsável da cidade.</p></div><div class="calc__row calc__row--key"><dt>Renda familiar das famílias A/B ${lab('e')}</dt><dd class="num">R$ ${nf(famAB)}</dd><p class="note">Média só dos domicílios com responsável acima de R$ 10.000.</p></div></dl><div class="afford"><h5>Quanto a mensalidade pesa na renda A/B ${lab('e')}</h5><div class="afford__row"><span>1 filho</span><span class="afford__bar" role="img"><i data-w="${fee / famAB * 100}" style="width: 0%;"></i></span><b class="num">${p1(fee / famAB * 100)}%</b><small class="num note">R$ ${nf(fee)} ÷ R$ ${nf(famAB)}</small></div><div class="afford__row"><span>2 filhos</span><span class="afford__bar" role="img"><i data-w="${2 * fee / famAB * 100}" style="width: 0%;"></i></span><b class="num">${p1(2 * fee / famAB * 100)}%</b><small class="num note">R$ ${nf(2 * fee)} ÷ R$ ${nf(famAB)}</small></div></div></div></div></div></section>
<section aria-labelledby="b-mercado" class="band"><h4 class="band__title" id="b-mercado">Concorrência num raio de 2 km</h4><div class="band__grid"><div class="band__cell"><div class="lead-stat"><b class="num" data-count="${h.schools}">0</b><span>escolas particulares de educação infantil ${lab('f')}</span></div><p class="grid-note"><span class="num">${nf(h.seats)}</span> vagas de 0 a 4 anos no raio. ${lab('f')}</p></div><div class="band__cell"><h5>Demanda por vaga ${lab('e')}</h5><div class="calc"><dl><div class="calc__row calc__row--key"><dt>Crianças A/B por vaga</dt><dd class="num">${p1(h.kids / h.seats)}</dd><p class="note">Acima de 3 indica demanda sem escola de alto padrão por perto.</p></div></dl></div></div></div></section>
<section aria-labelledby="b-rede" class="band"><h4 class="band__title" id="b-rede">A rede por perto</h4><div class="band__grid"><div class="band__cell"><div class="lead-stat"><b class="num">${p1(h.distKm)} km</b><span>até a unidade mais próxima ${lab('f')}</span></div></div><div class="band__cell"><h5>Público já coberto pela rede ${lab('e')}</h5><div class="share" role="img"><i data-w="${cover}" style="width: 0%;"></i></div><p class="share__cap"><b class="num">${cover}%</b> das crianças de renda alta do raio moram a até 3 km de uma unidade.</p></div></div></section>
</div>`;
}
function grow(root) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.querySelectorAll('[data-w]').forEach(i => i.style.width = i.dataset.w + '%');
    root.querySelectorAll('[data-h]').forEach((i, k) => { i.style.transitionDelay = (reduce ? 0 : k * 25) + 'ms'; i.style.height = i.dataset.h + '%'; });
    root.querySelectorAll('[data-count]').forEach(el => {
      const end = +el.dataset.count, t0 = performance.now();
      const step = t => { const p = reduce ? 1 : Math.max(0, Math.min(1, (t - t0) / 900)); el.textContent = nf(end * ease(p)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }));
}
function setTab(tab) {
  const bands = sbody.querySelector('.ficha-bands'); if (!bands) return;
  bands.dataset.tab = tab;
  sbody.querySelectorAll('.ficha__tabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === tab));
  const band = sbody.querySelector(`[aria-labelledby="b-${tab === 'resumo' ? 'veredito' : tab}"]`);
  if (band) { band.querySelectorAll('[data-w]').forEach(i => i.style.width = '0%'); band.querySelectorAll('[data-count]').forEach(e => e.textContent = '0');
    if (!reduce) band.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
    grow(band); }
  sbody.scrollTop = 0;
}
sbody.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]'); if (t && t.closest('.ficha__tabs')) { user(); setTab(t.dataset.tab); return; }
  const g = e.target.closest('[data-tab-go]'); if (g) { user(); setTab(g.dataset.tabGo); return; }
  const a = e.target.closest('[data-act]'); if (!a) return; user();
  const act = a.dataset.act;
  if (act === 'close') close();
  else if (act === 'expand') { sheet.dataset.size = sheet.dataset.size === 'full' ? 'half' : 'full'; }
  else if (act === 'notes') { const on = sheet.dataset.notes !== 'on'; sheet.dataset.notes = on ? 'on' : 'off'; a.setAttribute('aria-pressed', on); }
  else if (act === 'save') { sbody.querySelectorAll('.save-btn').forEach(s => { s.dataset.saved = 'true'; s.querySelector('span').textContent = 'Salvo'; }); const c = document.querySelector('.rail__count'); if (c) { c.textContent = (+c.textContent || 0) + 1; if (!reduce) c.animate([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'cubic-bezier(.16,1,.3,1)' }); } }
});
$('handle').addEventListener('click', () => { user(); sheet.dataset.size = { peek: 'half', half: 'full', full: 'peek' }[sheet.dataset.size] || 'half'; });

function hoodView(h) {
  const sh = 340, b = h.best.c, s = Math.min(Math.max(cam.s, 1.6), Math.min((W - 160) / (4.4 * KM), (H - sh - 120) / (4.4 * KM)));
  return { x: b[0], y: b[1] + ((sh - 90) / 2) / s, s };
}
function select(h) {
  S.sel = h; S.circleT0 = performance.now();
  [...rankEl.querySelectorAll('button')].forEach(b => b.setAttribute('aria-current', +b.dataset.i === h.i));
  const row = rankEl.querySelector(`button[data-i="${h.i}"]`); if (row) row.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  sheet.dataset.size = 'half'; sheet.dataset.notes = 'off';
  sbody.innerHTML = fichaHTML(h);
  if (sheet.hidden) { sheet.hidden = false; } else if (!reduce) sbody.animate([{ opacity: .2 }, { opacity: 1 }], { duration: 300 });
  grow(sbody.querySelector('[aria-labelledby="b-veredito"]'));
  setHead(); fly(hoodView(h), 1200);
}
function close() {
  S.sel = null; sheet.hidden = true; sbody.innerHTML = '';
  [...rankEl.querySelectorAll('button')].forEach(b => b.setAttribute('aria-current', 'false'));
  setHead(); fly(fitCity(), 1000);
}

/* ---------------- pointer: hover, click, drag ---------------- */
const tip = document.createElement('div'); tip.className = 'demo-tip'; tip.hidden = true; mapEl.appendChild(tip);
let drag = null;
function sectorAt(x, y) {
  const [wx, wy] = toWorld(x, y);
  for (let k = 0; k < SECT.length; k++) { const s = SECT[k]; if (wx < s.bb[0] || wx > s.bb[2] || wy < s.bb[1] || wy > s.bb[3]) continue; if (inPoly([wx, wy], s.poly)) return k; }
  return -1;
}
cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => {
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 4) { drag.moved = true; user(); camT0 = 0; cam.x = drag.cx - dx / cam.s; cam.y = drag.cy - dy / cam.s; tip.hidden = true; kick(); return; } }
  const k = S.revealed ? sectorAt(x, y) : -1;
  if (k !== S.hover) { S.hover = k; kick(); }
  if (k >= 0) { const s = SECT[k], h = HOODS[s.hood]; tip.hidden = false; tip.innerHTML = `<b>${h.name}</b><span>Ponto no ${Math.round(s.q * 100)}º percentil · bairro com nota ${h.score}</span>`; tip.style.left = x + 'px'; tip.style.top = y + 'px'; cv.style.cursor = 'pointer'; }
  else { tip.hidden = true; cv.style.cursor = ''; }
});
cv.addEventListener('pointerleave', () => { S.hover = -1; tip.hidden = true; kick(); });
cv.addEventListener('pointerup', e => {
  const d = drag; drag = null; if (!d || d.moved) return;
  const r = cv.getBoundingClientRect(), k = sectorAt(e.clientX - r.left, e.clientY - r.top); user();
  if (k >= 0) select(HOODS[SECT[k].hood]); else if (S.sel) close();
});
if (standalone) cv.addEventListener('wheel', e => { e.preventDefault(); user(); const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, [wx, wy] = toWorld(x, y);
  const s = Math.max(.35, Math.min(9, cam.s * Math.exp(-e.deltaY * .0015))); camT0 = 0; cam.s = s; cam.x = wx - (x - W / 2) / s; cam.y = wy - (y - H / 2) / s; kick(); }, { passive: false });

/* ---------------- autoplay tour ---------------- */
let auto = true, visible = standalone, gen = 0, waiters = [];
function user() { if (auto) { auto = false; gen++; } }
const sleep = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 50) : ms));
const gate = () => visible ? Promise.resolve() : new Promise(r => waiters.push(r));
async function step(ms, my) { await sleep(ms); await gate(); if (my !== gen || !auto) throw 'stop'; }
async function tour() {
  const my = ++gen;
  try {
    while (true) {
      for (const h of RANK.slice(0, 3)) {
        await step(1800, my); select(h);
        await step(4200, my); setTab('publico');
        await step(4600, my); close();
      }
    }
  } catch (e) { if (e !== 'stop') throw e; }
}
function start() {
  S.revealed = true; S.t0 = performance.now(); renderList(true); kick();
  if (reduce) select(RANK[0]); else tour();
}
window.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'demo') return;
  visible = !!e.data.visible;
  if (visible) { waiters.splice(0).forEach(r => r()); if (!S.revealed) start(); }
});

/* ---------------- boot ---------------- */
staticSat = buildStatic(true); staticPlain = buildStatic(false);
renderList(false); setHead();
new ResizeObserver(resize).observe(mapEl);
resize();
if (standalone || reduce) start();
})();
