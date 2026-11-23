/* The glass wall. Lower row: every plate served moves the row one pane toward the round end (no re-sweep);
   the new pane shows that dish's wild species today (dark = too few, white = too many),
   and a projector under the glass head prints that species on the pane: dark lines on white,
   white lines on dark, as strong as the degree. A clear pane catches no print.
   Upper band: the species' whole record, refreshed left to right. */
(function () {
  const sign = d => (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d);
  const NS = GEO.nStrips, HALF = NS / 2, idx = k => k < HALF ? k : NS - 1 - k;
  function rng(seed) { let s = 7; for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }
  function interpLog(pts, yrs) {
    const L = x => Math.log(1 + x * 365); pts = [...pts].sort((p, q) => q[0] - p[0]);
    if (yrs >= pts[0][0]) return pts[0][1]; if (yrs <= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    for (let i = 0; i < pts.length - 1; i++) { const [a0, v0] = pts[i], [a1, v1] = pts[i + 1]; if (yrs <= a0 && yrs >= a1) { const t = (L(a0) - L(yrs)) / (L(a0) - L(a1)); return v0 + (v1 - v0) * t } } return 0
  }
  function ageDays(sp, k) { const i = idx(k), T = RECORD[sp][0] * 365.25; return i === 0 ? 0 : Math.exp(Math.log(T) * (i - 1) / (HALF - 2)) }
  function history(sp, today) {
    const r = rng(sp), pts = RECORD[sp][1], N = NS / 2, ph = [r() * 6.28, r() * 6.28, r() * 6.28];
    let h = Array.from({ length: N }, (_, k) => {
      if (k === 0) return today; const y = ageDays(sp, k) / 365.25, L = Math.log(1 + y * 365);
      let v = interpLog(pts, y) * 0.45 + 48 * Math.sin(L * 1.9 + ph[0]) + 28 * Math.sin(L * 4.3 + ph[1]) + 18 * Math.sin(L * 9.1 + ph[2]) + (r() - .5) * 70;
      if (k <= 2) v = v + (today - v) * (k === 1 ? .6 : .3); return v
    });
    const rest = h.slice(1).sort((p, q) => p - q), med = rest[Math.floor(rest.length / 2)];
    h = h.map((v, k) => k === 0 ? v : v - med * 0.8);
    return h.map(v => Math.max(-100, Math.min(100, Math.round(v / 10) * 10)))
  }
  const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function ageLabel(d) {
    d = Math.round(d); const t = new Date(); t.setDate(t.getDate() - d);
    if (d === 0) return t.getDate() + ' ' + MON[t.getMonth()] + ' · TODAY';
    if (d < 45) return t.getDate() + ' ' + MON[t.getMonth()] + ' · ' + d + (d === 1 ? ' DAY' : ' DAYS') + ' AGO';
    if (d < 730) { const m = Math.round(d / 30.4); return MON[t.getMonth()] + ' ' + t.getFullYear() + ' · ' + m + (m === 1 ? ' MONTH' : ' MONTHS') + ' AGO' }
    const y = Math.round(d / 365.25); return t.getFullYear() + ' · ' + y + ' YEARS AGO'
  }
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const PRINT = { 'wild boar': 1, 'roe deer': 2, 'red deer': 3, 'chamois': 4, 'hare': 5, 'anchovy': 6, 'bluefin tuna': 7, 'swordfish': 8, 'blue crab': 9, 'wild chestnut': 10, 'pine nuts': 11 };
  const inkCache = {};
  function inked(img, rgb) {                       // the print mask, recoloured once per ink
    const key = img.src + rgb; if (inkCache[key]) return inkCache[key];
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d');
    x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = rgb; x.fillRect(0, 0, c.width, c.height); return (inkCache[key] = c)
  }
  const cache = {};
  function load(src) { if (!cache[src]) cache[src] = new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src }); return cache[src] }
  function blurCopy(img, W, H, k) {
    let a = document.createElement('canvas'); a.width = Math.round(W / k); a.height = Math.round(H / k); let x = a.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, a.width, a.height);
    let b = document.createElement('canvas'); b.width = a.width * 2; b.height = a.height * 2; b.getContext('2d').drawImage(a, 0, 0, b.width, b.height);
    let c = document.createElement('canvas'); c.width = W; c.height = H; const y = c.getContext('2d'); y.imageSmoothingQuality = 'high'; y.drawImage(b, 0, 0, W, H); return c
  }
  const layerCache = {};
  function makeLayers(img, outside) {
    const key = outside ? 'o' : 'i'; if (layerCache[key]) return layerCache[key];
    const W = img.naturalWidth, H = img.naturalHeight;
    const fr = blurCopy(img, W, H, 24), fx = fr.getContext('2d'); fx.fillStyle = outside ? 'rgba(245,246,242,.93)' : 'rgba(251,251,248,.92)'; fx.fillRect(0, 0, W, H);
    const tn = document.createElement('canvas'); tn.width = W; tn.height = H; const tx = tn.getContext('2d'); tx.drawImage(img, 0, 0);
    tx.globalCompositeOperation = 'multiply'; tx.fillStyle = outside ? 'rgb(18,21,23)' : 'rgb(30,34,37)'; tx.fillRect(0, 0, W, H); tx.globalCompositeOperation = 'source-over';
    if (outside) { const g = tx.createLinearGradient(0, 0, W * .5, H); g.addColorStop(0, 'rgba(180,200,215,.16)'); g.addColorStop(.6, 'rgba(180,200,215,.03)'); g.addColorStop(1, 'rgba(180,200,215,.1)'); tx.fillStyle = g; tx.fillRect(0, 0, W, H) }
    return (layerCache[key] = { fr, tn })
  }
  function poly(ctx, p, dy) { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1] - dy); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1] - dy); ctx.closePath() }
  function inside(p, x, y) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) != (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }

  /* mount(root, {views:['out','in'], tip}) → api */
  window.GlassWall = function (root, opt = {}) {
    const views = opt.views || ['out', 'in'];
    const mk = n => Array.from({ length: n }, () => ({ v: 0, from: 0, to: 0, t0: 0, t1: 0 }));
    const S = { up: mk(NS), low: mk(15) }, V = {};
    let plates = [], lastSp = null, anim = 0, cur = views[0], ready = false, queue = [];
    root.classList.add('glass');
    const els = {};
    for (const w of views) {
      const d = document.createElement('div'); d.className = 'glass-view ' + w + (w === cur ? '' : ' off');
      const c = document.createElement('canvas'); d.appendChild(c); root.appendChild(d); els[w] = { d, c }
    }
    const tip = opt.tip || null;
    function setPane(p, to, delay, dur) { const now = performance.now(); p.from = p.v; p.to = to; p.t0 = now + delay; p.t1 = now + delay + dur; kick() }
    function step(now) {
      let busy = false; for (const arr of [S.up, S.low]) for (const p of arr) {
        if (now < p.t0) { busy = true; continue }
        if (now >= p.t1) p.v = p.to; else { busy = true; p.v = p.from + (p.to - p.from) * ease((now - p.t0) / (p.t1 - p.t0)) }
      } return busy
    }
    function kick() { if (!anim) anim = requestAnimationFrame(loop) }
    function loop(now) { const busy = step(now); draw(); anim = busy ? requestAnimationFrame(loop) : 0 }
    function paint(ctx, L, p, v, dy) { if (Math.abs(v) < .5) return; ctx.save(); poly(ctx, p, dy); ctx.clip(); ctx.globalAlpha = Math.abs(v) < 3 ? 0 : Math.min(1, .1 + .9 * Math.abs(v) / 100); ctx.drawImage(v < 0 ? L.tn : L.fr, 0, 0); ctx.restore() }
    function print(ctx, p, pl, v, dy) {
      if (!pl || Math.abs(v) < 6) return; const im = prints[PRINT[pl.sp]]; if (!im) return;
      const ink = inked(im, v > 0 ? 'rgb(52,42,32)' : 'rgb(250,248,240)');
      const bot = [p[0], p[1]].sort((a, b) => a[0] - b[0]), top = [p[2], p[3]].sort((a, b) => a[0] - b[0]);
      const o = [top[0][0], top[0][1] - dy], ux = top[1][0] - top[0][0], uy = top[1][1] - top[0][1], vx = bot[0][0] - top[0][0], vy = bot[0][1] - top[0][1];
      const pw = Math.hypot(ux, uy), ph = Math.hypot(vx, vy), iw = ink.width, ih = ink.height;
      const k = Math.min(pw * .78 / iw, ph * .62 / ih), w = iw * k / pw, h = ih * k / ph, x0 = (1 - w) / 2, y0 = .55 - h / 2;
      ctx.save(); poly(ctx, p, dy); ctx.clip();
      ctx.globalAlpha = Math.min(1, Math.abs(v) / 100) * .9;
      ctx.setTransform(ux, uy, vx, vy, o[0], o[1]); ctx.drawImage(ink, x0, y0, w, h);
      ctx.restore()
    }
    function drawView(w) {
      const v = V[w]; if (!v) return; const g = GEO[v.key], ctx = v.ctx, dy = v.dy; ctx.drawImage(v.img, 0, 0);
      g.up.forEach(s => paint(ctx, v.L, s.p, S.up[s.k].v, dy));
      v.lowOrd.forEach((pi, slot) => { paint(ctx, v.L, g.low[pi], S.low[slot].v, dy); print(ctx, g.low[pi], plates[slot], S.low[slot].v, dy) });   // slot 0 = leftmost pane on screen
      if (v.front) ctx.drawImage(v.front, 0, 0);
      if (g.tlband && g.tlband.length) {
        ctx.save(); poly(ctx, g.tlband, dy); ctx.fillStyle = '#0c0d0d'; ctx.fill(); ctx.restore();
        if (lastSp) {
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = '500 14px "IBM Plex Mono",monospace';
          g.tl.filter(t => t.c[0] > 60 && t.c[0] < 2340).forEach((t, i) => { if (i % 3 !== 1) return; ctx.fillText(ageLabel(ageDays(lastSp, t.k)), t.c[0], t.c[1] - dy) })
        }
      }
      if (g.band && g.band.length) {                                                   // lower screen removed (11-13): a dark ledge with projectors
        const b = g.band; ctx.save(); poly(ctx, b, dy); ctx.fillStyle = '#16181a'; ctx.fill(); ctx.restore();
        const yb = b[0][1] - dy; ctx.fillStyle = '#0b0c0d';
        v.lowOrd.forEach((pi, slot) => { if (slot % 3 !== 1) return; const q = g.low[pi], cx = (q[2][0] + q[3][0]) / 2, w = Math.abs(q[2][0] - q[3][0]) * .42;
          ctx.fillRect(cx - w / 2, yb, w, w * .3); ctx.fillStyle = 'rgba(255,214,150,.55)'; ctx.fillRect(cx - w * .08, yb + w * .3 - 3, w * .16, 3); ctx.fillStyle = '#0b0c0d' })
      }
    }
    function draw() { views.forEach(drawView) }
    function serve(dish, t) {
      if (!ready) { queue.push([dish, t]); return }
      plates.unshift({ ...dish, t }); plates = plates.slice(0, 15);
      // 11-15: the lower row only moves one pane — older panes shift right as they are, no left-to-right re-sweep; only the new pane animates in
      for (let i = S.low.length - 1; i > 0; i--) { const a = S.low[i], b = S.low[i - 1]; a.v = a.from = a.to = b.to; a.t0 = a.t1 = 0 }
      const p0 = S.low[0]; p0.v = 0; setPane(p0, plates[0].d, 80, 420);
      if (dish.sp !== lastSp) {
        const h = history(dish.sp, dish.d), g = GEO[cur === 'out' ? 'ext' : 'int'], X = {};
        g.up.forEach(s => { X[s.k] = (s.p[0][0] + s.p[1][0] + s.p[2][0] + s.p[3][0]) / 4 });
        for (let k = 0; k < NS; k++) { const x = X[k]; const delay = x !== undefined ? Math.max(0, Math.min(2400, x)) / 2400 * 1600 : 1700 + idx(k) * 6; setPane(S.up[k], h[idx(k)], delay, 380) }
      }
      lastSp = dish.sp; if (opt.onServe) opt.onServe(dish, plates.length)
    }
    function show(w) { cur = w; for (const k in els) els[k].d.classList.toggle('off', k !== w) }
    function reset() { plates = []; lastSp = null; S.up.forEach(p => setPane(p, 0, 0, 500)); S.low.forEach(p => setPane(p, 0, 0, 500)) }
    function hover(w, e) {
      if (!tip) return; const v = V[w], cv = v.cv, r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * cv.width, y = (e.clientY - r.top) / r.height * cv.height + v.dy, g = GEO[v.key]; let html = '';
      g.low.forEach((p, i) => { if (inside(p, x, y)) { const pl = plates[v.lowOrd.indexOf(i)]; html = pl ? `<b>${pl.it}</b><br><span class="mono">${pl.t} · ${pl.sp} ${sign(pl.d)}</span>` : `<span class="mono">waiting for a plate</span>` } });
      g.up.forEach(s => { if (inside(s.p, x, y)) { html = lastSp ? `<span class="mono">${lastSp} · ${ageLabel(ageDays(lastSp, s.k)).toLowerCase()} · ${sign(Math.round(S.up[s.k].v))}</span>` : '' } });
      if (html) { tip.innerHTML = html; tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; tip.style.opacity = 1 } else tip.style.opacity = 0
    }
    const prints = {}; for (let n = 1; n <= 11; n++) load('img/prints/' + String(n).padStart(2, '0') + '.png').then(im => { prints[n] = im; if (ready) draw() });
    Promise.all([load('img/outside.jpg'), load('img/inside.jpg'), views.includes('in') ? load('img/inside_front.png') : 0, document.fonts ? document.fonts.ready : 0]).then(([o, i, f]) => {
      for (const w of views) {
        const out = w === 'out', img = out ? o : i, cv = els[w].c; if (!img) continue;
        cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        const gk = GEO[out ? 'ext' : 'int'], cxOf = q => q.reduce((t, p) => t + p[0], 0) / q.length, key = q => { const x = cxOf(q); return x < 0 || x > 2400 ? 1e5 + x : x }, ord = arr => (arr || []).map((q, i) => i).sort((a, b) => key(arr[a]) - key(arr[b]));   // panes off the picture go last
        V[w] = { lowOrd: ord(gk.low), scrOrd: ord(gk.scr), key: out ? 'ext' : 'int', img, cv, ctx: cv.getContext('2d'), front: out ? null : f, L: makeLayers(img, out), dy: GEO.crop[out ? 'ext' : 'int'] };
        cv.addEventListener('mousemove', e => hover(w, e)); cv.addEventListener('mouseleave', () => tip && (tip.style.opacity = 0))
      }
      ready = true; draw(); const q = queue; queue = []; q.forEach(a => serve(...a));
      if (opt.onReady) opt.onReady()
    });
    return { serve, show, reset, get view() { return cur }, get count() { return plates.length } }
  };
  window.GlassUtil = { sign };
})();
