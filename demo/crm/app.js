/* Demo CRM: the real CRM interface (markup + compiled CSS) with fictional leads.
   Every name, message and number here is invented. */
(() => {
const P = window.__PARTS, IC = P.icons;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const standalone = window.top === window;
const $ = id => document.getElementById(id);
const ease = t => 1 - Math.pow(1 - t, 4);
const UNIT = 'Vila Aurora';
const EASE = 'cubic-bezier(.16,1,.3,1)';

const COLS = [
  { id: 'novo', name: 'Novo Lead', grad: 'from-[#C9A3E3] to-[#B98CD9]', bl: 'border-l-[#B98CD9]', n: 77 },
  { id: 'atend', name: 'Em Atendimento', grad: 'from-[#B98CD9] to-[#A873CE]', bl: 'border-l-[#A873CE]', n: 54 },
  { id: 'qual', name: 'Qualificado', grad: 'from-[#A873CE] to-[#9A63C4]', bl: 'border-l-[#9A63C4]', n: 33 },
  { id: 'visita', name: 'Visita Agendada', grad: 'from-[#9A63C4] to-[#8A4FB8]', bl: 'border-l-[#8A4FB8]', n: 27 },
  { id: 'falta', name: 'Não Compareceu', grad: 'from-amber-400 to-amber-500', bl: 'border-l-amber-400', n: 4 },
  { id: 'realiz', name: 'Visita Realizada', grad: 'from-[#8A4FB8] to-[#7C3FA8]', bl: 'border-l-[#7C3FA8]', n: 1 },
  { id: 'negoc', name: 'Em Negociação', grad: 'from-[#7C3FA8] to-[#652D91]', bl: 'border-l-[#652D91]', n: 31 },
  { id: 'matric', name: 'Matrícula', grad: 'from-[#F59C00] to-[#E08900]', bl: 'border-l-[#F59C00]', n: 23 },
  { id: 'naofech', name: 'Não Fechou', grad: 'from-gray-400 to-gray-500', bl: 'border-l-gray-400', n: 24 }
];
const SRC = {
  Meta: 'bg-purple-50 text-purple-700', Google: 'bg-orange-50 text-orange-700', GMB: 'bg-purple-50 text-purple-600',
  Maps: 'bg-slate-100 text-slate-600', Site: 'bg-slate-100 text-slate-600', WhatsApp: 'bg-emerald-50 text-emerald-700', Outro: 'bg-gray-100 text-gray-600'
};
// fictional pipeline
const SEED = [
  ['novo', 'Sabrina Almeida', 'Gael, 4a', 'Outro', 0], ['novo', 'Marcelo Costa', 'Manuela, 4a', 'WhatsApp', 3], ['novo', 'Igor Lima', 'Bernardo, 4a', 'Meta', 3], ['novo', 'Elaine Silva', 'Bernardo, 5a', 'Site', 6], ['novo', 'Vanessa Ribeiro', 'Heitor, 2a', 'Meta', 3],
  ['atend', 'Otávio Silva', 'Davi, 7a', 'Meta', 18, 'Família com dúvida sobre valor da mensalidade e formas de pagamento; ainda não confirmou visita.', 'SDR demorou para responder; quando respondeu, foi direto e resolutivo.'],
  ['atend', 'Larissa Gomes', 'Enzo, 6a', 'GMB', 22, 'Mãe do Enzo (6 anos) busca vaga para o período da manhã; perguntou sobre transporte.', 'Boa personalização: SDR usou o nome da criança e o turno certo.'],
  ['atend', 'Patrícia Rodrigues', 'Helena, 6a', 'Site', 21, 'Já visitou outra unidade e está avaliando a proposta financeira antes de decidir.', 'Conversa ainda inicial; SDR enviou material institucional.'],
  ['qual', 'Vanessa Almeida', 'Gael, 2a', 'Maps', 49, 'Pesquisando opções de escola integral, perguntou sobre atividades extracurriculares e valores.', 'Comparou com outra escola da região mas segue engajado e pediu para visitar.', 'Follow-up de proposta', '06h59'],
  ['qual', 'Fernanda Pereira', 'Théo, 2a', 'GMB', 50, 'Família nova na região, pesquisando unidades próximas; ainda comparando.', 'Elogiou o atendimento e pediu para agendar a visita para o próximo fim de semana.'],
  ['visita', 'Fernanda Almeida', 'Gael, 2a', 'Meta', 66, null, null, 'Enviar contrato de matrícula', '05h03', 'Sáb 14/11 · 11h21'],
  ['visita', 'Beatriz Rodrigues', 'Lia, 3a', 'WhatsApp', 66, null, null, null, null, 'Sáb 14/11 · 07h12'],
  ['visita', 'Otávio Ferreira', 'Bernardo, 5a', 'Meta', 66, null, null, 'Retomar contato: lead sumiu', '17h14', 'Sex 13/11 · 10h10'],
  ['falta', 'Vanessa Ribeiro', 'Théo, 8a', 'Google', 36, null, null, null, null, 'Qui 12/11 · 06h53', 2], ['falta', 'Elaine Oliveira', 'Bia, 4a', 'Site', 35, null, null, null, null, 'Qui 12/11 · 00h08', 2],
  ['realiz', 'Sérgio Carvalho', 'Nina, 3a', 'Site', 83, null, null, null, null, 'Seg 09/11 · 17h58'],
  ['negoc', 'Patrícia Oliveira', 'Davi, 4a', 'Outro', 90], ['negoc', 'Ricardo Nunes', 'Clara, 2a', 'Google', 81],
  ['matric', 'Larissa Oliveira', 'Enzo, 5a', 'Meta', 100, null, null, null, null, null, 1], ['matric', 'Bruno Teixeira', 'Alice, 3a', 'WhatsApp', 96],
  ['naofech', 'Rafael Costa', 'Alice, 7a', 'GMB', 12], ['naofech', 'Juliana Prado', 'Pedro, 6a', 'Site', 9]
];

/* ---------------- markup (same classes as the real components) ---------------- */
const badge = s => s >= 70 ? ['bg-red-50 text-red-600', '🔥'] : s >= 40 ? ['bg-amber-50 text-amber-600', '⚡'] : ['bg-sky-50 text-sky-600', '❄️'];
function cardHTML(l) {
  const col = COLS.find(c => c.id === l.col), [bc, em] = badge(l.score);
  const assessColor = l.col === 'qual' ? 'text-[#652D91]' : 'text-[#8A4FB8]';
  return `<div class="group overflow-hidden relative rounded-xl border border-gray-100 border-l-4 ${col.bl} bg-white cursor-grab active:cursor-grabbing select-none transition-all shadow-sm hover:-translate-y-px hover:shadow-md" data-lead="${l.id}"><div class="px-3 py-3"><div class="flex items-start justify-between gap-2"><p class="font-semibold text-gray-900 text-sm leading-snug flex-1 min-w-0 truncate">${l.name}</p><span class="inline-flex items-center gap-0.5 text-2xs font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${bc}" data-badge>${em} ${l.score}</span></div><p class="text-xs text-gray-400 mt-0.5 truncate">${l.kid}</p><div class="mt-2 flex items-center gap-1 flex-wrap"><span class="text-2xs font-medium px-2 py-0.5 rounded-full ${SRC[l.src]}">${l.src}</span><span class="text-2xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">${UNIT}</span></div>${l.faltas ? `<p class="text-2xs text-red-500 font-semibold mt-1">${l.faltas}× falta</p>` : ''}<div class="mt-1 flex items-center gap-1 flex-wrap"></div>${l.date ? `<p class="text-2xs font-semibold mt-1 ${l.col === 'falta' ? 'text-amber-600' : 'text-[#652D91]'}" data-date>📅 ${l.date}</p>` : ''}${l.col !== 'novo' ? '<p class="text-2xs text-gray-400 mt-1 truncate" data-sdr>SDR: Renata</p>' : ''}${l.sum ? `<p class="text-2xs text-slate-600 mt-1 line-clamp-2 leading-snug" data-sum><span class="text-slate-400">💬 </span><span data-t>${l.sum}</span></p>` : ''}${l.assess ? `<p class="text-2xs ${assessColor} mt-1 line-clamp-2 leading-snug" data-assess>${l.assess}</p>` : ''}${l.task ? `<div class="mt-1.5 flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium bg-amber-50 text-amber-600" data-task>${IC.task}<span class="truncate min-w-0">${l.task}</span><span class="flex-shrink-0 opacity-70 ml-auto">· ${l.taskT}</span></div>` : ''}</div><div class="translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out"><button class="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-2xs font-semibold transition-colors disabled:opacity-40 cursor-pointer">${IC.wa}Abrir conversa</button></div></div>`;
}
const el = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };

let LEADS = new Map(), uid = 0;
function renderBoard() {
  const board = $('board'); board.innerHTML = ''; LEADS.clear();
  COLS.forEach(c => {
    c.count = c.n;
    board.appendChild(el(`<div class="flex flex-col w-[256px] flex-shrink-0 h-full" data-col="${c.id}"><div class="flex items-center justify-between px-3 py-2 mb-2 rounded-full bg-gradient-to-r ${c.grad} shadow-sm"><span class="text-white text-xs font-bold truncate">${c.name}</span><span class="ml-2 flex-shrink-0 bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full leading-none" data-count>${c.n}</span></div><div class="flex-1 min-h-[200px] overflow-y-auto rounded-xl p-2 space-y-2 transition-colors duration-150 bg-gray-100/70 border border-gray-200/60" data-list></div></div>`));
  });
  SEED.forEach(r => addLead({ col: r[0], name: r[1], kid: r[2], src: r[3], score: r[4], sum: r[5], assess: r[6], task: r[7], taskT: r[8], date: r[9], faltas: r[10] }, false));
  $('leadCount').textContent = 274; [27, 4, 1, 23].forEach((v, i) => $('kpi' + i).textContent = v);
}
function addLead(l, top) {
  l.id = 'L' + (++uid); LEADS.set(l.id, l);
  const node = el(cardHTML(l)), list = document.querySelector(`[data-col="${l.col}"] [data-list]`);
  top ? list.prepend(node) : list.appendChild(node);
  return node;
}
function setCount(colId, delta) {
  const c = COLS.find(x => x.id === colId); c.count += delta;
  const n = document.querySelector(`[data-col="${colId}"] [data-count]`); n.textContent = c.count;
  if (!reduce) n.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 420, easing: EASE });
}
function moveCard(l, colId) {
  const node = document.querySelector(`[data-lead="${l.id}"]`), a = node.getBoundingClientRect();
  const from = l.col; l.col = colId;
  const fresh = el(cardHTML(l)); node.replaceWith(fresh);
  const list = document.querySelector(`[data-col="${colId}"] [data-list]`); list.prepend(fresh); list.scrollTop = 0;
  const b = fresh.getBoundingClientRect();
  setCount(from, -1); setCount(colId, +1);
  if (!reduce) fresh.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) rotate(-1.5deg) scale(1.03)`, boxShadow: '0 18px 30px -12px rgba(78,27,100,.35)' }, { transform: 'none', boxShadow: '0 1px 2px 0 rgba(0,0,0,.05)' }], { duration: 800, easing: EASE });
  return fresh;
}
function tick(id, to) {
  const n = $(id), from = +n.textContent, t0 = performance.now();
  const step = t => { const p = reduce ? 1 : Math.max(0, Math.min(1, (t - t0) / 700)); n.textContent = Math.round(from + (to - from) * ease(p)); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  const card = n.parentElement; if (!reduce) card.animate([{ transform: 'translateY(-3px)', filter: 'brightness(1.12)' }, { transform: 'none', filter: 'none' }], { duration: 700, easing: EASE });
}

/* ---------------- drawer (same markup as the lead panel) ---------------- */
const temp = s => s >= 70 ? ['Quente', 'text-red-600', 'bg-red-400'] : s >= 40 ? ['Morno', 'text-amber-600', 'bg-amber-400'] : ['Frio', 'text-sky-600', 'bg-sky-400'];
const COLNAME = id => COLS.find(c => c.id === id).name;
function drawerHTML(l) {
  const [tl, tc, bar] = temp(l.score), ini = l.name.split(' ').map(w => w[0]).slice(0, 2).join('');
  const next = { novo: 'Em Atendimento', atend: 'Qualificado', qual: 'Visita Agendada', visita: 'Visita Realizada' }[l.col] || 'Em Negociação';
  return `<div class="relative bg-gray-50 border-b border-gray-100 px-5 pt-5 pb-4 flex-shrink-0"><button class="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all text-sm" data-close>✕</button><div class="mb-3"><span class="inline-flex items-center gap-1.5 text-2xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200"><span class="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>${COLNAME(l.col)}</span></div><div class="flex items-center gap-3"><div class="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 bg-orange-100 text-orange-700">${ini}</div><div class="min-w-0"><h2 class="text-base font-bold text-gray-900 leading-tight truncate pr-8">${l.name}</h2><p class="text-xs text-gray-500 mt-0.5 truncate"><span class="inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>${l.src}</span><span> · ${UNIT}</span></p></div></div><div class="mt-4 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm"><div class="flex items-end justify-between mb-2"><div><span class="text-2xl font-bold text-gray-900 leading-none" data-dscore>0</span><span class="text-sm text-gray-400 ml-1">/100</span></div><span class="text-xs font-bold ${tc}">${tl}</span></div><div class="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div class="h-full rounded-full transition-all ${bar} demo-bar" style="width: 0%;" data-dbar></div></div><p class="text-2xs text-gray-400 mt-1.5 uppercase tracking-wider font-semibold">Qualidade do Lead</p></div></div><div class="flex border-b border-gray-100 flex-shrink-0 bg-white" data-tabs>${['Dados', 'Atividade', 'Tarefas', 'Contatos'].map((t, i) => `<button class="flex-1 py-2.5 text-2xs font-semibold uppercase tracking-wide transition-colors ${i ? 'text-gray-400 hover:text-gray-600' : 'text-[#652D91] border-b-2 border-[#652D91]'}">${t}</button>`).join('')}</div><div class="flex-1 overflow-y-auto"><div class="px-5 py-5 space-y-5"><div><p class="text-2xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dados do Lead</p><div class="grid grid-cols-2 gap-x-6 gap-y-4"><div><p class="text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Telefone</p><div class="text-sm text-gray-700"><span class="text-[#652D91] font-medium">(11) 9●●●●-●●${String(l.id.length * 37 % 90 + 10)}</span></div></div><div><p class="text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Origem</p><div class="text-sm text-gray-700"><span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-orange-500"></span>${l.src}</span></div></div><div><p class="text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">SDR Responsável</p><div class="text-sm text-gray-700"><span class="inline-flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-2xs font-bold flex items-center justify-center">RE</span>Renata</span></div></div><div><p class="text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Unidade</p><div class="text-sm text-gray-700"><span class="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-600">🏫 ${UNIT}</span></div></div><div><p class="text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Filho(a)</p><div class="text-sm text-gray-700">${l.kid}</div></div></div></div>${l.want || l.sum ? `<div class="space-y-2"><p class="text-2xs font-bold text-gray-400 uppercase tracking-widest mb-3">Avaliação IA</p><div class="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5"><p class="text-2xs font-bold text-slate-500 uppercase tracking-wide mb-1">O que o lead quer</p><p class="text-sm text-slate-700 leading-relaxed" data-want>${l.want || l.sum}</p></div><div class="rounded-xl bg-purple-50 border border-purple-100 px-3 py-2.5"><p class="text-2xs font-bold text-purple-500 uppercase tracking-wide mb-1">Avaliação qualificação</p><p class="text-sm text-purple-700 leading-relaxed" data-qual>${l.assess || '—'}</p></div></div>` : ''}<button class="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100">Arquivar lead</button></div></div><div class="flex-shrink-0 bg-gray-50 border-t border-gray-100 px-4 py-3 flex gap-2.5"><button class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all">${IC.wa.replace('w-3.5 h-3.5', 'w-4 h-4')}Abrir Conversa</button><button class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[#4E1B64] text-white hover:bg-[#3D1550] transition-all" data-advance>→ ${next}</button></div>`;
}
const drawer = $('drawer'), backdrop = $('backdrop');
let drawerLead = null;
function openDrawer(l) {
  drawerLead = l; drawer.innerHTML = drawerHTML(l);
  backdrop.hidden = false; drawer.hidden = false;
  requestAnimationFrame(() => { backdrop.classList.add('open'); drawer.classList.add('open'); });
  const t0 = performance.now(), n = drawer.querySelector('[data-dscore]'), b = drawer.querySelector('[data-dbar]');
  setTimeout(() => { b.style.width = l.score + '%'; }, reduce ? 0 : 250);
  const step = t => { const p = reduce ? 1 : Math.max(0, Math.min(1, (t - t0 - 250) / 900)); n.textContent = Math.round(l.score * ease(p)); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function closeDrawer() {
  backdrop.classList.remove('open'); drawer.classList.remove('open');
  setTimeout(() => { if (!drawer.classList.contains('open')) { drawer.hidden = true; backdrop.hidden = true; } }, reduce ? 0 : 420);
  drawerLead = null;
}
backdrop.addEventListener('click', () => { user(); closeDrawer(); });
drawer.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) { user(); closeDrawer(); return; }
  const tb = e.target.closest('[data-tabs] button');
  if (tb) { user(); drawer.querySelectorAll('[data-tabs] button').forEach(b => { const on = b === tb; b.className = `flex-1 py-2.5 text-2xs font-semibold uppercase tracking-wide transition-colors ${on ? 'text-[#652D91] border-b-2 border-[#652D91]' : 'text-gray-400 hover:text-gray-600'}`; }); return; }
  if (e.target.closest('[data-advance]') && drawerLead) { user(); const l = drawerLead, nxt = { novo: 'atend', atend: 'qual', qual: 'visita', visita: 'realiz' }[l.col]; closeDrawer(); if (nxt) setTimeout(() => moveCard(l, nxt), 250); }
});
$('board').addEventListener('click', e => {
  if (e.target.closest('button')) return;
  const c = e.target.closest('[data-lead]'); if (!c) return; user(); openDrawer(LEADS.get(c.dataset.lead));
});

