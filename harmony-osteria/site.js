/* shared header, footer and the booking drawer */
(function () {
  const $ = s => document.querySelector(s);
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const DAYL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const now = new Date();
  const open = d => true;                                          // lunch and dinner every day
  const dinner = d => true;
  const service = () => { const h = now.getHours(); return h < 16 ? 'Lunch' : dinner(now) ? 'Dinner' : 'Lunch' };
  window.HO = { now, DAYL, MONL, longDate: d => DAYL[d.getDay()] + ' ' + d.getDate() + ' ' + MONL[d.getMonth()], open };

  const page = document.body.dataset.page;
  const link = (href, t) => `<a href="${href}"${page === href.replace('.html', '') ? ' aria-current="page"' : ''}>${t}</a>`;
  document.body.insertAdjacentHTML('afterbegin', `
<header class="top"><div class="wrap">
  <a class="mark" href="index.html">Harmony <span>Osteria</span></a>
  <nav class="main" aria-label="Main">${link('index.html', 'Home')}${link('menu.html', 'Menu')}${link('house.html', 'The House')}${link('visit.html', 'Visit')}</nav>
  <div class="right"><span class="today">${open(now) ? DAYS[now.getDay()] + ' ' + now.getDate() + ' ' + MON[now.getMonth()] + ' · ' + service() : 'Closed today · open Wednesday'}</span>
  <button class="burger" aria-expanded="false" aria-label="Pages"></button><button class="book" data-book>Book a table</button></div>
</div></header>`);
  document.body.insertAdjacentHTML('beforeend', `
<footer><div class="wrap">
  <div class="cols">
    <div><a class="mark" href="index.html">Harmony <span>Osteria</span></a><p style="margin-top:14px;color:#c9cbc2;max-width:300px">A small osteria in the hills behind Genoa. The menu follows the wild.</p></div>
    <div><div class="label">Hours</div><p>Lunch every day<br>12:30–15:00</p><p>Dinner every day<br>19:30–22:30</p></div>
    <div><div class="label">Find us</div><p>Above Torriglia<br>Ligurian Apennines (GE)</p><p><a href="visit.html">Getting here</a></p></div>
    <div><div class="label">Contact</div><p><a href="#" data-book>Book a table</a></p><p>booking@harmonyosteria.it</p><p>Instagram</p></div>
  </div>
  <div class="fine"><span>© 2026 Harmony Osteria</span><span>Concept project · Zeng Yihan · images are renders</span></div>
</div></footer>
<div class="tip" id="tip"></div>
<div class="scrim" data-close></div>
<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="bk-title">
  <header><h2 id="bk-title">Book a table</h2><button class="x" data-close>Close</button></header>
  <div class="steps" id="bk-steps"><span>1 Guests</span><span>2 Date</span><span>3 Courses</span><span>4 Details</span></div>
  <div class="pane" id="bk-pane"></div>
  <footer><button class="ghost" id="bk-back">Back</button><span class="summary" id="bk-sum"></span><button class="book" id="bk-next">Continue</button></footer>
</aside>`);

  $('.burger').onclick = e => { const o = document.body.classList.toggle('navopen'); e.target.setAttribute('aria-expanded', o) };

  /* ---------- booking ---------- */
  const B = { step: 0, guests: 2, day: null, time: null, picks: [null, null, null, null], name: '', email: '', note: '' };
  const days = []; for (let i = 0; i < 21 && days.length < 14; i++) { const d = new Date(now); d.setDate(now.getDate() + i); if (open(d)) days.push(d) }
  const pane = $('#bk-pane'), next = $('#bk-next'), back = $('#bk-back'), sum = $('#bk-sum');
  const short = d => DAYS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MON[d.getMonth()];
  function times(d) { const t = ['12:30', '13:00', '13:30']; if (d && dinner(d)) t.push('19:30', '20:00', '20:30'); return t }
  function render() {
    [...$('#bk-steps').children].forEach((s, i) => { s.className = i === B.step ? 'on' : i < B.step ? 'done' : '' });
    back.disabled = B.step === 0 || B.step === 4; $('#bk-steps').style.display = B.step === 4 ? 'none' : '';
    sum.textContent = [B.guests + (B.guests > 1 ? ' guests' : ' guest'), B.day ? short(B.day) : '', B.time || ''].filter(Boolean).join(' · ');
    if (B.step === 0) {
      pane.innerHTML = `<h3>How many of you?</h3><p class="hint">Ten tables, forty seats. For nine or more, write to us.</p>
        <div class="grid g4">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button class="opt" data-g="${n}" aria-pressed="${n === B.guests}">${n}</button>`).join('')}</div>`;
      pane.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { B.guests = +b.dataset.g; render() });
      next.textContent = 'Continue'; next.disabled = false
    } else if (B.step === 1) {
      pane.innerHTML = `<div class="sect"><div class="label">Date</div><div class="grid g4">${days.map((d, i) => `<button class="opt" data-d="${i}" aria-pressed="${B.day && d.toDateString() === B.day.toDateString()}"><small>${DAYS[d.getDay()]}</small>${d.getDate()} ${MON[d.getMonth()].charAt(0) + MON[d.getMonth()].slice(1).toLowerCase()}</button>`).join('')}</div></div>
        <div class="sect"><div class="label">Time</div><div class="grid g3">${times(B.day).map(t => `<button class="opt" data-t="${t}" aria-pressed="${t === B.time}"${B.day ? '' : ' disabled'}><small>${+t.slice(0, 2) < 16 ? 'Lunch' : 'Dinner'}</small>${t}</button>`).join('')}</div>
        <p class="hint" style="margin-top:12px">Lunch and dinner, every day.</p></div>`;
      pane.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { B.day = days[+b.dataset.d]; if (!times(B.day).includes(B.time)) B.time = null; render() });
      pane.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { B.time = b.dataset.t; render() });
      next.textContent = 'Continue'; next.disabled = !(B.day && B.time)
    } else if (B.step === 2) {
      pane.innerHTML = `<h3>Choose your courses</h3><p class="hint">Optional. One per course; you can also choose at the table. Shares shown are today's and may move by your visit.</p>` +
        MENU.map((row, c) => `<div class="sect"><div class="label">${COURSES[c]}</div><div class="pick">${row.map((m, j) => `<button class="opt" data-c="${c}" data-j="${j}" aria-pressed="${B.picks[c] === j}"${OFF(m.d) ? ' disabled' : ''}><span>${m.it}</span><em>${OFF(m.d) ? 'not available' : m.sp + ' ' + wildShare(m.d) + ' %'}</em></button>`).join('')}</div></div>`).join('');
      pane.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const c = +b.dataset.c, j = +b.dataset.j; B.picks[c] = B.picks[c] === j ? null : j; render() });
      next.textContent = B.picks.some(p => p !== null) ? 'Continue' : 'Skip, choose at the table'; next.disabled = false
    } else if (B.step === 3) {
      pane.innerHTML = `<h3>Your details</h3><p class="hint">We hold the table for 15 minutes.</p>
        <label class="field"><span class="label">Name</span><input id="f-n" autocomplete="name" value="${B.name}"></label>
        <label class="field"><span class="label">Email</span><input id="f-e" type="email" autocomplete="email" value="${B.email}"></label>
        <label class="field"><span class="label">Allergies or notes</span><textarea id="f-t" rows="3">${B.note}</textarea></label>`;
      const chk = () => { B.name = $('#f-n').value.trim(); B.email = $('#f-e').value.trim(); B.note = $('#f-t').value; next.disabled = !(B.name && /.+@.+\..+/.test(B.email)) };
      pane.querySelectorAll('input,textarea').forEach(i => i.oninput = chk); chk(); next.textContent = 'Request table'
    } else {
      const chosen = B.picks.map((j, c) => j !== null ? MENU[c][j] : MENU[c].find(m => !OFF(m.d)));
      pane.innerHTML = `<div class="label">${HO.longDate(B.day)} · ${B.time} · ${B.guests} ${B.guests > 1 ? 'guests' : 'guest'}</div>
        <p class="done-head">Thank you, ${B.name.split(' ')[0]}. Your table is held.</p>
        <p class="hint">${B.picks.some(p => p !== null) ? 'When your plates leave the kitchen, the lower glass moves one pane for each.' : 'When your plates leave the kitchen, the lower glass moves one pane for each, like this.'}</p>
        <div class="done-glass" id="bk-glass"></div>
        <ol class="served" id="bk-served">${chosen.map((m, i) => `<li>${['12:41', '13:02', '13:28', '13:55'][i]} · ${m.it} · ${m.sp} ${GlassUtil.sign(m.d)}</li>`).join('')}</ol>
        <p class="demo">Concept site: no booking is sent.</p>`;
      const wall = GlassWall($('#bk-glass'), { views: ['out'], tip: $('#tip') });
      const lis = pane.querySelectorAll('#bk-served li');
      chosen.forEach((m, i) => setTimeout(() => { wall.serve(m, ['12:41', '13:02', '13:28', '13:55'][i]); lis[i].classList.add('in') }, 700 + i * 2400));
      next.textContent = 'Done'; next.disabled = false
    }
  }
  next.onclick = () => { if (B.step === 4) return close(); B.step++; render(); pane.scrollTop = 0 };
  back.onclick = () => { if (B.step > 0) { B.step--; render() } };
  function openB(e) { if (e) e.preventDefault(); if (B.step === 4) { B.step = 0; B.day = null; B.time = null; B.picks = [null, null, null, null] } document.body.classList.add('booking'); render(); setTimeout(() => pane.querySelector('button,input')?.focus(), 320) }
  function close() { document.body.classList.remove('booking') }
  document.addEventListener('click', e => { if (e.target.closest('[data-book]')) openB(e); if (e.target.closest('[data-close]')) close() });
  addEventListener('keydown', e => { if (e.key === 'Escape') close() });
  if (location.hash === '#book') openB();
})();
