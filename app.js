document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const tok = n => getComputedStyle(root).getPropertyValue(n).trim();
const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => 1 - Math.pow(1 - t, 4);
const $ = id => document.getElementById(id);

/* run something only while its element is on screen and the tab is visible */
function whenVisible(el, cb, threshold = 0.2) {
  let seen = false;
  const fire = () => cb(seen && !document.hidden);
  new IntersectionObserver(es => { seen = es[0].isIntersecting; fire(); }, { threshold }).observe(el);
  document.addEventListener('visibilitychange', fire);
}

/* a small cancellable player: async steps that pause while hidden */
function player(el, script) {
  let visible = false, gen = 0, waiters = [];
  const gate = () => visible ? Promise.resolve() : new Promise(r => waiters.push(r));
  const api = {
    async wait(ms, my) { await sleep(ms); await gate(); if (my !== gen) throw 'stop'; },
    restart() { const my = ++gen; script(api, my).catch(e => { if (e !== 'stop') throw e; }); },
    setVisible(v) { visible = v; if (v) { waiters.splice(0).forEach(r => r()); if (!gen) api.restart(); } }
  };
  whenVisible(el, v => api.setVisible(v));
  return api;
}

/* oklch tokens, parsed once, for canvas colour */
function oklch(name) { const m = tok(name).match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)/); return m ? [+m[1], +m[2], +m[3]] : [50, 0, 0]; }
const okStr = c => `oklch(${c[0]}% ${c[1]} ${c[2]})`;
const okMix = (a, b, t) => okStr([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]);

/* ================= nav ================= */
(() => {
  const nav = $('nav'), links = [...document.querySelectorAll('.nav__links a')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href')));
  const on = () => {
    nav.classList.toggle('is-scrolled', scrollY > 8);
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    links.forEach((a, i) => i === cur ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
  };
  addEventListener('scroll', on, { passive: true }); on();
})();

/* ================= lab tabs ================= */
const lab = (() => {
  const tabs = [...document.querySelectorAll('#labTabs [role="tab"]')];
  const panels = tabs.map(t => $(t.getAttribute('aria-controls')));
  const listeners = [];
  $('labTabs').hidden = false;
  function select(i, focus) {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; panels[k].hidden = k !== i; });
    if (focus) tabs[i].focus();
    listeners.forEach(f => f(panels[i].id));
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
    });
  });
  // links to a lab project open its tab and scroll to the lab
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const i = panels.findIndex(p => '#' + p.id === a.getAttribute('href'));
    if (i < 0) return;
    a.addEventListener('click', e => { e.preventDefault(); select(i); $('lab').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', '#' + panels[i].id); });
  });
  const start = Math.max(0, panels.findIndex(p => '#' + p.id === location.hash));
  select(start);
  return { onChange: f => listeners.push(f), current: () => panels.find(p => !p.hidden).id };
})();

