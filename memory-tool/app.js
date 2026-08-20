/* ===================== CONFIG ===================== */
const TABLES_MAX_N = 30;
const TABLES_MAX_M = 20;
const FOCUS_LO = 16, FOCUS_HI = 29;   // the "hard zone" the user wants weighted
const SQUARES_MAX = 25;
const SQUARES_REF_MAX = 100;
const CUBES_MAX = 20;
const TIME_STEPS = [10, 8, 6, 4, 3];  // adaptive countdown, seconds
const STREAK_TO_STEP_DOWN = 5;        // this many "fast & correct" in a row tightens the clock
const STORAGE_KEY = 'numberLedgerState_v1';
const ADVANCE_DELAY_MS = 1150;

/* ===================== STATE ===================== */
function defaultState() {
  return {
    theme: null, // null = follow system, else 'light' | 'dark'
    timeLimits: { tables: 10, squares: 10, cubes: 10, mixed: 10 },
    streaks:    { tables: 0,  squares: 0,  cubes: 0,  mixed: 0 },
    totals:     {
      tables: { seen: 0, correct: 0 },
      squares:{ seen: 0, correct: 0 },
      cubes:  { seen: 0, correct: 0 },
      mixed:  { seen: 0, correct: 0 },
    },
    facts: { tables: {}, squares: {}, cubes: {} }, // per-fact weakness tracking
  };
}
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed, {
      timeLimits: Object.assign(defaultState().timeLimits, parsed.timeLimits),
      streaks: Object.assign(defaultState().streaks, parsed.streaks),
      totals: Object.assign(defaultState().totals, parsed.totals),
      facts: Object.assign(defaultState().facts, parsed.facts),
    });
  } catch (e) { return defaultState(); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

/* ===================== THEME ===================== */
function applyTheme() {
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = state.theme || (sysDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', mode);
  document.querySelector('.theme-icon').textContent = mode === 'dark' ? '☀' : '☾';
}
document.getElementById('themeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  state.theme = current === 'dark' ? 'light' : 'dark';
  saveState();
  applyTheme();
});
applyTheme();

/* ===================== TABS ===================== */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('is-active'));
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById(btn.dataset.tab).classList.add('is-active');
    if (btn.dataset.tab !== 'practice') endLiveQuiz(false);
  });
});

/* ===================== REFERENCE: TABLES ===================== */
function isFocusN(n) { return n >= FOCUS_LO && n <= FOCUS_HI; }

