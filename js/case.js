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
