/* Mock data. Names, marks and messages follow the Milestone 2 running example:
   class 5B (28 students, 27 papers), Math Quiz 3 (10 questions, 25 marks), Omar 22 / 25.
   All AI output is simulated, as the Project Description allows. */

const APP_NAME = 'Tally';
const CLASS_CODE = '5B-7421';
const OMAR_PICS = ['cat', 'ball', 'fish'];
const PIC_ORDER = ['cat', 'sun', 'ball', 'tree', 'car', 'fish', 'star', 'boat'];

const STUDENT_NAMES = ['Adam', 'Ali', 'Amina', 'Bassel', 'Dalia', 'Farida', 'Habiba', 'Hana', 'Hassan', 'Jana', 'Jonas', 'Karim', 'Laila', 'Lina', 'Mariam', 'Mostafa', 'Nadia', 'Nour', 'Omar', 'Rana', 'Salma', 'Seif', 'Tamer', 'Yara', 'Yassin', 'Youssef', 'Zeina', 'Ziad'];
const AVATAR_COLORS = ['#F6D7A7', '#CFE6D8', '#D9E4F5', '#F3D1D8', '#E5DCF3', '#FBE3B8', '#D4ECEA', '#F0DCCB'];
const STUDENTS = STUDENT_NAMES.map((n, i) => ({ id: n.toLowerCase(), name: n, color: AVATAR_COLORS[i % AVATAR_COLORS.length] }));
const SID = Object.fromEntries(STUDENTS.map(s => [s.id, s]));
// Omar, Lina and Jonas get the order the wireframes show first on the sign-in screen
const SIGNIN_ORDER = ['adam', 'jonas', 'karim', 'lina', 'mariam', 'nour', 'omar', 'salma', ...STUDENTS.map(s => s.id).filter(id => !['adam', 'jonas', 'karim', 'lina', 'mariam', 'nour', 'omar', 'salma'].includes(id))];

const TOPICS = {
  add: { en: 'Adding fractions', de: 'Brüche addieren' },
  cmp: { en: 'Comparing fractions', de: 'Brüche vergleichen' },
  mul: { en: 'Multiplication facts', de: 'Einmaleins' },
  word: { en: 'Word problems', de: 'Textaufgaben' },
};
const TOPIC_KEYS = ['add', 'cmp', 'mul', 'word'];

