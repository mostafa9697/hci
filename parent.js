/* Parent view (screen 16, bonus): Dina, Omar's mother, on her phone. Read-only: only released and confirmed information. */
function parentView() {
  const released = omarExamStatus('mq3') === 'ready';
  const items = released ? omarItems() : null;
  const total = items ? items.reduce((a, i) => a + i.mark, 0) : null;
  const prog = omarProgress();
  const flag = S.flags.omar && S.flags.omar.status === 'confirmed' ? S.flags.omar : null;
  const msgs = S.parentMsgs || [];
  const support = [];
  msgs.forEach(m => { if (m.practice && !support.find(s => s.k === m.practice)) support.push({ k: m.practice, text: PRACTICE[m.practice].home }); });
  if (flag && !support.find(s => s.k === 'game')) support.push({ k: 'game', text: PRACTICE.game.home });
  const st3 = omarExamStatus('mq3');
  const stChip = st => `<span class="chip ${st === 'todo' ? 'warn' : 'dash'}">${st === 'todo' ? 'Not uploaded yet' : t('st_checking')}</span>`;
  return `<div class="phone-stage">
    <div class="phone-stage-note row between" style="width:390px;max-width:100%"><span class="small muted">Parent view (bonus) · Dina Fawzy</span><button type="button" class="link small" data-act="signOut">${t('signOut')}</button></div>
    <div class="phone" role="main">
      <div class="phone-h">${avatar('omar')}<div class="grow"><h1 style="font-size:18px">${t('p_title', 'Omar')}</h1><div class="small muted">Class 5B · Ms. Sara</div></div>${seg([['en', 'EN'], ['de', 'DE']], S.lang, 'lang', 'aria-label="Language"')}</div>
      <div class="phone-b">
        <p class="small muted">${t('readOnly')}</p>
        <section class="card stack sm"><h2>${t('latestResults')} ${ft('P1')}</h2>
          <div class="row between nowrap"><span>${EXAMS.mq3}</span>${released ? `<strong class="num">${total} / ${QUIZ_TOTAL}</strong>` : stChip(st3)}</div>
          <div class="row between nowrap"><span>${EXAMS.sq2}</span>${stChip('checking')}</div>
          <div class="row between nowrap"><span>${EXAMS.mq2}</span><strong class="num">18 / 20</strong></div>
          ${released ? `<div><button type="button" class="btn sm" data-act="pFeedback">${S.parent.showFeedback ? t('hideFeedback') : t('seeFeedback')}</button></div>` : ''}
          ${released && S.parent.showFeedback ? `<div class="stack sm" style="border-top:1px solid var(--line);padding-top:8px">
            ${S.lang === 'de' ? `<span class="small muted">${t('feedbackLang')}</span>` : ''}
            <span class="small"><strong>${t('whatWell')}:</strong> You showed every step clearly, and your adding of fractions was great!</span>
            ${items.filter(i => i.mark < i.max).map(i => `<div class="small"><strong>Q${i.q} · ${i.mark}/${i.max}</strong> ${i.type === 'careless' ? `<span class="chip careless">${t('checkAgain')}</span>` : ''} ${esc(i.fix)}</div>`).join('')}
          </div>` : ''}
        </section>
        <section class="card stack sm"><h2>${t('progressByTopic')} ${ft('P2')}</h2>
          ${TOPIC_KEYS.map(k => { const v = prog[k][prog[k].length - 1]; return `<div class="topic-row" style="grid-template-columns:130px 1fr 38px;padding:2px 0"><span class="small">${topicName(k)}</span><div class="bar thin"><span style="width:${v}%"></span></div><span class="tiny num">${v}%</span></div>`; }).join('')}
          <span class="tiny muted">${t('carelessNot')}</span>
        </section>
        <section class="card stack sm" ${flag ? 'style="border:2px solid var(--ink);background:var(--sunken)"' : ''}><h2>${t('teacherHelping')} ${ft('P2')}</h2>
          ${flag ? `<p><strong>${topicName(flag.topic)}</strong> · ${t('confirmedBy')}</p>` : `<p class="small muted">${t('nothingFlagged')}</p>`}</section>
        <section class="card stack sm"><h2>${t('supportHome')} ${ft('P4')}</h2>
          ${support.length ? support.map(s => `<div class="row nowrap" style="align-items:flex-start"><span class="attach" style="padding:6px;border:0;background:none"><span class="ico" style="width:40px;height:40px">${icon(s.k === 'game' ? 'star' : 'sheet')}</span></span><span class="small">${esc(s.text)}</span></div>`).join('') : `<p class="small muted">${t('noSupport')}</p>`}</section>
        <section class="card stack sm"><h2>${t('msgsTitle')} ${ft('P3')}</h2>
          ${msgs.map(m => {
            const de = S.lang === 'de' && m.text === DEFAULT_MSG;
            return `<div class="row nowrap" style="align-items:flex-start">${icon('chat', 'style="width:20px;height:20px;flex:none;color:var(--accent);margin-top:2px"')}<div class="small"><strong>Ms. Sara ${m.fromTeacherToParent ? 'to you' : 'to Omar'} · ${esc(m.time)}</strong><div>“${esc(de ? DEFAULT_MSG_DE : m.text)}”</div>${de ? `<span class="tiny muted">${t('translatedFrom')}</span>` : ''}</div></div>`;
          }).join('')}
          ${released ? `<div class="row nowrap">${icon('bell', 'style="width:20px;height:20px;flex:none;color:var(--muted)"')}<span class="small">Math Quiz 3 results are ready.</span></div>` : ''}
          ${!msgs.length && !released ? `<p class="small muted">No messages yet.</p>` : ''}
        </section>
        <button type="button" class="btn primary lg block" data-act="pContact">${icon('mail')}${t('contactTeacher')}</button>${ft('P5')}
      </div>
    </div></div>`;
}
A.pFeedback = () => { S.parent.showFeedback = !S.parent.showFeedback; render(); };
A.pContact = () => { S.modal = { type: 'pContact', about: 'mq3', text: 'Hello Ms. Sara, can Omar join the small-group practice for fractions? Thank you, Dina' }; render(); };
MODALS.pContact = m => ({ title: t('contactTeacher'), body: `
    <div class="field"><label for="pc-about">${t('about')}</label><select id="pc-about" class="input" data-model="modal.about">
      <option value="mq3" ${m.about === 'mq3' ? 'selected' : ''}>${EXAMS.mq3}</option>
      ${S.flags.omar && S.flags.omar.status === 'confirmed' ? `<option value="flag" ${m.about === 'flag' ? 'selected' : ''}>${t('teacherHelping')}: ${topicName(S.flags.omar.topic)}</option>` : ''}
      <option value="meeting" ${m.about === 'meeting' ? 'selected' : ''}>${t('requestMeeting')}</option></select></div>
    <div class="field"><label for="pc-text">${t('yourMessage')}</label><textarea id="pc-text" class="input" rows="4" data-model="modal.text">${esc(m.text)}</textarea></div>`,
  foot: `<button type="button" class="btn" data-act="closeModal">${t('cancel')}</button><button type="button" class="btn primary" data-act="pSend" data-autofocus>${icon('send')}${t('send')}</button>` });
A.pSend = () => {
  const m = S.modal;
  if (!m.text.trim()) { toast(t('yourMessage') + '…', { icon: 'alert' }); return; }
  const about = m.about === 'flag' ? `Red flag: ${TOPICS[S.flags.omar.topic].en}` : m.about === 'meeting' ? 'Meeting request' : EXAMS.mq3;
  S.inbox.unshift({ id: 'in-p' + Date.now(), from: 'Dina (Omar’s mother)', kind: 'parent', text: m.text, about, time: 'Just now', read: false });
  S.modal = null;
  toast(t('sentToTeacher'), { icon: 'send' });
  render();
};
