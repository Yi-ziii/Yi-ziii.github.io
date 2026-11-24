/* Always open a project at the very top (no browser scroll restoration), and the Web / PDF switch */
(function () {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const toTop = () => { if (!location.hash) { const r = document.documentElement, b = r.style.scrollBehavior; r.style.scrollBehavior = 'auto'; scrollTo(0, 0); r.style.scrollBehavior = b; } };
  toTop(); addEventListener('DOMContentLoaded', toTop); addEventListener('load', toTop);
  addEventListener('pageshow', e => { if (e.persisted) toTop(); });

  // pages exported from the Figma portfolio book: assets/<slug>/pdf/page-NN.webp (+ -sm), <slug>.pdf
  const PAGES = { center: 6, lookcoin: 8, harmony: 6, medimate: 6, mlog: 8 };
  const slug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  const n = PAGES[slug]; if (!n) return;

  function build() {
    const title = document.title.split('·')[0].trim();
    const sec = document.createElement('section'); sec.className = 'pdfview'; sec.setAttribute('aria-label', 'Portfolio boards');
    let lis = '';
    for (let i = 1; i <= n; i++) {
      const k = String(i).padStart(2, '0'), b = `assets/${slug}/pdf/page-${k}`;
      lis += `<li><img src="${b}-sm.jpg" srcset="${b}-sm.jpg 1250w, ${b}.jpg 2500w" sizes="(min-width: 1800px) 1800px, 100vw" loading="${i < 3 ? 'eager' : 'lazy'}" alt="Portfolio page ${i} of ${n}" data-zoom="${b}.jpg" data-group="pdf-${slug}" data-cap="${title.trim()} · page ${i}/${n}"><span class="pg">${k} / ${String(n).padStart(2, '0')}</span></li>`;
    }
    sec.innerHTML = `<div class="pdf-head"><h1>${title.trim()}</h1><div class="pdf-actions"><span class="mono"><b>${n}</b> boards · click to zoom</span><a class="pdf-dl" href="assets/${slug}/pdf/${slug}.pdf" download>Download PDF ↓</a></div></div><ol class="pdf-pages">${lis}</ol>`;
    document.querySelector('main').after(sec);
  }

  function setMode(m, push) {
    if (m === 'pdf' && !document.querySelector('.pdfview')) build();
    document.body.classList.toggle('mode-pdf', m === 'pdf');
    document.querySelectorAll('.viewsw button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    try { sessionStorage.setItem('caseView', m); } catch (e) {}
    if (push) { const u = new URL(location.href); if (m === 'pdf') u.searchParams.set('view', 'pdf'); else u.searchParams.delete('view'); u.hash = ''; history.replaceState(null, '', u); }
    const r = document.documentElement, b = r.style.scrollBehavior; r.style.scrollBehavior = 'auto'; scrollTo(0, 0); r.style.scrollBehavior = b;
  }

  addEventListener('DOMContentLoaded', () => {
    const sw = document.createElement('div'); sw.className = 'viewsw'; sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', 'View as');
    sw.innerHTML = '<button type="button" data-mode="web">Interactive</button><button type="button" data-mode="pdf">Boards</button>';
    const head = document.querySelector('.top'); head.insertBefore(sw, head.querySelector('.menu'));
    sw.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode, true); });
    let m = new URLSearchParams(location.search).get('view');
    if (!m) { try { m = sessionStorage.getItem('caseView'); } catch (e) {} }
    setMode(m === 'pdf' ? 'pdf' : 'web', false);
  });
})();