/* ================= the map ================= */
(() => {
  const map = $('map'), svg = $('wires'), model = $('model');
  const nodes = Object.fromEntries([...map.querySelectorAll('[data-node]')].map(n => [n.dataset.node, n]));
  const NS = 'http://www.w3.org/2000/svg';
  let centers = {};

  const READ = {
    khaos: ['<span class="measured">GET /products/{id}</span>', '<span class="measured">POST /graphql SearchProducts</span>', '<span class="measured">42 pages, 6 endpoints</span>'],
    atlas: ['<span class="measured">score 0.81 Vila Aurora</span>', '<span class="measured">LOO R² 0.14, withheld</span>', '<span class="measured">15 min drive, OSRM</span>'],
    studium: ['<span class="measured">bail on: deixar na mão</span>', '<span class="measured">fallback after 6 s</span>', '<span class="measured">JSON mode, validated</span>'],
    crm: ['<span class="measured">objection: price</span>', '<span class="measured">visit: Saturday morning</span>', '<span class="measured">budget: not stored</span>'],
    scorer: ['<span class="measured">P(win, 30 d) 28%</span>', '<span class="measured">capture 68%, chance 20%</span>', '<span class="measured">decide after 138 d</span>'],
    streamflix: ['<span class="measured">resume 00:41:12</span>', '<span class="measured">progress every 10 s</span>', '<span class="measured">HLS master.m3u8</span>'],
    harness: [['allow', 'pg.query'], ['deny', 'env.read'], ['ask', 'pg.write'], ['allow', 'ssh.logs']]
  };
  const idx = {};
  const reading = (name, html) => { nodes[name].querySelector('.node__reading').innerHTML = html; };

  function layout() {
    const box = map.getBoundingClientRect();
    const c = el => { const r = el.getBoundingClientRect(); return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]; };
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = '';
    centers = { model: c(model) };
    for (const k in nodes) centers[k] = c(nodes[k]);
    for (const k in nodes) {
      if (k === 'you') continue;
      const l = document.createElementNS(NS, 'line');
      [l.x1.baseVal.value, l.y1.baseVal.value] = centers.model; [l.x2.baseVal.value, l.y2.baseVal.value] = centers[k];
      svg.appendChild(l);
    }
    const p = document.createElementNS(NS, 'line'); p.setAttribute('class', 'is-person');
    [p.x1.baseVal.value, p.y1.baseVal.value] = centers.harness; [p.x2.baseVal.value, p.y2.baseVal.value] = centers.you;
    svg.appendChild(p);
  }

  function packet(from, to, person) {
    return new Promise(res => {
      if (reduce || !centers[from]) return res();
      const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', 4);
      if (person) dot.setAttribute('class', 'is-person');
      svg.appendChild(dot);
      const [x1, y1] = centers[from], [x2, y2] = centers[to], t0 = performance.now(), dur = 760;
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        dot.setAttribute('transform', `translate(${lerp(x1, x2, e)} ${lerp(y1, y2, e)})`);
        if (p < 1) requestAnimationFrame(step); else { dot.remove(); res(); }
      })(t0);
    });
  }
  function hit(name) { const n = nodes[name]; n.classList.add('is-hit'); setTimeout(() => n.classList.remove('is-hit'), 700); }
  function next(name) {
    idx[name] = ((idx[name] ?? 0) + 1) % READ[name].length;
    if (name === 'harness') { const [d, tool] = READ.harness[idx[name]]; reading(name, `<span class="chip chip--${d}">${d}</span><span class="measured">${tool}</span>`); return d; }
    reading(name, READ[name][idx[name]]);
  }

  const order = ['harness', 'atlas', 'crm', 'khaos', 'scorer', 'studium', 'harness', 'streamflix'];
  const run = player(map, async (p, my) => {
    for (let k = 0; ; k = (k + 1) % order.length) {
      const name = order[k];
      await packet('model', name);
      hit(name);
      const d = next(name);
      if (d === 'ask') {
        reading('you', '<span class="measured">ask: pg.write</span>');
        await p.wait(300, my); await packet('harness', 'you', true); hit('you');
        await p.wait(900, my);
        reading('you', '<span class="measured">approved, reason logged</span>');
        await packet('you', 'harness', true); hit('harness');
        reading('harness', '<span class="chip chip--allow">allow</span><span class="measured">pg.write</span>');
        await p.wait(1400, my);
        reading('you', '<span class="measured">no pending asks</span>');
      }
      await p.wait(reduce ? 4000 : 650, my);
    }
  });
  layout();
  addEventListener('resize', layout);
  document.fonts?.ready.then(layout);
  if (reduce) run.setVisible = () => {};
})();

