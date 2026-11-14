/* Teacher view (screens 8–15): Ms. Sara Hassan, class 5B, desktop web. */

/* ================= quiz model ================= */
function openQuiz(silent) {
  if (!S.omarUploaded) {
    S.omarUploaded = true;
    if (!silent) toast('Omar’s paper was added so the review has 27 papers. Run Task 1 first to upload it from the student view.', { icon: 'info', ms: 6000 });
  }
  S.quiz.opened = true;
}
function verifiedReading(sid, n) {
  const cf = S.quiz.cf.find(c => c.sid === sid && c.q === n);
  if (cf) return cf.final ?? answerText(sid, n);
  const qc = S.quiz.qc.find(r => r.sid === sid && r.q === n);
  if (qc) return qc.ai;
  return answerText(sid, n);
}
function sumMet(q, met) { return q.rubric.reduce((a, r, i) => a + (met[i] ? r[1] : 0), 0); }
function pastGaps(sid, topic) { return (HISTORY[sid] && HISTORY[sid][topic]) || [0, 0]; }
function makeItem(sid, n) {
  const q = Q(n);
  const read = verifiedReading(sid, n);
  const o = OVERRIDES[`${sid}-${n}`] || {};
  let mark, met, ai;
  if (norm(read) === norm(q.right)) {
    mark = q.marks; met = q.rubric.map(() => true); ai = [mark, mark, mark];
  } else {
    const idx = o.met || q.wrongMet;
    met = q.rubric.map((_, i) => idx.includes(i));
    mark = q.rubric.length ? sumMet(q, met) : 0;
    if (o.got !== undefined && (LOSSES[n] || []).includes(sid)) mark = o.got;
    ai = o.ai ? o.ai.slice() : [mark, mark, mark];
  }
  const type = mark >= q.marks ? null : (o.type || (q.careless ? 'careless' : 'concept'));
  const cf = S.quiz.cf.find(c => c.sid === sid && c.q === n);
  let first = null;
  if (new Set(ai).size > 1) first = 'ai';
  if (cf && cf.mark) {
    const mis = (cf.mark === 'right' && mark < q.marks) || (cf.mark === 'wrong' && mark > 0) || (cf.mark === 'partly' && (mark === 0 || mark === q.marks));
    if (mis) first = 'stage1';
  }
  return { sid, q: n, read, max: q.marks, mark, aiMark: mark, met, ai, type, aiType: type, well: q.well, fix: q.fix, status: 'todo', first, cfMark: cf ? cf.mark : null, fromCf: !!cf, colleague: null };
}
function typeSuggestion(it) {
  const nm = name(it.sid);
  if (!it.aiType) return '';
  if (it.aiType === 'careless') return `AI suggests “careless”: the first time ${nm} made this mistake, and the method is right.`;
  const past = pastGaps(it.sid, Q(it.q).topic);
  const where = [past[0] ? 'Quiz 1' : null, past[1] ? 'Quiz 2' : null].filter(Boolean);
  if (where.length) return `AI suggests “concept gap”: ${nm} made the same mistake in ${where.join(' and ')}.`;
  return `AI suggests “concept gap”: the working shows the method is not right yet.`;
}
function openStage2() {
  if (!S.quiz.s2) {
    const students = {};
    STUDENTS.filter(s => s.id !== 'jonas').forEach(s => { students[s.id] = { items: QUESTIONS.map(q => makeItem(s.id, q.n)), confirmed: false }; });
    S.quiz.s2 = { students, open: {} };
  }
  S.quiz.stage = 2;
}
function stuTotal(sid) { return S.quiz.s2.students[sid].items.reduce((a, i) => a + i.mark, 0); }
function confirmStudent(sid) {
  const st = S.quiz.s2.students[sid];
  st.items.forEach(i => { i.status = 'confirmed'; });
  st.confirmed = true;
}
function refreshConfirmed(sid) {
  const st = S.quiz.s2.students[sid];
  const was = st.confirmed;
  st.confirmed = st.items.every(i => i.status === 'confirmed');
  return !was && st.confirmed;
}
function confirmedCount() { return S.quiz.s2 ? Object.values(S.quiz.s2.students).filter(s => s.confirmed).length : 0; }
function allConfirmed() { return !!S.quiz.s2 && confirmedCount() === 27; }

/* gaps, class-wide topics and red flags (T10, T12, T13, T14) */
function q3Gap(sid, topic) {
  if (!S.quiz.s2 || !S.quiz.s2.students[sid] || !S.quiz.s2.students[sid].confirmed) return null;
  return S.quiz.s2.students[sid].items.some(i => Q(i.q).topic === topic && i.mark < i.max && (i.type === 'concept' || i.type === 'numw')) ? 1 : 0;
}
function q3Types(sid, topic) {
  if (!S.quiz.s2 || !S.quiz.s2.students[sid]) return [];
  return S.quiz.s2.students[sid].items.filter(i => Q(i.q).topic === topic && i.mark < i.max).map(i => i.type);
}
function gapRow(sid, topic) { const p = pastGaps(sid, topic); return [p[0], p[1], q3Gap(sid, topic)]; }
function gapCount(sid, topic) { return gapRow(sid, topic).reduce((a, v) => a + (v || 0), 0); }
function classWide(topic) {
  if (!S.quiz.s2) return false;
  const conf = Object.keys(S.quiz.s2.students).filter(sid => S.quiz.s2.students[sid].confirmed);
  const n = conf.filter(sid => q3Gap(sid, topic)).length;
  return n >= 14;
}
function missedQ(n) {
  if (!S.quiz.s2) return null;
  const conf = Object.keys(S.quiz.s2.students).filter(sid => S.quiz.s2.students[sid].confirmed);
  return { missed: conf.filter(sid => S.quiz.s2.students[sid].items[n - 1].mark < Q(n).marks).length, of: conf.length };
}
function suggestedFlags() {
  if (!S.quiz.s2) return [];
  const out = [];
  Object.keys(S.quiz.s2.students).forEach(sid => {
    if (!S.quiz.s2.students[sid].confirmed) return;
    TOPIC_KEYS.forEach(tp => {
      const row = gapRow(sid, tp);
      if (row[2] === 1 && gapCount(sid, tp) >= 2 && !classWide(tp)) {
        const f = S.flags[sid];
        if (!f || f.topic !== tp) out.push({ sid, topic: tp, count: gapCount(sid, tp), inRow: row.every(v => v === 1) });
      }
    });
  });
  return out;
}
function flagFor(sid) {
  const f = S.flags[sid];
  if (f) return { ...f, sid, decided: true };
  const s = suggestedFlags().find(x => x.sid === sid);
  return s ? { ...s, status: 'suggested', decided: false } : null;
}