/* ---------------- views + Central de Ações ---------------- */
const NAV_ON = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all bg-[#F59C00] text-[#4E1B64] shadow-md shadow-black/20 font-semibold';
const NAV_OFF = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-white/70 hover:bg-white/10 hover:text-white';
function show(view) {
  document.querySelectorAll('nav a[data-view]').forEach(a => a.className = a.dataset.view === view ? NAV_ON : NAV_OFF);
  const on = $('view-' + view), off = $('view-' + (view === 'kanban' ? 'alertas' : 'kanban'));
  if (on.hidden) { off.hidden = true; on.hidden = false; if (!reduce) on.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE }); }
}
document.querySelectorAll('nav a[data-view]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); const v = a.dataset.view; if (v === 'other') { a.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 220 }); return; }
  user(); show(v);
}));
const SEV = {
  red: ['border-l-red-400', 'bg-red-500', 'bg-red-50 text-red-700'],
  amber: ['border-l-amber-400', 'bg-amber-500', 'bg-amber-50 text-amber-700'],
  purple: ['border-l-purple-200', 'bg-purple-300', 'bg-purple-50 text-purple-600']
};
function alertHTML(a) {
  const [bl, dot, bdg] = SEV[a.sev];
  return `<div class="bg-white rounded-xl border border-gray-100 border-l-4 ${bl} shadow-sm px-5 py-4 transition-shadow hover:shadow-md" data-alert="${a.lead || ''}"><div class="flex items-start gap-3"><span class="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${dot}"></span><div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap mb-1.5"><span class="text-xs font-bold px-2.5 py-1 rounded-full leading-none ${bdg}">${a.kind}</span><span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 leading-none">${UNIT}</span><span class="text-xs text-gray-400 ml-auto flex-shrink-0">${a.when}</span></div><p class="text-base font-bold text-gray-900 leading-snug">${a.kind}</p><p class="text-sm text-gray-600 mt-1">${a.sub}</p><div class="bg-gray-50 rounded-lg px-3 py-2 mt-2"><p class="text-2xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Motivo</p><p class="text-sm text-slate-700 leading-relaxed">${a.why}</p></div><p class="text-sm text-emerald-700 mt-2 font-semibold">→ ${a.act}</p></div></div><div class="flex items-center gap-2.5 mt-4 pt-3 border-t border-gray-100"><button class="flex items-center justify-center gap-1.5 text-sm font-semibold text-[#652D91] bg-purple-50 border border-purple-200 hover:bg-purple-100 active:scale-95 px-4 py-2 rounded-full transition-all" title="Ver lead" data-see>${IC.eye}Ver lead</button><button class="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 active:scale-95 px-4 py-2 rounded-full transition-all" title="Marcar como lido" data-done>${IC.check}Resolvido</button></div></div>`;
}
const BASE_ALERTS = [
  { sev: 'red', kind: 'Tarefa atrasada', when: '12min', sub: 'Enviar contrato de matrícula — Fernanda Almeida', why: 'Mãe do Gael (2 anos), busca vaga para o período da manhã; comparando preço com outra escola.', act: 'Concluir ou reagendar a tarefa agora' },
  { sev: 'red', kind: 'Tarefa atrasada', when: '40min', sub: 'Confirmar documentação da matrícula — Bruno Teixeira', why: 'Pai da Alice mencionou mudança de bairro recente e quer conhecer a estrutura presencialmente.', act: 'Concluir ou reagendar a tarefa agora' },
  { sev: 'amber', kind: 'Tarefa em breve', when: '1h', sub: 'Retomar contato: lead sumiu — Otávio Ferreira às 17:14', why: 'Família visitou a unidade e pediu a proposta; não respondeu desde então.', act: 'Se preparar para cumprir a tarefa no horário' },
  { sev: 'purple', kind: 'SQL parado', when: '3h', sub: 'Vanessa Almeida qualificada e sem agendamento há 4 dias', why: 'Pesquisando escola integral; comparou com outra escola da região mas pediu para visitar.', act: 'Ligar para o lead e tentar agendar a visita' }
];
let pending = 54;
function renderAlerts() {
  pending = 54; $('badge').textContent = pending;
  $('alertList').innerHTML = BASE_ALERTS.map(alertHTML).join('');
  syncAlertCounts();
}
function syncAlertCounts() {
  const n = $('view-alertas'); n.querySelector('header p').textContent = `${pending} ações pendentes, ordenadas por urgência`;
}
function pushAlert(a) {
  pending++; $('badge').textContent = pending; syncAlertCounts();
  if (!reduce) $('badge').animate([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 500, easing: EASE });
  const node = el(alertHTML(a)); $('alertList').prepend(node);
  if (!reduce) node.animate([{ opacity: 0, transform: 'translateY(-14px) scale(.98)', boxShadow: '0 0 0 0 rgba(101,45,145,0)' }, { opacity: 1, transform: 'none', boxShadow: '0 0 0 3px rgba(101,45,145,.18)' }, { boxShadow: '0 1px 2px 0 rgba(0,0,0,.05)' }], { duration: 1600, easing: EASE });
}
$('alertList').addEventListener('click', e => {
  const card = e.target.closest('[data-alert]'); if (!card) return;
  if (e.target.closest('[data-done]')) { user(); pending--; $('badge').textContent = pending; syncAlertCounts();
    const h = card.offsetHeight; card.style.overflow = 'hidden';
    const anim = card.animate([{ opacity: 1, height: h + 'px' }, { opacity: 0, height: '0px', paddingTop: '0px', paddingBottom: '0px', marginTop: '0px' }], { duration: reduce ? 1 : 380, easing: EASE });
    anim.onfinish = () => card.remove(); return; }
  if (e.target.closest('[data-see]')) { user(); const l = card.dataset.alert && LEADS.get(card.dataset.alert); if (l) { show('kanban'); openDrawer(l); } }
});