/* ================= ATLAS ================= */
(() => {
  const canvas = $('atlasCanvas'), box = $('atlasMap'), ctx = canvas.getContext('2d');
  const tip = $('tip'), sheet = $('sheet'), rankEl = $('rank'), seg = $('seg');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const HOODS = [
    { name: 'Vila Aurora', x: .62, y: .34 }, { name: 'Jardim Norte', x: .42, y: .22 },
    { name: 'Alto do Rio', x: .74, y: .62 }, { name: 'Parque das Águas', x: .30, y: .58 },
    { name: 'Centro Velho', x: .50, y: .48 }, { name: 'Bela Vista Sul', x: .52, y: .78 },
    { name: 'Morro Azul', x: .20, y: .36 }
  ];
  const UNITS = [{ x: .47, y: .52 }, { x: .30, y: .64 }, { x: .56, y: .80 }];
  const HOT = {
    res: [{ x: .62, y: .32, s: .14, w: 1 }, { x: .76, y: .64, s: .12, w: .8 }, { x: .40, y: .20, s: .10, w: .55 }],
    corp: [{ x: .50, y: .47, s: .11, w: 1 }, { x: .62, y: .36, s: .09, w: .6 }, { x: .30, y: .58, s: .10, w: .45 }]
  };
  const PANEL = {
    res: { title: 'Residential potential', rank: 'Neighborhoods by A/B households', unit: 'A/B households', k: 41 },
    corp: { title: 'Corporate potential', rank: 'Neighborhoods by formal jobs', unit: 'Formal jobs', k: 168 }
  };
  const R2 = [0.31, 0.14, 0.27, 0.12, 0.22, 0.09, 0.18];
  let C, W, H, R, cells = [], mode = 'res', sel = 0, t0 = 0, isoT = 1e12, modeT = -1e9, hover = -1, running = false, raf, auto = !reduce, autoTimer, started = false, S_, OX, OY;

  const colors = () => ({ cold: tok('--color-paper-2'), edge: tok('--color-paper-3'), lo: oklch('--color-cool-soft'), hi: oklch('--color-cool'), ink: tok('--color-ink'), muted: tok('--color-muted'), accent: tok('--color-accent'), paper3: tok('--color-paper-3') });
  const blob = th => 1 + .12 * Math.sin(3 * th + 1) + .08 * Math.sin(5 * th + 2.2) + .05 * Math.sin(7 * th + .4);
  const inside = (nx, ny) => { const dx = nx - .5, dy = (ny - .5) * 1.05; return Math.hypot(dx, dy) < .40 * blob(Math.atan2(dy, dx)); };
  const scoreAt = (nx, ny, m) => HOT[m].reduce((s, g) => s + g.w * Math.exp(-((nx - g.x) ** 2 + (ny - g.y) ** 2) / (2 * g.s * g.s)), 0);
  function hexPath(x, y, r) { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; ctx[k ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a)); } ctx.closePath(); }
  const toPx = (nx, ny) => [OX + nx * S_, OY + ny * S_ / 1.25];

  function build() {
    C = colors();
    const r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.max(7, Math.min(W, H) / 46);
    const dx = R * Math.sqrt(3), dy = R * 1.5, S = Math.min(W, H * 1.25);
    OX = (W - S) / 2 - (W > 700 ? W * 0.12 : 0); OY = (H - S / 1.25) / 2; S_ = S;
    cells = [];
    for (let row = 0; row * dy < H + R; row++) for (let col = 0; col * dx < W + R; col++) {
      const x = col * dx + (row % 2 ? dx / 2 : 0), y = row * dy, nx = (x - OX) / S, ny = (y - OY) / (S / 1.25);
      if (!inside(nx, ny)) continue;
      let best = 0, bd = 9;
      HOODS.forEach((h, i) => { const d = (nx - h.x) ** 2 + (ny - h.y) ** 2; if (d < bd) { bd = d; best = i; } });
      cells.push({ x, y, hood: best, d: Math.hypot(nx - .5, ny - .5), s: { res: scoreAt(nx, ny, 'res'), corp: scoreAt(nx, ny, 'corp') }, cur: 0, from: 0, to: 0 });
    }
    cells.thr = {};
    for (const m of ['res', 'corp']) {
      const max = Math.max(...cells.map(c => c.s[m])); cells.forEach(c => c.s[m] /= max);
      const sorted = cells.map(c => c.s[m]).sort((a, b) => a - b); cells.thr[m] = sorted[Math.floor(sorted.length * .62)];
    }
    cells.forEach(c => { c.cur = c.from = c.to = c.s[mode]; });
  }

  function hoodStats(m) {
    return HOODS.map((h, i) => {
      const cs = cells.filter(c => c.hood === i), mean = cs.reduce((a, c) => a + c.s[m], 0) / Math.max(1, cs.length);
      return { i, name: h.name, score: Math.round(mean * 100), value: Math.round(mean * cs.length * PANEL[m].k) * 10 };
    }).sort((a, b) => b.value - a.value);
  }

  function renderRank(animate) {
    const st = hoodStats(mode), max = st[0].value;
    const first = new Map([...rankEl.children].map(li => [li.dataset.i, li.getBoundingClientRect().top]));
    const existing = new Map([...rankEl.children].map(li => [li.dataset.i, li]));
    st.forEach((h, k) => {
      let li = existing.get(String(h.i));
      if (!li) {
        li = document.createElement('li'); li.dataset.i = h.i; li.tabIndex = 0;
        li.innerHTML = '<span class="n"></span><span class="nm"></span><span class="v"></span><span class="track"><b></b></span>';
        li.addEventListener('click', () => { stopAuto(); select(+li.dataset.i); });
        li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stopAuto(); select(+li.dataset.i); } });
      }
      li.querySelector('.n').textContent = k + 1;
      li.querySelector('.nm').textContent = h.name;
      li.querySelector('.v').textContent = h.value.toLocaleString('en-US');
      li.querySelector('.track b').style.transform = `scaleX(${h.value / max})`;
      li.classList.toggle('sel', h.i === sel);
      rankEl.appendChild(li);
    });
    if (!animate || reduce) return;
    [...rankEl.children].forEach(li => {
      const a = first.get(li.dataset.i); if (a == null) return;
      const d = a - li.getBoundingClientRect().top; if (!d) return;
      li.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
  }

  function renderSheet() {
    const st = hoodStats(mode), h = st.find(x => x.i === sel), pos = st.indexOf(h) + 1, r2 = R2[sel];
    const kids = 38 + (sel * 7) % 17, apt = 22 + (sel * 13) % 41;
    sheet.innerHTML = `
      <div class="sheet__top"><div><h4>${h.name}</h4><span class="side-label">${pos} of ${st.length} in the city</span></div><span class="score">${h.score}</span></div>
      <dl>
        <div class="row"><dt>${PANEL[mode].unit}</dt><dd>${h.value.toLocaleString('en-US')} <span class="chip chip--cool">fact</span></dd></div>
        <div class="row"><dt>Families with children</dt><dd>${kids}% <span class="chip chip--cool">fact</span></dd></div>
        <div class="row"><dt>Apartments</dt><dd>${apt}% <span class="chip chip--cool">fact</span></dd></div>
        <div class="row"><dt>Overlap with nearest unit</dt><dd>${(8 + sel * 3) % 19}% <span class="chip">estimate</span></dd></div>
      </dl>
      <div class="withheld">${r2 >= .2
        ? `Expected visits a year: <b>${120 + sel * 23}</b>, estimate with LOO R² ${r2.toFixed(2)}`
        : `Expected visits a year: <s>withheld</s>. LOO R² ${r2.toFixed(2)} is under the 0.20 bar.`}</div>`;
  }

  function color(c) {
    const thr = cells.thr[mode];
    if (c.cur < thr) return C.cold;
    return okMix(C.lo, C.hi, (c.cur - thr) / (1 - thr));
  }

  function frame(now) {
    const sweep = reduce ? 1 : Math.max(0, Math.min(1, (now - t0) / 1600));
    const iso = reduce ? 1 : Math.max(0, Math.min(1, (now - isoT) / 900));
    const mt = reduce ? 1 : Math.min(1, (now - modeT) / 900);
    ctx.clearRect(0, 0, W, H);
    for (const c of cells) {
      c.cur = lerp(c.from, c.to, ease(Math.max(0, Math.min(1, mt * 1.4 - c.d * 1.2))));
      const reveal = Math.max(0, Math.min(1, (sweep * 0.62 - c.d) / 0.06));
      if (reveal <= 0) continue;
      hexPath(c.x, c.y, (R - 0.6) * (0.55 + 0.45 * ease(reveal)));
      ctx.globalAlpha = reveal * (hover >= 0 && cells[hover].hood !== c.hood ? .55 : 1);
      ctx.fillStyle = color(c); ctx.fill();
      ctx.lineWidth = c.hood === sel ? 1.4 : .8; ctx.strokeStyle = c.hood === sel ? C.ink : C.edge; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const u of UNITS) {
      const [x, y] = toPx(u.x, u.y);
      ctx.globalAlpha = sweep; hexPath(x, y, R * .95); ctx.fillStyle = C.ink; ctx.fill();
      hexPath(x, y, R * .42); ctx.fillStyle = C.paper3; ctx.fill(); ctx.globalAlpha = 1;
    }
    if (iso > 0) {
      const h = HOODS[sel], [cx, cy] = toPx(h.x, h.y), rr = S_ * .15 * ease(iso);
      ctx.beginPath();
      for (let k = 0; k <= 48; k++) { const th = k / 48 * Math.PI * 2, f = 1 + .18 * Math.sin(3 * th + sel) + .1 * Math.sin(5 * th + 1); ctx[k ? 'lineTo' : 'moveTo'](cx + Math.cos(th) * rr * f, cy + Math.sin(th) * rr * f * .9); }
      ctx.setLineDash([5, 5]); ctx.lineDashOffset = reduce ? 0 : -now / 60; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.globalAlpha = .9 * iso; ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = iso;
      ctx.font = '400 12px "Atkinson Hyperlegible Mono", monospace'; ctx.fillStyle = C.ink;
      ctx.fillText('15 min drive', cx + rr * .55, cy - rr * .95); ctx.globalAlpha = 1;
    }
    ctx.font = '500 13px "Host Grotesk", sans-serif'; ctx.textAlign = 'center';
    HOODS.forEach((h, i) => {
      const [x, y] = toPx(h.x, h.y); ctx.globalAlpha = Math.max(0, (sweep - .5) * 2) * (i === sel ? 1 : .8);
      ctx.lineWidth = 3; ctx.strokeStyle = C.paper3; ctx.strokeText(h.name, x, y + 4);
      ctx.fillStyle = C.ink; ctx.fillText(h.name, x, y + 4);
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'start';
    if (iso >= 1 && sheet.classList.contains('hide')) sheet.classList.remove('hide');
    if (running && !reduce) raf = requestAnimationFrame(frame);
  }

  function setMode(m, user) {
    if (m === mode) return;
    if (user) stopAuto();
    cells.forEach(c => { c.from = c.cur; c.to = c.s[m]; });
    mode = m; modeT = performance.now();
    seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
    $('legendTitle').textContent = PANEL[m].title; $('rankTitle').textContent = PANEL[m].rank;
    renderRank(true); select(hoodStats(m)[0].i); kick();
  }
  function select(i) {
    sel = i;
    [...rankEl.children].forEach(li => li.classList.toggle('sel', +li.dataset.i === i));
    renderSheet();
    if (started && !reduce) { sheet.classList.add('hide'); isoT = Math.max(performance.now(), t0 + 1300); }
    kick();
  }
  function kick() { if (reduce || !running) frame(performance.now() + 1e5); }
  function stopAuto() { auto = false; clearInterval(autoTimer); }
  function startAuto() { clearInterval(autoTimer); if (auto) autoTimer = setInterval(() => setMode(mode === 'res' ? 'corp' : 'res'), 7000); }

  seg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode, true); });
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = -1, bd = R * R * 1.2;
    cells.forEach((c, k) => { const d = (c.x - x) ** 2 + (c.y - y) ** 2; if (d < bd) { bd = d; best = k; } });
    hover = best;
    if (best >= 0) { const c = cells[best]; tip.classList.add('on'); tip.style.left = c.x + 'px'; tip.style.top = c.y + 'px'; tip.textContent = `${HOODS[c.hood].name}, score ${Math.round(c.cur * 100)}`; }
    else tip.classList.remove('on');
    kick();
  });
  canvas.addEventListener('pointerleave', () => { hover = -1; tip.classList.remove('on'); kick(); });
  canvas.addEventListener('click', () => { if (hover >= 0) { stopAuto(); select(cells[hover].hood); } });

  build(); renderRank(false); select(hoodStats(mode)[0].i);
  if (reduce) { t0 = -1e9; isoT = -1e9; } else t0 = performance.now() + 1e9;
  addEventListener('resize', () => { build(); kick(); });
  document.fonts?.ready.then(kick);
  whenVisible($('atlasMock'), v => {
    running = v; cancelAnimationFrame(raf); clearInterval(autoTimer);
    if (!v) return;
    if (!started) { started = true; t0 = performance.now(); isoT = t0 + 1300; sheet.classList.add('hide'); }
    startAuto();
    if (reduce) frame(performance.now()); else raf = requestAnimationFrame(frame);
  });
  if (reduce) frame(performance.now());
})();