/* ================= shell ================= */
function teacherView() {
  const nav = [
    ['dashboard', 'dashboard', t('t_dashboard')], ['assessments', 'list', t('t_assessments')], ['stage1', 'inbox', t('t_review')],
    ['gaps', 'users', t('t_students')], ['class', 'grid', t('t_class')], ['messages', 'chat', t('t_messages')],
  ];
  const active = ({ check: 'stage1', stage2: 'stage1', setup: 'assessments' })[S.screen] || S.screen;
  const screens = { dashboard: tDashboard, assessments: tAssessments, setup: tSetup, stage1: tStage1, check: tCheck, stage2: tStage2, gaps: tGaps, class: tClass, messages: tMessages };
  const unread = S.inbox.filter(i => !i.read).length + (S.quiz.hod === 'replied' ? 1 : 0);
  return `<div class="shell">
    <header class="topbar" style="position:relative">${logo()}
      <div class="search hide-sm" style="margin-left:18px">${icon('search')}<label for="t-search" class="sr">Search</label><input id="t-search" class="input" placeholder="${t('t_search')}" data-enter="search"></div>
      <span class="spacer"></span>${langSwitch()}
      <button type="button" class="icon-btn" data-act="togglePop" aria-label="Notifications, ${unread} new" style="position:relative">${icon('bell')}${unread ? `<span class="badge" style="position:absolute;top:-6px;right:-6px">${unread}</span>` : ''}</button>
      <button type="button" class="who" data-act="signOut" title="${t('signOut')}"><span class="avatar" style="background:#F3D1D8">S</span><span class="hide-sm">Ms. Sara · 5B</span>${icon('logout', 'style="width:18px;height:18px;color:var(--muted)"')}</button>
      ${S.pop === 'notes' ? notifPop() : ''}
    </header>
    <div class="body">
      <nav class="sidenav" aria-label="Teacher menu">
        ${nav.map(([k, ic, label]) => `<button type="button" class="navbtn" data-act="${k === 'stage1' ? 'goReview' : 'go'}" data-to="${k}" ${active === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span>${k === 'messages' && S.inbox.filter(i => !i.read).length ? `<span class="badge">${S.inbox.filter(i => !i.read).length}</span>` : ''}</button>`).join('')}
      </nav>
      <main class="main" id="main"><div class="main-inner">${(screens[S.screen] || tDashboard)()}</div></main>
    </div></div>`;
}
A.goReview = () => go(S.quiz.stage === 2 ? 'stage2' : 'stage1', 'teacher');
A.togglePop = () => { S.pop = S.pop === 'notes' ? null : 'notes'; render(); };
function notifPop() {
  const items = [];
  if (S.quiz.hod === 'replied') items.push(`<button type="button" class="list-item" data-act="readHod">${icon('colleague', 'style="width:20px;height:20px;flex:none"')}<span><strong>Mr. Adel Mansour</strong> sent comments on Math Quiz 3</span></button>`);
  S.inbox.filter(i => !i.read).forEach(i => items.push(`<button type="button" class="list-item" data-act="openInbox" data-id="${i.id}">${icon('chat', 'style="width:20px;height:20px;flex:none"')}<span><strong>${esc(i.from)}</strong> ${i.kind === 'reply' ? `replied “${esc(i.text)}”` : 'sent a question'}<br><span class="small muted">${esc(i.about)}</span></span></button>`));
  suggestedFlags().forEach(f => items.push(`<button type="button" class="list-item" data-act="openGaps" data-sid="${f.sid}">${icon('flag', 'style="width:20px;height:20px;flex:none;color:var(--gap)"')}<span>Red flag suggested for <strong>${name(f.sid)}</strong>: ${topicName(f.topic).toLowerCase()}</span></button>`));
  return `<div class="pop" role="dialog" aria-label="Notifications"><h3>Notifications</h3>${items.length ? `<div class="stack" style="gap:0">${items.join('')}</div>` : '<p class="muted small" style="padding:14px">Nothing new.</p>'}</div>`;
}
A.search = el => {
  const q = el.value.trim().toLowerCase();
  if (!q) return;
  const st = STUDENTS.find(s => s.name.toLowerCase().startsWith(q));
  if (st) { S.gapStudent = st.id; go('gaps'); return; }
  if ('math quiz 3'.includes(q) || q.includes('quiz')) { A.goReview(); return; }
  toast(`No student or assessment matches “${esc(el.value)}”.`, { icon: 'info' });
};
A.openGaps = el => { S.gapStudent = el.dataset.sid; go('gaps'); };

/* ================= Screen 8 · Dashboard ================= */
function tDashboard() {
  const flags = suggestedFlags();
  const decided = Object.values(S.flags).filter(f => f.status === 'confirmed').length;
  const wideWord = classWide('word');
  const q4 = missedQ(4);
  const missing = ['jonas', ...(S.omarUploaded ? [] : ['omar'])];
  const toReview = (S.quiz.released && !S.quiz.reopened ? 0 : 1) + 1;
  const second = 1 + (S.quiz.hod === 'pending' ? 1 : 0) + (S.quiz.s2 ? Object.values(S.quiz.s2.students).flatMap(s => s.items).filter(i => i.colleague && i.colleague.status === 'pending').length : 0) + S.quiz.cf.filter(c => c.colleague && c.colleague.status === 'pending').length;
  const unreadReplies = S.inbox.filter(i => !i.read);
  const tiles = [
    ['To review', toReview, 'assessments', '', 'goReview'],
    [`Check-first answers ${ft('T4')}`, S.quiz.stage === 1 ? cfLeft() : 0, 'left · you read these first', S.quiz.stage === 1 && cfLeft() ? 'warn' : '', 'goReview'],
    ['Quick-confirm answers', S.quiz.stage === 1 ? qcLeft() : 0, 'left · AI is confident', '', 'goReview'],
    [`Second review ${ft('T11')}`, second, S.quiz.hod === 'pending' ? 'with Head of Dept. and colleagues' : 'with Head of Dept.', '', 'goReview'],
    [`Red flags ${ft('T13')}`, flags.length, flags.length ? 'to confirm or dismiss' : `${decided} confirmed`, flags.length ? 'gap' : '', flags.length ? 'openGaps' : 'goReview'],
  ];
  return `
    <div class="page-h"><h1>${t('t_morning')} ${ft('T1')}</h1>
      <div class="row"><button type="button" class="btn" data-act="classUpload">${icon('upload')}Upload class papers</button>${ft('T3')}
        <button type="button" class="btn primary" data-act="newAssessment">${icon('plus')}New assessment</button>${ft('T2')}</div></div>
    <div class="tiles">${tiles.map(([l, n, sub, cls, act]) => `<button type="button" class="tile ${cls}" data-act="${act}" ${act === 'openGaps' && flags[0] ? `data-sid="${flags[0].sid}"` : ''}><span class="t-label">${l}</span><span class="t-num num">${n}</span><span class="t-sub">${sub}</span></button>`).join('')}</div>
    <div class="dash-grid">
      <section class="card">
        <div class="card-h"><h2>Assessments ${ft('G5')}</h2><button type="button" class="btn sm ghost" data-act="go" data-to="assessments">See all</button></div>
        ${assessmentTable(true)}
        <div class="row small muted" style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px">
          ${missing.length ? `${missing.length} ${missing.length === 1 ? 'paper' : 'papers'} missing for Math Quiz 3 (${missing.map(name).join(', ')}) ·
          ${S.remindedJonas ? `<span class="chip ok">${icon('check')}Reminder sent</span>` : `<button type="button" class="link" data-act="remind">Remind ${missing.length === 1 ? 'student' : 'students'}</button>`}` : 'All papers are in.'}
        </div>
      </section>
      <section class="stack">
        <h2 style="font-size:17px">Class alerts</h2>
        ${wideWord && q4 ? `<div class="alert-card strong"><h4>${icon('users')}${q4.missed} of ${q4.of} students missed the word problem (Math Quiz 3)</h4><p class="small">${S.reteach ? 'Reteach lesson planned for Sunday.' : 'Reteach word problems to the class?'}</p><div class="row"><button type="button" class="btn sm primary" data-act="go" data-to="class">See class gaps</button>${ft('T14')}</div></div>` : ''}
        ${flags.map(f => `<div class="alert-card" style="border-color:#E7B8AC"><h4>${icon('flag', 'style="color:var(--gap)"')}${name(f.sid)}: same gap in ${f.count} quizzes${f.inRow ? ' in a row' : ''}</h4><p class="small">Red flag suggested: ${topicName(f.topic).toLowerCase()}</p><div class="row"><button type="button" class="btn sm" data-act="openGaps" data-sid="${f.sid}">Review red flag</button>${ft('T13')}</div></div>`).join('')}
        ${unreadReplies.slice(0, 2).map(i => `<div class="alert-card"><h4>${icon('chat')}${esc(i.from)} ${i.kind === 'reply' ? `replied “${esc(i.text)}”` : 'asked a question'}</h4><p class="small">On: ${esc(i.about)}</p><div class="row"><button type="button" class="btn sm" data-act="openInbox" data-id="${i.id}">Open message</button>${ft('S10')}</div></div>`).join('')}
        ${S.quiz.hod === 'replied' ? `<div class="alert-card"><h4>${icon('colleague')}Head of Dept. sent comments</h4><p class="small">Math Quiz 3 · read them before you release.</p><button type="button" class="btn sm" data-act="readHod">Read comments</button></div>` : ''}
        <div class="alert-card dashed"><h4>${icon('eye')}Spot-checks this month: AI wrong in 2 of 40 ${ft('T18')}</h4><p class="small muted">Now and then a confident answer is moved to Check first, to keep the AI honest.</p></div>
      </section>
    </div>`;
}
function assessmentTable(compact) {
  const rows = S.assessments.map(a => {
    let papers, stage, btn;
    if (a.id === 'mq3') {
      papers = `${papersIn()} / 28`;
      const st = mq3StageLabel();
      stage = st === 'Released' ? `<span class="chip ok">${icon('check')}Released</span>` : st.startsWith('Stage') || st === 'Ready for review' || st === 'Ready to release' ? `<span class="chip solid">${st}</span>` : `<span class="chip">${st}</span>`;
      btn = st === 'Released' ? `<button type="button" class="btn sm" data-act="reopen" data-id="mq3">${icon('reopen')}Reopen</button> ${ft('T17')}` : `<button type="button" class="btn sm primary" data-act="goReview">${S.quiz.opened ? 'Continue review' : 'Start review'}</button>`;
    } else {
      papers = a.papers !== undefined ? `${a.papers} / 28` : '0 / 28';
      const st = a.stage;
      stage = st === 'Released' ? `<span class="chip ok">${icon('check')}Released</span>` : st === 'Not started' ? `<span class="chip dash">Not started</span>` : `<span class="chip">${esc(st)}</span>`;
      btn = st === 'Released' ? `<button type="button" class="btn sm" data-act="reopen" data-id="${a.id}">${icon('reopen')}Reopen</button> ${ft('T17')}`
        : st === 'Reopened' ? `<button type="button" class="btn sm primary" data-act="rerelease" data-id="${a.id}">Release again</button>`
        : st === 'Not started' ? `<button type="button" class="btn sm" data-act="notBuilt" data-id="${a.id}">Start review</button>`
        : st.startsWith('Scheduled') ? `<button type="button" class="btn sm" data-act="notBuilt" data-id="${a.id}">View</button>`
        : `<button type="button" class="btn sm" data-act="viewHodEq">View</button>`;
    }
    return `<tr><td><strong>${esc(a.title)}</strong></td><td>${a.type}</td><td class="num">${papers}</td><td>${stage}</td><td style="text-align:right;white-space:nowrap">${btn}</td></tr>`;
  }).join('');
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Assessment</th><th>Type</th><th>Papers</th><th>Stage</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
A.remind = () => { S.remindedJonas = true; toast('Reminder sent to Jonas and his parents.', { icon: 'bell' }); render(); };
A.notBuilt = el => toast(`${esc(S.assessments.find(a => a.id === el.dataset.id).title)} isn’t built out in this prototype. Math Quiz 3 follows the full workflow.`, { icon: 'info', ms: 5000 });
A.viewHodEq = () => toast('English Quiz 2 is with Mr. Adel Mansour (Head of Dept.) for final revision. You’ll be notified when he replies.', { icon: 'colleague', ms: 5000 });
A.reopen = el => { S.modal = { type: 'reopen', id: el.dataset.id }; render(); };
MODALS.reopen = m => {
  const a = S.assessments.find(x => x.id === m.id);
  return { title: `Reopen ${esc(a.title)}?`, body: `<p>You can change marks, mistake types and feedback. Students keep their current results until you release again, and then they are told the results changed. ${ft('T17')}</p>`,
    foot: `<button type="button" class="btn" data-act="closeModal">${t('cancel')}</button><button type="button" class="btn primary" data-act="doReopen" data-id="${m.id}" data-autofocus>${icon('reopen')}Reopen</button>` };
};
A.doReopen = el => {
  const id = el.dataset.id; S.modal = null;
  if (id === 'mq3') { S.quiz.reopened = true; S.screen = 'stage2'; toast('Math Quiz 3 is reopened. Make your changes, then release again.', { icon: 'reopen' }); }
  else { S.assessments.find(a => a.id === id).stage = 'Reopened'; toast('Reopened. Make your changes, then release again.', { icon: 'reopen' }); }
  render(true);
};
A.rerelease = el => { S.assessments.find(a => a.id === el.dataset.id).stage = 'Released'; toast('Released again. Students and parents were told the results changed.'); render(); };

/* Upload class papers (T3) */
A.classUpload = () => { S.modal = { type: 'classUpload', step: 0, file: null }; render(); };
MODALS.classUpload = m => {
  if (m.step === 0) return { title: 'Upload class papers', body: `<p>Scan the whole stack after the quiz. The system matches each paper to a student, and you confirm the matches. ${ft('T3')}</p>
      <div class="field"><label for="cu-a">Assessment</label><select id="cu-a" class="input"><option>Science Quiz 2 (3 papers missing)</option></select></div>
      <label class="add-page" for="cu-file" style="min-height:140px;cursor:pointer"><span class="stack sm" style="align-items:center">${icon('upload')}${m.file ? esc(m.file) : 'Choose the scan (PDF or photos)'}</span></label>
      <input id="cu-file" type="file" class="sr" accept="image/*,application/pdf" multiple data-change="cuFile">`,
    foot: `<button type="button" class="btn" data-act="closeModal">${t('cancel')}</button><button type="button" class="btn" data-act="cuSample">Use a sample scan</button><button type="button" class="btn primary" data-act="cuNext" ${m.file ? '' : 'disabled'}>Match papers</button>` };
  const rows = [['Adam', 'Science Quiz 2 · p.1–2', 98], ['Jonas', 'Science Quiz 2 · p.1–2', 95], ['Nour', 'Science Quiz 2 · p.1–2', 71]];
  return { title: 'Confirm the matches', body: `<p class="small muted">3 papers found. Check the matches with low confidence.</p>
      <table class="table"><thead><tr><th>Paper</th><th>Matched to</th><th>Confidence</th></tr></thead><tbody>${rows.map(([n, p, c]) => `<tr><td>${p}</td><td><select class="input" style="min-height:34px"><option>${n}</option>${STUDENTS.slice(0, 6).map(s => `<option>${s.name}</option>`).join('')}</select></td><td>${c < 80 ? `<span class="chip warn">${c}% · check</span>` : `<span class="chip ok">${c}%</span>`}</td></tr>`).join('')}</tbody></table>`,
    foot: `<button type="button" class="btn" data-act="closeModal">${t('cancel')}</button><button type="button" class="btn primary" data-act="cuConfirm">Confirm matches</button>` };
};
A.cuFile = el => { if (el.files[0]) { S.modal.file = `${el.files.length} file(s): ${el.files[0].name}`; render(); } };
A.cuSample = () => { S.modal.file = 'sample-class-scan.pdf'; S.modal.step = 1; render(); };
A.cuNext = () => { S.modal.step = 1; render(); };
A.cuConfirm = () => { S.modal = null; const a = S.assessments.find(x => x.id === 'sq2'); a.papers = 28; toast('3 papers matched and added to Science Quiz 2.'); render(); };

/* ================= Assessments list + Screen 9 · setup ================= */
function tAssessments() {
  return `<div class="page-h"><h1>${t('t_assessments')}</h1><button type="button" class="btn primary" data-act="newAssessment">${icon('plus')}New assessment</button></div>
    <section class="card">${assessmentTable(false)}</section>`;
}
A.newAssessment = () => {
  S.setup = {
    type: 'quiz', title: 'Math Quiz 4 – Fractions', subject: 'Math', cls: '5B', lang: 'english', date: '2026-11-19', collect: 'students',
    qs: [
      { text: '1/2 + 1/4 = ?', key: '3/4', marks: 1, topic: 'add', rubric: '' },
      { text: 'Compare 2/3 and 3/5 (< or >)', key: '2/3 > 3/5', marks: 2, topic: 'cmp', rubric: '1 · same denominator\n1 · correct sign' },
      { text: '6 × 9 = ?', key: '54', marks: 1, topic: 'mul', rubric: '' },
      { text: 'Word problem: sharing a cake', key: '5/8 eaten', marks: 3, topic: 'word', rubric: '1 · correct steps\n1 · calculation\n1 · answer sentence' },
    ],
  };
  go('setup', 'teacher');
};
function tSetup() {
  const s = S.setup;
  if (!s) { A.newAssessment(); return ''; }
  const total = s.qs.reduce((a, q) => a + (+q.marks || 0), 0);
  return `<div class="crumbs"><button type="button" data-act="go" data-to="assessments">${t('t_assessments')}</button> › New assessment</div>
    <div class="page-h"><h1>New assessment ${ft('T2')}</h1></div>
    <section class="card">
      <div class="row" style="gap:16px;align-items:flex-end">
        <div class="field"><span class="label">Type</span>${seg([['quiz', 'Quiz'], ['exam', 'Exam']], s.type, 'setupType')}</div>
        <div class="field grow"><label for="su-title">Title</label><input id="su-title" class="input" value="${esc(s.title)}" data-model="setup.title"></div>
        <div class="field"><label for="su-subj">Subject</label><select id="su-subj" class="input" data-model="setup.subject"><option>Math</option><option>Science</option><option>English</option></select></div>
        <div class="field"><label for="su-cls">Class</label><select id="su-cls" class="input"><option>5B</option></select></div>
        <div class="field"><span class="label">Exam language</span>${seg([['english', 'English'], ['german', 'German']], s.lang, 'setupLang')}</div>
        <div class="field"><label for="su-date">Date</label><input id="su-date" type="date" class="input" value="${s.date}" data-model="setup.date"></div>
      </div>
      ${s.lang === 'german' ? `<div class="notice" style="margin-top:12px">${icon('info')}<span>German exam: answers with a reversed number (42 written for 24) go to Check first, and you can type them as a number-writing mistake. Feedback is written in German. ${ft('T5')}</span></div>` : ''}
    </section>
    <div class="dash-grid" style="grid-template-columns:1fr 320px">
      <section class="card">
        <div class="card-h"><h2>Questions, answer key and rubric</h2><label class="btn sm" for="su-key" style="cursor:pointer">${icon('upload')}Upload answer key</label><input id="su-key" type="file" class="sr" data-change="keyFile"></div>
        <div class="table-wrap"><table class="table setup-table"><thead><tr><th>#</th><th>Question</th><th>Answer key</th><th>Marks</th><th>Topic tag</th><th>Partial credit (rubric)</th><th></th></tr></thead><tbody>
          ${s.qs.map((q, i) => `<tr>
            <td>${i + 1}</td>
            <td><input id="su-q${i}" class="input" value="${esc(q.text)}" data-model="setup.qs.${i}.text" aria-label="Question ${i + 1}"></td>
            <td><input id="su-k${i}" class="input" value="${esc(q.key)}" data-model="setup.qs.${i}.key" style="width:110px" aria-label="Answer key ${i + 1}"></td>
            <td><input id="su-m${i}" class="input num" type="number" min="1" max="10" value="${q.marks}" data-model="setup.qs.${i}.marks" data-rerender style="width:64px" aria-label="Marks ${i + 1}"></td>
            <td><select id="su-t${i}" class="input" data-model="setup.qs.${i}.topic" aria-label="Topic ${i + 1}">${TOPIC_KEYS.map(k => `<option value="${k}" ${q.topic === k ? 'selected' : ''}>${TOPICS[k].en}</option>`).join('')}</select></td>
            <td><textarea id="su-r${i}" class="input" rows="2" style="min-height:38px;font-size:13px" placeholder="—" data-model="setup.qs.${i}.rubric" aria-label="Rubric ${i + 1}">${esc(q.rubric)}</textarea></td>
            <td><button type="button" class="icon-btn sm" data-act="delQ" data-i="${i}" aria-label="Delete question ${i + 1}">${icon('trash')}</button></td></tr>`).join('')}
        </tbody></table></div>
        <div class="row between" style="margin-top:10px"><button type="button" class="btn dashed sm" data-act="addQ">${icon('plus')}Add question</button><span class="small muted">Total: <strong class="num">${total}</strong> marks</span></div>
        <p class="small muted" style="margin-top:10px">Topic tags let the system find learning gaps. Rubric steps let the AI give partial credit.</p>
      </section>
      <section class="card stack">
        <h2 style="font-size:16px">How papers are collected</h2>
        <label class="radio-card"><input type="radio" name="collect" data-act="setCollect" data-v="students" ${s.collect === 'students' ? 'checked' : ''}><span><strong>Students upload their own</strong><br><span class="small muted">From the student app, after the quiz ${ft('S2')}</span></span></label>
        <label class="radio-card"><input type="radio" name="collect" data-act="setCollect" data-v="stack" ${s.collect === 'stack' ? 'checked' : ''}><span><strong>I upload the class stack</strong><br><span class="small muted">One scan of all papers ${ft('T3')}</span></span></label>
        ${s.collect === 'stack' ? `<div class="notice dashed small">${icon('info')}<span>After the quiz, scan the papers and upload them from the dashboard. The system matches each paper to a student, and you confirm the matches.</span></div>` : ''}
        <div class="stack sm"><strong class="small">What students will see</strong><p class="small">“${esc(s.title)}” appears in their upload list on ${new Date(s.date + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.</p></div>
        <div class="row" style="margin-top:auto"><button type="button" class="btn grow" data-act="saveDraft">Save draft</button><button type="button" class="btn primary grow" data-act="publishSetup">Publish to 5B</button></div>
      </section>
    </div>`;
}
A.setupType = el => { S.setup.type = el.dataset.v; render(); };
A.setupLang = el => { S.setup.lang = el.dataset.v; render(); };
A.setCollect = el => { S.setup.collect = el.dataset.v; render(); };
A.addQ = () => { S.setup.qs.push({ text: '', key: '', marks: 1, topic: 'add', rubric: '' }); render(); setTimeout(() => { const el = document.getElementById(`su-q${S.setup.qs.length - 1}`); if (el) el.focus(); }, 0); };
A.delQ = el => { const i = +el.dataset.i; const removed = S.setup.qs.splice(i, 1)[0]; render(); toast('Question deleted.', { icon: 'trash', undo: () => S.setup.qs.splice(i, 0, removed) }); };
A.keyFile = el => { if (el.files[0]) toast(`Answer key “${esc(el.files[0].name)}” attached. In the real system the keys would fill in automatically.`, { icon: 'file', ms: 5000 }); };
A.saveDraft = () => toast('Draft saved.');
A.publishSetup = () => {
  const s = S.setup;
  const missing = s.qs.findIndex(q => !q.text.trim() || !q.key.trim());
  if (!s.title.trim()) { toast('Give the assessment a title first.', { icon: 'alert' }); return; }
  if (missing >= 0) { toast(`Question ${missing + 1} needs a question and an answer key.`, { icon: 'alert' }); const el = document.getElementById(`su-q${missing}`); if (el) el.focus(); return; }
  const d = new Date(s.date + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  S.assessments.unshift({ id: 'new' + Date.now(), title: s.title, type: s.type === 'quiz' ? 'Quiz' : 'Exam', papers: 0, stage: `Scheduled ${d}` });
  S.setup = null;
  toast(`Published to 5B. Students see it in their upload list on ${d}.`);
  go('dashboard');
};

/* ================= Screen 10 · Stage 1: two lists ================= */
function reviewSteps(cur) {
  return stepper(['Text check', 'Grade check', 'Release'], cur);
}
function tStage1() {
  openQuiz();
  if (S.quiz.stage === 2) return tStage2();
  const q = S.quiz;
  const todo = q.cf.filter(c => c.status !== 'done');
  const done = q.cf.filter(c => c.status === 'done');
  const checked = checkedCount();
  const pct = Math.round(100 * checked / q.total);
  return `
    <div class="crumbs"><button type="button" data-act="go" data-to="dashboard">${t('t_review')}</button> › Math Quiz 3 – Fractions · 5B</div>
    <div class="page-h"><h1>Stage 1: check what the AI read</h1>${reviewSteps(0)}</div>
    <div class="notice dashed">${icon('lock')}<span>AI grades stay hidden until every answer’s text is checked. You check the text first, then the grades.</span></div>
    <div class="two-lists">
      <section class="card" style="padding:0;${todo.length ? 'border:2px solid var(--ink)' : ''}">
        <div style="padding:16px 16px 10px" class="stack sm">
          <div class="row between"><h2 style="font-size:17px" class="row">Check first <span class="badge" style="background:var(--ink)">${todo.length}</span> ${ft('T4')}</h2><span class="small muted">You read these yourself</span></div>
          <div class="row" style="gap:6px"><span class="small muted">Why:</span>${Object.entries(REASONS).map(([k, r]) => `<span class="chip ${r.cls}">${r.label}</span>`).join('')}${ft('T5')}</div>
        </div>
        <div style="border-top:1px solid var(--line);max-height:520px;overflow-y:auto" data-keep-scroll="cf">
          ${todo.map((c, i) => `<div class="cf-item ${i === 0 ? 'first' : ''}">
            <div class="grow stack" style="gap:4px"><strong>${name(c.sid)} · Q${c.q}</strong>
              <div class="row" style="gap:6px"><span class="chip ${REASONS[c.reason].cls}">${REASONS[c.reason].label}</span>${c.reason === 'spot' ? ft('T18') : ''}
              ${c.colleague ? `<span class="chip ${c.colleague.status === 'pending' ? 'dash' : 'accent'}">${icon('colleague')}${c.colleague.status === 'pending' ? `Asked ${esc(c.colleague.by.split(' ').slice(0, 2).join(' '))}` : 'Colleague replied'}</span>` : ''}</div></div>
            <button type="button" class="btn sm ${i === 0 ? 'primary' : ''}" data-act="openCf" data-id="${c.id}">${i === 0 ? 'Check now' : 'Check'}</button></div>`).join('')}
          ${todo.length ? '' : `<div class="cf-item"><span class="chip ok">${icon('check')}All 14 checked</span></div>`}
          ${done.length ? `<div class="cf-item small muted" style="background:var(--sunken)">${icon('check', 'style="width:16px;height:16px;color:var(--ok)"')}${done.length} checked: ${done.map(c => `<button type="button" class="link small" data-act="openCf" data-id="${c.id}">${name(c.sid)} Q${c.q}</button>`).join(', ')}</div>` : ''}
        </div>
      </section>
      <section class="card" style="padding:0">
        <div class="row between" style="padding:16px 16px 10px">
          <h2 style="font-size:17px" class="row">Quick confirm <span class="chip">${qcLeft()} left of 256</span> ${ft('T7')}</h2>
          <button type="button" class="btn primary sm" data-act="qcAll" ${qcLeft() ? '' : 'disabled'}>${icon('check')}Confirm all ${qcLeft()}</button>
        </div>
        <p class="small muted" style="padding:0 16px 10px">The AI is confident about these. Compare each reading with the scan, fix any that are wrong, then confirm.</p>
        <div class="qc-scroll" data-keep-scroll="qc">
          <table class="table qc-table"><thead><tr><th>Student</th><th>Q</th><th>Scan</th><th>AI reading (edit if wrong)</th><th style="text-align:center">OK</th></tr></thead><tbody>
          ${q.qc.map(r => `<tr class="${r.status === 'done' ? 'done' : ''}">
            <td>${name(r.sid)}</td><td class="num">${r.q}</td>
            <td><div class="scan"><span class="hand">${esc(r.scan)}</span></div></td>
            <td><div class="row nowrap"><label for="qc-${r.id}" class="sr">AI reading for ${name(r.sid)} Q${r.q}</label><input id="qc-${r.id}" class="input ${r.edited ? 'edited' : ''}" value="${esc(r.ai)}" data-qc="${r.id}" ${r.status === 'done' ? 'disabled' : ''}>${r.edited ? '<span class="small" style="color:var(--accent)">edited</span>' : ''}</div></td>
            <td style="text-align:center"><input type="checkbox" class="check" style="width:22px;height:22px;accent-color:var(--accent)" data-act="qcToggle" data-id="${r.id}" ${r.status === 'done' ? 'checked' : ''} aria-label="Reading is right"></td></tr>`).join('')}
          </tbody></table>
        </div>
      </section>
    </div>
    <div class="footbar">
      <span><strong class="num">${checked} of ${q.total}</strong> answers checked <span class="muted">(27 papers × 10 questions)</span></span>
      <div class="bar grow" style="min-width:160px"><span style="width:${pct}%"></span></div>
      <button type="button" class="btn primary" data-act="toStage2" ${stage1Done() ? '' : 'disabled'}>Go to Stage 2: grade check ${icon('right')}</button>
    </div>`;
}
document.addEventListener('input', e => {
  const id = e.target.dataset && e.target.dataset.qc;
  if (!id) return;
  const r = S.quiz.qc.find(x => x.id === id);
  r.ai = e.target.value; r.edited = r.ai !== answerText(r.sid, r.q) || r.id === 'qc-lina-3';
  if (r.id === 'qc-lina-3') r.edited = norm(r.ai) !== norm('7 × 8 = 36');
  render();
});
A.qcToggle = el => { const r = S.quiz.qc.find(x => x.id === el.dataset.id); r.status = r.status === 'done' ? 'todo' : 'done'; render(); };
A.qcAll = () => {
  const left = S.quiz.qc.filter(r => r.status !== 'done');
  left.forEach(r => { r.status = 'done'; });
  toast(`${left.length} readings confirmed.`, { undo: () => left.forEach(r => { r.status = 'todo'; }) });
  render();
};
A.toStage2 = () => { openStage2(); S.quiz.s2Sel = firstUnconfirmed() || 'omar'; go('stage2'); };
function firstUnconfirmed() {
  const order = stage2Order();
  return order.find(sid => !S.quiz.s2.students[sid].confirmed);
}
function stage2Order() {
  const ids = Object.keys(S.quiz.s2.students);
  const firstish = sid => S.quiz.s2.students[sid].items.some(i => i.first) ? 0 : 1;
  const lead = ['lina', 'omar', 'youssef', 'mariam', 'adam'];
  return ids.sort((a, b) => {
    const la = lead.indexOf(a), lb = lead.indexOf(b);
    if (la >= 0 || lb >= 0) return (la < 0 ? 99 : la) - (lb < 0 ? 99 : lb);
    return firstish(a) - firstish(b) || name(a).localeCompare(name(b));
  });
}

/* ================= Screens 11–12 · Check first: read, then compare ================= */
A.openCf = el => { S.quiz.cfSel = el.dataset.id; go('check'); };
function tCheck() {
  const q = S.quiz;
  const c = q.cf.find(x => x.id === q.cfSel);
  if (!c) return tStage1();
  const idx = q.cf.indexOf(c);
  const qq = Q(c.q);
  const nav = `<div class="row nowrap"><button type="button" class="icon-btn sm" data-act="cfStep" data-d="-1" ${idx === 0 ? 'disabled' : ''} aria-label="Previous answer">${icon('left')}</button><button type="button" class="icon-btn sm" data-act="cfStep" data-d="1" ${idx === q.cf.length - 1 ? 'disabled' : ''} aria-label="Next answer">${icon('right')}</button></div>`;
  const head = `<div class="row between" style="align-items:flex-end">
      <div class="row nowrap"><button type="button" class="btn sm" data-act="go" data-to="stage1">${icon('left')}Back to lists</button>
        <div><div class="small muted">Math Quiz 3 · Stage 1 · Check first ${idx + 1} of ${q.cf.length}</div><h1 style="font-size:22px">${name(c.sid)} · Question ${c.q}${c.revealed ? ': compare readings' : ''} ${ft('T6')}</h1></div></div>
      <div class="row"><span class="chip ${REASONS[c.reason].cls}">Why here: ${REASONS[c.reason].label}</span>${ft('T5')}${nav}</div></div>`;
  const paper = `<section class="card stack">
      <div class="row between"><h2 style="font-size:16px">The child’s paper</h2>
        <div class="row nowrap"><button type="button" class="icon-btn sm" data-act="zoom" data-d="-1" aria-label="Zoom out">${icon('zoomout')}</button><button type="button" class="icon-btn sm" data-act="zoom" data-d="1" aria-label="Zoom in">${icon('zoomin')}</button><button type="button" class="btn sm" data-act="fullPage">Full page</button></div></div>
      <div class="paper child-paper zoom-${q.zoom}">
        <div class="print">${c.q}. ${esc(qq.text)}</div>
        ${(c.q === 2 && (LOSSES[2] || []).includes(c.sid) ? qq.work : []).map(w => `<div class="hand">${esc(w)}</div>`).join('')}
        <div class="hand" style="${c.reason === 'hard' ? 'filter:blur(.6px);transform:skewX(-6deg);opacity:.85' : ''}">${esc(answerText(c.sid, c.q))}</div>
      </div></section>`;
  if (!c.revealed) {
    const ready = c.reading.trim() && c.mark;
    return `${head}
      <div class="check-layout">${paper}
        <div class="stack">
          <section class="card stack sm">
            <h2 style="font-size:16px"><label for="cf-reading">1. What does the answer say?</label></h2>
            <input id="cf-reading" class="input" style="font-size:20px;min-height:50px" value="${esc(c.reading)}" data-cfread="${c.id}" autocomplete="off" placeholder="Type what you see">
            <p class="small muted">Type exactly what the child wrote, even if it is wrong.</p>
            ${c.colleague && c.colleague.status === 'replied' ? `<div class="notice accent">${icon('colleague')}<span><strong>${esc(c.colleague.by)}</strong> read it as “${esc(c.colleague.reading)}”. <button type="button" class="link" data-act="useColleague">Use this reading</button></span></div>` : ''}
          </section>
          <section class="card stack sm"><h2 style="font-size:16px">2. Is it right?</h2>
            ${seg([['right', 'Right'], ['partly', 'Partly'], ['wrong', 'Wrong']], c.mark, 'cfMark', 'aria-label="Is it right?"', 'block lg mark-seg')}
            <p class="small muted">Your mark is compared with the AI’s grade in Stage 2.</p></section>
          <div class="locked-box">${icon('lock')}<span>The AI’s reading is hidden until you finish steps 1 and 2.</span></div>
          <button type="button" class="btn primary lg" data-act="reveal" ${ready ? '' : 'disabled'}>Done – show the AI’s reading</button>
          ${c.colleague && c.colleague.status === 'pending' ? `<div class="notice dashed">${icon('colleague')}<span>Waiting for ${esc(c.colleague.by)}… you can check other answers meanwhile.</span></div>`
            : `<button type="button" class="btn dashed" data-act="askColleagueCf">${icon('colleague')}Can’t read it – ask a colleague</button>${ft('T11')}`}
        </div></div>`;
  }
  // revealed: screen 12
  const same = norm(c.reading) === norm(c.ai);
  const [mine, ai] = diffTokens(c.reading, c.ai);
  const chosen = c.status === 'done' ? c.source : null;
  const doneN = q.cf.filter(x => x.status === 'done').length;
  const markLabel = { right: 'Right', partly: 'Partly right', wrong: 'Wrong' }[c.mark];
  return `${head}
    <div class="check-layout" style="grid-template-columns:.9fr 1.1fr">${paper}
      <div class="stack">
        ${same ? `<div class="notice ok">${icon('check')}<div><strong>The readings match.</strong><div class="small">Your reading goes to grading.</div></div></div>`
          : `<div class="notice warn">${icon('alert')}<div><strong>The readings are different. ${chosen === 'ai' ? 'The AI’s reading will be used.' : 'Your reading will be used.'}</strong><div class="small">${c.reason === 'looks' ? 'The AI may have corrected the child’s mistake while reading it.' : 'Check the highlighted part against the paper.'}</div></div></div>`}
        <div class="compare-grid">
          <section class="card stack sm" ${chosen !== 'ai' ? 'style="border:2px solid var(--ink)"' : ''}><span class="small muted">You read</span><div class="reading">${tokHtml(mine)}</div><span class="small">Your mark: <strong>${markLabel}</strong></span></section>
          <section class="card stack sm" ${chosen === 'ai' ? 'style="border:2px solid var(--ink)"' : ''}><span class="small muted">AI read</span><div class="reading">${tokHtml(ai)}</div><span class="small muted">AI grade appears in Stage 2</span></section>
        </div>
        <section class="card stack sm"><h2 style="font-size:15px">What happens next</h2>
          <ul style="margin:0;padding-left:18px" class="small">
            <li>${chosen === 'ai' ? 'The AI’s reading' : 'Your reading'} “${esc(chosen === 'ai' ? c.ai : c.reading)}” goes to grading.</li>
            <li>In Stage 2 the AI grades it, and its grade is compared with your mark.</li>
            <li>${chosen === 'ai' && c.reason === 'looks' ? '<strong>Careful:</strong> if the AI corrected the child’s answer, the real mistake is hidden and won’t count towards a learning gap.' : 'The child’s real mistake stays visible, so it can count towards a learning gap.'}</li></ul></section>
        <div class="row" style="margin-top:6px">
          ${same ? `<button type="button" class="btn primary" data-act="keepReading" data-src="teacher">${icon('check')}Confirm reading</button>`
            : `<button type="button" class="btn ${chosen !== 'ai' ? 'primary' : ''}" data-act="keepReading" data-src="teacher">${chosen === 'teacher' ? icon('check') : ''}Keep my reading</button>
               <button type="button" class="btn ${chosen === 'ai' ? 'primary' : ''}" data-act="keepReading" data-src="ai">${chosen === 'ai' ? icon('check') : ''}Use the AI’s reading</button>`}
          <button type="button" class="btn sm ghost" data-act="editReading">${icon('pencil')}Change my reading</button>
          <span class="grow"></span><span class="small muted">${doneN} of ${q.cf.length} done</span>
          <button type="button" class="btn" data-act="nextCf" ${c.status === 'done' ? '' : 'disabled'}>Next answer ${icon('right')}</button>
        </div>
      </div></div>`;
}
document.addEventListener('input', e => {
  const id = e.target.dataset && e.target.dataset.cfread;
  if (!id) return;
  const c = S.quiz.cf.find(x => x.id === id);
  c.reading = e.target.value;
  render();
});
A.cfMark = el => { const c = S.quiz.cf.find(x => x.id === S.quiz.cfSel); c.mark = el.dataset.v; render(); };
A.reveal = () => { const c = S.quiz.cf.find(x => x.id === S.quiz.cfSel); c.revealed = true; render(); };
A.editReading = () => { const c = S.quiz.cf.find(x => x.id === S.quiz.cfSel); c.revealed = false; c.status = 'todo'; c.source = null; render(); setTimeout(() => document.getElementById('cf-reading')?.focus(), 0); };
A.keepReading = el => {
  const c = S.quiz.cf.find(x => x.id === S.quiz.cfSel);
  c.source = el.dataset.src; c.final = c.source === 'ai' ? c.ai : c.reading; c.status = 'done';
  render();
};
A.nextCf = () => {
  const q = S.quiz; const i = q.cf.findIndex(x => x.id === q.cfSel);
  const next = q.cf.slice(i + 1).concat(q.cf.slice(0, i)).find(x => x.status !== 'done' && !(x.colleague && x.colleague.status === 'pending'));
  if (next) { q.cfSel = next.id; q.zoom = 1; go('check'); }
  else { toast(cfLeft() ? 'The rest are waiting for a colleague.' : 'All check-first answers are done. Now the quick-confirm list.'); go('stage1'); }
};
A.cfStep = el => { const q = S.quiz; const i = q.cf.findIndex(x => x.id === q.cfSel) + +el.dataset.d; if (q.cf[i]) { q.cfSel = q.cf[i].id; go('check'); } };
A.zoom = el => { S.quiz.zoom = Math.max(0, Math.min(2, S.quiz.zoom + +el.dataset.d)); render(); };
A.fullPage = () => { const c = S.quiz.cf.find(x => x.id === S.quiz.cfSel); S.modal = { type: 'fullPage', sid: c.sid, q: c.q }; render(); };
MODALS.fullPage = m => {
  const page = Object.keys(PAGE_QS).find(p => PAGE_QS[p].includes(m.q));
  return { title: `${name(m.sid)} · Math Quiz 3 · page ${page}`, wide: true, body: `<div class="paper">${PAGE_QS[page].map(n => `<div class="print" style="margin-top:8px">${n}. ${esc(Q(n).text)}</div>${(n === 2 && (LOSSES[2] || []).includes(m.sid) ? Q(2).work : []).map(w => `<div class="hand">${esc(w)}</div>`).join('')}<div class="hand" ${n === m.q ? 'style="background:var(--sun-soft);display:inline-block;padding:0 6px;border-radius:6px"' : ''}>${esc(answerText(m.sid, n))}</div>`).join('')}</div>` };
};
A.askColleagueCf = () => { const c = S.quiz.cf.find(x => x.id === S.quiz.cfSel); S.modal = { type: 'ask', target: 'cf', id: c.id, who: 'karimf', note: '' }; render(); };
A.useColleague = () => { const c = S.quiz.cf.find(x => x.id === S.quiz.cfSel); c.reading = c.colleague.reading; render(); };

/* Ask a colleague (T11), used in Stage 1 and Stage 2 */
MODALS.ask = m => {
  let what = '';
  if (m.target === 'cf') { const c = S.quiz.cf.find(x => x.id === m.id); what = `${name(c.sid)} · Question ${c.q} (the handwriting)`; }
  else { what = `${name(m.sid)} · Question ${m.q} (the mark)`; }
  return { title: 'Ask a colleague', body: `<p class="small muted">${what}. The answer comes back to this screen. ${ft('T11')}</p>
      <div class="stack sm">${COLLEAGUES.filter(c => c.id !== 'adel').map(c => `<label class="radio-card"><input type="radio" name="col" data-act="askWho" data-v="${c.id}" ${m.who === c.id ? 'checked' : ''}><span><strong>${c.name}</strong><br><span class="small muted">${c.role}</span></span></label>`).join('')}</div>
      <div class="field"><label for="ask-note">Note (optional)</label><textarea id="ask-note" class="input" data-model="modal.note" placeholder="Can you read the last line?">${esc(m.note)}</textarea></div>`,
    foot: `<button type="button" class="btn" data-act="closeModal">${t('cancel')}</button><button type="button" class="btn primary" data-act="sendAsk" data-autofocus>${icon('send')}Send</button>` };
};
A.askWho = el => { S.modal.who = el.dataset.v; render(); };
A.sendAsk = () => {
  const m = S.modal; const col = COLLEAGUES.find(c => c.id === m.who);
  S.modal = null;
  if (m.target === 'cf') {
    const c = S.quiz.cf.find(x => x.id === m.id);
    c.colleague = { by: col.name, status: 'pending' };
    toast(`Sent to ${col.name}. You can check the next answer meanwhile.`, { icon: 'colleague' });
    setTimeout(() => { c.colleague = { by: col.name, status: 'replied', reading: answerText(c.sid, c.q) }; toast(`${col.name} replied about ${name(c.sid)}’s Q${c.q}.`, { icon: 'colleague' }); render(); }, 3500);
    A.nextCf();
  } else {
    const it = S.quiz.s2.students[m.sid].items[m.q - 1];
    it.colleague = { by: col.name, status: 'pending' };
    toast(`Sent to ${col.name}.`, { icon: 'colleague' });
    setTimeout(() => { it.colleague = { by: col.name, status: 'replied', text: `I agree with ${it.mark} of ${it.max}. ${it.fix}` }; toast(`${col.name} replied about ${name(m.sid)}’s Q${m.q}.`, { icon: 'colleague' }); render(); }, 3500);
    render();
  }
};

/* ================= Screen 13 · Stage 2: grade check and release ================= */
function tStage2() {
  openStage2();
  const q = S.quiz;
  const sel = q.s2Sel in q.s2.students ? q.s2Sel : 'omar';
  const st = q.s2.students[sel];
  const items = st.items;
  const first = items.filter(i => i.first);
  const wrong = items.filter(i => !i.first && i.mark < i.max);
  const right = items.filter(i => !i.first && i.mark >= i.max);
  const rightTodo = right.filter(i => i.status !== 'confirmed');
  const conf = confirmedCount();
  const released = q.released && !q.reopened;
  const canRelease = allConfirmed() && q.hod !== 'pending' && !released;
  const order = stage2Order();
  const showRight = q.s2.open[sel];
  return `
    <div class="crumbs"><button type="button" data-act="go" data-to="dashboard">${t('t_review')}</button> › Math Quiz 3 – Fractions · 5B</div>
    <div class="page-h"><h1>Stage 2: check the grades</h1>${reviewSteps(released ? 3 : 1)}</div>
    ${q.reopened ? `<div class="notice warn">${icon('reopen')}<span>Reopened. Students still see the old results until you release again. ${ft('T17')}</span></div>` : ''}
    ${q.hod === 'replied' ? `<div class="notice accent">${icon('colleague')}<span class="grow"><strong>Mr. Adel Mansour (Head of Dept.)</strong> sent comments on this quiz.</span><button type="button" class="btn sm" data-act="readHod">Read comments</button></div>` : ''}
    <div class="stage2">
      <section class="card" style="padding:0">
        <div style="padding:12px 14px;border-bottom:1px solid var(--line)" class="row between"><strong>Students</strong><span class="small muted num">${conf}/27</span></div>
        <div class="stu-list" data-keep-scroll="stu">
          ${order.map(sid => { const s = q.s2.students[sid]; const fl = s.items.some(i => i.first && i.status !== 'confirmed');
            return `<button type="button" class="list-item ${sid === sel ? 'sel' : ''}" data-act="s2Pick" data-sid="${sid}">${s.confirmed ? icon('check', 'style="color:var(--ok)"') : '<span style="width:16px;height:16px;border:2px solid var(--line-strong);border-radius:50%;display:inline-block;flex:none"></span>'}<span class="grow" style="${s.confirmed ? 'color:var(--muted)' : sid === sel ? 'font-weight:600' : ''}">${name(sid)}</span>${fl ? `<span class="chip warn" style="padding:0 6px;min-height:20px" title="Shown first">!</span>` : ''}<span class="small muted num">${stuTotal(sid)}</span></button>`; }).join('')}
        </div>
      </section>
      <div class="stack">
        <div class="row between"><div class="row">${avatar(sel)}<h2 style="font-size:19px">${name(sel)}</h2>${st.confirmed ? `<span class="chip ok">${icon('check')}Confirmed</span>` : ''}</div>
          ${st.confirmed && firstUnconfirmed() ? `<button type="button" class="btn sm" data-act="s2Next">Next student: ${name(firstUnconfirmed())} ${icon('right')}</button>` : ''}</div>
        ${first.length ? `<div class="section-label">${icon('alert', 'style="width:16px;height:16px;color:var(--warn)"')}Shown first · ${first.some(i => i.first === 'stage1') ? 'your Stage 1 mark and the AI disagree' : 'the AI’s three gradings disagree'} (${first.length}) ${ft('T8')}</div>${first.map(i => qCard(i)).join('')}` : ''}
        ${wrong.length ? `<div class="section-label">Wrong or partly right · check the mistake type (${wrong.length}) ${ft('T10')}</div>${wrong.map(i => qCard(i)).join('')}` : ''}
        <div class="section-label">Correct · the AI’s gradings agree (${right.length})</div>
        <div class="q-card" style="border-style:dashed">
          <div class="row between"><span>${right.map(i => `Q${i.q}`).join(', ')} · full marks</span>
            <div class="row"><button type="button" class="btn sm" data-act="s2ShowRight">${showRight ? 'Hide' : 'Show'}</button>
            ${rightTodo.length ? `<button type="button" class="btn sm primary" data-act="s2ConfirmRight">Confirm all ${rightTodo.length}</button>` : `<span class="chip ok">${icon('check')}Confirmed</span>`}</div></div>
          ${showRight ? `<div class="stack sm">${right.map(i => `<div class="row nowrap small"><strong style="width:34px">Q${i.q}</strong><div class="scan grow" style="min-height:38px"><span class="hand sm">${esc(i.read)}</span></div><span class="num">${i.mark}/${i.max}</span></div>`).join('')}</div>` : ''}
        </div>
      </div>
      <div class="side stack">
        <section class="card total-box stack sm"><span class="small muted">${name(sel)}’s total</span><span class="num">${stuTotal(sel)} / ${QUIZ_TOTAL}</span><span class="small muted">updates automatically</span></section>
        <section class="card stack sm"><h2 style="font-size:15px">Second review ${ft('T11')}</h2>
          <button type="button" class="btn dashed sm" data-act="askColleagueS2" ${released ? 'disabled' : ''}>${icon('colleague')}Ask a colleague</button>
          ${q.hod === 'pending' ? `<span class="chip dash">${icon('colleague')}With Head of Dept.…</span>` : q.hod === 'done' ? `<span class="chip ok">${icon('check')}Head of Dept. reviewed</span>` : q.hod === 'replied' ? `<button type="button" class="btn sm" data-act="readHod">Read Head of Dept. comments</button>` : `<button type="button" class="btn sm" data-act="sendHod" ${released ? 'disabled' : ''}>Send to Head of Dept.</button>`}
        </section>
        <section class="card stack sm" ${canRelease ? 'style="border:2px solid var(--ink)"' : ''}><h2 style="font-size:15px">Release results ${ft('T16')}</h2>
          <span class="small"><strong class="num">${conf} of 27</strong> students confirmed</span>
          <div class="bar"><span style="width:${Math.round(100 * conf / 27)}%"></span></div>
          ${released ? `<span class="chip ok">${icon('check')}Released</span><button type="button" class="btn sm" data-act="reopen" data-id="mq3">${icon('reopen')}Reopen</button>`
            : `<button type="button" class="btn primary" data-act="release" ${canRelease ? '' : 'disabled'}>${q.reopened ? 'Release again' : 'Release to students'}</button>`}
          <span class="small muted">${q.hod === 'pending' ? 'Waiting for the Head of Dept. before release.' : 'Students and parents are notified when you release.'}</span>
        </section>
      </div>
    </div>`;
}
function typeChip(type) {
  if (type === 'careless') return `<span class="chip careless">Careless</span>`;
  if (type === 'numw') return `<span class="chip numw">Number-writing</span>`;
  if (type === 'concept') return `<span class="chip gap">Concept gap</span>`;
  return '';
}
function qCard(it) {
  const q = Q(it.q);
  const key = `${it.sid}-${it.q}`;
  const released = S.quiz.released && !S.quiz.reopened;
  if (it.status === 'confirmed') {
    return `<div class="q-card confirmed"><div class="q-h"><strong>Q${it.q}</strong><span class="hand sm">${esc(it.read)}</span><span class="chip num">${it.mark} / ${it.max}</span>${typeChip(it.mark < it.max ? it.type : null)}<span class="grow"></span><span class="chip ok">${icon('check')}Confirmed</span>${released ? '' : `<button type="button" class="btn sm" data-act="s2Edit" data-k="${key}">Edit</button>`}</div></div>`;
  }
  const firstChip = it.first === 'ai' ? `<span class="chip solid num">AI gradings: ${it.ai.join(' · ')} of ${it.max}</span>`
    : it.first === 'stage1' ? `<span class="chip warn">Your Stage 1 mark: ${it.cfMark} · AI: ${it.aiMark} / ${it.max}</span>` : '';
  return `<div class="q-card ${it.first ? 'first' : ''}">
    <div class="q-h"><strong>Q${it.q}</strong><span class="hand sm">${esc(it.read)}</span>${it.fromCf ? `<span class="chip">Your reading from Stage 1</span>` : ''}${firstChip}
      ${it.cfMark && !it.first ? `<span class="chip small">You: ${it.cfMark} · AI: ${it.aiMark} / ${it.max}</span>` : ''}</div>
    <div class="small muted">${esc(q.text)} · key: ${esc(q.key)}</div>
    <div class="row" style="align-items:flex-start;gap:18px">
      ${q.rubric.length ? `<div class="stack sm grow"><span class="label">Rubric</span>${q.rubric.map((r, i) => `<label class="check small"><input type="checkbox" data-act="s2Rubric" data-k="${key}" data-i="${i}" ${it.met[i] ? 'checked' : ''}>${esc(r[0])} (${r[1]})</label>`).join('')}</div>` : '<div class="grow small muted">No rubric steps: right or wrong.</div>'}
      <div class="stack sm" style="align-items:flex-end"><label class="label" for="mk-${key}">Mark</label><div class="row nowrap"><input id="mk-${key}" class="input mark-in num" type="number" min="0" max="${it.max}" value="${it.mark}" data-s2mark="${key}"><span>/ ${it.max}</span></div></div>
    </div>
    ${it.mark < it.max ? `<div class="stack sm"><span class="label">Mistake type ${ft('T10')}</span>
      ${seg([['careless', 'Careless'], ['numw', 'Number-writing'], ['concept', 'Concept gap']], it.type, 's2Type', `data-k="${key}" aria-label="Mistake type"`, 'block type-seg')}
      <span class="small muted">${esc(typeSuggestion(it))}</span></div>` : ''}
    <div class="stack sm">
      <div class="row between"><span class="label">Feedback to ${name(it.sid)} ${ft('T9')}</span>
        <select class="input" style="width:auto;min-height:32px;font-size:13px" data-change="s2Saved" data-k="${key}" aria-label="Saved comments"><option value="">Saved comments ▾</option>${SAVED_COMMENTS.map((c, i) => `<option value="${i}">${esc(c)}</option>`).join('')}</select></div>
      <div class="grid2" style="gap:10px">
        <div class="field"><label for="fw-${key}" style="font-size:12px">What you did well</label><textarea id="fw-${key}" class="input" rows="2" data-s2fb="${key}" data-f="well">${esc(it.well)}</textarea></div>
        <div class="field"><label for="ff-${key}" style="font-size:12px">What to fix</label><textarea id="ff-${key}" class="input" rows="2" data-s2fb="${key}" data-f="fix">${esc(it.fix)}</textarea></div>
      </div>
    </div>
    ${it.colleague ? `<div class="notice ${it.colleague.status === 'pending' ? 'dashed' : 'accent'} small">${icon('colleague')}<span>${it.colleague.status === 'pending' ? `Waiting for ${esc(it.colleague.by)}…` : `<strong>${esc(it.colleague.by)}:</strong> ${esc(it.colleague.text)}`}</span></div>` : ''}
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn primary" data-act="s2Confirm" data-k="${key}">${icon('check')}Confirm Q${it.q}</button></div>
  </div>`;
}
function itemByKey(k) { const [sid, n] = k.split('-'); return S.quiz.s2.students[sid].items[+n - 1]; }
A.s2Pick = el => { S.quiz.s2Sel = el.dataset.sid; render(); document.querySelector('.main').scrollTop = 0; };
A.s2Next = () => { S.quiz.s2Sel = firstUnconfirmed(); render(); document.querySelector('.main').scrollTop = 0; };
A.s2ShowRight = () => { const s = S.quiz.s2Sel; S.quiz.s2.open[s] = !S.quiz.s2.open[s]; render(); };
A.s2ConfirmRight = () => {
  const sid = S.quiz.s2Sel;
  S.quiz.s2.students[sid].items.filter(i => !i.first && i.mark >= i.max).forEach(i => { i.status = 'confirmed'; });
  afterConfirm(sid);
};
A.s2Rubric = el => {
  const it = itemByKey(el.dataset.k); const q = Q(it.q);
  it.met[+el.dataset.i] = !it.met[+el.dataset.i];
  it.mark = sumMet(q, it.met);
  if (it.mark < it.max && !it.type) it.type = q.careless ? 'careless' : 'concept';
  render();
};
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.s2mark;
  if (!k) return;
  const it = itemByKey(k);
  let v = Math.round(+e.target.value);
  if (isNaN(v)) v = it.mark;
  it.mark = Math.max(0, Math.min(it.max, v));
  if (it.mark < it.max && !it.type) it.type = Q(it.q).careless ? 'careless' : 'concept';
  render();
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.s2fb;
  if (!k) return;
  itemByKey(k)[e.target.dataset.f] = e.target.value;
});
A.s2Type = el => { const box = el.closest('[data-k]'); const it = itemByKey(box.dataset.k); it.type = el.dataset.v; render(); };
A.s2Saved = el => { if (el.value === '') return; const it = itemByKey(el.dataset.k); it.fix = SAVED_COMMENTS[+el.value]; render(); };
A.s2Edit = el => { const it = itemByKey(el.dataset.k); it.status = 'todo'; S.quiz.s2.students[it.sid].confirmed = false; render(); };
A.s2Confirm = el => { const it = itemByKey(el.dataset.k); it.status = 'confirmed'; afterConfirm(it.sid); };
function afterConfirm(sid) {
  const became = refreshConfirmed(sid);
  if (became) {
    const flags = suggestedFlags().filter(f => f.sid === sid);
    toast(`${name(sid)}’s grades are confirmed: ${stuTotal(sid)} / ${QUIZ_TOTAL}.${flags.length ? ` A red flag is suggested for ${topicName(flags[0].topic).toLowerCase()}.` : ''}`, { icon: flags.length ? 'flag' : 'check', ms: 5000 });
  }
  render();
}
A.askColleagueS2 = () => {
  const sid = S.quiz.s2Sel; const it = S.quiz.s2.students[sid].items.find(i => i.status !== 'confirmed' && i.mark < i.max) || S.quiz.s2.students[sid].items[0];
  S.modal = { type: 'ask', target: 's2', sid, q: it.q, who: 'karimf', note: '' }; render();
};
A.sendHod = () => {
  S.quiz.hod = 'pending';
  toast('Sent to Mr. Adel Mansour (Head of Dept.) for final revision.', { icon: 'colleague' });
  render();
  setTimeout(() => { S.quiz.hod = 'replied'; toast('Mr. Adel Mansour sent comments on Math Quiz 3.', { icon: 'colleague' }); render(); }, 4000);
};
A.readHod = () => { S.pop = null; S.modal = { type: 'hod' }; render(); };
MODALS.hod = () => ({ title: 'Comments from Mr. Adel Mansour', body: `<p class="small muted">Head of Department · final revision of Math Quiz 3</p>
    <div class="notice">${icon('chat')}<span>I checked a sample of 8 papers. The marks follow the rubric. For Q4, accept “5 eighths” written in words as the same answer as 5/8.</span></div>
    <div class="notice">${icon('chat')}<span>Q2 feedback is clear. Good that the concept gaps are kept apart from the careless slips.</span></div>`,
  foot: `<button type="button" class="btn primary" data-act="hodDone" data-autofocus>${icon('check')}Mark as read</button>` });
A.hodDone = () => { S.quiz.hod = 'done'; S.modal = null; render(); };
A.release = () => { S.modal = { type: 'release' }; render(); };
MODALS.release = () => ({ title: S.quiz.reopened ? 'Release the changed results?' : 'Release Math Quiz 3?', body: `<p>27 students and their parents will see their grade, feedback and mistake labels. ${S.quiz.reopened ? 'They are told the results changed.' : ''} ${ft('T16')}</p>
    <div class="notice">${icon('info')}<span>Red flags stay hidden until you confirm them on the student’s page.</span></div>`,
  foot: `<button type="button" class="btn" data-act="closeModal">${t('cancel')}</button><button type="button" class="btn primary" data-act="doRelease" data-autofocus>${icon('send')}Release to 27 students</button>` });
A.doRelease = () => {
  const again = S.quiz.reopened;
  S.quiz.released = true; S.quiz.reopened = false; S.modal = null;
  S.messages.unshift({ id: 'm-res' + Date.now(), from: 'System', title: again ? 'Your Math Quiz 3 results were updated' : 'Your Math Quiz 3 results are ready', body: again ? 'Ms. Sara changed your Math Quiz 3 results. Open My results to see them.' : 'Ms. Sara has checked Math Quiz 3. Open My results to see your grade and feedback.', time: 'Just now', read: false });
  toast(again ? 'Released again. Students and parents were told the results changed.' : 'Math Quiz 3 released. 27 students and their parents were notified.', { icon: 'send', ms: 5000 });
  go('dashboard');
};

/* ================= Screen 14 · Student gaps and red flags ================= */
function tGaps() {
  const sid = S.gapStudent;
  const flag = flagFor(sid);
  const notes = S.notes[sid] || [];
  const sentHere = S.sent.filter(m => m.to.includes(sid));
  const cell = (v, types, i) => {
    if (i === 2 && v === null) return `<span class="small muted">—</span>`;
    if (v === 1) return `<span class="dot concept" title="Concept gap"></span>`;
    if (i === 2 && types.includes('careless')) return `<span class="dot careless" title="Careless (not counted)"></span>`;
    return `<span class="dot none" title="No gap"></span>`;
  };
  const q3done = S.quiz.s2 && S.quiz.s2.students[sid] && S.quiz.s2.students[sid].confirmed;
  const rows = TOPIC_KEYS.map(tp => {
    const r = gapRow(sid, tp); const types = q3Types(sid, tp); const n = gapCount(sid, tp);
    const wide = classWide(tp);
    let verdict = 'No gaps';
    if (n >= 3) verdict = `<strong>Yes · ${n} quizzes in a row</strong>`;
    else if (n === 2) verdict = `<strong>Yes · ${n} of 3 quizzes</strong>${wide ? ' (class-wide)' : ''}`;
    else if (n === 1) verdict = `Yes · once${r[2] === 1 && wide ? ' (class-wide, see Class overview)' : ''}`;
    else if (types.includes('careless')) verdict = '<span class="muted">No · careless, first time</span>';
    return `<tr ${n >= 2 ? 'style="background:var(--gap-soft)"' : ''}><td>${n >= 2 ? `<strong>${TOPICS[tp].en}</strong>` : TOPICS[tp].en}</td>${r.map((v, i) => `<td>${cell(v, types, i)}</td>`).join('')}<td>${verdict}</td></tr>`;
  }).join('');
  return `
    <div class="page-h"><div class="row">${avatar(sid, 'lg')}<div><div class="crumbs">${t('t_students')} ›</div><h1>${name(sid)} · 5B</h1></div></div>
      <div class="field"><label for="sw-stu" class="sr">Switch student</label><select id="sw-stu" class="input" data-change="switchStu">${STUDENTS.map(s => `<option value="${s.id}" ${s.id === sid ? 'selected' : ''}>${s.name}</option>`).join('')}</select></div></div>
    <div class="dash-grid" style="grid-template-columns:1fr 360px">
      <div class="stack">
        <section class="card">
          <div class="card-h"><h2>Learning gaps across assessments ${ft('T12')}</h2>${q3done ? '' : `<span class="chip dash">Math Quiz 3 counts after you confirm ${name(sid)}’s grades</span>`}</div>
          <div class="table-wrap"><table class="table gap-table"><thead><tr><th>Topic</th><th>Quiz 1</th><th>Quiz 2</th><th>Quiz 3</th><th>Counts as a gap?</th></tr></thead><tbody>${rows}</tbody></table></div>
          <div class="legend" style="margin-top:10px"><span><span class="dot concept"></span> Concept gap</span><span><span class="dot numw"></span> Number-writing (counts when repeated)</span><span><span class="dot careless"></span> Careless (not counted)</span></div>
        </section>
        <section class="card stack">
          <h2 style="font-size:16px">Notes from classwork and homework</h2>
          ${notes.length ? notes.map(n => `<div class="row nowrap small"><span class="muted" style="width:64px;flex:none">${esc(n.date)}</span><span>${esc(n.text)}</span></div>`).join('') : '<p class="small muted">No notes yet.</p>'}
          <div class="row nowrap"><label for="note-in" class="sr">Add a note</label><input id="note-in" class="input" placeholder="Add a note from classwork or homework…" data-enter="addNote"><button type="button" class="btn" data-act="addNote">Add note</button></div>
        </section>
      </div>
      <div class="stack">
        ${flagCard(sid, flag)}
        ${messageCard(sid, sentHere)}
      </div>
    </div>`;
}
function flagCard(sid, flag) {
  if (!flag) {
    const why = !S.quiz.s2 || !S.quiz.s2.students[sid] || !S.quiz.s2.students[sid].confirmed
      ? `Confirm ${name(sid)}’s Math Quiz 3 grades first. Gaps are counted on confirmed grades only.`
      : `A red flag is suggested when the same concept gap comes back in several quizzes. ${TOPIC_KEYS.some(tp => gapCount(sid, tp) >= 2 && classWide(tp)) ? 'The repeated gap here is class-wide, so reteaching the class fits better than a flag.' : ''}`;
    return `<section class="card stack sm"><h2 style="font-size:16px">Red flag ${ft('T13')}</h2><p class="small muted">No red flag suggested. ${why}</p></section>`;
  }
  const tn = TOPICS[flag.topic].en;
  if (flag.decided && flag.status === 'confirmed') {
    return `<section class="card stack sm flag-card confirmed"><h2 style="font-size:16px" class="row">${icon('flag', 'style="width:20px;height:20px;color:var(--gap)"')}Red flag confirmed ${ft('T13')}</h2>
      <p><strong>${tn}</strong> · concept gap in ${flag.count} quizzes</p>${flag.note ? `<p class="small">Note: ${esc(flag.note)}</p>` : ''}
      <p class="small muted">${name(sid)} and the parents can now see “Your teacher will help you with ${tn.toLowerCase()}”.</p>
      <div><button type="button" class="btn sm" data-act="undoFlag" data-sid="${sid}">Undo</button></div></section>`;
  }
  if (flag.decided && flag.status === 'dismissed') {
    return `<section class="card stack sm"><h2 style="font-size:16px">Red flag dismissed</h2><p class="small">${tn} · reason: ${esc(flag.reason)}</p><div><button type="button" class="btn sm" data-act="undoFlag" data-sid="${sid}">Undo</button></div></section>`;
  }
  const m = S.flagDraft && S.flagDraft.sid === sid ? S.flagDraft : (S.flagDraft = { sid, note: sid === 'omar' ? 'Seen in classwork too. Plan small-group practice.' : '', dismissing: false });
  return `<section class="card stack sm" style="border:2px solid var(--ink)"><h2 style="font-size:16px" class="row">${icon('flag', 'style="width:20px;height:20px;color:var(--gap)"')}Suggested red flag ${ft('T13')}</h2>
    <p><strong>${tn}</strong> · concept gap in ${flag.count} quizzes${flag.inRow ? ' in a row' : ''}</p>
    <div class="field"><label for="flag-note">Note (optional)</label><textarea id="flag-note" class="input" rows="2" data-model="flagDraft.note">${esc(m.note)}</textarea></div>
    ${m.dismissing ? `<div class="stack sm"><span class="label">Why dismiss it?</span>${['It was careless', 'Class-wide gap: reteach instead', 'Already fixed in class'].map(r => `<button type="button" class="btn sm" data-act="dismissFlag" data-sid="${sid}" data-r="${r}">${r}</button>`).join('')}<button type="button" class="link small" data-act="cancelDismiss">Cancel</button></div>`
      : `<div class="grid2" style="gap:8px"><button type="button" class="btn primary" data-act="confirmFlag" data-sid="${sid}">Confirm red flag</button><button type="button" class="btn" data-act="startDismiss">Dismiss</button></div>`}
    <p class="small muted">${name(sid)} and the parents see it only after you confirm.</p></section>`;
}
function messageCard(sid, sentHere) {
  const isOmar = sid === 'omar';
  const d = S.msgDraft && S.msgDraft.sid === sid ? S.msgDraft : (S.msgDraft = { sid, toStudent: true, toParents: true, text: isOmar ? DEFAULT_MSG : `Hi ${name(sid)}! `, practice: isOmar ? 'sheet2' : '' });
  const replies = S.inbox.filter(i => i.from === name(sid) && i.msgId);
  return `<section class="card stack sm"><h2 style="font-size:16px">Send a message ${ft('T15')}</h2>
    <div class="row"><label class="check"><input type="checkbox" data-model="msgDraft.toStudent" ${d.toStudent ? 'checked' : ''}>${name(sid)}</label><label class="check"><input type="checkbox" data-model="msgDraft.toParents" ${d.toParents ? 'checked' : ''}>Parents</label></div>
    <label for="msg-text" class="sr">Message</label><textarea id="msg-text" class="input" rows="4" data-model="msgDraft.text">${esc(d.text)}</textarea>
    <div class="row nowrap"><label for="msg-pr" class="small" style="white-space:nowrap">Attach practice:</label><select id="msg-pr" class="input" data-model="msgDraft.practice"><option value="">None</option>${Object.entries(PRACTICE).filter(([k]) => k !== 'sheet1').map(([k, p]) => `<option value="${k}" ${d.practice === k ? 'selected' : ''}>${p.title}</option>`).join('')}</select></div>
    <button type="button" class="btn primary" data-act="sendMsg" data-sid="${sid}">${icon('send')}Send</button>
    ${sentHere.length ? `<div class="stack sm" style="border-top:1px solid var(--line);padding-top:10px"><span class="label">Sent</span>${sentHere.map(m => {
      const rep = replies.find(r => r.msgId === m.msgId);
      return `<div class="small"><strong>${esc(m.time)}:</strong> ${esc(m.text.slice(0, 70))}${m.text.length > 70 ? '…' : ''}${m.practice ? ` <span class="chip">${icon('sheet')}${PRACTICE[m.practice].title}</span>` : ''}
        <div style="margin-top:4px">${rep ? `<span class="chip ${rep.text === 'I need help' ? 'warn' : 'ok'}">${name(sid)} replied: ${esc(rep.text)}</span>${rep.text === 'I need help' ? ` <button type="button" class="link small" data-act="extraHelp" data-sid="${sid}">Give extra guidance</button>` : ''}` : `<span class="chip dash">Waiting for ${name(sid)}’s reply</span>`} ${ft('S10')}</div></div>`;
    }).join('')}</div>` : ''}
  </section>`;
}
A.switchStu = el => { S.gapStudent = el.value; S.flagDraft = null; S.msgDraft = null; render(true); };
A.addNote = () => {
  const el = document.getElementById('note-in'); const v = el.value.trim();
  if (!v) { el.focus(); return; }
  (S.notes[S.gapStudent] = S.notes[S.gapStudent] || []).unshift({ date: 'Today', text: v });
  render();
};
A.confirmFlag = el => {
  const sid = el.dataset.sid; const f = suggestedFlags().find(x => x.sid === sid);
  S.flags[sid] = { status: 'confirmed', topic: f.topic, count: f.count, inRow: f.inRow, note: S.flagDraft ? S.flagDraft.note : '' };
  toast(`Red flag confirmed for ${name(sid)}. Now send support.`, { icon: 'flag' });
  render();
};
A.startDismiss = () => { S.flagDraft.dismissing = true; render(); };
A.cancelDismiss = () => { S.flagDraft.dismissing = false; render(); };
A.dismissFlag = el => {
  const sid = el.dataset.sid; const f = suggestedFlags().find(x => x.sid === sid);
  S.flags[sid] = { status: 'dismissed', topic: f.topic, count: f.count, reason: el.dataset.r };
  S.flagDraft = null;
  toast(`Red flag dismissed for ${name(sid)}.`, { icon: 'info' });
  render();
};
A.undoFlag = el => { delete S.flags[el.dataset.sid]; S.flagDraft = null; render(); };
A.sendMsg = el => {
  const sid = el.dataset.sid; const d = S.msgDraft;
  if (!d.text.trim()) { toast('Write a short message first.', { icon: 'alert' }); return; }
  if (!d.toStudent && !d.toParents) { toast('Choose who gets the message.', { icon: 'alert' }); return; }
  const to = [...(d.toStudent ? [sid] : []), ...(d.toParents ? ['parents'] : [])];
  const msgId = 'm' + Date.now();
  S.sent.unshift({ msgId, sid, to, text: d.text, practice: d.practice || null, time: 'Today, 10:15' });
  if (sid === 'omar' && d.toStudent) {
    S.messages.unshift({ id: msgId, from: 'Ms. Sara', title: d.practice ? `New practice: ${PRACTICE[d.practice].title.split(' – ')[0].toLowerCase()}` : d.text.slice(0, 40), body: d.text, bodyDe: d.text === DEFAULT_MSG ? DEFAULT_MSG_DE : null, practice: d.practice || null, time: 'Today, 10:15', read: false });
  }
  if (sid === 'omar' && d.toParents) S.parentMsgs = [{ msgId, text: d.text, practice: d.practice || null, time: 'Today, 10:15' }, ...(S.parentMsgs || [])];
  S.msgDraft = null;
  toast(`Sent to ${to.map(x => x === 'parents' ? 'the parents' : name(x)).join(' and ')}.`, { icon: 'send' });
  render();
};
A.extraHelp = el => { const sid = el.dataset.sid; S.msgDraft = { sid, toStudent: true, toParents: false, text: `Hi ${name(sid)}! Let’s go through it together. Join my small group on Sunday, and bring your practice sheet.`, practice: '' }; render(); setTimeout(() => document.getElementById('msg-text')?.focus(), 0); };

/* ================= Screen 15 · Class gap heatmap ================= */
function tClass() {
  const ready = S.quiz.s2 && confirmedCount() > 0;
  const q4 = missedQ(4);
  const wide = classWide('word');
  const perQ = QUESTIONS.map(q => { const m = missedQ(q.n); return m && m.of ? Math.round(100 * (m.of - m.missed) / m.of) : null; });
  const lowest = perQ.every(v => v === null) ? null : perQ.indexOf(Math.min(...perQ.filter(v => v !== null))) + 1;
  return `
    <div class="page-h"><h1>Class 5B · learning gaps ${ft('T14')}</h1>
      <div class="row"><label class="small muted" for="cl-a">Assessments</label><select id="cl-a" class="input" style="width:auto"><option>Quiz 1 – Quiz 3</option></select><label class="small muted" for="cl-s">Subject</label><select id="cl-s" class="input" style="width:auto"><option>Math</option></select></div></div>
    ${wide && q4 ? `<div class="notice ${S.reteach ? 'ok' : ''}" style="border:2px solid var(--ink);align-items:center">${icon(S.reteach ? 'check' : 'users', 'style="width:28px;height:28px"')}
      <div class="grow"><strong style="font-size:16px">${q4.missed} of ${q4.of} students missed the word problem in Math Quiz 3.</strong><div class="small">${S.reteach ? 'Reteach lesson on word problems planned for Sunday, period 2.' : 'This looks like a class-wide gap: reteach word problems to the whole class instead of flagging ' + q4.missed + ' children.'}</div></div>
      ${S.reteach ? '' : `<button type="button" class="btn primary" data-act="planReteach">Plan a reteach lesson</button>`}<button type="button" class="btn" data-act="msgClass">Message the class</button>${ft('T15')}</div>` : ''}
    ${ready ? '' : `<div class="notice">${icon('info')}<span>Math Quiz 3 joins this view as you confirm grades in Stage 2. Showing Quiz 1–2 for now.</span></div>`}
    <div class="dash-grid" style="grid-template-columns:1fr 320px">
      <section class="card">
        <div class="card-h"><h2>Students × topics</h2><span class="small muted">Concept gaps across Quiz 1–3</span></div>
        <div class="table-wrap" style="max-height:520px;overflow-y:auto" data-keep-scroll="heat"><table class="heat"><thead><tr><th></th>${TOPIC_KEYS.map(tp => `<th class="${classWide(tp) ? 'hl' : ''}">${TOPICS[tp].en}</th>`).join('')}</tr></thead><tbody>
          ${STUDENTS.map(s => `<tr><td class="name"><button type="button" data-act="openGaps" data-sid="${s.id}">${s.name}</button>${s.id === 'jonas' ? ' <span class="small muted">(no paper)</span>' : ''}</td>${TOPIC_KEYS.map(tp => { const n = gapCount(s.id, tp); return `<td><div class="cell ${n >= 2 ? 'c2' : n === 1 ? 'c1' : ''} ${classWide(tp) ? 'hl' : ''}" title="${s.name} · ${TOPICS[tp].en}: ${n ? `gap in ${n} quiz${n > 1 ? 'zes' : ''}` : 'no gap'}"></div></td>`; }).join('')}</tr>`).join('')}
        </tbody></table></div>
        <div class="legend" style="margin-top:10px"><span><span class="cell"></span>No gap</span><span><span class="cell c1"></span>Gap once</span><span><span class="cell c2"></span>Gap 2+ times</span><span>Careless mistakes are not counted</span></div>
      </section>
      <section class="card stack sm">
        <h2 style="font-size:16px">Math Quiz 3 · per question</h2>
        <span class="small muted">% of the class who got it fully right${S.quiz.s2 && confirmedCount() < 27 ? ` (${confirmedCount()} confirmed so far)` : ''}</span>
        ${QUESTIONS.map(q => `<div class="topic-row" style="grid-template-columns:34px 1fr 44px;padding:3px 0"><strong class="small">Q${q.n}</strong><div class="bar thin"><span style="width:${perQ[q.n - 1] ?? 0}%;${perQ[q.n - 1] !== null && perQ[q.n - 1] < 50 ? 'background:var(--gap)' : ''}"></span></div><span class="small num">${perQ[q.n - 1] === null ? '—' : perQ[q.n - 1] + '%'}</span></div>`).join('')}
        ${lowest ? `<p class="small">Lowest: <strong>Q${lowest} · ${TOPICS[Q(lowest).topic].en}</strong></p><div><button type="button" class="btn sm" data-act="openQAnswers" data-q="${lowest}">Open Q${lowest} answers</button></div>` : ''}
      </section>
    </div>`;
}
A.planReteach = () => { S.reteach = true; toast('Reteach lesson added to Sunday, period 2.', { icon: 'calendar' }); render(); };
A.msgClass = () => { S.modal = { type: 'msgClass', text: 'Hi 5B! On Sunday we will practise word problems together. Remember: finish every word problem with an answer sentence.' }; render(); };
MODALS.msgClass = m => ({ title: 'Message the class', body: `<p class="small muted">To all 28 students in 5B and their parents. ${ft('T15')}</p><label for="mc-text" class="sr">Message</label><textarea id="mc-text" class="input" rows="4" data-model="modal.text">${esc(m.text)}</textarea>`,
  foot: `<button type="button" class="btn" data-act="closeModal">${t('cancel')}</button><button type="button" class="btn primary" data-act="sendClassMsg" data-autofocus>${icon('send')}Send to 5B</button>` });
A.sendClassMsg = () => {
  const text = S.modal.text; S.modal = null;
  S.sent.unshift({ msgId: 'mc' + Date.now(), sid: 'class', to: ['class'], text, practice: null, time: 'Today' });
  S.messages.unshift({ id: 'mc' + Date.now(), from: 'Ms. Sara', title: 'To the whole class: word problems', body: text, time: 'Just now', read: false });
  toast('Sent to all of 5B and their parents.', { icon: 'send' });
  render();
};
A.openQAnswers = el => { S.modal = { type: 'qAnswers', q: +el.dataset.q }; render(); };
MODALS.qAnswers = m => {
  const rows = Object.keys(S.quiz.s2.students).filter(sid => S.quiz.s2.students[sid].confirmed).map(sid => S.quiz.s2.students[sid].items[m.q - 1]);
  return { title: `Q${m.q} answers · ${esc(Q(m.q).text)}`, wide: true,
    body: `<div class="table-wrap" style="max-height:60vh"><table class="table"><thead><tr><th>Student</th><th>Answer</th><th>Mark</th><th>Type</th></tr></thead><tbody>${rows.sort((a, b) => a.mark - b.mark).map(i => `<tr><td>${name(i.sid)}</td><td><span class="hand sm">${esc(i.read)}</span></td><td class="num">${i.mark} / ${i.max}</td><td>${typeChip(i.mark < i.max ? i.type : null)}</td></tr>`).join('')}</tbody></table></div>` };
};

/* ================= Teacher messages ================= */
function tMessages() {
  const sel = S.inbox.find(i => i.id === S.inboxSel);
  return `<div class="page-h"><h1>${t('t_messages')}</h1></div>
    <div class="dash-grid" style="grid-template-columns:360px 1fr">
      <section class="stack">
        <h2 style="font-size:15px">Inbox</h2>
        <div class="list">${S.inbox.length ? S.inbox.map(i => `<button type="button" class="list-item ${i.id === S.inboxSel ? 'sel' : ''}" data-act="openInbox" data-id="${i.id}">
          <span style="width:10px;height:10px;border-radius:50%;flex:none;${i.read ? 'border:2px solid var(--line-strong)' : 'background:var(--accent)'}"></span>
          <span class="stack" style="gap:2px"><span class="small"><strong>${esc(i.from)}</strong> · <span class="muted">${esc(i.time)}</span></span><span>${i.kind === 'reply' ? `Replied “${esc(i.text)}”` : esc(i.text.slice(0, 48))}</span><span class="small muted">${esc(i.about)}</span></span></button>`).join('') : '<p class="small muted" style="padding:12px">No messages.</p>'}</div>
        <h2 style="font-size:15px;margin-top:8px">Sent</h2>
        <div class="list">${S.sent.length ? S.sent.map(m => `<div class="list-item"><span class="stack" style="gap:2px"><span class="small"><strong>To ${m.to.map(x => x === 'parents' ? 'parents' : x === 'class' ? 'class 5B' : name(x)).join(', ')}</strong> · <span class="muted">${esc(m.time)}</span></span><span class="small">${esc(m.text.slice(0, 60))}…</span></span></div>`).join('') : '<p class="small muted" style="padding:12px">Nothing sent yet.</p>'}</div>
      </section>
      <section class="card stack">
        ${sel ? `<div class="row">${avatar(sel.from.toLowerCase()) || ''}<div><strong>${esc(sel.from)}</strong><div class="small muted">${esc(sel.time)} · ${esc(sel.about)}</div></div></div>
          <p style="font-size:18px">${sel.kind === 'reply' ? `${esc(sel.from)} tapped <strong>“${esc(sel.text)}”</strong>.` : esc(sel.text)}</p>
          <div class="row">${SID[sel.from.toLowerCase()] ? `<button type="button" class="btn" data-act="openGaps" data-sid="${sel.from.toLowerCase()}">Open ${esc(sel.from)}’s gaps</button>` : ''}
          ${sel.kind === 'parent' ? `<button type="button" class="btn primary" data-act="replyParent">Reply to Dina</button>` : ''}
          ${sel.kind === 'reply' && sel.text === 'I need help' && SID[sel.from.toLowerCase()] ? `<button type="button" class="btn primary" data-act="extraHelpFromInbox" data-sid="${sel.from.toLowerCase()}">Give extra guidance</button>` : ''}</div>`
          : '<p class="muted">Pick a message.</p>'}
      </section>
    </div>`;
}
A.openInbox = el => { S.inboxSel = el.dataset.id; const i = S.inbox.find(x => x.id === el.dataset.id); if (i) i.read = true; go('messages', 'teacher'); };
A.extraHelpFromInbox = el => { S.gapStudent = el.dataset.sid; go('gaps'); A.extraHelp(el); };
A.replyParent = () => { S.modal = { type: 'replyParent', text: 'Dear Dina, yes, Omar can join the small-group practice on Sunday, period 2. Thank you for the fraction game at home!' }; render(); };
MODALS.replyParent = m => ({ title: 'Reply to Dina Fawzy', body: `<label for="rp-text" class="sr">Reply</label><textarea id="rp-text" class="input" rows="4" data-model="modal.text">${esc(m.text)}</textarea>`,
  foot: `<button type="button" class="btn" data-act="closeModal">${t('cancel')}</button><button type="button" class="btn primary" data-act="sendParentReply">${icon('send')}Send</button>` });
A.sendParentReply = () => {
  const text = S.modal.text; S.modal = null;
  S.parentMsgs = [{ msgId: 'r' + Date.now(), text, practice: null, time: 'Just now', fromTeacherToParent: true }, ...(S.parentMsgs || [])];
  S.sent.unshift({ msgId: 'r' + Date.now(), sid: 'omar', to: ['parents'], text, practice: null, time: 'Just now' });
  toast('Reply sent to Dina.', { icon: 'send' });
  render();
};