const QUESTIONS = [
  { n: 1, text: '3/4 + 1/4 = ?', key: '1', marks: 2, topic: 'add', rubric: [['Adds the numerators', 1], ['Simplifies to 1', 1]],
    right: '3/4 + 1/4 = 1', wrong: '3/4 + 1/4 = 4/8', lossGot: 1, wrongMet: [0],
    well: 'You added the top numbers correctly.', fix: 'Keep the bottom number the same: 3/4 + 1/4 = 4/4 = 1.' },
  { n: 2, text: 'Compare 5/6 and 3/4. Write < or >.', key: '5/6 > 3/4', marks: 2, topic: 'cmp', rubric: [['Same denominator', 1], ['Correct sign', 1]],
    right: '5/6 > 3/4', wrong: '5/6 < 3/4', work: ['5/6 = 10/12', '3/4 = 9/12'], lossGot: 1, wrongMet: [0],
    well: 'You changed both fractions to twelfths.', fix: '10/12 is bigger than 9/12, so 5/6 > 3/4.' },
  { n: 3, text: '7 × 8 = ?', key: '56', marks: 1, topic: 'mul', rubric: [],
    right: '7 × 8 = 56', wrong: '7 × 8 = 54', lossGot: 0, wrongMet: [], careless: true,
    well: 'You know your 7 times table.', fix: 'Look again at this one: 7 × 8 = 56.' },
  { n: 4, text: 'Mona ate 3/8 of a cake and Ali ate 2/8. How much of the cake did they eat?', key: '5/8', marks: 3, topic: 'word', rubric: [['Correct steps', 1], ['Correct calculation', 1], ['Answer sentence', 1]],
    right: '3/8 + 2/8 = 5/8. They ate 5/8.', wrong: '3 + 2 = 5, 5/8', lossGot: 2, wrongMet: [0, 1],
    well: 'Your steps and your adding were right.', fix: 'Finish with a sentence: They ate 5/8 of the cake.' },
  { n: 5, text: '2/5 + 1/5 = ?', key: '3/5', marks: 2, topic: 'add', rubric: [['Adds the numerators', 1], ['Keeps the denominator', 1]],
    right: '2/5 + 1/5 = 3/5', wrong: '2/5 + 1/5 = 3/10', lossGot: 1, wrongMet: [0],
    well: 'You added the top numbers.', fix: 'The bottom number stays 5: 2/5 + 1/5 = 3/5.' },
  { n: 6, text: 'Order from smallest: 1/2, 2/3, 3/5', key: '1/2, 3/5, 2/3', marks: 3, topic: 'cmp', rubric: [['Common denominator', 1], ['Compares correctly', 1], ['Correct order', 1]],
    right: '1/2, 3/5, 2/3', wrong: '1/2, 2/3, 3/5', lossGot: 1, wrongMet: [0],
    well: 'You started by comparing the fractions.', fix: 'Change them to thirtieths first: 15/30, 18/30, 20/30.' },
  { n: 7, text: '6 × 9 = ?   4 × 7 = ?', key: '54, 28', marks: 2, topic: 'mul', rubric: [['6 × 9 = 54', 1], ['4 × 7 = 28', 1]],
    right: '54, 28', wrong: '54, 24', lossGot: 1, wrongMet: [0], careless: true,
    well: 'You got 6 × 9 right.', fix: 'Check 4 × 7 again: it is 28.' },
  { n: 8, text: '12 × 4 = ?  Show how you split it.', key: '48', marks: 3, topic: 'mul', rubric: [['Splits 12 into 10 + 2', 1], ['Multiplies each part', 1], ['Correct total', 1]],
    right: '40 + 8 = 48', wrong: '40 + 8 = 46', lossGot: 2, wrongMet: [0, 1], careless: true,
    well: 'You split 12 into 10 and 2.', fix: 'Add the two parts again: 40 + 8 = 48.' },
  { n: 9, text: 'A pizza has 8 slices. Hana eats 1/4 of it. How many slices are left?', key: '6 slices', marks: 4, topic: 'word', rubric: [['Finds 1/4 of 8 = 2', 2], ['Subtracts from 8', 1], ['Answer sentence', 1]],
    right: '8 − 2 = 6. 6 slices are left.', wrong: '8 − 4 = 4. 4 slices are left.', lossGot: 2, wrongMet: [1, 2],
    well: 'You subtracted and wrote a sentence.', fix: 'First find 1/4 of 8: 8 ÷ 4 = 2 slices.' },
  { n: 10, text: '1/3 + 1/3 + 1/3 = ?', key: '1', marks: 3, topic: 'add', rubric: [['Adds the numerators', 1], ['Gets 3/3', 1], ['Simplifies to 1', 1]],
    right: '3/3 = 1', wrong: '3/9', lossGot: 1, wrongMet: [0],
    well: 'You added the top numbers.', fix: 'Keep the bottom number 3: 3/3 = 1.' },
];
const Q = n => QUESTIONS[n - 1];
const QUIZ_TOTAL = QUESTIONS.reduce((a, q) => a + q.marks, 0); // 25

/* Who lost marks on which question in Math Quiz 3 (before any teacher changes).
   Q4: 18 of 27 students, the class-wide gap. Jonas has no paper. */