/* ================= CRM ================= */
(() => {
  const board = $('board'), chat = $('chat'), fieldsEl = $('fields'), verdict = $('verdict'), scoreN = $('scoreN');
  const action = $('action'), actionText = $('actionText'), aiTitle = $('aiTitle');
  const COLS = [['new', 'New'], ['talk', 'Talking'], ['qual', 'Qualified'], ['visit', 'Visit']];
  const BASE = [
    ['new', 'Rafael Nunes', 'Lia, 2', 12], ['new', 'Bia Santos', 'Caio, 4', 8],
    ['talk', 'Paulo Mendes', 'Nina, 1', 0], ['talk', 'Marina Costa', 'Theo, 3', 0], ['talk', 'Igor Teles', 'Davi, 5', 41],
    ['qual', 'Carla Dias', 'Sofia, 2', 72], ['qual', 'Júlia Prado', 'Leo, 3', 66],
    ['visit', 'Ana Ribeiro', 'Luca, 4', 84]
  ];
  const STORIES = [
    { who: 'Marina Costa', score: 78, move: 'qual',
      chat: [['in', 'Hi! Do you have a <mark>full-day</mark> spot for Theo? He turns 3 in March.'], ['out', 'We do, in the morning group starting February. Would you like to visit?'], ['in', '<mark>Escola Horizonte</mark> quoted us <mark>less</mark>, so I am still comparing.'], ['in', 'Could we come <mark>Saturday morning</mark>?']],
      fields: [['Child', 'Theo, 3 in March'], ['Interest', 'Full-day'], ['Objection', 'Price'], ['Competitor', 'Escola Horizonte'], ['Visit', 'Saturday morning'], ['Budget', null]],
      verdict: ['allow', 'Qualified'], next: 'Book Saturday. She is comparing with Escola Horizonte on price.' },
    { who: 'Paulo Mendes', score: 34, move: null,
      chat: [['in', 'Hello, how much is it for <mark>next year</mark>?'], ['out', 'Here is the 2027 table. Which age group is Nina in?'], ['in', 'Thanks, I’ll take a look.']],
      fields: [['Child', 'Nina, from the form'], ['Interest', 'Next school year'], ['Objection', null], ['Competitor', null], ['Visit', null], ['Budget', null]],
      verdict: ['cool', 'Not qualified yet'], next: 'No reply in 3 days. Ask about Nina’s age group and offer a visit.' }
  ];
  let cardEls = {};
  function renderBoard() {
    board.innerHTML = ''; cardEls = {};
    COLS.forEach(([id, label]) => { const c = document.createElement('div'); c.className = 'col'; c.dataset.col = id; c.innerHTML = `<h4>${label}<span>0</span></h4><div class="stack"></div>`; board.appendChild(c); });
    BASE.forEach(([col, name, kid, sc]) => {
      const el = document.createElement('div'); el.className = 'lead-card';
      el.innerHTML = `<div class="r1"><b>${name}</b><span class="sc${sc >= 70 ? ' hot' : ''}">${sc || '--'}</span></div><span>${kid}</span>`;
      cardEls[name] = el; board.querySelector(`[data-col="${col}"] .stack`).appendChild(el);
    });
    counts();
  }
  const counts = () => board.querySelectorAll('.col').forEach(c => c.querySelector('h4 span').textContent = c.querySelectorAll('.lead-card').length);
  function moveCard(el, colId) {
    const a = el.getBoundingClientRect();
    board.querySelector(`[data-col="${colId}"] .stack`).prepend(el);
    const b = el.getBoundingClientRect(); counts();
    if (!reduce) el.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  function countTo(v) {
    const start = +scoreN.textContent || 0, s = performance.now();
    (function step(t) { const p = reduce ? 1 : Math.max(0, Math.min(1, (t - s) / 900)); scoreN.textContent = Math.round(lerp(start, v, ease(p))); if (p < 1) requestAnimationFrame(step); })(s);
  }
  function reset(story) {
    chat.innerHTML = ''; verdict.textContent = ''; verdict.className = 'verdict chip'; action.classList.remove('on'); scoreN.textContent = '0';
    aiTitle.textContent = story.who;
    fieldsEl.innerHTML = story.fields.map(([k]) => `<div class="field"><dt>${k}</dt><dd></dd></div>`).join('');
  }
  async function play(story, p, my) {
    reset(story);
    const el = cardEls[story.who];
    Object.values(cardEls).forEach(c => c.classList.remove('active')); el.classList.add('active');
    for (const [dir, text] of story.chat) {
      const m = document.createElement('div'); m.className = 'msg' + (dir === 'out' ? ' out' : '');
      m.innerHTML = '<span class="typing" aria-hidden="true"><i></i><i></i><i></i></span>'; chat.appendChild(m);
      await p.wait(650, my); m.innerHTML = text; await p.wait(850, my);
    }
    const rows = [...fieldsEl.children];
    for (let k = 0; k < story.fields.length; k++) {
      const v = story.fields[k][1], row = rows[k]; row.classList.add('on');
      if (v == null) { row.classList.add('null'); row.querySelector('dd').textContent = 'not said, not stored'; }
      else row.querySelector('dd').textContent = v;
      await p.wait(240, my);
    }
    countTo(story.score);
    const sc = el.querySelector('.sc'); sc.textContent = story.score; sc.classList.toggle('hot', story.score >= 70);
    await p.wait(700, my);
    verdict.textContent = story.verdict[1]; verdict.className = `verdict chip chip--${story.verdict[0]}`;
    await p.wait(500, my);
    if (story.move) moveCard(el, story.move);
    await p.wait(600, my);
    actionText.textContent = story.next; action.classList.add('on');
    await p.wait(3600, my);
    action.classList.remove('on');
    await p.wait(500, my);
  }
  const run = player($('crmMock'), async (p, my) => {
    do { renderBoard(); for (const s of STORIES) await play(s, p, my); await p.wait(800, my); } while (!reduce);
  });
  $('replay').addEventListener('click', () => run.restart());
  renderBoard(); reset(STORIES[0]);
})();

/* ================= HARNESS TRAIL ================= */
(() => {
  const trail = $('trail');
  const EVENTS = [
    { who: 'agent, Claude', tool: 'docs.search runbook', d: 'allow', note: 'Three passages, sources attached' },
    { who: 'agent, Claude', tool: 'pg.write enrollments', d: 'ask', note: 'Destructive write, waiting for a person' },
    { who: 'operator', person: true, tool: 'pg.write enrollments', d: 'allow', note: 'Approved, with the reason in the log' },
    { who: 'agent, Codex', tool: 'shell curl', d: 'deny', note: 'Hook blocks direct network access' },
    { who: 'agent, Gemini', tool: 'gh.read internal-repo', d: 'allow', note: 'Read-only token never leaves the vault' },
    { who: 'agent, Codex', tool: 'pg.query reporting', d: 'allow', note: 'Email masked as j***@example.com' },
    { who: 'agent, Claude', tool: 'env.read', d: 'deny', note: 'Credentials stay inside the broker' },
    { who: 'agent, Gemini', tool: 'ssh.logs api-01', d: 'allow', note: 'Last 200 lines, secrets redacted' }
  ];
  let clock = 9 * 3600 + 41 * 60 + 2;
  const fmt = s => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':');
  function add(e) {
    clock += 6 + Math.floor(Math.random() * 9);
    const li = document.createElement('li');
    li.className = 'is-new' + (e.d === 'ask' ? ' is-ask' : '');
    li.innerHTML = `<span class="t measured">${fmt(clock)}</span><span class="who${e.person ? ' person' : ''}">${e.who}</span><span class="tool measured">${e.tool}</span><span><span class="chip chip--${e.d}">${e.d}</span></span><span class="note">${e.note}</span>`;
    trail.prepend(li);
    while (trail.children.length > 6) trail.lastElementChild.remove();
  }
  if (reduce) { EVENTS.slice(0, 3).reverse().forEach(add); return; }
  player(trail, async (p, my) => {
    for (let k = 0; ; k = (k + 1) % EVENTS.length) { add(EVENTS[k]); await p.wait(EVENTS[k].d === 'ask' ? 2400 : 1700, my); }
  });
})();

