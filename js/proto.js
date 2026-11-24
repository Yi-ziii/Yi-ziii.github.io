/* Clickable prototype engine.
   <div class="proto" data-proto="KEY"></div>  +  window.PROTOS[KEY] = { ... }
   Screen hot areas are [x%, y%, w%, h%, target, label?, holdMs?]
   target: screen key, 'next', 'prev' or 'back' (history). */
(function () {
  const R = window.PROTOS || {};
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function frame(cfg) {
    const d = h('div', 'p-device dev-' + cfg.device + (cfg.noIsland ? ' no-island' : ''));
    if (cfg.ar) d.style.setProperty('--ar', cfg.ar);
    const screen = h('div', 'p-screen');
    if (cfg.device === 'browser') {
      const bar = h('div', 'bar', '<i></i><i></i><i></i><span>' + (cfg.url || '') + '</span>');
      d.appendChild(bar);
    }
    if (cfg.device === 'badge') {
      d.appendChild(h('div', 'lanyard'));
      d.appendChild(h('div', 'lightbar'));
    }
    d.appendChild(screen);
    return { d, screen };
  }

  function build(el) {
    const cfg = R[el.dataset.proto]; if (!cfg) return;
    const S = cfg.screens;
    const hasAlt = Object.values(S).some(s => s.alt);
    let mode = cfg.mode || 'a';       // 'a' = primary set, 'b' = alt set (e.g. hi-fi)
    let flowI = 0, cur = null, hist = [];
    if (cfg.wide) el.classList.add('wide');

    const { d, screen } = frame(cfg);
    const img = h('img'); img.alt = ''; img.draggable = false; screen.appendChild(img);
    const hotLayer = h('div'); hotLayer.style.cssText = 'position:absolute;inset:0'; screen.appendChild(hotLayer);
    const toast = h('div', 'toast'); screen.appendChild(toast);
    let gaze = null;
    if (cfg.device === 'hud') { gaze = h('div', 'gaze'); screen.appendChild(gaze); }

    const side = h('div', 'p-side');
    const flows = h('div', 'p-flows');
    const count = h('div', 'p-count');
    const title = h('h4', 'p-title');
    const note = h('p', 'p-note');
    const tags = h('div', 'p-tags');
    const ctrl = h('div', 'p-ctrl');
    const prev = h('button', '', '← Prev'), next = h('button', '', 'Next →'), show = h('button', '', 'Show tap areas');
    ctrl.append(prev, next, show);
    let seg = null;
    if (hasAlt) {
      seg = h('div', 'seg');
      const [la, lb] = cfg.modeLabels || ['Wireframe', 'Hi-fi'];
      seg.append(h('button', mode === 'a' ? 'on' : '', la), h('button', mode === 'b' ? 'on' : '', lb));
      [...seg.children].forEach((b, i) => b.onclick = () => setMode(i ? 'b' : 'a'));
      ctrl.appendChild(seg);
    }
    const help = h('p', 'p-help', cfg.help || 'Click the highlighted areas inside the screen, use ← → keys, or pick a screen below.');
    if (cfg.flows && cfg.flows.length > 1) side.appendChild(flows);
    side.append(count, title, note, tags, ctrl, help);
    const stripLabel = h('div', 'mono p-strip-label', cfg.stripLabel || 'All screens in this flow');
    const strip = h('div', 'p-strip');
    if (cfg.thumbW) strip.style.setProperty('--tw', cfg.thumbW + 'px');

    el.append(d, side);
    if (!cfg.noStrip) el.append(stripLabel, strip);

    const flowList = cfg.flows || [{ name: 'All', keys: Object.keys(S).filter(k => !Object.values(S).some(s => s.alt === k)) }];
    function resolve(k) { if (mode === 'b' && S[k] && S[k].alt) return S[k].alt; return k; }
    function base(k) { const p = Object.keys(S).find(x => S[x].alt === k); return p || k; }
    function flowOf(k) { const b = base(k); const i = flowList.findIndex(f => f.keys.includes(b)); return i < 0 ? flowI : i; }

    flowList.forEach((f, i) => { const b = h('button', '', f.name); b.onclick = () => go(f.keys[0], true); flows.appendChild(b); });

    function renderStrip() {
      strip.innerHTML = '';
      flowList[flowI].keys.forEach(k => {
        const rk = resolve(k), s = S[rk];
        const b = h('button', rk === cur ? 'on' : '');
        const t = h('img'); t.src = s.thumb || s.src; t.loading = 'lazy'; t.alt = '';
        b.append(t, h('span', '', s.short || s.title)); b.onclick = () => go(k, true);
        strip.appendChild(b);
      });
      const on = strip.querySelector('.on'); if (on) { const sr = strip.getBoundingClientRect(), br = on.getBoundingClientRect(); strip.scrollTo({ left: strip.scrollLeft + (br.left - sr.left) - (sr.width - br.width) / 2, behavior: 'smooth' }); }
    }

    let holdTimer = null, autoTimer = null;
    function clearTimers() { clearInterval(holdTimer); clearTimeout(autoTimer); }

    function say(t) { if (!t) return; toast.textContent = t; toast.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('on'), 2400); }

    function target(t) {
      const keys = flowList[flowI].keys, i = keys.indexOf(base(cur));
      if (t === 'next') return keys[Math.min(keys.length - 1, i + 1)];
      if (t === 'prev') return keys[Math.max(0, i - 1)];
      if (t === 'back') return hist.length ? base(hist.pop()) : keys[Math.max(0, i - 1)];
      return t;
    }

    function go(k, fromUI, noHist) {
      clearTimers();
      const rk = resolve(k); if (!S[rk]) return;
      if (cur && !noHist && rk !== cur) hist.push(cur);
      cur = rk; flowI = flowOf(rk);
      const s = S[rk];
      img.classList.add('fade');
      const pre = new Image(); pre.src = s.src;
      const swap = () => { img.src = s.src; img.classList.remove('fade'); };
      pre.complete ? setTimeout(swap, 120) : (pre.onload = () => setTimeout(swap, 60));
      // hot areas
      hotLayer.innerHTML = '';
      (s.hot || []).forEach(a => {
        const [x, y, w, hh, to, label, hold] = a;
        const b = h('button', 'hot');
        b.style.cssText = `left:${x}%;top:${y}%;width:${w}%;height:${hh}%`;
        b.setAttribute('aria-label', label || ('Go to ' + to));
        if (label) b.appendChild(h('span', 'tip', label));
        if (hold) {
          b.insertAdjacentHTML('beforeend', '<svg class="ring" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14"/></svg>');
          const start = () => {
            const t0 = performance.now(); b.classList.add('holding'); clearInterval(holdTimer);
            holdTimer = setInterval(() => {
              const p = Math.min(1, (performance.now() - t0) / hold); b.style.setProperty('--p', p);
              if (p >= 1) { clearInterval(holdTimer); b.classList.remove('holding'); fire(a); }
            }, 30);
          };
          const stop = () => { clearInterval(holdTimer); b.classList.remove('holding'); b.style.setProperty('--p', 0); };
          if (cfg.dwell) { b.addEventListener('pointerenter', start); b.addEventListener('pointerleave', stop); }
          b.addEventListener('pointerdown', start); b.addEventListener('pointerup', () => { if (!cfg.dwell) stop(); });
          b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(a); } });
        } else b.onclick = () => fire(a);
        hotLayer.appendChild(b);
      });
      if (s.auto) autoTimer = setTimeout(() => go(target(s.auto[1])), s.auto[0]);
      say(s.toast);
      // side panel
      const keys = flowList[flowI].keys, i = keys.indexOf(base(rk));
      [...flows.children].forEach((b, j) => b.classList.toggle('on', j === flowI));
      count.textContent = (flowList.length > 1 ? flowList[flowI].name + ' · ' : '') + String(i + 1).padStart(2, '0') + ' / ' + String(keys.length).padStart(2, '0');
      title.textContent = s.title; note.innerHTML = s.note || '';
      tags.innerHTML = (s.tags || []).map(t => '<span>' + t + '</span>').join('');
      prev.disabled = i <= 0 && flowI === 0; next.disabled = i >= keys.length - 1 && flowI === flowList.length - 1;
      if (seg) [...seg.children].forEach((b, j) => b.classList.toggle('on', (j ? 'b' : 'a') === mode));
      renderStrip();
      if (fromUI) { d.classList.remove('hint-pulse'); void d.offsetWidth; d.classList.add('hint-pulse'); }
      if (cfg.onChange) cfg.onChange(rk, el);
    }
    function fire(a) { if (a[7]) say(a[7]); go(target(a[4])); }
    function step(dir) {
      const keys = flowList[flowI].keys, i = keys.indexOf(base(cur));
      if (keys[i + dir]) return go(keys[i + dir], true);
      const nf = flowI + dir; if (flowList[nf]) go(dir > 0 ? flowList[nf].keys[0] : flowList[nf].keys.slice(-1)[0], true);
    }
    function setMode(m) { mode = m; go(base(cur), true, true); }

    prev.onclick = () => step(-1); next.onclick = () => step(1);
    show.onclick = () => { d.classList.toggle('show-hots'); show.textContent = d.classList.contains('show-hots') ? 'Hide tap areas' : 'Show tap areas'; };
    el.tabIndex = -1;
    el.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
    d.addEventListener('pointerenter', () => el.focus({ preventScroll: true }));
    if (gaze) screen.addEventListener('pointermove', e => { const r = screen.getBoundingClientRect(); gaze.style.left = (e.clientX - r.left) + 'px'; gaze.style.top = (e.clientY - r.top) + 'px'; });

    el._go = go;
    go(cfg.start || flowList[0].keys[0]);
    // pulse the tap areas once when the stage scrolls into view
    new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { d.classList.add('hint-pulse'); o.disconnect(); } }, { threshold: .5 }).observe(d);
  }

  document.querySelectorAll('.proto[data-proto]').forEach(build);
})();