const LOSSES = {
  1: ['youssef', 'dalia'],
  2: ['omar', 'lina', 'seif', 'tamer', 'rana', 'ziad', 'bassel'],
  3: ['omar', 'hana', 'ali', 'yara', 'hassan'],
  4: ['omar', 'lina', 'youssef', 'adam', 'nour', 'salma', 'karim', 'ali', 'bassel', 'dalia', 'habiba', 'hassan', 'laila', 'mostafa', 'rana', 'tamer', 'yassin', 'ziad'],
  5: ['salma', 'amina', 'jana', 'laila', 'mostafa', 'habiba', 'zeina', 'nadia'],
  6: ['farida', 'seif', 'tamer', 'rana', 'ali', 'dalia'],
  7: ['mariam', 'yassin', 'hassan'],
  8: ['adam', 'ziad', 'bassel', 'habiba'],
  9: ['ali', 'bassel', 'dalia', 'habiba', 'hassan', 'laila', 'mostafa', 'rana', 'tamer', 'yassin'],
  10: ['nadia'],
};
/* Per-student overrides of the default wrong answer. */
const OVERRIDES = {
  'omar-4': { got: 2, ai: [1, 2, 2] },
  'lina-4': { got: 1, ai: [1, 1, 2], text: '3 + 2 = 5' , met: [0] },
  'nour-4': { got: 1, ai: [1, 1, 2], text: '5/16', met: [0] },
  'adam-8': { got: 1, ai: [1, 2, 1], text: '10 × 4 + 2 = 42', met: [0], type: 'concept' },
};

/* Concept gaps in Quiz 1 and Quiz 2 (1 = concept gap that quiz). */
const HISTORY = {
  omar: { cmp: [1, 1] },
  jonas: { cmp: [1, 0] },
  rana: { cmp: [1, 0] },
  ziad: { word: [1, 0] },
};
/* Omar's progress per topic: % of questions fully right, careless slips not counted. Quiz 3 is computed. */
const OMAR_PAST = { add: [67, 100], cmp: [25, 33], mul: [75, 100], word: [50, 50] };

function answerText(sid, n) {
  const q = Q(n);
  if ((LOSSES[n] || []).includes(sid)) {
    const o = OVERRIDES[`${sid}-${n}`];
    return (o && o.text) || q.wrong;
  }
  return q.right;
}

/* Stage 1 · Check first: 14 answers the AI is unsure about (reasons from T5). */
const CHECK_FIRST = [
  { id: 'cf1', sid: 'omar', q: 2, reason: 'looks', ai: '5/6 > 3/4' },
  { id: 'cf2', sid: 'lina', q: 4, reason: 'hard', ai: '3 + 2 = 5, 3/8' },
  { id: 'cf3', sid: 'youssef', q: 2, reason: 'hard', ai: '5/6 > 3/9' },
  { id: 'cf4', sid: 'mariam', q: 1, reason: 'spot', ai: '3/4 + 1/4 = 1' },
  { id: 'cf5', sid: 'adam', q: 8, reason: 'looks', ai: '10 × 4 + 8 = 48' },
  { id: 'cf6', sid: 'nour', q: 6, reason: 'hard', ai: '1/2, 3/5, 2/5' },
  { id: 'cf7', sid: 'karim', q: 8, reason: 'hard', ai: '40 + 8 = 43' },
  { id: 'cf8', sid: 'salma', q: 5, reason: 'spot', ai: '2/5 + 1/5 = 3/10' },
  { id: 'cf9', sid: 'ziad', q: 9, reason: 'hard', ai: '8 − 2 = 0. 6 slices are left.' },
  { id: 'cf10', sid: 'hana', q: 3, reason: 'looks', ai: '7 × 8 = 56' },
  { id: 'cf11', sid: 'farida', q: 6, reason: 'hard', ai: '1/2, 2/3, 3/5' },
  { id: 'cf12', sid: 'seif', q: 2, reason: 'spot', ai: '5/6 < 3/4' },
  { id: 'cf13', sid: 'rana', q: 7, reason: 'hard', ai: '54, 23' },
  { id: 'cf14', sid: 'tamer', q: 6, reason: 'looks', ai: '1/2, 3/5, 2/3' },
];
const REASONS = {
  hard: { label: 'Hard to read', cls: 'warn', why: 'The handwriting is hard to read.' },
  looks: { label: 'Looks more correct than working', cls: 'warn', why: 'The AI reading looks more correct than the child’s working.' },
  reversed: { label: 'Reversed number (DE)', cls: 'numw', why: 'A reversed number on a German exam (42 for 24).' },
  spot: { label: 'Spot-check', cls: 'dash', why: 'Random spot-check: the AI was confident, you check it anyway.' },
};

