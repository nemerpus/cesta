(() => {
  'use strict';

  /* ============ Constantes ============ */
  const KEY = 'cesta:v1';
  const COLORS = ['#2F9E62', '#2B7BB9', '#E0533A', '#C77A12', '#8A5CB8', '#C2366B', '#178F86', '#5A6270'];
  const EMOJIS = ['🛒', '🥖', '🍎', '🥦', '🐟', '🥩', '🧀', '🥚', '🍷', '🧴', '🌿', '🏪'];
  /* Cadenas habituales: distintivo con su inicial y colores de marca (no son los logotipos oficiales).
     `color` es el acento de la app para ese súper; `match` reconoce nombres ya escritos. */
  const BRANDS = {
    mercadona: { name: 'Mercadona', mark: 'M', bg: '#00843D', fg: '#FFFFFF', color: '#00843D', match: ['mercadona'] },
    carrefour: { name: 'Carrefour', mark: 'C', bg: '#1C5BAA', fg: '#FFFFFF', ac: '#E1251B', color: '#1C5BAA', match: ['carrefour'] },
    lidl: { name: 'Lidl', mark: 'L', bg: '#0050AA', fg: '#E60A14', color: '#0050AA', match: ['lidl'] },
    dia: { name: 'Dia', mark: 'Dia', bg: '#E2001A', fg: '#FFFFFF', color: '#D0021B', match: ['dia', 'supermercadosdia'] },
    eroski: { name: 'Eroski', mark: 'E', bg: '#D7141A', fg: '#FFFFFF', ac: '#1D1D1B', color: '#C8102E', match: ['eroski'] },
    alcampo: { name: 'Alcampo', mark: 'A', bg: '#009A44', fg: '#FFFFFF', ac: '#E2001A', color: '#00873C', match: ['alcampo', 'auchan'] },
    aldi: { name: 'Aldi', mark: 'A', bg: '#00205B', fg: '#FFFFFF', ac: '#F39200', color: '#24408E', match: ['aldi'] },
    consum: { name: 'Consum', mark: 'C', bg: '#F18A00', fg: '#FFFFFF', color: '#D97300', match: ['consum'] },
    eci: { name: 'El Corte Inglés', mark: 'ECI', bg: '#0F7B3F', fg: '#FFFFFF', color: '#0F7B3F', match: ['elcorteingles', 'corteingles', 'eci', 'hipercor', 'supercor'] },
    ahorramas: { name: 'Ahorramás', mark: 'Ah', bg: '#00953A', fg: '#FFD400', color: '#00853A', match: ['ahorramas'] },
    bm: { name: 'BM', mark: 'BM', bg: '#E4032E', fg: '#FFFFFF', ac: '#7AB800', color: '#C4122F', match: ['bm', 'bmsupermercados'] },
    coviran: { name: 'Covirán', mark: 'C', bg: '#E30613', fg: '#FFFFFF', ac: '#004F9F', color: '#C8102E', match: ['coviran'] },
    blanca: { name: 'Marca blanca', mark: 'MB', bg: '#FFFFFF', fg: '#3A3F45', color: '#5A6270', match: ['marcablanca', 'blanca', 'generico', 'otros'] },
  };
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const brandFor = name => {
    const n = norm(name);
    if (!n) return null;
    return Object.keys(BRANDS).find(id => BRANDS[id].match.some(m => n === m || (m.length > 3 && n.startsWith(m)))) || null;
  };
  function logoHTML(id) {
    const b = BRANDS[id];
    if (!b) return '';
    return `<span class="logo logo-${id}${b.ac ? ' ac' : ''}" style="--lb:${b.bg};--lf:${b.fg}${b.ac ? `;--la:${b.ac}` : ''}" data-len="${b.mark.length}" aria-hidden="true"><b>${esc(b.mark)}</b></span>`;
  }
  /** Icono de un súper: imagen propia > distintivo de cadena > emoji */
  function ico(x) {
    if (x.img && /^data:image\//.test(x.img)) return `<img class="logo logo-img" src="${x.img}" alt="">`;
    if (x.brand && BRANDS[x.brand]) return logoHTML(x.brand);
    return esc(x.emoji || '🛒');
  }
  /** Logo propio: recorte cuadrado de 128 px, fondo blanco (para PNG con transparencia) */
  function makeLogo(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const S = 128, side = Math.min(img.naturalWidth, img.naturalHeight);
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, S, S);
        ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, S, S);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', .86));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('image')); };
      img.src = url;
    });
  }

  const STRIKE_PATH = 'M2 7 C 18 3.5, 32 9, 50 6 S 82 3.5, 98 6.5';

  const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  const ICON = {
    list: svg('<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17"/>'),
    store: svg('<path d="M4 4h16l1 5H3z"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 11.5V20h14v-8.5"/><path d="M10 20v-5h4v5"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
    pencil: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.6"'),
    dots: svg('<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>'),
    chev: svg('<path d="M6 9l6 6 6-6"/>', 'class="chev"'),
    repeat: svg('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>'),
    trash: svg('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'),
    undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
    broom: svg('<path d="M14 4l6 6"/><path d="M17 7l-6 6"/><path d="M11 13l-6 7h9l1-5z"/>'),
    flag: svg('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
    camera: svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    receipt: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
    grip: svg('<circle cx="9" cy="6" r="1.3" fill="currentColor"/><circle cx="15" cy="6" r="1.3" fill="currentColor"/><circle cx="9" cy="12" r="1.3" fill="currentColor"/><circle cx="15" cy="12" r="1.3" fill="currentColor"/><circle cx="9" cy="18" r="1.3" fill="currentColor"/><circle cx="15" cy="18" r="1.3" fill="currentColor"/>', 'stroke="none"'),
  };

  /* ============ Utilidades ============ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  function ago(ts) {
    const diff = (ts - Date.now()) / 1000;
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
    return 'ahora mismo';
  }
  const fmtDay = ts => new Date(ts).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = ts => new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const money = cents => EUR.format((cents || 0) / 100);
  /** "42,80" · "42.8" · "1.234,56 €" → céntimos; null si no es válido */
  function parseMoney(v) {
    const n = Number(String(v).replace(/[€\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
  }
  const monthKey = ts => { const d = new Date(ts); return d.getFullYear() * 12 + d.getMonth(); };

  /* Fotos de tickets: en IndexedDB (localStorage se quedaría corto) */
  const photoDB = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('cesta-photos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('photos');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
    const run = (mode, fn) => open().then(db => new Promise((res, rej) => {
      const t = db.transaction('photos', mode);
      const req = fn(t.objectStore('photos'));
      t.oncomplete = () => res(req.result);
      t.onerror = () => rej(t.error);
    }));
    return {
      put: (id, blob) => run('readwrite', st => st.put(blob, id)),
      get: id => run('readonly', st => st.get(id)),
      del: id => run('readwrite', st => st.delete(id)),
    };
  })();
  const photoURLs = new Map();
  async function photoURL(id) {
    if (!id) return null;
    if (photoURLs.has(id)) return photoURLs.get(id);
    const blob = await photoDB.get(id).catch(() => null);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    photoURLs.set(id, url);
    return url;
  }
  function dropPhoto(id) {
    if (!id) return;
    if (photoURLs.has(id)) { URL.revokeObjectURL(photoURLs.get(id)); photoURLs.delete(id); }
    photoDB.del(id).catch(() => {});
  }
  /** Reduce la foto a ~1600 px en JPEG: legible y ligera (≈200 KB) */
  function compressImage(file, max = 1600, quality = .72) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k);
        c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('image')); };
      img.src = url;
    });
  }
  function pickPhoto(cb) {
    const input = $('#photo-input');
    input.value = '';
    input.onchange = () => { if (input.files[0]) cb(input.files[0]); };
    input.click();
  }
  function hydratePhotos(root) {
    $$('img[data-photo]', root).forEach(async img => {
      const url = await photoURL(img.dataset.photo);
      if (url) img.src = url; else img.closest('.r-photo')?.remove();
    });
  }

  /** "2 leche" → {qty:'2', text:'Leche'} · "1 kg tomates" · "huevos x12" */
  function parseEntry(raw) {
    let s = raw.trim().replace(/\s+/g, ' ');
    let price = null;
    const pm = s.match(/\s(\d+(?:[.,]\d{1,2})?)\s?€$/);
    if (pm) { price = parseMoney(pm[1]); s = s.slice(0, pm.index).trim(); }
    return { ...parseQty(s), price };
  }
  function parseQty(s) {
    let m = s.match(/^(\d+(?:[.,]\d+)?\s?(?:kg|g|gr|l|ml|cl|uds?|u|x|paq|docenas?)?)\.?\s+(.+)$/i);
    if (m) return { qty: m[1], text: cap(m[2]) };
    m = s.match(/^(.+?)\s*[x×]\s?(\d+)$/i);
    if (m) return { qty: m[2], text: cap(m[1]) };
    return { qty: '', text: cap(s) };
  }
  const newItem = raw => ({ id: uid(), ...parseEntry(raw), done: false });

  /* ============ Estado ============ */
  function seed() {
    const mk = (name, emoji, color, items) => ({ id: uid(), name, emoji, color, brand: brandFor(name), items: items.map(newItem) });
    const a = mk('Mercadona', '🛒', BRANDS.mercadona.color, ['Leche semidesnatada 0,95€', '2 pan de molde 2,30€', 'Huevos x12 2,85€', '1 kg tomates 2,49€', 'Aceite de oliva 8,95€', 'Papel de cocina', 'Yogures naturales 1,60€']);
    const b = mk('Lidl', '🥖', BRANDS.lidl.color, ['Croissants', 'Queso curado']);
    const c = mk('Frutería', '🍎', COLORS[2], ['Plátanos', '3 aguacates', 'Limones']);
    const prices = {};
    [a, b, c].forEach(x => x.items.forEach(i => { if (i.price != null) prices[norm(i.text)] = i.price; }));
    return { v: 2, supers: [a, b, c], history: [], prices, activeSuperId: a.id, tab: 'list', historyFilter: 'all' };
  }
  /** v2: los súper cuyo nombre coincide con una cadena reciben su distintivo */
  function migrate(st) {
    if ((st.v || 1) < 2) {
      for (const x of [...st.supers, ...st.history]) {
        if (x.brand === undefined && !x.img) {
          x.brand = brandFor(x.name);
          if (x.brand && st.supers.includes(x)) x.color = BRANDS[x.brand].color;
        }
      }
      st.v = 2;
    }
    return st;
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.supers) && s.supers.length) return migrate({ history: [], prices: {}, tab: 'list', historyFilter: 'all', ...s });
    } catch (_) {}
    return seed();
  }
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  save(); // persiste migraciones de versiones anteriores

  const getSuper = id => state.supers.find(s => s.id === id);
  /** Último precio conocido de cada artículo, para sugerirlo la próxima vez */
  const knownPrice = text => (state.prices || {})[norm(text)] ?? null;
  function rememberPrice(text, price) {
    state.prices = state.prices || {};
    if (price != null) state.prices[norm(text)] = price;
    else delete state.prices[norm(text)];
  }
  const activeSuper = () => getSuper(state.activeSuperId) || state.supers[0];

  /* ============ Render: general ============ */
  function render() {
    renderTabs();
    renderList();
    renderSupers();
    renderHistory();
  }

  function renderTabs() {
    const s = activeSuper();
    document.documentElement.style.setProperty('--accent', s.color);
    $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === state.tab));
    $$('.tab').forEach(t => {
      const on = t.dataset.tab === state.tab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-current', on ? 'page' : 'false');
    });
    $('#composer').classList.toggle('hidden', state.tab !== 'list');
    const pending = s.items.filter(i => !i.done).length;
    $('#badge-list').textContent = state.tab !== 'list' && pending ? pending : '';
  }

  /* ============ Render: lista ============ */
  let lastListSuper = null;

  function itemHTML(it) {
    return `<li class="item${it.done ? ' done' : ''}" data-id="${it.id}">
      <button class="item-main" data-action="toggle" aria-pressed="${it.done}">
        <span class="check"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" pathLength="1"/></svg></span>
        <span class="label-wrap"><span class="label"><span class="text">${esc(it.text)}</span><svg class="strike" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path d="${STRIKE_PATH}" pathLength="1"/></svg></span></span>
        ${it.qty ? `<span class="qty">${esc(it.qty)}</span>` : ''}
        ${it.price != null ? `<span class="price">${money(it.price)}</span>` : ''}
      </button>
      <button class="edit" data-action="edit" aria-label="Editar ${esc(it.text)}">${ICON.pencil}</button>
    </li>`;
  }

  function updateListHeader(s) {
    const total = s.items.length;
    const done = s.items.filter(i => i.done).length;
    $('#progress-fill').style.width = total ? `${(done / total) * 100}%` : '0%';
    $('#progress-text').textContent = `${done}/${total}`;
    $('#f-total').textContent = total;
    const est = s.items.reduce((a, i) => a + (i.price || 0), 0);
    const cart = s.items.filter(i => i.done).reduce((a, i) => a + (i.price || 0), 0);
    $('#f-done').textContent = cart ? `${done} · ${money(cart)}` : done;
    $('#f-est').textContent = money(est);
    $('#f-est-row').hidden = !est;
    $('#f-left').textContent = total - done;
  }

  function renderList() {
    const s = activeSuper();
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
    $('#list-eyebrow').textContent = `Tu lista · ${today}`;
    $('#list-title').innerHTML = `<span class="title-emoji">${ico(s)}</span><span>${esc(s.name)}</span>`;

    $('#super-chips').innerHTML = state.supers.map(x => {
      const n = x.items.filter(i => !i.done).length;
      return `<button class="chip${x.id === s.id ? ' active' : ''}" style="--c:${x.color}" data-action="select-super" data-id="${x.id}" aria-pressed="${x.id === s.id}">
        <span class="chip-ico">${ico(x)}</span><span>${esc(x.name)}</span>${n ? `<span class="n">${n}</span>` : ''}</button>`;
    }).join('') + `<button class="chip add" data-action="new-super" aria-label="Nuevo súper">${ICON.plus}</button>`;

    const ticketNo = state.history.filter(h => h.superId === s.id).length + 1;
    $('#ticket-no').textContent = `Ticket Nº ${String(ticketNo).padStart(4, '0')}`;
    $('#ticket-date').textContent = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });

    updateListHeader(s);

    // FLIP: guardamos posiciones previas para animar la reordenación
    const ul = $('#items');
    const sameSuper = lastListSuper === s.id;
    const prev = new Map();
    if (sameSuper) $$('[data-id]', ul).forEach(el => prev.set(el.dataset.id, el.getBoundingClientRect().top));

    const pending = s.items.filter(i => !i.done);
    const checked = s.items.filter(i => i.done);
    let html = pending.map(itemHTML).join('');
    if (checked.length) html += `<li class="divider" data-id="__divider">En el carro · ${checked.length}</li>` + checked.map(itemHTML).join('');
    ul.innerHTML = html;
    $('#list-empty').hidden = s.items.length > 0;

    if (sameSuper && !reducedMotion()) {
      $$('[data-id]', ul).forEach(el => {
        const top = prev.get(el.dataset.id);
        if (top == null) { if (prev.size || el.dataset.id !== '__divider') el.classList.add('enter'); return; }
        const dy = top - el.getBoundingClientRect().top;
        if (Math.abs(dy) > 1) el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.85,.25,1)' });
      });
    }
    lastListSuper = s.id;
  }

  /* ============ Render: supers ============ */
  function renderSupers() {
    const cur = activeSuper();
    $('#super-grid').innerHTML = state.supers.map(s => {
      const total = s.items.length;
      const pending = s.items.filter(x => !x.done);
      const past = state.history.filter(h => h.superId === s.id);
      const last = past[0];
      const est = pending.reduce((a, x) => a + (x.price || 0), 0);
      const meta = [
        total ? `${pending.length} pendiente${pending.length === 1 ? '' : 's'}` : 'Lista vacía',
        est ? `≈ ${money(est)}` : '',
        last ? `última compra ${ago(last.completedAt)}` : 'sin compras aún',
      ].filter(Boolean).join(' · ');
      const preview = pending.slice(0, 4).map(x => x.text).join(' · ') + (pending.length > 4 ? ` +${pending.length - 4}` : '');
      return `<article class="super-card${s.id === cur.id ? ' current' : ''}" style="--c:${s.color}" data-id="${s.id}">
        <button class="grip" aria-label="Mover ${esc(s.name)} (flechas arriba y abajo)" title="Arrastra para ordenar">${ICON.grip}</button>
        <button class="super-open" data-action="open-super">
          <span class="s-emoji">${ico(s)}</span>
          <span class="s-info">
            <strong>${esc(s.name)}${s.id === cur.id ? '<span class="s-tag">Activa</span>' : ''}</strong>
            <small>${meta}</small>
            ${preview ? `<small class="s-preview">${esc(preview)}</small>` : ''}
          </span>
        </button>
        <button class="edit" data-action="edit-super" aria-label="Editar ${esc(s.name)}">${ICON.pencil}</button>
        <div class="s-bar"><span style="width:${total ? ((total - pending.length) / total) * 100 : 0}%"></span></div>
      </article>`;
    }).join('') + `<button class="super-new" data-action="new-super">${ICON.plus}<span>Nuevo supermercado</span></button>`;
  }

  /* ============ Render: histórico ============ */
  const openReceipts = new Set();

  function renderHistory() {
    const seen = new Map();
    state.history.forEach(h => { if (!seen.has(h.superId)) seen.set(h.superId, getSuper(h.superId) || h); });
    if (state.historyFilter !== 'all' && !seen.has(state.historyFilter)) state.historyFilter = 'all';

    $('#history-filters').innerHTML = state.history.length
      ? `<button class="chip${state.historyFilter === 'all' ? ' active' : ''}" style="--c:var(--ink)" data-action="history-filter" data-id="all">Todas<span class="n">${state.history.length}</span></button>` +
        [...seen].map(([id, s]) => {
          const n = state.history.filter(h => h.superId === id).length;
          return `<button class="chip${state.historyFilter === id ? ' active' : ''}" style="--c:${s.color}" data-action="history-filter" data-id="${id}"><span class="chip-ico">${ico(s)}</span>${esc(s.name)}<span class="n">${n}</span></button>`;
        }).join('')
      : '';

    const list = state.history.filter(h => state.historyFilter === 'all' || h.superId === state.historyFilter);
    const spent = h => h.amount || h.estimate || 0;
    const sum = arr => arr.reduce((a, h) => a + spent(h), 0);
    const usesEstimate = list.some(h => !h.amount && h.estimate);
    const thisMonth = monthKey(Date.now());

    $('#history-stats').innerHTML = state.history.length ? `
      <div class="stat stat-main"><b>${money(sum(list.filter(h => monthKey(h.completedAt) === thisMonth)))}</b><span>Este mes</span></div>
      <div class="stat"><b>${money(sum(list))}</b><span>Total</span></div>
      <div class="stat"><b>${list.length}</b><span>Tickets</span></div>
      ${usesEstimate ? '<p class="stats-note">≈ Incluye el coste estimado de los tickets sin importe</p>' : ''}` : '';

    if (!list.length) {
      $('#history-list').innerHTML = `<div class="history-empty">
        <div class="empty-art">🧾</div>
        <h3>Aún no hay tickets</h3>
        <p>Cuando taches todos los artículos de una lista, se guardará aquí automáticamente.</p></div>`;
      return;
    }

    const byMonth = new Map();
    list.forEach(h => { const k = monthKey(h.completedAt); byMonth.set(k, (byMonth.get(k) || 0) + spent(h)); });

    let html = '', month = null;
    for (const h of list) {
      const k = monthKey(h.completedAt);
      if (k !== month) {
        month = k;
        const label = new Date(h.completedAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        html += `<div class="month"><span>${esc(label)}</span><i></i>${byMonth.get(k) ? `<b>${money(byMonth.get(k))}</b>` : ''}</div>`;
      }
      const s = getSuper(h.superId) || h;
      const open = openReceipts.has(h.id);
      const n = h.items.length;
      html += `<article class="receipt${open ? ' open' : ''}" style="--c:${s.color}" data-id="${h.id}">
        <button class="receipt-head" data-action="history-toggle" aria-expanded="${open}">
          <span class="r-emoji">${ico(s)}${h.photo ? '<i class="r-cam" aria-label="con foto">📷</i>' : ''}</span>
          <span class="r-info"><strong>${esc(s.name)}</strong><small>${fmtDay(h.completedAt)} · ${fmtTime(h.completedAt)}${n ? ` · ${n} art.` : ''}</small></span>
          <span class="r-amount${h.amount ? '' : h.estimate ? ' est' : ' empty'}">${h.amount ? money(h.amount) : h.estimate ? `≈ ${money(h.estimate)}` : 'sin importe'}</span>
          ${ICON.chev}
        </button>
        <div class="receipt-body"><div class="receipt-inner">
          ${h.photo ? `<button class="r-photo" data-action="photo-view" aria-label="Ver foto del ticket"><img data-photo="${h.photo}" alt=""><span>${ICON.camera}Ver ticket</span></button>` : ''}
          ${n ? `<ul class="r-items">${h.items.map(i => `<li><span>${esc(i.text)}</span><span>${esc(i.qty)}${i.price != null ? `${i.qty ? ' · ' : ''}${money(i.price)}` : ''}</span></li>`).join('')}</ul>` : ''}
          <div class="r-actions">
            ${n ? `<button class="btn small primary grow" style="background:${s.color}" data-action="history-repeat">${ICON.repeat}Repetir</button>` : ''}
            <button class="btn small ghost${n ? '' : ' grow'}" data-action="ticket-edit">${ICON.receipt}${h.amount || h.photo ? 'Editar gasto' : 'Añadir gasto'}</button>
            <button class="btn small ghost danger" data-action="history-delete" aria-label="Borrar ticket">${ICON.trash}</button>
          </div>
        </div></div>
      </article>`;
    }
    $('#history-list').innerHTML = html;
    hydratePhotos($('#history-list'));
  }

  /* ============ Acciones: artículos ============ */
  let reorderTimer = null;

  function toggleItem(id, li) {
    const s = activeSuper();
    const it = s.items.find(i => i.id === id);
    if (!it) return;
    it.done = !it.done;
    save();
    li.classList.toggle('done', it.done);
    li.querySelector('.item-main').setAttribute('aria-pressed', it.done);
    vibrate(it.done ? 14 : 6);
    updateListHeader(s);
    clearTimeout(reorderTimer);
    reorderTimer = setTimeout(() => {
      render();
      if (s.items.length && s.items.every(i => i.done)) setTimeout(() => completeList(s.id), 250);
    }, 650);
  }

  function addItems(raw) {
    const s = activeSuper();
    const parts = raw.split(/[;\n]|,(?!\d)/).map(p => p.trim()).filter(Boolean);
    let added = 0, dupe = null;
    for (const p of parts) {
      const it = newItem(p);
      if (it.price == null) it.price = knownPrice(it.text);
      else rememberPrice(it.text, it.price);
      const existing = s.items.find(i => i.text.toLowerCase() === it.text.toLowerCase());
      if (existing) {
        if (existing.done) { existing.done = false; added++; }
        if (it.qty) existing.qty = it.qty;
        if (it.price != null) existing.price = it.price;
        dupe = existing;
        continue;
      }
      s.items.push(it);
      added++;
    }
    save();
    render();
    if (dupe && !added) {
      const el = $(`#items [data-id="${dupe.id}"]`);
      if (el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      toast(`«${dupe.text}» ya está en la lista`);
    } else if (parts.length > 1) {
      toast(`${added} artículos añadidos`);
    }
  }

  function deleteItem(superId, id) {
    const s = getSuper(superId);
    const idx = s.items.findIndex(i => i.id === id);
    if (idx < 0) return;
    const [removed] = s.items.splice(idx, 1);
    save();
    render();
    toast(`«${removed.text}» eliminado`, 'Deshacer', () => {
      s.items.splice(idx, 0, removed);
      save();
      render();
    });
  }

  /* ============ Completar lista → histórico ============ */
  function completeList(superId, onlyDone = false) {
    const s = getSuper(superId);
    if (!s) return;
    const doneItems = s.items.filter(i => i.done);
    if (!doneItems.length || (!onlyDone && doneItems.length !== s.items.length)) return;

    const entry = {
      id: uid(), superId: s.id, name: s.name, emoji: s.emoji, brand: s.brand || null, color: s.color,
      items: doneItems.map(({ text, qty, price }) => ({ text, qty, price: price ?? null })),
      estimate: doneItems.reduce((a, i) => a + (i.price || 0), 0) || null,
      completedAt: Date.now(),
    };
    const backup = s.items.slice();
    state.history.unshift(entry);
    s.items = s.items.filter(i => !i.done);
    save();
    render();
    celebrate(entry, s.items.length, () => {
      state.history = state.history.filter(h => h.id !== entry.id);
      s.items = backup;
      save();
      render();
    });
  }

  function celebrate(entry, leftover, onUndo) {
    const el = $('#celebrate');
    $('#c-title').textContent = `¡Compra en ${entry.name} terminada!`;
    $('#c-sub').textContent = `${entry.items.length} artículo${entry.items.length === 1 ? '' : 's'} guardado${entry.items.length === 1 ? '' : 's'} en tu histórico` +
      (leftover ? `. ${leftover} pendiente${leftover === 1 ? '' : 's'} se queda${leftover === 1 ? '' : 'n'} para la próxima.` : '.');
    el.classList.add('show');
    vibrate([20, 60, 30]);
    confetti(entry.color);

    const close = () => { el.classList.remove('show'); $('#c-undo').onclick = $('#c-ok').onclick = $('#c-ticket').onclick = null; };
    $('#c-ok').onclick = close;
    $('#c-ticket').onclick = () => { close(); openTicketSheet(entry.id); };
    $('#c-undo').onclick = () => { close(); onUndo(); toast('Lista recuperada'); };
    setTimeout(() => $('#c-ok').focus(), 50);
  }

  /* ============ Confeti ============ */
  function confetti(main) {
    if (reducedMotion()) return;
    const cv = $('#confetti');
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const palette = [main, main, ...COLORS];
    const shapes = ['rect', 'circle', 'strip'];
    const P = Array.from({ length: 160 }, () => ({
      x: W / 2 + (Math.random() - .5) * 80,
      y: H * .42,
      vx: (Math.random() - .5) * 15,
      vy: -Math.random() * 15 - 5,
      r: Math.random() * 6 + 4,
      a: Math.random() * Math.PI,
      va: (Math.random() - .5) * .35,
      c: palette[Math.floor(Math.random() * palette.length)],
      s: shapes[Math.floor(Math.random() * shapes.length)],
    }));
    const t0 = performance.now();
    (function frame(t) {
      const k = (t - t0) / 2600;
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.vy += .38; p.vx *= .985; p.vy *= .985;
        p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - k * k);
        ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.c;
        if (p.s === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2); ctx.fill(); }
        else if (p.s === 'strip') ctx.fillRect(-p.r, -1.5, p.r * 2, 3);
        else ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .7);
        ctx.restore();
      }
      if (k < 1) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    })(t0);
  }

  /* ============ Toast ============ */
  let toastTimer = null;
  function toast(msg, actionLabel = '', action = null) {
    const el = $('#toast');
    $('#toast-msg').textContent = msg;
    const btn = $('#toast-action');
    btn.textContent = actionLabel;
    btn.onclick = action ? () => { hide(); action(); } : null;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hide, action ? 5000 : 2600);
    function hide() { el.classList.remove('show'); btn.onclick = null; }
  }

  /* ============ Bottom sheet ============ */
  function openSheet(html, onMount) {
    const sheet = $('#sheet');
    sheet.innerHTML = html;
    $('#toast').classList.remove('show');
    $('#sheet-backdrop').classList.add('open');
    onMount && onMount(sheet);
  }
  function closeSheet() {
    $('#sheet-backdrop').classList.remove('open');
    document.activeElement && document.activeElement.blur();
  }

  /** Doble toque para confirmar acciones destructivas, sin diálogos nativos */
  function armConfirm(btn, label, fn) {
    if (btn.dataset.armed) return fn();
    btn.dataset.armed = '1';
    const original = btn.innerHTML;
    const labelEl = btn.querySelector('.mi-label') || btn;
    labelEl.textContent = label;
    btn.classList.add('armed');
    vibrate(8);
    setTimeout(() => {
      if (!btn.isConnected) return;
      delete btn.dataset.armed;
      btn.innerHTML = original;
      btn.classList.remove('armed');
    }, 2800);
  }

  function superRadios(selectedId, name = 'super') {
    return state.supers.map(x => `<label class="chip-radio"><input type="radio" name="${name}" value="${x.id}"${x.id === selectedId ? ' checked' : ''}>
      <span class="chip" style="--c:${x.color}"><span class="chip-ico">${ico(x)}</span>${esc(x.name)}</span></label>`).join('');
  }

  function openItemSheet(id) {
    const s = activeSuper();
    const it = s.items.find(i => i.id === id);
    if (!it) return;
    openSheet(`
      <h2 class="sheet-title">Editar artículo</h2>
      <form class="form" id="item-form">
        <div class="row">
          <label class="field"><span>Artículo</span><input type="text" name="text" value="${esc(it.text)}" required maxlength="80" autocomplete="off"></label>
          <label class="field"><span>Cantidad</span><input type="text" name="qty" value="${esc(it.qty)}" placeholder="2, 500 g…" maxlength="14" autocomplete="off"></label>
        </div>
        <label class="field"><span>Precio estimado</span>
          <span class="money-input small"><input type="text" name="price" inputmode="decimal" placeholder="0,00" value="${it.price != null ? (it.price / 100).toFixed(2).replace('.', ',') : ''}" maxlength="10" autocomplete="off"><em>€</em></span>
          <small class="field-hint">Lo que costará esta línea. Se recordará para la próxima vez.</small>
        </label>
        ${state.supers.length > 1 ? `<div class="field"><span>Comprar en</span><div class="chips wrap">${superRadios(s.id)}</div></div>` : ''}
        <div class="sheet-actions">
          <button type="button" class="btn ghost danger" id="item-delete">${ICON.trash}Eliminar</button>
          <button type="submit" class="btn primary grow">Guardar</button>
        </div>
      </form>`, sheet => {
      const form = $('#item-form', sheet);
      const input = form.elements.text;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      form.onsubmit = e => {
        e.preventDefault();
        const text = form.elements.text.value.trim();
        if (!text) return input.focus();
        const rawPrice = form.elements.price.value.trim();
        const price = rawPrice ? parseMoney(rawPrice) : null;
        if (rawPrice && price == null) { form.elements.price.focus(); toast('Ese precio no parece válido'); return; }
        it.text = cap(text);
        it.qty = form.elements.qty.value.trim();
        it.price = price;
        rememberPrice(it.text, price);
        const target = form.elements.super ? form.elements.super.value : s.id;
        if (target !== s.id) {
          s.items = s.items.filter(i => i.id !== it.id);
          it.done = false;
          getSuper(target).items.push(it);
          toast(`Movido a ${getSuper(target).name}`);
        }
        save(); closeSheet(); render();
      };
      $('#item-delete', sheet).onclick = () => { closeSheet(); deleteItem(s.id, it.id); };
    });
  }

  function openSuperSheet(id) {
    const s = id ? getSuper(id) : null;
    let color = s ? s.color : COLORS[state.supers.length % COLORS.length];
    const emoji = s && s.emoji ? s.emoji : EMOJIS[(state.supers.length + 3) % EMOJIS.length];
    let customImg = s && s.img ? s.img : null;
    const icon = customImg ? 'img' : s && s.brand ? `brand:${s.brand}` : `emoji:${emoji}`;
    const swatches = [...COLORS];
    if (!swatches.includes(color)) swatches.unshift(color);
    const swatch = c => `<label><input type="radio" name="color" value="${c}"${c === color ? ' checked' : ''} aria-label="Color ${c}"><span style="--sw:${c}"></span></label>`;
    const imgOption = () => customImg ? `<label class="img-opt"><input type="radio" name="icon" value="img"${icon === 'img' ? ' checked' : ''}><span><img class="logo logo-img" src="${customImg}" alt="Imagen propia"></span></label>` : '';

    openSheet(`
      <h2 class="sheet-title">${s ? 'Editar supermercado' : 'Nuevo supermercado'}</h2>
      <form class="form" id="super-form">
        <div class="field"><span>Cadena</span><div class="brand-grid">${Object.keys(BRANDS).map(b => `
          <label><input type="radio" name="icon" value="brand:${b}"${icon === `brand:${b}` ? ' checked' : ''}><span>${logoHTML(b)}<small>${esc(BRANDS[b].name)}</small></span></label>`).join('')}
        </div></div>
        <label class="field"><span>Nombre</span><input type="text" name="name" value="${esc(s ? s.name : '')}" placeholder="p. ej. Carrefour Express, Mercado central…" required maxlength="30" autocomplete="off"></label>
        <div class="field"><span>O un icono</span>
          <div class="emoji-grid" id="emoji-grid">${imgOption()}${EMOJIS.map(e => `<label><input type="radio" name="icon" value="emoji:${e}"${icon === `emoji:${e}` ? ' checked' : ''}><span>${e}</span></label>`).join('')}</div>
          <button type="button" class="btn small ghost logo-pick" id="logo-pick">${ICON.camera}Usar imagen propia (logo de la galería)</button>
        </div>
        <div class="field"><span>Color</span><div class="color-grid" id="color-grid">${swatches.map(swatch).join('')}</div></div>
        <div class="sheet-actions">
          ${s && state.supers.length > 1 ? `<button type="button" class="btn ghost danger" id="super-delete">${ICON.trash}<span class="mi-label">Eliminar</span></button>` : ''}
          <button type="submit" class="btn primary grow">${s ? 'Guardar' : 'Crear'}</button>
        </div>
      </form>`, sheet => {
      const form = $('#super-form', sheet);
      const nameInput = form.elements.name;
      const brandNames = Object.values(BRANDS).map(b => b.name);
      const paint = () => { $('.btn.primary', form).style.background = form.elements.color.value; };
      const setColor = c => {
        let input = $(`#color-grid input[value="${c}"]`, form);
        if (!input) {
          $('#color-grid', form).insertAdjacentHTML('afterbegin', swatch(c));
          input = $(`#color-grid input[value="${c}"]`, form);
        }
        input.checked = true;
      };
      form.addEventListener('change', e => {
        const v = e.target.name === 'icon' ? e.target.value : '';
        if (v.startsWith('brand:')) {
          const b = BRANDS[v.slice(6)];
          // Rellena el nombre salvo que el usuario haya escrito uno propio
          if (!nameInput.value.trim() || brandNames.includes(nameInput.value.trim())) nameInput.value = b.name;
          setColor(b.color);
          vibrate(6);
        }
        paint();
      });
      paint();

      $('#logo-pick', sheet).onclick = () => pickPhoto(async file => {
        try {
          customImg = await makeLogo(file);
          $('.img-opt', form)?.remove();
          $('#emoji-grid', form).insertAdjacentHTML('afterbegin', imgOption());
          $('.img-opt input', form).checked = true;
        } catch (_) { toast('No se pudo leer la imagen'); }
      });

      form.onsubmit = e => {
        e.preventDefault();
        const name = nameInput.value.trim();
        if (!name) return nameInput.focus();
        const iv = form.elements.icon.value;
        const data = {
          name: cap(name),
          color: form.elements.color.value,
          brand: iv.startsWith('brand:') ? iv.slice(6) : null,
          img: iv === 'img' ? customImg : null,
          emoji: iv.startsWith('emoji:') ? iv.slice(6) : emoji,
        };
        if (s) Object.assign(s, data);
        else {
          const created = { id: uid(), ...data, items: [] };
          state.supers.push(created);
          state.activeSuperId = created.id;
          state.tab = 'list';
          setTimeout(() => $('#composer-input').focus(), 300);
        }
        save(); closeSheet(); render();
      };
      const del = $('#super-delete', sheet);
      if (del) del.onclick = () => armConfirm(del, '¿Seguro?', () => {
        state.supers = state.supers.filter(x => x.id !== s.id);
        if (state.activeSuperId === s.id) state.activeSuperId = state.supers[0].id;
        save(); closeSheet(); render();
        toast(`${s.name} eliminado`);
      });
    });
  }

  function openListMenu() {
    const s = activeSuper();
    const done = s.items.filter(i => i.done).length;
    const item = (id, icon, label, sub, cls = '', disabled = false) =>
      `<button class="menu-item ${cls}" id="${id}"${disabled ? ' disabled' : ''}><span class="mi-icon">${icon}</span><span><span class="mi-label">${label}</span><small>${sub}</small></span></button>`;
    openSheet(`
      <h2 class="sheet-title"><span class="chip-ico">${ico(s)}</span> ${esc(s.name)}</h2>
      <div class="menu">
        ${item('m-finish', ICON.flag, 'Terminar compra', done ? `Guarda ${done} tachado${done === 1 ? '' : 's'}; lo pendiente se queda` : 'Tacha algo primero', '', !done)}
        ${item('m-uncheck', ICON.undo, 'Desmarcar todo', 'Vuelve a poner todo como pendiente', '', !done)}
        ${item('m-clear-done', ICON.broom, 'Quitar tachados', 'Borra lo tachado sin guardarlo', '', !done)}
        ${item('m-empty', ICON.trash, 'Vaciar lista', 'Elimina todos los artículos', 'danger', !s.items.length)}
      </div>`, sheet => {
      $('#m-finish', sheet).onclick = () => { closeSheet(); completeList(s.id, true); };
      $('#m-uncheck', sheet).onclick = () => { s.items.forEach(i => { i.done = false; }); save(); closeSheet(); render(); };
      $('#m-clear-done', sheet).onclick = () => {
        const backup = s.items.slice();
        s.items = s.items.filter(i => !i.done); save(); closeSheet(); render();
        toast('Tachados eliminados', 'Deshacer', () => { s.items = backup; save(); render(); });
      };
      const empty = $('#m-empty', sheet);
      empty.onclick = () => armConfirm(empty, 'Toca otra vez para vaciar', () => {
        const backup = s.items.slice();
        s.items = []; save(); closeSheet(); render();
        toast('Lista vaciada', 'Deshacer', () => { s.items = backup; save(); render(); });
      });
    });
  }

  /* ============ Ticket: importe y foto ============ */
  function openTicketSheet(entryId) {
    const h = entryId ? state.history.find(x => x.id === entryId) : null;
    const cur = activeSuper();
    let newPhoto = null, removePhoto = false, previewURL = null;
    const cents = h && h.amount ? (h.amount / 100).toFixed(2).replace('.', ',') : '';
    openSheet(`
      <h2 class="sheet-title">${h ? 'Gasto del ticket' : 'Registrar ticket'}</h2>
      ${h ? `<p class="sheet-sub"><span class="chip-ico">${ico(getSuper(h.superId) || h)}</span> ${esc(h.name)} · ${fmtDay(h.completedAt)} · ${fmtTime(h.completedAt)}</p>` : ''}
      <form class="form" id="ticket-form">
        ${h ? '' : `<div class="field"><span>Supermercado</span><div class="chips wrap">${superRadios(cur.id)}</div></div>`}
        <label class="field"><span>Importe total</span>
          <span class="money-input"><input type="text" name="amount" inputmode="decimal" placeholder="0,00" value="${cents}" maxlength="12" autocomplete="off"><em>€</em></span>
          ${h && h.estimate ? `<button type="button" class="est-chip" id="use-est">Usar el estimado de la lista: ${money(h.estimate)}</button>` : ''}
        </label>
        <div class="field"><span>Foto del ticket</span><div id="photo-slot"></div></div>
        <div class="sheet-actions"><button type="submit" class="btn primary grow">Guardar</button></div>
      </form>`, sheet => {
      const form = $('#ticket-form', sheet);
      const slot = $('#photo-slot', sheet);
      const paint = async () => {
        let src = null;
        if (newPhoto) {
          if (previewURL) URL.revokeObjectURL(previewURL);
          src = previewURL = URL.createObjectURL(newPhoto);
        } else if (h && h.photo && !removePhoto) src = await photoURL(h.photo);
        slot.innerHTML = src
          ? `<div class="photo-preview"><img src="${src}" alt="Foto del ticket">
              <div class="photo-btns"><button type="button" class="btn small ghost" data-p="pick">${ICON.camera}Cambiar</button>
              <button type="button" class="btn small ghost danger" data-p="remove">${ICON.trash}Quitar</button></div></div>`
          : `<button type="button" class="photo-pick" data-p="pick">${ICON.camera}<span><b>Hacer foto o elegir de la galería</b><small>Se guarda reducida en tu móvil</small></span></button>`;
      };
      slot.onclick = e => {
        const b = e.target.closest('[data-p]');
        if (!b) return;
        if (b.dataset.p === 'remove') { newPhoto = null; removePhoto = true; paint(); return; }
        pickPhoto(async file => {
          slot.classList.add('loading');
          try { newPhoto = await compressImage(file); removePhoto = false; }
          catch (_) { toast('No se pudo leer la imagen'); }
          slot.classList.remove('loading');
          paint();
        });
      };
      paint();
      const useEst = $('#use-est', sheet);
      if (useEst) useEst.onclick = e => { e.preventDefault(); form.elements.amount.value = (h.estimate / 100).toFixed(2).replace('.', ','); vibrate(6); };
      if (h && !h.amount) setTimeout(() => form.elements.amount.focus(), 380);

      form.onsubmit = async e => {
        e.preventDefault();
        const raw = form.elements.amount.value.trim();
        const amount = raw ? parseMoney(raw) : null;
        if (raw && amount == null) { form.elements.amount.focus(); toast('Ese importe no parece válido'); return; }
        const keepsPhoto = newPhoto || (h && h.photo && !removePhoto);
        if (!h && amount == null && !keepsPhoto) { toast('Añade el importe o una foto'); return; }

        let entry = h;
        if (!entry) {
          const s = getSuper(form.elements.super ? form.elements.super.value : cur.id) || cur;
          entry = { id: uid(), superId: s.id, name: s.name, emoji: s.emoji, brand: s.brand || null, color: s.color, items: [], completedAt: Date.now() };
          state.history.unshift(entry);
        }
        entry.amount = amount;
        try {
          if (newPhoto) {
            const id = uid();
            await photoDB.put(id, newPhoto);
            dropPhoto(entry.photo);
            entry.photo = id;
          } else if (removePhoto && entry.photo) {
            dropPhoto(entry.photo);
            entry.photo = null;
          }
        } catch (_) { toast('No se pudo guardar la foto'); }
        if (previewURL) URL.revokeObjectURL(previewURL);
        openReceipts.add(entry.id);
        save(); closeSheet(); render();
        toast(amount ? `Gasto de ${money(amount)} guardado` : 'Ticket guardado');
      };
    });
  }

  async function viewPhoto(id) {
    const url = await photoURL(id);
    if (!url) return toast('No se encuentra la foto');
    $('#viewer-img').src = url;
    $('#viewer').scrollTop = 0;
    $('#viewer').classList.add('show');
  }
  const closeViewer = () => $('#viewer').classList.remove('show');

  /* ============ Ordenar supers (arrastrar el asa ⠿ o flechas) ============ */
  function initSuperSorting() {
    const grid = $('#super-grid');
    grid.addEventListener('pointerdown', e => {
      const grip = e.target.closest('.grip');
      if (!grip || state.supers.length < 2) return;
      e.preventDefault();
      const card = grip.closest('.super-card');
      const cards = $$('.super-card', grid);
      const from = cards.indexOf(card);
      const mids = cards.map(c => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });
      const step = card.getBoundingClientRect().height + 12;
      const startY = e.clientY;
      let to = from;
      grip.setPointerCapture(e.pointerId);
      card.classList.add('dragging');
      grid.classList.add('sorting');
      vibrate(12);

      const move = ev => {
        const dy = ev.clientY - startY;
        card.style.transform = `translateY(${dy}px) scale(1.02)`;
        const y = mids[from] + dy;
        const next = mids.filter((m, i) => i !== from && m < y).length;
        if (next !== to) vibrate(5);
        to = next;
        cards.forEach((c, i) => {
          if (c === card) return;
          let shift = 0;
          if (from < to && i > from && i <= to) shift = -step;
          else if (from > to && i >= to && i < from) shift = step;
          c.style.transform = shift ? `translateY(${shift}px)` : '';
        });
      };
      const end = () => {
        grip.removeEventListener('pointermove', move);
        grip.removeEventListener('pointerup', end);
        grip.removeEventListener('pointercancel', end);
        grid.classList.remove('sorting');
        if (to !== from) {
          const [moved] = state.supers.splice(from, 1);
          state.supers.splice(to, 0, moved);
          save();
        }
        render();
      };
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', end);
      grip.addEventListener('pointercancel', end);
    });

    grid.addEventListener('keydown', e => {
      const grip = e.target.closest('.grip');
      if (!grip || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      e.preventDefault();
      const id = grip.closest('.super-card').dataset.id;
      const i = state.supers.findIndex(s => s.id === id);
      const j = i + (e.key === 'ArrowUp' ? -1 : 1);
      if (j < 0 || j >= state.supers.length) return;
      [state.supers[i], state.supers[j]] = [state.supers[j], state.supers[i]];
      save(); render();
      $(`#super-grid [data-id="${id}"] .grip`).focus();
    });
  }

  /* ============ Histórico: acciones ============ */
  function repeatHistory(id) {
    const h = state.history.find(x => x.id === id);
    if (!h) return;
    const target = getSuper(h.superId) || activeSuper();
    let added = 0;
    for (const i of h.items) {
      const ex = target.items.find(x => x.text.toLowerCase() === i.text.toLowerCase());
      if (ex) { ex.done = false; continue; }
      target.items.push({ id: uid(), text: i.text, qty: i.qty, price: knownPrice(i.text) ?? i.price ?? null, done: false });
      added++;
    }
    state.activeSuperId = target.id;
    state.tab = 'list';
    save(); render(); scrollTo({ top: 0 });
    toast(`${added || h.items.length} artículos de vuelta en ${target.name}`);
  }

  function deleteHistory(id) {
    const idx = state.history.findIndex(x => x.id === id);
    if (idx < 0) return;
    const [removed] = state.history.splice(idx, 1);
    save(); render();
    toast('Ticket eliminado', 'Deshacer', () => { state.history.splice(idx, 0, removed); save(); render(); });
    if (removed.photo) setTimeout(() => { if (!state.history.includes(removed)) dropPhoto(removed.photo); }, 6000);
  }

  /* ============ Eventos ============ */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const host = t.closest('[data-id]');
    const id = t.dataset.id || (host && host.dataset.id);

    switch (t.dataset.action) {
      case 'toggle': toggleItem(id, host); break;
      case 'edit': openItemSheet(id); break;
      case 'list-menu': openListMenu(); break;
      case 'select-super':
        if (state.activeSuperId === id) break;
        state.activeSuperId = id; save(); render();
        $(`#super-chips [data-id="${id}"]`).scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        break;
      case 'new-super': openSuperSheet(null); break;
      case 'edit-super': openSuperSheet(id); break;
      case 'open-super':
        state.activeSuperId = id; state.tab = 'list'; save(); render(); scrollTo({ top: 0 });
        break;
      case 'tab':
        if (state.tab === t.dataset.tab) { scrollTo({ top: 0, behavior: 'smooth' }); break; }
        state.tab = t.dataset.tab; save(); render(); scrollTo({ top: 0 });
        break;
      case 'history-filter': state.historyFilter = id; save(); renderHistory(); break;
      case 'history-toggle': {
        const open = !openReceipts.has(id);
        open ? openReceipts.add(id) : openReceipts.delete(id);
        host.classList.toggle('open', open);
        t.setAttribute('aria-expanded', open);
        break;
      }
      case 'history-repeat': repeatHistory(id); break;
      case 'history-delete': deleteHistory(id); break;
      case 'ticket-new': openTicketSheet(null); break;
      case 'ticket-edit': openTicketSheet(id); break;
      case 'photo-view': { const h = state.history.find(x => x.id === id); if (h) viewPhoto(h.photo); break; }
      case 'viewer-close': closeViewer(); break;
    }
  });

  $('#composer').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#composer-input');
    const v = input.value.trim();
    if (!v) { input.focus(); return; }
    addItems(v);
    input.value = '';
    input.focus();
    vibrate(8);
  });

  $('#sheet-backdrop').addEventListener('click', e => { if (e.target.id === 'sheet-backdrop') closeSheet(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('#viewer').classList.contains('show')) closeViewer();
    else if ($('#celebrate').classList.contains('show')) $('#c-ok').click();
    else closeSheet();
  });
  window.addEventListener('storage', e => { if (e.key === KEY) { state = load(); render(); } });

  /* Botón «atrás» de Android: lo llama la app nativa. Devuelve true si lo ha gestionado. */
  window.cestaBack = () => {
    if ($('#viewer').classList.contains('show')) { closeViewer(); return true; }
    if ($('#celebrate').classList.contains('show')) { $('#c-ok').click(); return true; }
    if ($('#sheet-backdrop').classList.contains('open')) { closeSheet(); return true; }
    if (state.tab !== 'list') { state.tab = 'list'; save(); render(); scrollTo({ top: 0 }); return true; }
    return false;
  };

  /* ============ Init ============ */
  $$('[data-icon]').forEach(el => { el.innerHTML = ICON[el.dataset.icon] || ''; });
  initSuperSorting();
  render();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/CestaAndroid/.test(navigator.userAgent)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