/* ================= LAB DEMOS ================= */
// ponytail: a hidden tab panel never intersects, so the player's own observer already pauses it
const labPlayer = (id, script) => player($(id), script);

/* khaos: endpoints arrive as the crawl finds them */
labPlayer('khaos', async (p, my) => {
  const body = $('endpoints'), status = $('crawlStatus');
  const EP = [
    ['GET', '/products/{id}', 'id, name, price', 'observed'],
    ['GET', '/api/v2/search?q=', 'q, page, total', 'observed'],
    ['POST', '/cart/items', 'sku, qty', 'form'],
    ['POST', '/graphql', 'SearchProducts', 'observed'],
    ['GET', '/api/v2/users/{id}', 'unknown', 'inferred'],
    ['GET', '/sitemap.xml', '42 urls', 'observed']
  ];
  do {
    body.innerHTML = '';
    for (let k = 0; k < EP.length; k++) {
      const [m, path, f, ev] = EP[k], tr = document.createElement('tr'); tr.className = 'is-new';
      tr.innerHTML = `<td class="m measured">${m}</td><td class="p measured">${path}</td><td class="f measured">${f}</td><td><span class="chip ${ev === 'inferred' ? '' : 'chip--cool'}">${ev}</span></td>`;
      body.appendChild(tr);
      status.textContent = `${k + 1} endpoint candidate${k ? 's' : ''}, ${(k + 1) * 7} pages crawled`;
      await p.wait(900, my);
    }
    status.textContent = '6 candidates, 1 inferred and left to confirm against a capture';
    await p.wait(4200, my);
  } while (!reduce);
});