/* ---------------- toolbar bits ---------------- */
const tbButtons = document.querySelectorAll('#view-kanban .flex.items-center.gap-1.flex-shrink-0 button');
if (tbButtons.length >= 3) {
  const [ativos, arq, sync] = tbButtons;
  [ativos, arq].forEach(b => b.addEventListener('click', () => { user(); ativos.className = arq.className = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-slate-500 hover:bg-slate-100'; b.className = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-slate-800 text-white'; }));
  sync.addEventListener('click', () => { user(); sync.textContent = '↻ Sincronizando…'; setTimeout(() => sync.textContent = '↻ Sincronizar', 1200); });
}
const search = document.querySelector('#view-kanban header input');
if (search) { search.placeholder = 'Buscar lead...'; search.addEventListener('input', () => { user(); const q = search.value.trim().toLowerCase(); document.querySelectorAll('[data-lead]').forEach(c => c.style.display = !q || c.textContent.toLowerCase().includes(q) ? '' : 'none'); }); }

/* ---------------- the story ---------------- */
let auto = true, visible = standalone, gen = 0, waiters = [];
function user() { if (auto) { auto = false; gen++; } }
const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const gate = () => visible ? Promise.resolve() : new Promise(r => waiters.push(r));
async function step(ms, my) { await sleep(ms); await gate(); if (my !== gen || !auto) throw 'stop'; }
async function typeInto(node, text, my) {
  if (reduce) { node.textContent = text; return; }
  for (let i = 1; i <= text.length; i += 2) { node.textContent = text.slice(0, i); await step(14, my); }
  node.textContent = text;
}
function setBadge(card, v) { const b = card.querySelector('[data-badge]'), [cls, em] = badge(v); b.className = `inline-flex items-center gap-0.5 text-2xs font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${cls}`; b.textContent = `${em} ${v}`; }
async function countBadge(l, to, my) {
  const card = () => document.querySelector(`[data-lead="${l.id}"]`), from = l.score, t0 = performance.now();
  if (!reduce) await new Promise(res => { const st = t => { const p = Math.max(0, Math.min(1, (t - t0) / 1100)); const v = Math.round(from + (to - from) * ease(p)); const c = card(); if (c) setBadge(c, v); if (p < 1) requestAnimationFrame(st); else res(); }; requestAnimationFrame(st); });
  l.score = to; const c = card(); if (c) setBadge(c, to);
}
const STORIES = [
  { lead: { col: 'novo', name: 'Helena Duarte', kid: 'Benício, 3a', src: 'WhatsApp', score: 0 },
    sum: 'Mãe do Benício (3 anos) quer período integral a partir de fevereiro; perguntou valores e cardápio.',
    assess: 'Comparou com outra escola da região mas pediu para visitar no sábado de manhã.', score: 64, qualifies: true,
    date: 'Sáb 14/11 · 09h30', task: 'Confirmar visita', taskT: 'sex 18h',
    alert: { sev: 'amber', kind: 'Tarefa em breve', when: 'agora', sub: 'Confirmar visita — Helena Duarte, sábado às 09:30', why: 'Mãe do Benício (3 anos) quer integral a partir de fevereiro; comparou preço com outra escola.', act: 'Ligar na sexta para confirmar a visita' } },
  { lead: { col: 'novo', name: 'Caio Menezes', kid: 'Lara, 1a', src: 'Meta', score: 0 },
    sum: 'Pediu só a tabela de preços do berçário; não respondeu depois do envio.',
    assess: 'SDR enviou a tabela sem perguntar a rotina da família; conversa parou ali.', score: 22, qualifies: false,
    alert: { sev: 'purple', kind: 'Lead esfriando', when: 'agora', sub: 'Caio Menezes sem resposta há 3 dias', why: 'Pediu a tabela do berçário para a Lara (1 ano) e não respondeu mais.', act: 'Enviar follow-up com convite para visita' } }
];
async function play(s, my) {
  show('kanban');
  const l = { ...s.lead };
  await step(900, my);
  // 1. a new lead arrives from the webhook
  const card = addLead(l, true); setCount('novo', +1); $('leadCount').textContent = +$('leadCount').textContent + 1;
  if (!reduce) card.animate([{ opacity: 0, transform: 'translateY(-16px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: EASE });
  await step(1400, my);
  // 2. SDR takes it
  moveCard(l, 'atend');
  await step(1100, my);
  // 3. the model reads the conversation
  let c = document.querySelector(`[data-lead="${l.id}"]`);
  const sumP = el('<p class="text-2xs text-slate-600 mt-1 line-clamp-2 leading-snug" data-sum><span class="text-slate-400">💬 </span><span data-t class="demo-reading">IA lendo a conversa…</span></p>');
  c.querySelector('.px-3.py-3').appendChild(sumP);
  if (!reduce) sumP.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  await step(1500, my);
  const t = sumP.querySelector('[data-t]'); t.classList.remove('demo-reading');
  await typeInto(t, s.sum, my); l.sum = s.sum;
  const asP = el('<p class="text-2xs text-[#8A4FB8] mt-1 line-clamp-2 leading-snug" data-assess></p>'); c.querySelector('.px-3.py-3').appendChild(asP);
  await typeInto(asP, s.assess, my); l.assess = s.assess;
  await countBadge(l, s.score, my);
  await step(900, my);
  if (s.qualifies) {
    // 4. qualified, then the rep books the visit from the lead panel
    moveCard(l, 'qual'); l.want = s.sum;
    await step(1400, my);
    openDrawer(l);
    await step(3600, my);
    const adv = drawer.querySelector('[data-advance]'); if (adv && !reduce) adv.animate([{ transform: 'scale(1)' }, { transform: 'scale(.95)' }, { transform: 'scale(1)' }], { duration: 260 });
    await step(350, my);
    closeDrawer(); await step(350, my);
    l.date = s.date; l.task = s.task; l.taskT = s.taskT; moveCard(l, 'visita'); tick('kpi0', +$('kpi0').textContent + 1);
    await step(1800, my);
  } else {
    l.want = s.sum; openDrawer(l); await step(3200, my); closeDrawer(); await step(900, my);
  }
  // 5. the Action Center picks it up
  const a = { ...s.alert, lead: l.id };
  pending++; $('badge').textContent = pending; pending--;
  if (!reduce) $('badge').animate([{ transform: 'scale(1.7)' }, { transform: 'scale(1)' }], { duration: 500, easing: EASE });
  await step(900, my);
  show('alertas'); await step(500, my); pushAlert(a);
  await step(4200, my);
}
async function loop() {
  const my = ++gen;
  try { while (true) { renderBoard(); renderAlerts(); for (const s of STORIES) await play(s, my); } }
  catch (e) { if (e !== 'stop') throw e; }
}
window.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'demo') return;
  visible = !!e.data.visible;
  if (visible) { waiters.splice(0).forEach(r => r()); if (!gen) loop(); }
});
document.addEventListener('pointerdown', e => { if (e.isTrusted && !e.target.closest('[data-autoplay-ok]')) user(); }, true);

renderBoard(); renderAlerts(); show('kanban');
if (standalone && !reduce) loop();
})();