function renderTablesChips() {
  const wrap = document.getElementById('tablesChips');
  wrap.innerHTML = '';
  for (let n = 1; n <= TABLES_MAX_N; n++) {
    const chip = document.createElement('button');
    chip.className = 'chip' + (isFocusN(n) ? ' is-focus-zone' : '');
    chip.textContent = n;
    chip.addEventListener('click', () => {
      const el = document.getElementById('table-item-' + n);
      el.open = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    wrap.appendChild(chip);
  }
}

function renderTablesGrid() {
  const grid = document.getElementById('tablesGrid');
  grid.innerHTML = '';
  for (let n = 1; n <= TABLES_MAX_N; n++) {
    const details = document.createElement('details');
    details.className = 'table-item' + (isFocusN(n) ? ' is-focus-zone' : '');
    details.id = 'table-item-' + n;

    const summary = document.createElement('summary');
    summary.innerHTML = `<span class="n">${n}×</span><span>table of ${n}</span><span class="hint">${isFocusN(n) ? '— focus zone' : ''}</span>`;
    details.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'table-item-body';
    for (let m = 1; m <= TABLES_MAX_M; m++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.innerHTML = `<span class="op">${n}×${m}</span><span>${n * m}</span>`;
      body.appendChild(cell);
    }
    details.appendChild(body);
    grid.appendChild(details);
  }
}

/* ===================== REFERENCE: SQUARES ===================== */
function renderSquares() {
  const t = document.getElementById('squaresTable');
  let rows = '<tr><th>n</th><th>n²</th></tr>';
  for (let n = 1; n <= SQUARES_MAX; n++) rows += `<tr><td>${n}</td><td>${n * n}</td></tr>`;
  t.innerHTML = rows;

  const big = document.getElementById('bigSquaresTable');
  let bigRows = '<tr><th>n</th><th>n²</th></tr>';
  for (let n = SQUARES_MAX + 1; n <= SQUARES_REF_MAX; n++) bigRows += `<tr><td>${n}</td><td>${n * n}</td></tr>`;
  big.innerHTML = bigRows;
}
document.getElementById('revealBig').addEventListener('click', (e) => {
  const wrap = document.getElementById('bigSquaresWrap');
  wrap.hidden = !wrap.hidden;
  e.target.textContent = wrap.hidden ? 'Show computed values, 26 → 100' : 'Hide computed values';
});

/* ===================== REFERENCE: CUBES ===================== */
function renderCubes() {
  const t = document.getElementById('cubesTable');
  let rows = '<tr><th>n</th><th>n³</th></tr>';
  for (let n = 1; n <= CUBES_MAX; n++) rows += `<tr><td>${n}</td><td>${n * n * n}</td></tr>`;
  t.innerHTML = rows;
}

renderTablesChips();
renderTablesGrid();
renderSquares();
renderCubes();

/* ===================== QUIZ: FACT POOLS & WEIGHTING ===================== */
function factKeyTables(n, m) { return `${n}x${m}`; }
function factWeight(category, key, boost) {
  const rec = state.facts[category][key];
  let w = boost || 1;
  if (rec) w += rec.wrong * 3 + (rec.slow ? 1.5 : 0);
  return w;
}
function weightedPick(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const it of items) { r -= it.weight; if (r <= 0) return it; }
  return items[items.length - 1];
}
function recordFactResult(category, key, correct, slow) {
  const bank = state.facts[category];
  if (!bank[key]) bank[key] = { wrong: 0, seen: 0, slow: false };
  bank[key].seen++;
  bank[key].slow = !!slow;
  if (!correct) bank[key].wrong++;
  else bank[key].wrong = Math.max(0, bank[key].wrong - 0.5); // easing off once it's learned
}

function pickTablesFact() {
  const items = [];
  for (let n = 1; n <= TABLES_MAX_N; n++) {
    const boost = isFocusN(n) ? 4 : 1;
    for (let m = 1; m <= TABLES_MAX_M; m++) {
      const key = factKeyTables(n, m);
      items.push({ n, m, key, weight: factWeight('tables', key, boost) });
    }
  }
  const pick = weightedPick(items);
  return { category: 'tables', key: pick.key, text: `${pick.n} × ${pick.m}`, answer: pick.n * pick.m,
    distract: () => tablesDistractors(pick.n, pick.m) };
}
function pickSquaresFact() {
  const items = [];
  for (let n = 1; n <= SQUARES_MAX; n++) items.push({ n, key: String(n), weight: factWeight('squares', String(n), 1) });
  const pick = weightedPick(items);
  return { category: 'squares', key: pick.key, text: `${pick.n}²`, answer: pick.n * pick.n,
    distract: () => squareDistractors(pick.n) };
}
function pickCubesFact() {
  const items = [];
  for (let n = 1; n <= CUBES_MAX; n++) items.push({ n, key: String(n), weight: factWeight('cubes', String(n), 1) });
  const pick = weightedPick(items);
  return { category: 'cubes', key: pick.key, text: `${pick.n}³`, answer: pick.n * pick.n * pick.n,
    distract: () => cubeDistractors(pick.n) };
}

function tablesDistractors(n, m) {
  const correct = n * m;
  const cand = new Set([
    correct + n, correct - n, correct + m, correct - m,
    n * (m + 1), n * (m - 1), correct + 2, correct - 2,
    (n + 1) * m, (n - 1) * m,
  ]);
  return pickThree(cand, correct);
}
function squareDistractors(n) {
  const correct = n * n;
  const cand = new Set([
    (n - 1) * (n - 1), (n + 1) * (n + 1),
    correct + n, correct - n, correct + 2 * n - 1, correct - (2 * n + 1),
    correct + 2, correct - 2,
  ]);
  return pickThree(cand, correct);
}
function cubeDistractors(n) {
  const correct = n * n * n;
  const cand = new Set([
    (n - 1) ** 3, (n + 1) ** 3,
    n * n * (n - 1), n * n * (n + 1),
    correct + n, correct - n, correct + 3 * n * n,
  ]);
  return pickThree(cand, correct);
}
function pickThree(candidateSet, correct) {
  const pool = [...candidateSet].filter(v => v > 0 && v !== correct);
  shuffle(pool);
  const out = [];
  for (const v of pool) { if (!out.includes(v)) out.push(v); if (out.length === 3) break; }
  while (out.length < 3) {
    const jitter = correct + (Math.floor(Math.random() * 20) - 10 || 1);
    if (jitter > 0 && jitter !== correct && !out.includes(jitter)) out.push(jitter);
  }
  return out;
}
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

function nextFact(mode) {
  if (mode === 'tables') return pickTablesFact();
  if (mode === 'squares') return pickSquaresFact();
  if (mode === 'cubes') return pickCubesFact();
  // mixed: tables weighted heavier since that's the bulk of the ask
  const r = Math.random();
  if (r < 0.5) return pickTablesFact();
  if (r < 0.75) return pickSquaresFact();
  return pickCubesFact();
}

/* ===================== QUIZ: MODE SELECT / SETUP SCREEN ===================== */
let currentMode = 'tables';
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentMode = btn.dataset.mode;
    renderModeStats();
  });
});