/* lead scorer: the bars draw once each time the tab opens */
(() => {
  const bars = $('bars');
  lab.onChange(id => { if (id !== 'scorer') { bars.classList.remove('is-drawn'); return; } requestAnimationFrame(() => requestAnimationFrame(() => bars.classList.add('is-drawn'))); });
  whenVisible(bars, v => { if (v) bars.classList.add('is-drawn'); });
})();

/* studium: a click pauses the scene and asks for a gloss */
labPlayer('studium', async (p, my) => {
  const target = $('subTarget'), native = $('subNative'), gloss = $('gloss'), paused = $('paused');
  const LINES = [
    { en: 'I’m not going to bail on you now.', pt: 'Não vou te deixar na mão agora.', pick: 'bail on', head: 'bail on', tr: 'deixar na mão', note: 'Phrasal verb. Aqui: abandonar quem conta com você, não “pagar fiança”.' },
    { en: 'Fine, I guess we can call it a day.', pt: 'Tá, acho que por hoje chega.', pick: 'call it a day', head: 'call it a day', tr: 'encerrar por hoje', note: 'Expressão idiomática. Ninguém está “ligando” para nada: é parar o trabalho.' }
  ];
  const words = l => l.en.replace(l.pick, `<span class="w" data-pick>${l.pick}</span>`);
  do {
    for (const l of LINES) {
      target.innerHTML = words(l); native.textContent = l.pt; gloss.classList.add('hide'); paused.hidden = true;
      await p.wait(1400, my);
      target.querySelector('[data-pick]').classList.add('is-picked'); paused.hidden = false;
      gloss.innerHTML = '<span class="side-label">buscando…</span>'; gloss.classList.remove('hide');
      await p.wait(900, my);
      gloss.innerHTML = `<h4>${l.head}</h4><span class="measured">${l.tr}</span><p>${l.note}</p>`;
      await p.wait(4200, my);
    }
  } while (!reduce);
});

