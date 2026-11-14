/* Core: state, rendering, routing, shared UI (toasts, modals, read aloud, sign-in, prototype guide). */

function initState() {
  return {
    role: null, screen: 'signin', lang: 'en', showIds: false, demoOpen: false, modal: null, pop: null,
    signin: { tab: 'student', code: '', name: null, pics: [], err: '', shake: false },
    // ---- student (Omar) ----
    stu: {
      upload: { exam: 'mq3', pages: [], shots: 0, flash: null, step: 1, undo: null, retakeIdx: null },
      sentScreen: false, resultsFor: 'mq3', practice: { sheet1: true }, msgSel: null, topic: 'cmp', moreQs: false,
    },
    omarUploaded: false,
    messages: [
      { id: 'm-remind', from: 'Ms. Sara', title: 'Remember to upload your quiz', body: 'Hi Omar! Please upload Math Quiz 3 from home today. Take a photo of every page.', time: 'Today, 8:10', read: false },
      { id: 'm-mult', from: 'Ms. Sara', title: 'Great job on multiplication!', body: 'You did really well on Math Quiz 2. Your 7 times table is getting strong!', time: 'Mon', read: false },
      { id: 'm-old', from: 'System', title: 'Your Math Quiz 2 results are ready', body: 'Ms. Sara has checked Math Quiz 2. Open My results to see your grade and feedback.', time: 'Last week', read: true },
    ],
    // ---- teacher (Ms. Sara) ----
    quiz: {
      opened: false, stage: 1, cfSel: null, zoom: 1,
      cf: CHECK_FIRST.map(c => ({ ...c, status: 'todo', reading: '', mark: null, final: null, revealed: false, colleague: null, source: null })),
      qc: buildQuickRows(), base: 203, total: 270,
      s2: null, s2Sel: 'omar', hod: null, released: false, reopened: false,
    },
    remindedJonas: false,
    flags: {},
    notes: {
      omar: [
        { date: '3 Oct', text: 'Classwork: mixed up < and > again when the bottom numbers differ.' },
        { date: '26 Sep', text: 'Homework: did well on adding fractions.' },
      ],
    },
    sent: [],
    inbox: [
      { id: 'in-lina', from: 'Lina', kind: 'reply', text: 'I need help', about: 'Practice sheet – fractions', time: 'Yesterday', read: false },
    ],
    reteach: false,
    gapStudent: 'omar',
    assessments: [
      { id: 'mq3', title: 'Math Quiz 3 – Fractions', type: 'Quiz' },
      { id: 'sq2', title: 'Science Quiz 2', type: 'Quiz', papers: 25, stage: 'Not started' },
      { id: 'eq2', title: 'English Quiz 2 – Writing', type: 'Quiz', papers: 28, stage: 'With Head of Dept.' },
      { id: 'mq2', title: 'Math Quiz 2 – Multiplication', type: 'Quiz', papers: 28, stage: 'Released' },
    ],
    setup: null,
    parent: { showFeedback: false },
  };
}
let S = initState();

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ft = id => `<span class="feature-tag">${id}</span>`;
const fts = (...ids) => ids.map(ft).join(' ');
const name = sid => (SID[sid] ? SID[sid].name : sid);
function avatar(sid, cls = '') {
  const s = SID[sid];
  return `<span class="avatar ${cls}" style="background:${s ? s.color : '#E3E8E5'}" aria-hidden="true">${esc((s ? s.name : sid)[0])}</span>`;
}
function norm(s) {
  return String(s || '').toLowerCase().replace(/[x*]/g, '×').replace(/[–—-]/g, '−').replace(/\s+/g, '').replace(/\.$/, '');
}
function tokens(s) { return String(s || '').match(/\d+\/\d+|\d+|[<>=×x*+−\-÷,.]|[A-Za-zÀ-ÿ]+/g) || []; }
function diffTokens(a, b) {
  const ta = tokens(a), tb = tokens(b);
  const n = Math.max(ta.length, tb.length);
  const ra = [], rb = [];
  for (let i = 0; i < n; i++) {
    const x = ta[i], y = tb[i];
    const same = x !== undefined && y !== undefined && norm(x) === norm(y);
    if (x !== undefined) ra.push({ t: x, d: !same });
    if (y !== undefined) rb.push({ t: y, d: !same });
  }
  return [ra, rb];
}
function tokHtml(list) { return list.map(o => `<span class="tok${o.d ? ' diff' : ''}">${esc(o.t)}</span>`).join(' '); }
function seg(items, value, act, extra = '', cls = '') {
  return `<div class="seg ${cls}" role="group" ${extra}>${items.map(([v, label]) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${value === v}">${label}</button>`).join('')}</div>`;
}
function stepper(steps, current) {
  return `<div class="stepper">${steps.map((s, i) => {
    const st = i < current ? 'done' : i === current ? 'on' : '';
    return `${i ? `<span class="step-line ${i <= current ? 'done' : ''}"></span>` : ''}<span class="step ${st}">${i < current ? icon('check') : ''}${s}</span>`;
  }).join('')}</div>`;
}

/* ---------- derived quiz state ---------- */
function cfLeft() { return S.quiz.cf.filter(c => c.status !== 'done').length; }
function qcLeft() { return S.quiz.qc.filter(r => r.status !== 'done').length; }
function checkedCount() { return S.quiz.total - cfLeft() - qcLeft(); }
function stage1Done() { return cfLeft() === 0 && qcLeft() === 0; }
function papersIn() { return S.omarUploaded ? 27 : 26; }
function omarExamStatus(id) {
  if (id === 'sq2') return 'checking';
  if (id === 'mq2') return 'ready';
  if (id === 'mq3') {
    if (S.quiz.released && !S.quiz.reopened) return 'ready';
    if (!S.omarUploaded) return 'todo';
    if (S.quiz.opened) return 'checking';
    return 'uploaded';
  }
  return 'todo';
}
function mq3StageLabel() {
  const q = S.quiz;
  if (q.released && !q.reopened) return 'Released';
  if (q.reopened) return 'Reopened';
  if (q.hod === 'pending') return 'With Head of Dept.';
  if (q.stage === 2) return allConfirmed() ? 'Ready to release' : 'Stage 2: grade check';
  return q.opened ? 'Stage 1: text check' : 'Ready for review';
}

/* ---------- toasts ---------- */
function toast(text, opts = {}) {
  const box = document.getElementById('toasts');
  while (box.children.length >= 2) box.firstElementChild.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `${icon(opts.icon || 'check')}<span>${text}</span>${opts.undo ? `<button type="button">${t('undo')}</button>` : ''}`;
  if (opts.undo) el.querySelector('button').addEventListener('click', () => { opts.undo(); el.remove(); render(); });
  box.appendChild(el);
  setTimeout(() => el.remove(), opts.ms || 4200);
}

/* ---------- read aloud (G4) ---------- */
function speak(text) {
  const plain = String(text).replace(/<[^>]+>/g, '');
  try {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(plain);
      u.lang = S.lang === 'de' ? 'de-DE' : 'en-US';
      u.rate = 0.92;
      speechSynthesis.speak(u);
    }
  } catch (e) { /* the frame may block audio; the toast still shows what is read */ }
  toast(`${t('reading')} “${esc(plain.length > 90 ? plain.slice(0, 88) + '…' : plain)}”`, { icon: 'speaker', ms: 3600 });
}

/* ---------- routing ---------- */
const SCREENS = {
  student: ['home', 'upload', 'pages', 'sent', 'results', 'progress', 'messages'],
  teacher: ['dashboard', 'assessments', 'setup', 'stage1', 'check', 'stage2', 'gaps', 'class', 'messages'],
  parent: ['overview'],
};
function go(screen, role = S.role) {
  S.role = role; S.screen = screen; S.pop = null;
  if (role === 'teacher' && (screen === 'stage1' || screen === 'check' || screen === 'stage2')) openQuiz();
  if (role === 'student' && screen === 'messages' && !S.stu.msgSel) {
    const first = S.messages[0]; if (first) { S.stu.msgSel = first.id; first.read = true; }
  }
  render(true);
}
function hashFor() { return S.role ? `${S.role}-${S.screen}` : 'signin'; }
function fromHash() {
  const h = (location.hash || '').replace('#', '');
  if (!h || h === 'signin') { if (S.role) { S.role = null; S.screen = 'signin'; } return; }
  const [role, screen] = h.split('-');
  if (SCREENS[role] && SCREENS[role].includes(screen)) {
    if (screen === 'check' && !S.quiz.cfSel) { S.role = role; S.screen = 'stage1'; return; }
    S.role = role; S.screen = screen;
    if (role === 'teacher' && ['stage1', 'stage2'].includes(screen)) openQuiz(true);
  }
}
window.addEventListener('hashchange', () => { if (location.hash.replace('#', '') !== hashFor()) { fromHash(); render(true); } });

/* ---------- render ---------- */
let lastKey = '';
function render(newScreen = false) {
  const ae = document.activeElement;
  const focusId = ae && ae.id ? ae.id : null;
  const sel = focusId && ae.selectionStart !== undefined ? [ae.selectionStart, ae.selectionEnd] : null;
  const main = document.querySelector('.main, .phone-stage');
  const key = hashFor();
  const keep = main && !newScreen && key === lastKey ? main.scrollTop : 0;
  const scrollers = {};
  document.querySelectorAll('[data-keep-scroll]').forEach(el => { scrollers[el.dataset.keepScroll] = el.scrollTop; });

  document.body.classList.toggle('show-ids', S.showIds);
  document.documentElement.lang = S.lang;
  const app = document.getElementById('app');
  app.innerHTML = view() + (S.modal ? modalView() : '');
  const m2 = document.querySelector('.main, .phone-stage');
  if (m2) m2.scrollTop = keep;
  document.querySelectorAll('[data-keep-scroll]').forEach(el => { if (scrollers[el.dataset.keepScroll] !== undefined && !newScreen) el.scrollTop = scrollers[el.dataset.keepScroll]; });
  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) { try { el.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
  } else if (newScreen) {
    const h = document.querySelector('.main h1, .phone h1');
    if (h) { h.setAttribute('tabindex', '-1'); }
  }
  if (S.modal) { const f = document.querySelector('.modal [data-autofocus]'); if (f && !focusId) f.focus(); }
  renderDemo();
  if (location.hash.replace('#', '') !== key) history.replaceState(null, '', '#' + key);
  lastKey = key;
}
function screenTitle() {
  if (!S.role) return 'Sign in';
  return { student: 'Omar', teacher: 'Ms. Sara', parent: 'Dina' }[S.role] + ' · ' + S.screen;
}
function view() {
  if (!S.role) return signinView();
  if (S.role === 'student') return studentView();
  if (S.role === 'teacher') return teacherView();
  return parentView();
}

/* ---------- events ---------- */
const A = {}; // actions
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el) {
    if (el.disabled || el.classList.contains('is-disabled')) return;
    const fn = A[el.dataset.act];
    if (fn) {
      e.preventDefault();
      const fromGuide = el.closest('#demo') && !['toggleDemo', 'demoIds'].includes(el.dataset.act);
      if (fromGuide) S.demoOpen = false;
      fn(el, e);
      if (fromGuide) renderDemo();
    }
    return;
  }
  if (S.pop && !e.target.closest('.pop')) { S.pop = null; render(); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.model) {
    setPath(el.dataset.model, el.type === 'checkbox' ? el.checked : el.value);
    if (el.dataset.rerender !== undefined) render();
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.change && A[el.dataset.change]) A[el.dataset.change](el, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.modal) { S.modal = null; render(); }
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter && A[e.target.dataset.enter]) { e.preventDefault(); A[e.target.dataset.enter](e.target, e); }
});
document.addEventListener('submit', e => e.preventDefault());
function setPath(path, val) {
  const parts = path.split('.');
  let o = S;
  for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
  o[parts[parts.length - 1]] = val;
}

/* shared actions */
A.go = el => go(el.dataset.to, el.dataset.role || S.role);
A.lang = el => { S.lang = el.dataset.v; render(); };
A.closeModal = () => { S.modal = null; render(); };
A.signOut = () => { S.role = null; S.screen = 'signin'; S.signin = { ...S.signin, name: null, pics: [], err: '' }; render(true); };
A.read = el => speak(el.dataset.text || readScreenText());
A.toggleDemo = () => { S.demoOpen = !S.demoOpen; renderDemo(); };
A.noop = () => {};

/* ---------- top bar pieces ---------- */
function langSwitch() {
  return `<div class="row nowrap" style="gap:6px">${seg([['en', 'EN'], ['de', 'DE']], S.lang, 'lang', 'aria-label="Interface language"')}${ft('G2')}</div>`;
}
function readBtn(text = '') {
  return `<button type="button" class="btn" data-act="read" ${text ? `data-text="${esc(text)}"` : ''}>${icon('speaker')}<span class="hide-sm">${t('readToMe')}</span></button>${ft('G4')}`;
}
function logo(sub = '') {
  return `<div class="logo"><span class="logo-mark">${LOGO_SVG}</span>${APP_NAME}${sub ? `<small>${sub}</small>` : ''}</div>`;
}

/* ---------- modal ---------- */
const MODALS = {};
function modalView() {
  const m = S.modal; const fn = MODALS[m.type];
  if (!fn) return '';
  const { title, body, foot, wide } = fn(m);
  return `<div class="overlay" role="presentation"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-h"><h2 id="modal-title">${title}</h2><button type="button" class="icon-btn sm" data-act="closeModal" aria-label="Close">${icon('x')}</button></div>
    <div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div></div>`;
}

/* ---------- sign in (screen 1, G1) ---------- */
function signinView() {
  const si = S.signin;
  const codeOk = norm(si.code) === norm(CLASS_CODE);
  const tabs = seg([['student', t('imStudent')], ['teacher', t('teacher')], ['parent', t('parent')]], si.tab, 'siTab', 'aria-label="Who is signing in?"', 'lg');
  let content = '';
  if (si.tab === 'student') {
    const nm = si.name ? name(si.name) : '';
    content = `<div class="signin-grid student">
      <section class="card stack lg">
        <div class="stack sm">
          <h2 class="row" style="font-size:20px"><span class="stepnum">1</span>${t('typeCode')}</h2>
          <div class="row">
            <label for="si-code" class="sr">${t('typeCode')}</label>
            <input id="si-code" class="input lg" style="max-width:240px" placeholder="5B-…" autocomplete="off" value="${esc(si.code)}" data-model="signin.code" data-rerender>
            <span class="muted">${codeOk ? `<span class="chip ok">${icon('check')}${t('codeOk')}</span>` : t('codeHint')}</span>
          </div>
          ${si.code.length >= 7 && !codeOk ? `<p class="small" style="color:var(--gap)">${t('codeWrong')}</p>` : ''}
        </div>
        <div class="stack sm">
          <h2 class="row" style="font-size:20px"><span class="stepnum">2</span>${t('tapName')}</h2>
          <div class="names ${codeOk ? '' : 'locked'}" data-keep-scroll="names" ${codeOk ? '' : 'aria-disabled="true"'}>
            ${SIGNIN_ORDER.map(id => `<button type="button" class="name-btn" data-act="siName" data-id="${id}" aria-pressed="${si.name === id}" ${codeOk ? '' : 'tabindex="-1"'}>${avatar(id)}${name(id)}</button>`).join('')}
          </div>
          <p class="small muted">${codeOk ? t('classNames') : t('codeFirst')}</p>
        </div>
      </section>
      <section class="card stack lg ${si.shake ? 'shake' : ''}" style="${si.name ? '' : 'opacity:.55'}">
        <h2 class="row" style="font-size:20px"><span class="stepnum">3</span>${si.name ? t('hiTapPics', nm) : t('tapPicsLocked')}</h2>
        <div class="slots" aria-label="Pictures chosen">
          ${[0, 1, 2].map(i => si.pics[i] ? `<span class="slot filled">${PICTURES[si.pics[i]].svg}</span>` : '<span class="slot"></span>').join('')}
          <span class="muted">${t('ofThree', si.pics.length)}</span>
        </div>
        <div class="pics">
          ${PIC_ORDER.map(p => {
            const idx = si.pics.indexOf(p);
            return `<button type="button" class="pic-btn" data-act="siPic" data-p="${p}" aria-pressed="${idx >= 0}" ${si.name ? '' : 'disabled'} aria-label="${picName(p)}">${idx >= 0 ? `<span class="order">${idx + 1}</span>` : ''}${PICTURES[p].svg}<span>${picName(p)}</span></button>`;
          }).join('')}
        </div>
        ${si.err ? `<div class="notice gap" role="alert">${icon('alert')}<span>${si.err}</span></div>` : `<p class="small muted">${si.name ? t('picsHint') : t('nameFirst')}</p>`}
        <div class="row" style="margin-top:auto">
          ${si.name ? `<button type="button" class="btn dashed" data-act="siNotMe">${t('notMe', nm)}</button>` : ''}
          <button type="button" class="btn primary lg grow" data-act="siGo" ${si.pics.length === 3 ? '' : 'disabled'}>${t('letsGo')}</button>
        </div>
      </section>
    </div>
    <p class="small muted">${t('adultsSignIn')} ${ft('G1')}</p>`;
  } else {
    const isT = si.tab === 'teacher';
    content = `<section class="card stack lg" style="max-width:460px;margin:0 auto;width:100%">
      <h2 style="font-size:20px">${isT ? 'Teacher sign in' : 'Parent sign in'}</h2>
      <div class="field"><label for="si-email">${t('email')}</label><input id="si-email" class="input" type="email" value="${isT ? 'sara.hassan@school.edu.eg' : 'dina.fawzy@mail.com'}"></div>
      <div class="field"><label for="si-pass">${t('password')}</label><input id="si-pass" class="input" type="password" value="prototype"></div>
      <button type="button" class="btn primary lg" data-act="siAdult">${t('signin')}</button>
      <button type="button" class="link small" data-act="noop">${t('forgot')}</button>
      <p class="small muted">${isT ? 'Signs in as Ms. Sara Hassan, class teacher of 5B.' : 'Signs in as Dina Fawzy, Omar’s mother (bonus parent view).'}</p>
    </section>`;
  }
  return `<div class="signin">
    <header class="topbar">${logo('for teachers and children')}<span class="spacer"></span>${si.tab === 'student' ? readBtn(signinReadText()) : ''}${langSwitch()}</header>
    <div class="signin-body"><div class="signin-wrap">
      <div class="page-h"><h1 style="font-size:30px">${t('signin')} ${ft('G1')}</h1>${tabs}</div>
      ${content}
    </div></div></div>`;
}
function signinReadText() {
  const si = S.signin;
  if (!si.name) return `${t('signin')}. ${t('typeCode')}. ${t('tapName')}.`;
  return `${t('hiTapPics', name(si.name))}. ${t('picsHint')}`;
}
A.siTab = el => { S.signin.tab = el.dataset.v; S.signin.err = ''; render(); };
A.siName = el => { S.signin.name = el.dataset.id; S.signin.pics = []; S.signin.err = ''; render(); };
A.siNotMe = () => { S.signin.name = null; S.signin.pics = []; S.signin.err = ''; render(); };
A.siPic = el => {
  const si = S.signin; const p = el.dataset.p;
  si.err = ''; si.shake = false;
  const i = si.pics.indexOf(p);
  if (i >= 0) si.pics.splice(i, 1); else if (si.pics.length < 3) si.pics.push(p);
  render();
};
A.siGo = () => {
  const si = S.signin;
  const ok = si.name === 'omar' && si.pics.join() === OMAR_PICS.join();
  const otherKid = si.name && si.name !== 'omar' && si.pics.length === 3;
  if (ok) { si.pics = []; go('home', 'student'); return; }
  if (otherKid) { // every child has their own pictures; the prototype only has Omar's account
    si.err = `This prototype has one student account: Omar. Tap “Omar”, then Cat, Ball, Fish.`;
  } else { si.err = t('wrongPics'); }
  si.pics = []; si.shake = true; render();
  setTimeout(() => { S.signin.shake = false; }, 400);
};
A.siAdult = () => go(S.signin.tab === 'teacher' ? 'dashboard' : 'overview', S.signin.tab);

/* ---------- prototype guide (not part of the product UI) ---------- */
function task1Done() { return S.omarUploaded; }
function task2Done() { return S.quiz.released; }
function task3Done() { return !!(S.flags.omar && S.flags.omar.status !== 'suggested' && S.sent.some(m => m.to.includes('omar'))); }
function renderDemo() {
  const box = document.getElementById('demo');
  if (!S.demoOpen) {
    box.innerHTML = `<button type="button" class="demo-fab" data-act="toggleDemo">${icon('guide')}Prototype guide</button>`;
    return;
  }
  const done = b => b ? `<span class="dp-done">${icon('check', 'style="width:14px;height:14px;vertical-align:-2px"')} done</span>` : '';
  box.innerHTML = `<div class="demo-panel" role="complementary" aria-label="Prototype guide">
    <div class="row between nowrap"><h3>Prototype guide</h3><button type="button" class="icon-btn sm" style="background:#3A3049;border-color:#514563;color:#fff" data-act="toggleDemo" aria-label="Hide the guide">${icon('x')}</button></div>
    <p class="small" style="color:#C9BFDC">Helper for the TA and the video walkthrough. It is not part of the product. All AI output is mock data.</p>
    <div class="dp-sec"><span class="dp-label">Switch view</span>
      <div class="dp-row">
        <button type="button" class="dp-btn" data-act="demoView" data-r="student">Student</button>
        <button type="button" class="dp-btn" data-act="demoView" data-r="teacher">Teacher</button>
        <button type="button" class="dp-btn" data-act="demoView" data-r="parent">Parent</button>
      </div>
      <span class="small" style="color:#C9BFDC">Student sign-in: code <code>${CLASS_CODE}</code>, name Omar, pictures Cat · Ball · Fish</span>
    </div>
    <div class="dp-sec"><span class="dp-label">Primary tasks (Milestone 2 HTA)</span>
      <button type="button" class="dp-btn" data-act="demoTask" data-n="1">${icon('play', 'style="width:16px;height:16px;flex:none;margin-top:2px"')}<span>Task 1 · Omar uploads Math Quiz 3 ${done(task1Done())}<small>Student · Home → Take photos → Check pages → Send</small></span></button>
      <button type="button" class="dp-btn" data-act="demoTask" data-n="2">${icon('play', 'style="width:16px;height:16px;flex:none;margin-top:2px"')}<span>Task 2 · Ms. Sara reviews the quiz ${done(task2Done())}<small>Teacher · Dashboard → Stage 1 text check → Stage 2 grade check → Release</small></span></button>
      <button type="button" class="dp-btn" data-act="demoTask" data-n="3">${icon('play', 'style="width:16px;height:16px;flex:none;margin-top:2px"')}<span>Task 3 · Ms. Sara handles Omar’s red flag ${done(task3Done())}<small>Teacher · Dashboard → Student gaps → Confirm flag → Message with practice</small></span></button>
      <button type="button" class="dp-btn" data-act="demoTask" data-n="4">${icon('eye', 'style="width:16px;height:16px;flex:none;margin-top:2px"')}<span>See the outcome<small>Omar’s results and messages, then the parent view</small></span></button>
    </div>
    <div class="dp-sec"><span class="dp-label">Shortcuts for a short video</span>
      <button type="button" class="dp-btn" data-act="demoFinishCf">Check the remaining check-first answers<small>Keeps Omar’s Q2 for you if it is still open</small></button>
      <button type="button" class="dp-btn" data-act="demoConfirmOthers">Confirm the other students’ grades<small>Stage 2: everyone except Omar</small></button>
    </div>
    <div class="dp-sec">
      <label><input type="checkbox" data-act="demoIds" ${S.showIds ? 'checked' : ''}> Show feature IDs from Milestone 2 (G1, S2, T4…)</label>
      <button type="button" class="dp-btn" data-act="demoReset">${icon('reset', 'style="width:16px;height:16px;flex:none;margin-top:2px"')}<span>Reset the prototype</span></button>
    </div>
  </div>`;
}
A.demoView = el => {
  const r = el.dataset.r;
  go({ student: 'home', teacher: 'dashboard', parent: 'overview' }[r], r);
};
A.demoIds = el => { S.showIds = el.checked; render(); };
A.demoReset = () => { const keep = { demoOpen: S.demoOpen, showIds: S.showIds }; S = initState(); Object.assign(S, keep); render(true); toast('Prototype reset to the start of the example.'); };
A.demoTask = el => {
  const n = el.dataset.n;
  if (n === '1') { S.stu.upload = { exam: 'mq3', pages: [], shots: 0, flash: null, step: 1, undo: null, retakeIdx: null }; S.stu.sentScreen = false; go('home', 'student'); }
  if (n === '2') { go('dashboard', 'teacher'); }
  if (n === '3') {
    if (!S.quiz.s2 || !S.quiz.s2.students.omar.confirmed) {
      demoCompleteStage1(); openStage2(); confirmStudent('omar');
      toast('Stage 1 and Omar’s grades were completed for you so the red flag can appear.', { icon: 'info' });
    }
    go('dashboard', 'teacher');
  }
  if (n === '4') { go(S.quiz.released ? 'results' : 'home', 'student'); }
};
A.demoFinishCf = () => {
  if (!S.quiz.opened) openQuiz();
  S.quiz.cf.forEach(c => {
    if (c.status === 'done' || (c.id === 'cf1')) return;
    autoCheck(c);
  });
  toast('The other check-first answers were checked with the child’s real reading.');
  render();
};
A.demoConfirmOthers = () => {
  if (!stage1Done()) { demoCompleteStage1(); }
  openStage2();
  Object.keys(S.quiz.s2.students).forEach(sid => { if (sid !== 'omar') confirmStudent(sid); });
  toast('All students except Omar are confirmed.');
  if (S.role === 'teacher') S.screen = 'stage2';
  render();
};
function autoCheck(c) {
  c.reading = answerText(c.sid, c.q);
  const qq = Q(c.q); const loss = (LOSSES[c.q] || []).includes(c.sid);
  const o = OVERRIDES[`${c.sid}-${c.q}`];
  const got = loss ? (o && o.got !== undefined ? o.got : qq.lossGot) : qq.marks;
  c.mark = got === qq.marks ? 'right' : got === 0 ? 'wrong' : 'partly';
  c.final = c.reading; c.source = 'teacher'; c.status = 'done'; c.revealed = true;
}
function demoCompleteStage1() {
  S.omarUploaded = true; openQuiz(true);
  S.quiz.cf.forEach(c => { if (c.status !== 'done') autoCheck(c); });
  S.quiz.qc.forEach(r => { if (r.status !== 'done') { if (r.id === 'qc-lina-3') { r.ai = r.scan; r.edited = true; } r.status = 'done'; } });
}

/* ---------- boot ---------- */
window.addEventListener('DOMContentLoaded', () => { fromHash(); render(true); });