function renderModeStats() {
  const wrap = document.getElementById('modeStats');
  const t = state.totals[currentMode];
  const pct = t.seen ? Math.round((t.correct / t.seen) * 100) : 0;
  wrap.innerHTML = `
    <span>current clock: ${state.timeLimits[currentMode]}s</span>
    <span>lifetime accuracy: ${pct}% (${t.seen} asked)</span>
    <span>streak toward faster clock: ${state.streaks[currentMode]}/${STREAK_TO_STEP_DOWN}</span>
  `;
}
renderModeStats();

document.getElementById('resetProgress').addEventListener('click', () => {
  if (!confirm('Reset all saved progress and adaptive timers? This cannot be undone.')) return;
  state = defaultState();
  saveState();
  renderModeStats();
});

/* ===================== QUIZ: LIVE SESSION ===================== */
let session = null; // { mode, total, correct, active }
let question = null; // { category, key, text, answer, options, startTs, timeLimit }
let rafId = null;

const setupEl = document.getElementById('quizSetup');
const liveEl = document.getElementById('quizLive');
const summaryEl = document.getElementById('quizSummary');
const marginRule = document.getElementById('marginRule');

document.getElementById('startQuiz').addEventListener('click', () => startSession(currentMode));
document.getElementById('stopQuiz').addEventListener('click', () => endLiveQuiz(true));
document.getElementById('againQuiz').addEventListener('click', () => startSession(currentMode));

function startSession(mode) {
  session = { mode, total: 0, correct: 0 };
  setupEl.hidden = true; summaryEl.hidden = true; liveEl.hidden = false;
  document.getElementById('quizModeLabel').textContent = mode;
  marginRule.classList.remove('is-idle');
  askQuestion();
}

function endLiveQuiz(showSummary) {
  if (!session) return;
  cancelAnimationFrame(rafId);
  marginRule.classList.add('is-idle');
  marginRule.style.transform = 'scaleY(1)';
  if (showSummary) {
    liveEl.hidden = true; summaryEl.hidden = false;
    const pct = session.total ? Math.round((session.correct / session.total) * 100) : 0;
    document.getElementById('summaryText').textContent =
      `${session.correct} / ${session.total} correct (${pct}%) — clock now sits at ${state.timeLimits[session.mode]}s for ${session.mode}.`;
  } else {
    liveEl.hidden = true; setupEl.hidden = false;
  }
  session = null;
  renderModeStats();
}