/* streamflix: progress moves from the TV to the phone through Jellyfin */
labPlayer('streamflix', async (p, my) => {
  const tv = $('devTv'), ph = $('devPhone'), log = $('sfLog'), TOTAL = 112 * 60;
  const fmt = s => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':');
  const set = (dev, s, idle) => { dev.querySelector('.track b').style.setProperty('--p', s / TOTAL); dev.querySelector('.measured').textContent = idle ? 'idle' : fmt(s); dev.classList.toggle('is-idle', !!idle); };
  const line = (req, s) => { const li = document.createElement('li'); li.className = 'is-new'; li.innerHTML = `<span class="cool">${fmt(s)}</span><span>${req}</span>`; log.prepend(li); while (log.children.length > 4) log.lastElementChild.remove(); };
  do {
    let s = 41 * 60 + 12; log.innerHTML = ''; set(tv, s); set(ph, 0, true);
    line('POST /Sessions/Playing', s);
    for (let k = 0; k < 4; k++) { await p.wait(1000, my); s += 10; set(tv, s); line('POST /Sessions/Playing/Progress', s); }
    await p.wait(900, my);
    line('POST /Sessions/Playing/Stopped', s); set(tv, s, true);
    await p.wait(1300, my);
    line('GET /UserItems/Resume', s); set(ph, s);
    for (let k = 0; k < 3; k++) { await p.wait(1000, my); s += 10; set(ph, s); line('POST /Sessions/Playing/Progress', s); }
    await p.wait(3000, my);
  } while (!reduce);
});
