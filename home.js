/* Yihan Zeng — homepage
   Left: project names (scroll or hover to select). Right: sticky preview + details.
   Edit project text here; everything on the page is generated from this list. */
const PROJECTS = [
  {
    slug: 'center', title: 'Should Humans Remain at the Center?', ratio: 1.603,
    category: 'Interactive installation',
    summary: 'An interactive installation that starts from a debate that went viral online: in a burning museum, would you save a famous painting or a cat? Four handmade sculptures, standing for animals, nature, the unborn and AI, ask visitors questions out loud, and each spoken yes or no shows how far they will move away from the human center.',
    meta: [['Format', 'Individual project'], ['Date', '2025.06 – 2025.10']],
    live: 'center-experience/'
  },
  {
    slug: 'lookcoin', title: 'LookCoin', ratio: 1.685,
    category: 'Speculative design',
    summary: 'A near future in which smart glasses verify where we look, and human attention is measured, priced and paid for in its own currency. Through a fictional company, its glasses and app, and a city where looking pays, the project pushes today’s attention economy one step further and makes visible what we already trade every time we look.',
    meta: [['Format', 'Individual project'], ['Date', '2026.07 – 2026.10']],
    live: 'lookcoin-city/'
  },
  {
    slug: 'harmony', title: 'Harmony Osteria', ratio: 1.444,
    category: 'Spatial & service design',
    summary: 'A restaurant in the hills behind Genoa whose menu follows real wildlife data, so every meal becomes a signal of ecological change. An e-ink menu, the plates and a glass wall let diners read how the wild is doing today.',
    meta: [['Format', 'Individual project'], ['Date', '2026.10 – 2026.11']],
    live: 'harmony-osteria/'
  },
  {
    slug: 'medimate', title: 'MediMate', ratio: 1.039, fit: 'side',
    category: 'Health interaction & game design',
    summary: 'A medication-history app and a playable game about antibiotic misuse, made for the Art for 2030 program of the UNESCO Youth Education Research Centre. It is aimed at people who reuse antibiotics to recover fast, and makes resistance visible and personal so they pause and check before taking another dose.',
    meta: [['Format', 'Group project · 5 members'], ['Date', '2026.07'], ['My role', 'Game programming, low-fidelity app flows, survey analysis']],
    live: 'medimate-game/'
  },
  {
    slug: 'mlog', title: 'MLOG', ratio: 1.5,
    category: 'Product & system design',
    summary: 'A wearable badge system that replaces passive workplace surveillance with work logs that employees start themselves. A badge, an employee app and a manager dashboard make work visible, while managers only see the records an employee has reviewed and confirmed.',
    meta: [['Format', 'Individual project'], ['Date', '2025.11 – 2026.04']],
    live: ''
  }
];

const $ = (s, r = document) => r.querySelector(s);
const desktop = matchMedia('(min-width: 901px)');
const pad = n => String(n).padStart(2, '0');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* ---------- build ---------- */
const listEl = $('#works');
const stage = $('#stage');
const info = $('#info');

PROJECTS.forEach((p, i) => {
  // left: name
  const li = document.createElement('li');
  li.innerHTML =
    `<a class="work work-${p.slug}" href="${p.slug}.html" data-i="${i}">` +
      `<span class="work-meta"><b>${pad(i + 1)}</b>${esc(p.category)}</span>` +
      `<span class="work-name">${p.slug === 'center' ? 'Should Humans Remain<br>at the Center?' : esc(p.title)}</span>` +
    `</a>` +
    // mobile-only detail (hidden on desktop)
    `<div class="m-detail">` +
      `<a href="${p.slug}.html" class="m-pic" style="--r:${p.ratio}"><img src="assets/${p.slug}/images/home.jpg" alt="" loading="lazy"></a>` +
      `<p>${esc(p.summary)}</p>` +
      `<a class="cta" href="${p.slug}.html">View project <i>→</i></a>` +
    `</div>`;
  listEl.appendChild(li);

  // right: picture layer
  const layer = document.createElement('div');
  layer.className = 'layer';
  layer.innerHTML =
    `<div class="pic${p.fit ? ' fit-' + p.fit : ''}" style="--r:${p.ratio}">` +
      `<img class="screen" src="assets/${p.slug}/images/${document.body.classList.contains('bgfull') && desktop.matches ? 'home-dots-bg' : 'home-dots'}.png" alt="">` +
      `<div class="lens"><img src="assets/${p.slug}/images/home.jpg" alt=""></div>` +
    `</div>`;
  stage.appendChild(layer);

  // right: info block
  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('aria-hidden', 'true');
  card.innerHTML =
    `<div class="card-top"><span class="count"><b>${pad(i + 1)}</b> / ${pad(PROJECTS.length)}</span><span>${esc(p.category)}</span></div>` +
    `<p class="summary">${esc(p.summary)}</p>` +
    `<dl class="facts${p.meta.length > 2 ? ' three' : ''}">${p.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` +
    `<div class="actions"><a class="cta" href="${p.slug}.html">View project <i>→</i></a>` +
    `</div>`;
  info.appendChild(card);
});