/* Case-page behaviour: reading bar, chapter nav, reveal, board gallery, lightbox, lazy embeds */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // reading progress + chapter highlight
  const bar = $('.readbar'), links = $$('.c-nav a'), secs = links.map(a => $(a.getAttribute('href')));
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + Math.min(1, scrollY / Math.max(1, max)) + ')';
    let on = -1; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) on = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === on));
    // keep the active chapter visible inside the horizontal nav strip only —
    // never call scrollIntoView here, it would scroll the page and fight the user's wheel
    if (on !== lastOn) {
      lastOn = on;
      const act = links[on], strip = act && act.closest('ol');
      if (strip && strip.scrollWidth > strip.clientWidth) {
        const li = act.parentElement, l = li.offsetLeft, r = l + li.offsetWidth;
        if (l < strip.scrollLeft || r > strip.scrollLeft + strip.clientWidth) strip.scrollTo({ left: l - 24, behavior: 'smooth' });
      }
    }
  }
  let lastOn = -2;
  addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true }); onScroll();

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.reveal, .bars').forEach(e => io.observe(e));

  // boards: <div class="boards" data-proj="mlog" data-n="10" data-labels="a|b|c">
  $$('.boards').forEach(g => {
    const n = +g.dataset.n, p = g.dataset.proj, labels = (g.dataset.labels || '').split('|');
    for (let i = 1; i <= n; i++) {
      const k = String(i).padStart(2, '0'), b = document.createElement('button');
      b.innerHTML = `<img loading="lazy" src="assets/${p}/boards/thumb-${k}.webp" alt=""><span>${k} · ${labels[i - 1] || 'Board'}</span>`;
      b.dataset.zoom = `assets/${p}/boards/board-${k}.webp`; b.dataset.cap = `Original board ${k} — ${labels[i - 1] || ''}`; b.dataset.group = p;
      g.appendChild(b);
    }
  });

  // lightbox (any [data-zoom] or img.zoom)
  const lb = document.createElement('div'); lb.className = 'lb';
  lb.innerHTML = '<img alt=""><button class="x">Close ✕</button><button class="nav prev">←</button><button class="nav next">→</button><div class="cap"></div>';
  document.body.appendChild(lb);
  const lbImg = $('img', lb), cap = $('.cap', lb);
  let group = [], gi = 0;
  function open(list, i) { group = list; gi = i; show(); lb.classList.add('on'); document.body.style.overflow = 'hidden'; }
  function show() { const it = group[gi]; lb.classList.remove('zoom'); lbImg.src = it.src; cap.textContent = it.cap + (group.length > 1 ? `   ·   ${gi + 1}/${group.length}   ·   click to zoom` : '   ·   click to zoom'); $$('.nav', lb).forEach(n => n.style.display = group.length > 1 ? '' : 'none'); }
  function close() { lb.classList.remove('on'); document.body.style.overflow = ''; }
  function pan(e) { if (!lb.classList.contains('zoom')) return; const w = lbImg.offsetWidth, hh = lbImg.offsetHeight; lb.style.setProperty('--tx', -(w - innerWidth) * (e.clientX / innerWidth) + 'px'); lb.style.setProperty('--ty', -(hh - innerHeight) * (e.clientY / innerHeight) + 'px'); }
  lb.addEventListener('click', e => {
    if (e.target.closest('.x')) return close();
    if (e.target.closest('.prev')) { gi = (gi - 1 + group.length) % group.length; return show(); }
    if (e.target.closest('.next')) { gi = (gi + 1) % group.length; return show(); }
    lb.classList.toggle('zoom'); pan(e);
  });
  lb.addEventListener('pointermove', pan);
  addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') { gi = (gi + 1) % group.length; show(); } if (e.key === 'ArrowLeft') { gi = (gi - 1 + group.length) % group.length; show(); } });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-zoom], .fig img, .grid-figs img'); if (!t || t.closest('.lb') || t.closest('.p-screen')) return;
    e.preventDefault();
    const g = t.dataset.group;
    const items = (g ? $$(`[data-group="${g}"]`) : [t]).map(x => ({ src: x.dataset.zoom || x.currentSrc || x.src, cap: x.dataset.cap || x.alt || (x.closest('figure') && x.closest('figure').querySelector('figcaption') ? x.closest('figure').querySelector('figcaption').textContent : '') }));
    open(items, g ? $$(`[data-group="${g}"]`).indexOf(t) : 0);
  });

  // lazy embeds: <div class="embed"><div class="bar">…</div><a class="cover-play" data-src="…"><img><span>Play</span></a></div>
  $$('.cover-play').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); const f = document.createElement('iframe'); f.src = a.dataset.src; f.title = a.dataset.title || 'Live prototype'; f.allow = 'fullscreen'; a.replaceWith(f);
  }));
})();