/* Stage 1 · Quick confirm: 53 answers left of 256 (the AI is confident). */
function buildQuickRows() {
  const rows = [];
  const cfKeys = new Set(CHECK_FIRST.map(c => `${c.sid}-${c.q}`));
  const order = ['omar', 'lina', 'youssef', 'mariam', 'adam', 'nour', 'karim', 'salma', 'ali', 'amina', 'bassel', 'dalia', 'farida', 'habiba', 'hana', 'hassan', 'jana', 'laila', 'mostafa', 'nadia', 'rana', 'seif', 'tamer', 'yara', 'yassin', 'zeina', 'ziad'];
  const qs = [1, 3, 5, 7, 10, 2, 6, 8, 9, 4];
  outer: for (const n of qs) {
    for (const sid of order) {
      if (cfKeys.has(`${sid}-${n}`)) continue;
      rows.push({ id: `qc-${sid}-${n}`, sid, q: n, scan: answerText(sid, n), ai: answerText(sid, n), status: 'todo' });
      if (rows.length >= 53) break outer;
    }
  }
  // put the wireframe rows first: Omar Q1, Omar Q3, Lina Q1, Lina Q3 (misread), Youssef Q1
  const pick = ['qc-omar-1', 'qc-omar-3', 'qc-lina-1', 'qc-lina-3', 'qc-youssef-1'];
  rows.sort((a, b) => {
    const ia = pick.indexOf(a.id), ib = pick.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const lina3 = rows.find(r => r.id === 'qc-lina-3');
  if (lina3) lina3.ai = '7 × 8 = 36'; // the AI misread 56 as 36
  return rows.slice(0, 53);
}

const COLLEAGUES = [
  { id: 'karimf', name: 'Mr. Karim Fathy', role: 'Grade 5 Math teacher' },
  { id: 'nadia', name: 'Ms. Nadia Samir', role: 'Grade 4 class teacher' },
  { id: 'adel', name: 'Mr. Adel Mansour', role: 'Head of Department' },
];

const PRACTICE = {
  sheet2: { title: 'Fraction pairs – sheet 2', sub: 'Comparing fractions · about 10 minutes', home: 'Sit with Omar for 10 minutes while he does “Fraction pairs – sheet 2”. Ask him to explain which fraction is bigger and why.' },
  game: { title: 'Fraction game · 10 min', sub: 'Comparing fractions · a game to play at home', home: 'Fraction game with real food · 10 min. Cut fruit into parts and compare the pieces.' },
  sheet1: { title: 'Fraction pairs – sheet 1', sub: 'Comparing fractions · warm-up', home: 'Warm-up sheet on comparing fractions.' },
};

const SAVED_COMMENTS = [
  'Great effort! Check your answer once more.',
  'You showed every step clearly. Well done!',
  'Remember to finish with an answer sentence.',
  'Change the fractions so the bottom numbers are the same first.',
];

const DEFAULT_MSG = 'Hi Omar! You are getting better at fractions. I added a practice sheet for comparing fractions. Try it this week, and tell me if you need help.';
const DEFAULT_MSG_DE = 'Hallo Omar! Du wirst bei Brüchen immer besser. Ich habe ein Übungsblatt zum Vergleichen von Brüchen hinzugefügt. Probier es diese Woche und sag mir, wenn du Hilfe brauchst.';
