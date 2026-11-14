/* Student view (screens 2–7): Omar, Grade 5, on the family tablet. */

const EXAMS = { mq3: 'Math Quiz 3 – Fractions', sq2: 'Science Quiz 2', mq2: 'Math Quiz 2 – Multiplication' };
const PAGE_QS = { 1: [1, 2, 3, 4], 2: [5, 6, 7], 3: [8, 9, 10] };

function unreadCount() { return S.messages.filter(m => !m.read).length; }

function studentView() {
  const nav = [
    ['home', 'home', t('nav_home')], ['upload', 'upload', t('nav_upload')], ['results', 'results', t('nav_results')],
    ['progress', 'progress', t('nav_progress')], ['messages', 'chat', t('nav_messages')],
  ];
  const active = ({ pages: 'upload', sent: 'upload' })[S.screen] || S.screen;
  const screens = { home: sHome, upload: sUpload, pages: sPages, sent: sSent, results: sResults, progress: sProgress, messages: sMessages };
  const u = unreadCount();
  return `<div class="shell student">
    <header class="topbar">${logo()}<span class="spacer"></span>${readBtn()}${langSwitch()}
      <button type="button" class="who" data-act="signOut" title="${t('signOut')}">${avatar('omar')}<span class="hide-sm">Omar</span>${icon('logout', 'style="width:18px;height:18px;color:var(--muted)"')}</button>
    </header>
    <div class="body">
      <nav class="sidenav" aria-label="Student menu">
        ${nav.map(([k, ic, label]) => `<button type="button" class="navbtn" data-act="go" data-to="${k}" ${active === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span>${k === 'messages' && u ? `<span class="badge" aria-label="${u} unread">${u}</span>` : ''}</button>`).join('')}
      </nav>
      <main class="main" id="main"><div class="main-inner">${(screens[S.screen] || sHome)()}</div></main>
    </div></div>`;
}

function statusTrack(st) {
  const order = ['uploaded', 'checking', 'ready'];
  const idx = order.indexOf(st);
  const labels = [t('st_uploaded'), t('st_checking'), t('st_ready')];
  return `<div class="status-track" aria-label="Status: ${st === 'todo' ? t('st_todo') : labels[idx]}">${labels.map((l, i) => {
    const cls = idx < 0 ? '' : i < idx ? 'done' : i === idx ? 'on' : '';
    return `${i ? `<span class="st-line ${idx >= i ? 'done' : ''}"></span>` : ''}<span class="st ${cls}">${l}</span>`;
  }).join('')}</div>`;
}

/* ----- Screen 2 · Home ----- */
function sHome() {
  const mq3 = omarExamStatus('mq3');
  const released = mq3 === 'ready';
  const unread = S.messages.filter(m => !m.read).slice(0, 2);
  const prog = omarProgress();
  return `
    <div class="page-h"><h1><span class="hello">${t('hi', 'Omar')}</span> <span class="muted" style="font-size:18px;font-weight:400">${t('whatToday')}</span> ${ft('S1')}</h1></div>
    <div class="home-grid">
      <button type="button" class="upload-tile" data-act="go" data-to="upload">
        <span class="ut-icon">${icon('camera')}</span><strong>${t('uploadMyExam')}</strong>
        <span>${mq3 === 'todo' ? `${EXAMS.mq3} · ${t('takePhotos')}` : t('takePhotos')} ${ft('S2')}</span>
      </button>
      <section class="card stack">
        <div class="card-h"><h2>${icon('star', 'style="width:20px;height:20px;color:#C08A00"')}${t('newResults')} ${ft('S5')}</h2></div>
        ${released ? `<div class="row between nowrap"><div class="stack sm"><strong style="font-size:17px">${EXAMS.mq3}</strong><span class="muted small">${t('checkedByTeacher')}</span></div>
          <button type="button" class="btn primary" data-act="openResults" data-q="mq3">${t('seeResults')}</button></div>`
          : `<p class="muted">${t('noNewResults')}</p>`}
      </section>
    </div>
    <section class="card">
      <div class="card-h"><h2>${t('myExams')} ${ft('G5')}</h2></div>
      ${['sq2', 'mq3', 'mq2'].map(id => {
        const st = omarExamStatus(id);
        return `<div class="exam-row"><strong>${EXAMS[id].split(' – ')[0]}</strong>${st === 'todo' ? `<span class="chip warn">${icon('upload')}${t('st_todo')}</span>` : statusTrack(st)}
          <span>${st === 'todo' ? `<button type="button" class="btn sm" data-act="go" data-to="upload">${t('uploadNow')}</button>` : st === 'ready' ? `<button type="button" class="btn sm" data-act="openResults" data-q="${id}">${t('seeResults')}</button>` : ''}</span></div>`;
      }).join('')}
    </section>
    <div class="grid2">
      <section class="card stack">
        <div class="card-h"><h2>${t('nav_messages')} ${unreadCount() ? `<span class="chip solid">${t('newN', unreadCount())}</span>` : ''} ${ft('S9')}</h2></div>
        ${unread.length ? unread.map(m => `<div class="row nowrap">${icon('chat', 'style="width:20px;height:20px;color:var(--accent);flex:none"')}<span><strong>${esc(m.from)}:</strong> ${esc(m.title)}</span></div>`).join('') : '<p class="muted">No new messages.</p>'}
        <div><button type="button" class="btn" data-act="go" data-to="messages">${t('openMessages')}</button></div>
      </section>
      <section class="card stack">
        <div class="card-h"><h2>${t('myProgress')} ${ft('S12')}</h2></div>
        ${TOPIC_KEYS.filter(k => k !== 'add').map(k => `<div class="topic-row" style="grid-template-columns:150px 1fr"><span class="small">${topicName(k)}</span><div class="bar"><span style="width:${prog[k][prog[k].length - 1]}%"></span></div></div>`).join('')}
        <div><button type="button" class="btn" data-act="go" data-to="progress">${t('seeMyProgress')}</button></div>
      </section>
    </div>`;
}
A.openResults = el => { S.stu.resultsFor = el.dataset.q; go('results'); };

/* ----- simulated exam paper (Omar's handwriting) ----- */
function simPaper(page, extraCls = '') {
  const qs = PAGE_QS[page] || [];
  return `<div class="vf-paper ${extraCls}" aria-label="Photo of page ${page}">
    <div class="print" style="display:flex;justify-content:space-between"><span>Math Quiz 3 · Fractions</span><span>Omar · 5B · p.${page}</span></div>
    ${qs.map(n => `<div class="print" style="margin-top:8px">${n}. ${esc(Q(n).text)}</div>
      ${(n === 2 ? Q(2).work : []).map(w => `<div class="hand">${esc(w)}</div>`).join('')}
      <div class="hand">${esc(answerText('omar', n))}</div>`).join('')}
  </div>`;
}
function thumbHtml(p) {
  if (p.kind === 'file') {
    return `<div class="page-thumb">${p.src ? `<img src="${p.src}" alt="Your photo">` : `<div class="stack sm" style="margin:auto;text-align:center">${icon('file', 'style="width:36px;height:36px;margin:0 auto"')}<span class="small">${esc(p.name)}</span></div>`}</div>`;
  }
  const qs = PAGE_QS[p.n] || [];
  return `<div class="page-thumb" aria-hidden="true"><span class="print">Math Quiz 3 · p.${p.n}</span>${qs.map(n => `<span class="print">${n}. ${esc(Q(n).text.slice(0, 26))}</span><span class="hand">${esc(answerText('omar', n))}</span>`).join('')}</div>`;
}

/* ----- Screen 3 · Upload: take photos (S2, S3) ----- */
function sUpload() {
  const up = S.stu.upload;
  if (S.omarUploaded && !up.pages.length) {
    return `<div class="page-h"><h1>${t('nav_upload')}</h1></div>
      <section class="card celebrate"><div class="big-check">${icon('check')}</div><h2>${t('nothingToUpload')}</h2>
      <button type="button" class="btn primary lg" data-act="go" data-to="home">${t('backHome')}</button></section>`;
  }
  const retake = up.retakeIdx !== null && up.retakeIdx !== undefined;
  const simCount = up.pages.filter(p => p.kind === 'sim').length;
  const nextN = retake ? up.pages[up.retakeIdx].n : nextSimPage();
  const dark = up.flash && up.flash.type === 'dark';
  const good = up.flash && up.flash.type === 'good';
  const allDone = !retake && !nextN;
  return `
    ${stepper([t('up_step1'), t('up_step2'), t('up_step3')], 0)}
    <div class="page-h"><h1>${retake ? `${t('retake')}: ${t('page', up.pages[up.retakeIdx].n || up.retakeIdx + 1)}` : t('uploadMyExam')}</h1></div>
    <div class="row"><label class="label" for="exam-pick" style="font-size:17px;color:var(--ink);font-weight:600">${t('whichExam')}</label>
      <select id="exam-pick" class="input" style="max-width:320px;font-size:16px"><option>${EXAMS.mq3}</option></select></div>
    <div class="camera-wrap">
      <div class="stack">
        <div class="viewfinder" aria-live="polite">
          <span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
          ${allDone ? `<div class="vf-msg good">${icon('check')}<div><strong>All 3 pages are done!</strong><div class="small muted">Tap “${t('nextCheck')}”.</div></div></div>`
            : simPaper(dark ? up.flash.page : nextN || 1, dark ? 'dark' : '')}
          ${dark ? `<div class="vf-msg" role="alert">${icon('alert')}<div><strong style="font-size:17px">${t('tooDark')}</strong><div class="small muted">${t('tooDarkSub')}</div></div>${ft('S3')}</div>` : ''}
          ${good ? `<div class="vf-msg good" role="status">${icon('check')}<div><strong style="font-size:17px">${t('goodPhoto')}</strong><div class="small muted">${t('goodPhotoSub')}</div></div></div>` : ''}
        </div>
        <div class="row" style="justify-content:center;gap:22px">
          <label class="btn dashed" for="file-in" style="cursor:pointer">${icon('file')}${t('chooseFile')}</label>
          <input id="file-in" type="file" accept="image/*,application/pdf" class="sr" data-change="fileChosen">
          <button type="button" class="shutter" data-act="shoot" aria-label="${t('takePhoto')}" ${allDone ? 'disabled style="opacity:.4"' : ''}><span></span></button>
          <strong style="font-size:17px">${allDone ? '' : retake ? t('retake') : t('holdPage', nextN)}</strong>
        </div>
      </div>
      <div class="stack">
        <section class="card stack sm">
          <h2 style="font-size:17px">${t('tips')}</h2>
          ${[['frame', 'tip1'], ['frame', 'tip2'], ['sun', 'tip3']].map(([ic, k]) => `<div class="row nowrap">${icon(ic, 'style="width:22px;height:22px;color:var(--accent);flex:none"')}<span>${t(k)}</span></div>`).join('')}
        </section>
        <section class="card stack sm">
          <h2 style="font-size:17px">${t('myPages')}</h2>
          ${up.pages.length ? up.pages.map((p, i) => `<div class="row nowrap"><div style="width:44px">${thumbHtml(p)}</div><span>${t('page', i + 1)} ${icon('check', 'style="width:16px;height:16px;color:var(--ok);vertical-align:-3px"')}</span></div>`).join('') : ''}
          ${allDone ? '' : `<div class="row nowrap"><span style="width:44px;height:58px;border:2px dashed var(--line-strong);border-radius:6px;display:block"></span><span class="muted">${t('page', up.pages.length + 1)}…</span></div>`}
        </section>
        <button type="button" class="btn primary lg" data-act="toPages" ${up.pages.length ? '' : 'disabled'}>${t('nextCheck')}</button>
      </div>
    </div>`;
}
function nextSimPage() {
  const have = new Set(S.stu.upload.pages.filter(p => p.kind === 'sim').map(p => p.n));
  for (const n of [1, 2, 3]) if (!have.has(n)) return n;
  return null;
}
A.shoot = () => {
  const up = S.stu.upload;
  const retake = up.retakeIdx !== null && up.retakeIdx !== undefined;
  const n = retake ? up.pages[up.retakeIdx].n : nextSimPage();
  if (!n && !retake) return;
  up.shots += 1;
  if (up.shots === 1) { up.flash = { type: 'dark', page: n }; render(); return; } // S3: the first photo is too dark
  if (retake) { up.pages[up.retakeIdx] = { id: 'p' + Date.now(), kind: 'sim', n: n || 1 }; up.retakeIdx = null; up.flash = { type: 'good' }; go('pages'); return; }
  up.pages.push({ id: 'p' + Date.now(), kind: 'sim', n });
  up.flash = { type: 'good' };
  render();
};
A.fileChosen = el => {
  const f = el.files && el.files[0];
  if (!f) return;
  const up = S.stu.upload;
  const add = src => {
    const page = { id: 'p' + Date.now(), kind: 'file', name: f.name, src };
    if (up.retakeIdx !== null && up.retakeIdx !== undefined) { up.pages[up.retakeIdx] = page; up.retakeIdx = null; go('pages'); return; }
    up.pages.push(page); up.flash = { type: 'good' }; render();
  };
  if (f.type.startsWith('image/')) { const r = new FileReader(); r.onload = () => add(r.result); r.readAsDataURL(f); } else add(null);
};
A.toPages = () => { S.stu.upload.flash = null; S.stu.upload.retakeIdx = null; go('pages'); };

/* ----- Screen 4 · Upload: check pages and send (S4) ----- */
function sPages() {
  const up = S.stu.upload;
  const sims = up.pages.filter(p => p.kind === 'sim').map(p => p.n);
  const outOfOrder = sims.some((n, i) => i && n < sims[i - 1]);
  const missing = [1, 2, 3].filter(n => !sims.includes(n));
  return `
    ${stepper([t('up_step1'), t('up_step2'), t('up_step3')], 1)}
    <div class="page-h"><h1>${t('allPagesHere')} ${ft('S4')}</h1></div>
    <p class="muted" style="font-size:17px">${t('putOrder', EXAMS.mq3, up.pages.length)}</p>
    ${outOfOrder ? `<div class="notice warn">${icon('alert')}<span>The pages look out of order. Page ${Math.min(...sims.filter((n, i) => i && n < sims[i - 1]))} should come earlier. Use the arrows to move it.</span></div>` : ''}
    ${!outOfOrder && missing.length && up.pages.every(p => p.kind === 'sim') ? `<div class="notice warn">${icon('alert')}<span>Math Quiz 3 has 3 pages. ${missing.map(n => t('page', n)).join(', ')} ${missing.length > 1 ? 'are' : 'is'} missing. Tap “${t('addPage')}”.</span></div>` : ''}
    ${up.pages.length ? '' : `<div class="notice">${icon('info')}<span>${t('noPages')}</span></div>`}
    <div class="pages-row">
      ${up.pages.map((p, i) => `<div class="page-card">
        <h3>${t('page', i + 1)}</h3>${thumbHtml(p)}
        <div class="row" style="justify-content:center">
          <button type="button" class="icon-btn" data-act="movePage" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="${t('moveLeft')}">${icon('left')}</button>
          <button type="button" class="icon-btn" data-act="movePage" data-i="${i}" data-d="1" ${i === up.pages.length - 1 ? 'disabled' : ''} aria-label="${t('moveRight')}">${icon('right')}</button>
        </div>
        <div class="row nowrap"><button type="button" class="btn sm grow" data-act="retakePage" data-i="${i}">${icon('retake')}${t('retake')}</button><button type="button" class="btn sm dashed grow" data-act="delPage" data-i="${i}">${icon('trash')}${t('del')}</button></div>
      </div>`).join('')}
      <button type="button" class="add-page" data-act="addPage"><span class="stack sm" style="align-items:center">${icon('plus')}${t('addPage')}</span></button>
    </div>
    <div class="footbar" style="margin-top:8px">
      ${icon('info', 'style="width:24px;height:24px;color:var(--accent);flex:none"')}<span class="grow">${t('teacherFirst')}</span>
      <button type="button" class="btn lg" data-act="go" data-to="upload">${t('back')}</button>
      <button type="button" class="btn primary lg" data-act="sendExam" ${up.pages.length ? '' : 'disabled'}>${icon('send')}${t('sendTeacher')}</button>
    </div>`;
}
A.movePage = el => { const p = S.stu.upload.pages; const i = +el.dataset.i, j = i + +el.dataset.d; [p[i], p[j]] = [p[j], p[i]]; render(); };
A.retakePage = el => { S.stu.upload.retakeIdx = +el.dataset.i; S.stu.upload.flash = null; go('upload'); };
A.delPage = el => {
  const p = S.stu.upload.pages; const i = +el.dataset.i; const removed = p.splice(i, 1)[0];
  render();
  toast(t('pageDeleted'), { icon: 'trash', undo: () => { S.stu.upload.pages.splice(i, 0, removed); } });
};
A.addPage = () => { S.stu.upload.flash = null; S.stu.upload.retakeIdx = null; go('upload'); };
A.sendExam = () => {
  S.omarUploaded = true;
  S.stu.upload = { exam: 'mq3', pages: [], shots: 1, flash: null, step: 1, undo: null, retakeIdx: null };
  go('sent');
};
function sSent() {
  return `${stepper([t('up_step1'), t('up_step2'), t('up_step3')], 3)}
    <section class="card celebrate"><div class="big-check">${icon('check')}</div>
      <h1 style="font-size:30px">${t('sentTitle')}</h1><p style="font-size:18px;max-width:46ch">${t('sentSub')}</p>
      ${statusTrack(omarExamStatus('mq3'))}
      <button type="button" class="btn primary lg" data-act="go" data-to="home">${t('backHome')}</button></section>`;
}

/* ----- Screen 5 · Exam results (S5, S6, S7) ----- */
function omarItems() { return S.quiz.s2 && S.quiz.s2.students.omar ? S.quiz.s2.students.omar.items : null; }
function kindLabel(it) {
  if (it.mark >= it.max) return '';
  if (it.type === 'careless') return `<span class="chip careless">${t('checkAgain')}</span>`;
  if (it.type === 'numw') return `<span class="chip numw">Check how you write the number</span>`;
  return `<span class="chip gap">${t('letsPractise', topicName(Q(it.q).topic).toLowerCase())}</span>`;
}
function resultScan(it) {
  const q = Q(it.q);
  const txt = it.read;
  if (it.mark >= it.max) return `<span class="hand md">${esc(txt)}</span>`;
  // circle the differing tokens against the correct answer
  const [a] = diffTokens(txt, q.right);
  const circled = a.map(o => o.d ? `<span class="circle-mark">${esc(o.t)}</span>` : esc(o.t)).join(' ');
  return `<span class="hand md">${circled}</span>`;
}
function sResults() {
  const which = S.stu.resultsFor;
  const tabs = seg([['mq3', 'Math Quiz 3'], ['mq2', 'Math Quiz 2']], which, 'pickResult', 'aria-label="Choose a quiz"');
  if (which === 'mq2') return resultsMq2(tabs);
  if (omarExamStatus('mq3') !== 'ready') {
    return `<div class="page-h"><h1>${t('pickResult')}</h1>${tabs}</div>
      <section class="card stack"><h2>${EXAMS.mq3}</h2>${statusTrack(omarExamStatus('mq3'))}<p style="font-size:17px">${omarExamStatus('mq3') === 'todo' ? 'You have not uploaded this quiz yet.' : t('stillChecking')}</p>
      ${omarExamStatus('mq3') === 'todo' ? `<div><button type="button" class="btn primary" data-act="go" data-to="upload">${t('uploadNow')}</button></div>` : ''}</section>`;
  }
  const items = omarItems();
  const total = items.reduce((a, i) => a + i.mark, 0);
  const shown = S.stu.moreQs ? items : items.slice(0, 3);
  return `
    <div class="page-h"><div class="stack sm"><h1>${EXAMS.mq3}</h1><div class="row"><span class="chip ok">${icon('check')}${t('checkedBy')}</span>${ft('S5')}${tabs}</div></div>
      <div class="grade-box"><div class="small muted">${t('myGrade')}</div><div class="num">${total} / ${QUIZ_TOTAL}</div></div></div>
    ${S.lang === 'de' ? `<div class="notice">${icon('info')}<span>${t('feedbackLang')}</span></div>` : ''}
    <section class="card soft row nowrap">${icon('star', 'style="width:30px;height:30px;color:#C08A00;flex:none"')}<div><strong>${t('whatWell')}</strong> ${ft('S6')}<div>You showed every step clearly, and your adding of fractions was great!</div></div>
      <button type="button" class="icon-btn" style="margin-left:auto" data-act="read" data-text="You showed every step clearly, and your adding of fractions was great!" aria-label="${t('readToMe')}">${icon('speaker')}</button></section>
    ${shown.map(it => {
      const ok = it.mark >= it.max;
      const say = ok ? 'Well done!' : `${it.well ? 'Well done: ' + it.well + ' ' : ''}Fix: ${it.fix}`;
      return `<section class="card result-q" ${!ok && it.type !== 'careless' ? 'style="border:2px solid var(--ink)"' : ''}>
        <div class="scan">${resultScan(it)}</div>
        <div class="stack sm">
          <div class="row"><strong style="font-size:17px">${t('question', it.q)} · ${ok ? `${t('correct')} ${icon('check', 'style="width:18px;height:18px;color:var(--ok);vertical-align:-3px"')}` : t('ofMarks', it.mark, it.max)}</strong>${kindLabel(it)} ${ok ? '' : ft('S7')}</div>
          ${ok ? `<span>${t('wellDone')}</span>` : `${it.well && it.type !== 'careless' ? `<span><strong>${t('wellLabel')}</strong> ${esc(it.well)}</span>` : ''}<span><strong>${t('fixLabel')}</strong> ${esc(it.fix)}</span>`}
        </div>
        <div class="stack sm" style="align-items:flex-end">
          <button type="button" class="icon-btn" data-act="read" data-text="${esc(say)}" aria-label="${t('readToMe')}">${icon('speaker')}</button>
          ${!ok && it.type === 'concept' ? `<button type="button" class="btn primary sm" data-act="go" data-to="progress">${t('practise')}</button>` : ''}
        </div>
      </section>`;
    }).join('')}
    <button type="button" class="btn dashed block" data-act="toggleMoreQs">${S.stu.moreQs ? 'Show fewer questions' : t('moreQs')}</button>`;
}
function resultsMq2(tabs) {
  return `<div class="page-h"><div class="stack sm"><h1>${EXAMS.mq2}</h1><div class="row"><span class="chip ok">${icon('check')}${t('checkedBy')}</span>${tabs}</div></div>
    <div class="grade-box"><div class="small muted">${t('myGrade')}</div><div class="num">18 / 20</div></div></div>
    <section class="card soft row nowrap">${icon('star', 'style="width:30px;height:30px;color:#C08A00;flex:none"')}<div><strong>${t('whatWell')}</strong><div>Your 7 times table is getting strong!</div></div></section>
    <section class="card result-q"><div class="scan"><span class="hand md">9 × 6 = <span class="circle-mark">45</span></span></div>
      <div class="stack sm"><div class="row"><strong style="font-size:17px">${t('question', 4)} · ${t('ofMarks', 0, 2)}</strong><span class="chip careless">${t('checkAgain')}</span></div><span><strong>${t('fixLabel')}</strong> Look again: 9 × 6 = 54. You swapped the digits.</span></div>
      <button type="button" class="icon-btn" data-act="read" data-text="Look again: 9 times 6 is 54." aria-label="${t('readToMe')}">${icon('speaker')}</button></section>
    <p class="muted">${t('allCorrect')}</p>`;
}
A.pickResult = el => { S.stu.resultsFor = el.dataset.v; render(); };
A.toggleMoreQs = () => { S.stu.moreQs = !S.stu.moreQs; render(); };

/* ----- Screen 6 · My progress (S8, S11, S12) ----- */
function omarProgress() {
  const out = {};
  const items = omarExamStatus('mq3') === 'ready' ? omarItems() : null;
  TOPIC_KEYS.forEach(k => {
    const past = OMAR_PAST[k].slice();
    if (items) {
      const qs = items.filter(i => Q(i.q).topic === k && !(i.type === 'careless' && i.mark < i.max));
      const right = qs.filter(i => i.mark >= i.max).length;
      past.push(qs.length ? Math.round(100 * right / qs.length) : 100);
    }
    out[k] = past;
  });
  return out;
}
function lineChart(vals) {
  const W = 520, H = 210, L = 46, R = 20, T = 14, B = 34;
  const xs = [0, 1, 2].map(i => L + i * (W - L - R) / 2);
  const y = v => T + (100 - v) * (H - T - B) / 100;
  const pts = vals.map((v, i) => [xs[i], y(v)]);
  const grid = [0, 50, 100].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-dasharray="${v ? '3 4' : ''}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`).join('');
  const area = pts.length > 1 ? `<path d="M${pts[0][0]},${y(0)} ${pts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${pts[pts.length - 1][0]},${y(0)} Z" fill="var(--accent-soft)"/>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress: ${vals.map((v, i) => `Quiz ${i + 1} ${v}%`).join(', ')}">
    ${grid}${area}
    <polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>
    ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 7 : 5}" fill="${i === pts.length - 1 ? 'var(--accent)' : 'var(--surface)'}" stroke="var(--accent)" stroke-width="3"/><text x="${p[0]}" y="${p[1] - 13}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${vals[i]}%</text>`).join('')}
    ${xs.map((x, i) => `<text x="${x}" y="${H - 10}" text-anchor="middle">${t('quiz', i + 1)}${i === 2 && vals.length < 3 ? ' · soon' : ''}</text>`).join('')}
  </svg>`;
}
function omarPracticeList() {
  const list = [{ key: 'sheet1', ...PRACTICE.sheet1 }];
  S.sent.filter(m => m.to.includes('omar') && m.practice).forEach(m => { if (!list.find(l => l.key === m.practice)) list.push({ key: m.practice, ...PRACTICE[m.practice] }); });
  return list;
}
function sProgress() {
  const prog = omarProgress();
  const topic = S.stu.topic;
  const flag = S.flags.omar && S.flags.omar.status === 'confirmed';
  const practice = omarPracticeList();
  return `
    <div class="page-h"><div class="stack sm"><h1>${t('nav_progress')}</h1><p class="muted">${t('onlyYou')}</p></div></div>
    <div class="dash-grid" style="grid-template-columns:1fr 320px">
      <div class="stack">
        <section class="card stack">
          <div class="card-h"><h2>${t('howGrowing')} ${ft('S12')}</h2></div>
          <div class="row">${TOPIC_KEYS.map(k => `<button type="button" class="btn sm" data-act="pickTopic" data-k="${k}" aria-pressed="${topic === k}" style="${topic === k ? 'background:var(--ink);color:#fff;border-color:var(--ink)' : ''}">${topicName(k)}</button>`).join('')}</div>
          ${lineChart(prog[topic])}
          <p class="small muted">${t('pctRight')} · ${t('carelessNot')}</p>
        </section>
        <section class="card stack sm">
          ${TOPIC_KEYS.map(k => { const v = prog[k][prog[k].length - 1]; return `<div class="topic-row"><span>${topicName(k)}</span><div class="bar"><span style="width:${v}%"></span></div><span class="num small">${v}%</span></div>`; }).join('')}
        </section>
      </div>
      <div class="stack">
        <section class="card stack sm" ${flag ? 'style="border:2px solid var(--ink)"' : ''}>
          <h2 style="font-size:17px">${t('workingOn')} ${ft('S8')}</h2>
          <div class="row nowrap">${icon('users', 'style="width:30px;height:30px;color:var(--accent);flex:none"')}<p style="font-size:16px">${flag ? t('teacherHelp', topicName(S.flags.omar.topic).toLowerCase()) : t('nothingWorking')}</p></div>
        </section>
        <section class="card stack sm">
          <h2 style="font-size:17px">${t('myPractice')} ${ft('S11')}</h2>
          ${practice.map(p => `<label class="check" style="min-height:40px"><input type="checkbox" data-act="togglePractice" data-k="${p.key}" ${S.stu.practice[p.key] ? 'checked' : ''}><span style="${S.stu.practice[p.key] ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(p.title)}</span></label>`).join('')}
          <span class="small muted">${t('addedBy')}</span>
          ${practice.some(p => !S.stu.practice[p.key]) ? `<button type="button" class="btn primary" data-act="startPractice" data-k="${practice.find(p => !S.stu.practice[p.key]).key}">${t('startPractising')}</button>` : ''}
        </section>
      </div>
    </div>`;
}
A.pickTopic = el => { S.stu.topic = el.dataset.k; render(); };
A.togglePractice = el => { const k = el.dataset.k; S.stu.practice[k] = !S.stu.practice[k]; render(); };
A.startPractice = el => { S.modal = { type: 'practice', key: el.dataset.k, step: 0, picked: null }; render(); };

/* Practice sheet: a tiny comparing-fractions game (S11) */
const PRACTICE_ITEMS = [['2/3', '3/4', '<', 'Change both to twelfths: 8/12 and 9/12.'], ['5/8', '1/2', '>', '1/2 is the same as 4/8, and 5/8 is bigger.'], ['3/5', '7/10', '<', '3/5 is the same as 6/10, and 6/10 is smaller than 7/10.']];
MODALS.practice = m => {
  const p = PRACTICE[m.key] || PRACTICE.sheet2;
  if (m.step >= PRACTICE_ITEMS.length) {
    return { title: esc(p.title), body: `<div class="celebrate" style="padding:10px"><div class="big-check">${icon('check')}</div><h2>All done! Great work.</h2><p>Ms. Sara will see that you finished this sheet.</p></div>`,
      foot: `<button type="button" class="btn primary lg" data-act="finishPractice">Close</button>` };
  }
  const [a, b, ans, why] = PRACTICE_ITEMS[m.step];
  const res = m.picked ? (m.picked === ans ? 'ok' : 'no') : null;
  return { title: `${esc(p.title)} · ${m.step + 1} of ${PRACTICE_ITEMS.length}`,
    body: `<p style="font-size:17px">Which sign goes in the middle?</p>
      <div class="reading" style="justify-content:center;font-size:56px">${a} <span class="slot" style="width:70px;height:70px;font-size:44px">${m.picked ? esc(m.picked) : '?'}</span> ${b}</div>
      <div class="row" style="justify-content:center">${['<', '>'].map(s => `<button type="button" class="btn lg" style="min-width:110px;font-size:28px" data-act="pickSign" data-s="${s}">${s === '<' ? '&lt;' : '&gt;'}</button>`).join('')}</div>
      ${res === 'ok' ? `<div class="notice ok">${icon('check')}<span><strong>Yes!</strong> ${why}</span></div>` : ''}
      ${res === 'no' ? `<div class="notice warn">${icon('info')}<span><strong>Not yet. Try again!</strong> Tip: make the bottom numbers the same first.</span></div>` : ''}`,
    foot: `<button type="button" class="btn" data-act="read" data-text="Which is bigger, ${a} or ${b}?">${icon('speaker')}${t('readToMe')}</button><button type="button" class="btn primary" data-act="nextPractice" ${res === 'ok' ? '' : 'disabled'}>Next</button>` };
};
A.pickSign = el => { S.modal.picked = el.dataset.s; render(); };
A.nextPractice = () => { S.modal.step += 1; S.modal.picked = null; render(); };
A.finishPractice = () => { S.stu.practice[S.modal.key] = true; S.modal = null; toast('Practice marked as done.'); render(); };

/* ----- Screen 7 · Messages (S9, S10, S11) ----- */
function sMessages() {
  const sel = S.messages.find(m => m.id === S.stu.msgSel);
  return `
    <div class="page-h"><h1>${t('nav_messages')} ${ft('S9')}</h1></div>
    <div class="dash-grid" style="grid-template-columns:330px 1fr">
      <div class="list" role="list">
        ${S.messages.map(m => `<button type="button" class="list-item ${m.id === S.stu.msgSel ? 'sel' : ''}" data-act="openMsg" data-id="${m.id}" role="listitem">
          <span style="width:10px;height:10px;border-radius:50%;flex:none;${m.read ? 'border:2px solid var(--line-strong)' : 'background:var(--accent)'}" aria-label="${m.read ? 'read' : 'unread'}"></span>
          <span class="stack sm" style="gap:2px"><span class="small"><strong>${esc(m.from)}</strong> · <span class="muted">${esc(m.time)}</span></span><span style="${m.read ? '' : 'font-weight:600'}">${esc(m.title)}</span></span></button>`).join('')}
      </div>
      <section class="card stack lg">
        ${sel ? `
          <div class="row between nowrap"><div class="row nowrap">${sel.from === 'System' ? `<span class="avatar" style="background:var(--accent-soft)">${icon('bell', 'style="width:18px;height:18px"')}</span>` : '<span class="avatar" style="background:#F3D1D8">S</span>'}<div><strong>${esc(sel.from)}</strong><div class="small muted">${esc(sel.time)}</div></div></div>
            <button type="button" class="icon-btn" data-act="read" data-text="${esc(sel.body)}" aria-label="${t('readToMe')}">${icon('speaker')}</button></div>
          <p class="msg-body">${esc(S.lang === 'de' && sel.bodyDe ? sel.bodyDe : sel.body)}</p>
          ${sel.practice ? `<div class="attach"><span class="ico">${icon('sheet')}</span><div class="grow"><strong>Practice: ${esc(PRACTICE[sel.practice].title)}</strong><div class="small muted">${esc(PRACTICE[sel.practice].sub)}</div></div>
            <button type="button" class="btn primary" data-act="startPractice" data-k="${sel.practice}">${t('open')}</button>${ft('S11')}</div>` : ''}
          ${sel.from !== 'System' ? `<div class="stack sm" style="margin-top:auto"><strong>${t('replyTo')} ${ft('S10')}</strong>
            ${sel.reply ? `<div class="notice ok">${icon('check')}<span>${t('youReplied', sel.reply === 'understand' ? t('iUnderstand') : t('iNeedHelp'))}</span></div>` : ''}
            <div class="grid2">
              <button type="button" class="btn big-reply" data-act="replyMsg" data-r="understand" ${sel.reply === 'understand' ? 'style="border:2px solid var(--ok);background:var(--ok-soft)"' : ''}>${icon('thumb')}${t('iUnderstand')}</button>
              <button type="button" class="btn big-reply" data-act="replyMsg" data-r="help" ${sel.reply === 'help' ? 'style="border:2px solid var(--warn);background:var(--warn-soft)"' : ''}>${icon('hand')}${t('iNeedHelp')}</button>
            </div></div>` : ''}`
          : `<p class="muted">${t('noMessage')}</p>`}
      </section>
    </div>`;
}
A.openMsg = el => { S.stu.msgSel = el.dataset.id; const m = S.messages.find(x => x.id === el.dataset.id); if (m) m.read = true; render(); };
A.replyMsg = el => {
  const m = S.messages.find(x => x.id === S.stu.msgSel);
  if (!m) return;
  m.reply = el.dataset.r;
  S.inbox.unshift({ id: 'in-' + Date.now(), from: 'Omar', kind: 'reply', text: m.reply === 'understand' ? 'I understand' : 'I need help', about: m.practice ? `Practice: ${PRACTICE[m.practice].title}` : m.title, time: 'Just now', read: false, msgId: m.id });
  toast(t('youReplied', m.reply === 'understand' ? t('iUnderstand') : t('iNeedHelp')));
  render();
};

/* Read aloud: what each student screen reads (G4) */
function readScreenText() {
  if (S.role !== 'student') return document.querySelector('.main h1, .phone h1')?.textContent || '';
  const s = S.screen;
  if (s === 'home') return `${t('hi', 'Omar')} ${t('whatToday')} ${t('uploadMyExam')}. ${unreadCount() ? t('newN', unreadCount()) + ' ' + t('nav_messages') : ''}`;
  if (s === 'upload') return `${t('uploadMyExam')}. ${t('tip1')}. ${t('tip2')}. ${t('tip3')}.`;
  if (s === 'pages') return `${t('allPagesHere')} ${t('teacherFirst')}`;
  if (s === 'sent') return `${t('sentTitle')} ${t('sentSub')}`;
  if (s === 'results') {
    const items = omarItems();
    if (S.stu.resultsFor === 'mq3' && items && omarExamStatus('mq3') === 'ready') return `Math Quiz 3. ${t('myGrade')}: ${items.reduce((a, i) => a + i.mark, 0)} of ${QUIZ_TOTAL}. You showed every step clearly.`;
    return t('stillChecking');
  }
  if (s === 'progress') return `${t('nav_progress')}. ${S.flags.omar && S.flags.omar.status === 'confirmed' ? t('teacherHelp', topicName(S.flags.omar.topic)) : t('nothingWorking')}`;
  if (s === 'messages') { const m = S.messages.find(x => x.id === S.stu.msgSel); return m ? m.body : t('noMessage'); }
  return '';
}