const links = [...document.querySelectorAll('.work')];
const layers = [...stage.children];
const cards = [...info.children];
let active = -1;

/* ---------- selection ---------- */
function select(i) {
  if (i === active) return;
  if (active > -1) {
    links[active].classList.remove('current');
    layers[active].classList.remove('current');
    cards[active].classList.remove('current');
    cards[active].setAttribute('aria-hidden', 'true');
  }
  links[i].classList.add('current');
  layers[i].classList.add('current');
  cards[i].classList.add('current');
  cards[i].setAttribute('aria-hidden', 'false');
  $('#progress b').textContent = pad(i + 1);
  document.documentElement.style.setProperty('--prog', (i + 1) / PROJECTS.length);
  active = i;
}

// on phones the list is a plain stack; on desktop a project is chosen by clicking its name
links.forEach((a, i) => {
  a.addEventListener('click', e => {
    if (!desktop.matches) return;               // phones: the link opens the project directly
    if (i !== active) { e.preventDefault(); select(i); }   // first click selects, second click opens
  });
  a.addEventListener('focus', () => { if (a.matches(':focus-visible')) select(i); });
});

/* keyboard: ↑ ↓ to move between projects, Enter opens */
addEventListener('keydown', e => {
  if (!desktop.matches || e.target.closest('input,textarea')) return;
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const next = Math.max(0, Math.min(PROJECTS.length - 1, active + (e.key === 'ArrowDown' ? 1 : -1)));
  if (next === active && active !== -1) return;
  e.preventDefault();
  links[next].scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  select(next);
});

/* ---------- lens: reveal the colour photo under the cursor ---------- */
let frame = 0, px = 0, py = 0;
const lensTarget = document.body.classList.contains('bgfull') && desktop.matches ? document : stage;
lensTarget.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  px = e.clientX; py = e.clientY;
  if (!frame) frame = requestAnimationFrame(() => {
    frame = 0;
    const pic = layers[active] && layers[active].firstElementChild;
    if (!pic) return;
    const r = pic.getBoundingClientRect();
    pic.style.setProperty('--x', (px - r.left) + 'px');
    pic.style.setProperty('--y', (py - r.top) + 'px');
    stage.classList.add('tracking');
  });
}, { passive: true });
(lensTarget === document ? document.documentElement : stage).addEventListener('pointerleave', () => stage.classList.remove('tracking'));
$('#stage-link').addEventListener('click', () => { if (!document.body.classList.contains('bgfull')) location.href = PROJECTS[active].slug + '.html'; });

/* ---------- arrive with ?project=slug (from “All projects” on case pages) ---------- */
addEventListener('pageshow', () => {
  const slug = new URLSearchParams(location.search).get('project');
  const i = PROJECTS.findIndex(p => p.slug === slug);
  if (i > -1) { links[i].scrollIntoView({ block: 'center' }); select(i); }
  if (active < 0) select(0);
});
select(0);

/* ---------- header: highlight the section in view ---------- */
const navLinks = [...document.querySelectorAll('.menu a')];
const sections = [['top', $('.split')], ['about', $('#about')], ['contact', $('#contact')]];
function markNav() {
  const y = innerHeight * 0.45;
  let id = 'top';
  sections.forEach(([key, el]) => { if (el.getBoundingClientRect().top <= y) id = key; });
  navLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
}
addEventListener('scroll', () => requestAnimationFrame(markNav), { passive: true });
markNav();