function askQuestion() {
  const fact = nextFact(session.mode);
  const options = shuffle([fact.answer, ...fact.distract()]);
  const timeLimit = state.timeLimits[session.mode];
  question = { ...fact, options, startTs: performance.now(), timeLimit, answered: false };

  document.getElementById('questionText').textContent = fact.text + ' = ?';
  document.getElementById('quizTimeLimitLabel').textContent = timeLimit + 's';
  document.getElementById('quizScore').textContent = `${session.correct}/${session.total}`;
  document.getElementById('feedbackText').textContent = '';
  document.getElementById('feedbackText').className = 'feedback';

  const grid = document.getElementById('optionsGrid');
  grid.innerHTML = '';
  options.forEach((val, i) => {
    const b = document.createElement('button');
    b.className = 'option-btn';
    b.innerHTML = `${val}<span class="key-hint">${i + 1}</span>`;
    b.addEventListener('click', () => selectOption(val, b));
    grid.appendChild(b);
  });

  runTimer();
}

function runTimer() {
  cancelAnimationFrame(rafId);
  const tick = () => {
    if (!question || question.answered) return;
    const elapsed = (performance.now() - question.startTs) / 1000;
    const frac = Math.max(0, 1 - elapsed / question.timeLimit);
    marginRule.style.transform = `scaleY(${frac})`;
    if (frac <= 0) { handleAnswer(null, true); return; }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function selectOption(val, btnEl) {
  if (!question || question.answered) return;
  handleAnswer(val, false, btnEl);
}

function handleAnswer(val, timedOut, btnEl) {
  question.answered = true;
  cancelAnimationFrame(rafId);
  const elapsed = (performance.now() - question.startTs) / 1000;
  const correct = !timedOut && val === question.answer;
  const slow = elapsed > question.timeLimit * 0.65;

  // disable & style all options
  document.querySelectorAll('.option-btn').forEach(b => {
    b.disabled = true;
    const v = parseInt(b.textContent, 10);
    if (v === question.answer) b.classList.add('is-correct');
    else if (b === btnEl) b.classList.add('is-wrong');
  });

  const fb = document.getElementById('feedbackText');
  if (timedOut) { fb.textContent = `Time's up — it was ${question.answer}.`; fb.className = 'feedback is-timeout'; }
  else if (correct) { fb.textContent = `Right, in ${elapsed.toFixed(1)}s.`; fb.className = 'feedback is-correct'; }
  else { fb.textContent = `Not quite — it was ${question.answer}.`; fb.className = 'feedback is-wrong'; }

  recordFactResult(question.category, question.key, correct, slow);
  session.total++; if (correct) session.correct++;
  state.totals[session.mode].seen++; if (correct) state.totals[session.mode].correct++;

  adjustClock(session.mode, correct, slow);
  saveState();
  document.getElementById('quizScore').textContent = `${session.correct}/${session.total}`;
  document.getElementById('quizTimeLimitLabel').textContent = state.timeLimits[session.mode] + 's';

  setTimeout(() => { if (session) askQuestion(); }, ADVANCE_DELAY_MS);
}

function adjustClock(mode, correct, slow) {
  const idx = TIME_STEPS.indexOf(state.timeLimits[mode]);
  if (correct && !slow) {
    state.streaks[mode]++;
    if (state.streaks[mode] >= STREAK_TO_STEP_DOWN) {
      state.streaks[mode] = 0;
      const nextIdx = Math.min(idx + 1, TIME_STEPS.length - 1);
      state.timeLimits[mode] = TIME_STEPS[nextIdx];
    }
  } else {
    state.streaks[mode] = 0;
    if (!correct) {
      const prevIdx = Math.max(idx - 1, 0);
      state.timeLimits[mode] = TIME_STEPS[prevIdx];
    }
  }
}
