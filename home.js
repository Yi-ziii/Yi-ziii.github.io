/* Yihan Zeng — homepage
   Left: project names (scroll or hover to select). Right: sticky preview + details.
   Edit project text here; everything on the page is generated from this list. */
const PROJECTS = [
  {
    slug: 'center', title: 'Should Humans Remain at the Center?', ratio: 2.163,
    category: 'Interactive installation', medium: 'Sculpture, sensors & voice',
    question: 'Who gets to stand at the center?',
    summary: 'A participant stands between four handmade sculptures representing animals, nature, future generations and AI. Reaching toward one triggers a response — it moves, speaks and waits for a yes or no.',
    facts: ['205 survey responses', '4 sculptures', '3 rounds of questions'],
    steps: ['A small cost to me', 'A loss I can weigh', 'A risk to someone else'],
    prototype: true
  },
  {
    slug: 'lookcoin', title: 'LookCoin', ratio: 1.718,
    category: 'Speculative design', medium: 'Worldbuilding & browser interaction',
    question: 'What is a minute of looking worth?',
    summary: 'In a fictional 2035 city, smart glasses verify attention to street advertisements. One verified minute is one VAU, and the payout in LookCoin varies with the place and the viewer.',
    facts: ['Fictional city, 2035', 'Browser simulation', '360° street panoramas'],
    steps: ['Find a paid view', 'Hold your gaze', 'Let the city settle up'],
    prototype: true
  },
  {
    slug: 'harmony', title: 'Harmony Osteria', ratio: 1.5,
    category: 'Spatial & service design', medium: 'Space, tableware & adaptive glass',
    question: 'Can dinner make an ecosystem legible?',
    summary: 'A restaurant near Genoa brings wildlife observations into the dining room through the menu, the plate and a wall of glass, turning changes in animal activity into signals at the table.',
    facts: ['Genoa, Italy', 'Camera-trap data', 'Menu · plate · glass'],
    steps: ['Read the day’s menu', 'Read the plate', 'Read the glass'],
    prototype: true
  },
  {
    slug: 'medimate', title: 'MediMate', ratio: 0.973,
    category: 'Health interaction & game design', medium: 'Mobile app & educational game',
    question: 'What happens before someone reaches for leftover medicine?',
    summary: 'A medication history app and the playable game Inside Defense explore the moment someone decides to reuse antibiotics. I analysed the questionnaire, designed the app flows and programmed the game.',
    facts: ['5-person team', '161 questionnaire responses', 'Playable game'],
    steps: ['Locate the decision', 'Bring history into view', 'Play the trade-off'],
    prototype: true
  },
  {
    slug: 'mlog', title: 'MLOG', ratio: 1.339,
    category: 'Product & system design', medium: 'Wearable hardware & work software',
    question: 'Who gets to start the record?',
    summary: 'An employee-controlled badge turns a workplace record into a deliberate action. The wearer starts the log, reviews it, and chooses what a manager can see.',
    facts: ['142 survey responses', 'Badge + app + dashboard', 'One-handed paper mockups'],
    steps: ['Start on the badge', 'Review before sharing', 'Respond to a confirmed record'],
    prototype: false
  }
];

const $ = (s, r = document) => r.querySelector(s);
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
      `<a href="${p.slug}.html" class="m-pic" style="--r:${p.ratio}"><img src="assets/${p.slug}/images/cover.jpg" alt="" loading="lazy"></a>` +
      `<p>${esc(p.summary)}</p>` +
      `<a class="cta" href="${p.slug}.html">View project <i>→</i></a>` +
    `</div>`;
  listEl.appendChild(li);

  // right: picture layer
  const layer = document.createElement('div');
  layer.className = 'layer';
  layer.innerHTML =
    `<div class="pic" style="--r:${p.ratio}">` +
      `<img class="screen" src="assets/${p.slug}/images/screen.png" alt="">` +
      `<div class="lens"><img src="assets/${p.slug}/images/cover.jpg" alt=""></div>` +
    `</div>`;
  stage.appendChild(layer);

  // right: info block
  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('aria-hidden', 'true');
  card.innerHTML =
    `<div class="card-top"><span class="count"><b>${pad(i + 1)}</b> / ${pad(PROJECTS.length)}</span><span>${esc(p.category)}</span></div>` +
    `<h2>${esc(p.question)}</h2>` +
    `<p class="summary">${esc(p.summary)}</p>` +
    `<dl class="facts"><div><dt>Medium</dt><dd>${esc(p.medium)}</dd></div>` +
      `<div><dt>Key facts</dt><dd>${p.facts.map(esc).join('<br>')}</dd></div>` +
      `<div><dt>Sequence</dt><dd>${p.steps.map((s, k) => `<span class="step"><i>${k + 1}</i>${esc(s)}</span>`).join('')}</dd></div></dl>` +
    `<div class="actions"><a class="cta" href="${p.slug}.html">View project <i>→</i></a>` +
      (p.prototype ? `<a class="ghost" href="assets/${p.slug}/prototype/index.html">Open prototype ↗</a>` : '') +
    `</div>`;
  info.appendChild(card);
});

const links = [...document.querySelectorAll('.work')];
const layers = [...stage.children];
const cards = [...info.children];
const desktop = matchMedia('(min-width: 901px)');
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

let queued = false;
function atMidline() {
  queued = false;
  if (!desktop.matches) return;
  const mid = innerHeight / 2;
  if (scrollY < 4) { select(0); return; }
  let best = 0, dist = Infinity;
  links.forEach((a, i) => {
    const b = a.getBoundingClientRect();
    const d = Math.max(0, b.top - mid, mid - b.bottom);
    if (d < dist) { dist = d; best = i; }
  });
  select(best);
}
const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(atMidline); } };
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

links.forEach((a, i) => {
  a.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && desktop.matches) select(i); });
  a.addEventListener('focus', () => select(i));
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
stage.addEventListener('pointermove', e => {
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
stage.addEventListener('pointerleave', () => stage.classList.remove('tracking'));
$('#stage-link').addEventListener('click', () => { location.href = PROJECTS[active].slug + '.html'; });

/* ---------- arrive with ?project=slug (from “All projects” on case pages) ---------- */
addEventListener('pageshow', () => {
  const slug = new URLSearchParams(location.search).get('project');
  const i = PROJECTS.findIndex(p => p.slug === slug);
  if (i > -1) { links[i].scrollIntoView({ block: 'center' }); select(i); }
  else atMidline();
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
