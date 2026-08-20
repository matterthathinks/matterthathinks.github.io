/* ===================== CONFIG ===================== */
const TABLES_MAX_N = 30;
const TABLES_MAX_M = 10;                         // "just need multiples till 10"
const FOCUS_SET = new Set([16,17,18,19, 21,22,23,24, 26,27,28,29]); // 20/25/30 excluded — already easy
const SQUARES_MAX = 25;
const SQUARES_REF_MAX = 100;
const CUBES_MAX = 20;
const FRACTIONS_MAX_X = 30;
const FRACTIONS_MAX_N = 5;
const FRACTIONS_HARD_LO = 11, FRACTIONS_HARD_HI = 29; // denominators worth over-weighting
const TIME_STEPS = [10, 8, 6, 4, 3];              // adaptive countdown, seconds
const STREAK_TO_STEP_DOWN = 5;                    // this many "fast & correct" in a row tightens the clock
const STORAGE_KEY = 'numberLedgerState_v2';

/* ===================== STATE ===================== */
function defaultState() {
  return {
    theme: null, // null = follow system, else 'light' | 'dark'
    timeLimits: { tables: 10, squares: 10, cubes: 10, fractions: 10, mixed: 10 },
    streaks:    { tables: 0,  squares: 0,  cubes: 0,  fractions: 0,  mixed: 0 },
    totals: {
      tables:   { seen: 0, correct: 0 },
      squares:  { seen: 0, correct: 0 },
      cubes:    { seen: 0, correct: 0 },
      fractions:{ seen: 0, correct: 0 },
      mixed:    { seen: 0, correct: 0 },
    },
    facts: { tables: {}, squares: {}, cubes: {}, fractions: {} }, // per-fact weakness tracking
  };
}
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const d = defaultState();
    return {
      theme: parsed.theme ?? d.theme,
      timeLimits: Object.assign(d.timeLimits, parsed.timeLimits),
      streaks: Object.assign(d.streaks, parsed.streaks),
      totals: Object.assign(d.totals, parsed.totals),
      facts: Object.assign(d.facts, parsed.facts),
    };
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
function isFocusN(n) { return FOCUS_SET.has(n); }

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

/* ===================== REFERENCE: FRACTIONS ===================== */
function pctOf(n, x) { return Math.round((n / x) * 10000) / 100; } // 2 dp

function renderFractions() {
  const t = document.getElementById('fractionsTable');
  let head = '<tr><th>n/x →</th>';
  for (let x = 2; x <= FRACTIONS_MAX_X; x++) head += `<th>${x}</th>`;
  head += '</tr>';

  let body = '';
  for (let n = 1; n <= FRACTIONS_MAX_N; n++) {
    body += `<tr><td>${n}/x</td>`;
    for (let x = 2; x <= FRACTIONS_MAX_X; x++) {
      if (n >= x) { body += '<td class="blank">—</td>'; continue; }
      body += `<td>${pctOf(n, x).toFixed(2)}</td>`;
    }
    body += '</tr>';
  }
  t.innerHTML = head + body;
}

renderTablesChips();
renderTablesGrid();
renderSquares();
renderCubes();
renderFractions();

/* ===================== QUIZ: HELPERS ===================== */
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

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
  else bank[key].wrong = Math.max(0, bank[key].wrong - 0.5); // eases off once it's learned
}
function pickThree(candidateSet, correct) {
  const pool = [...candidateSet].filter(v => v > 0 && Math.abs(v - correct) > 0.001);
  shuffle(pool);
  const out = [];
  for (const v of pool) { if (!out.some(o => Math.abs(o - v) < 0.001)) out.push(v); if (out.length === 3) break; }
  while (out.length < 3) {
    const jitter = Math.round((correct + (Math.floor(Math.random() * 20) - 10 || 1)) * 100) / 100;
    if (jitter > 0 && Math.abs(jitter - correct) > 0.001 && !out.some(o => Math.abs(o - jitter) < 0.001)) out.push(jitter);
  }
  return out;
}

function formatValue(category, val) {
  return category === 'fractions' ? val.toFixed(2) + '%' : String(val);
}

/* ===================== QUIZ: FACT POOLS ===================== */
function pickTablesFact() {
  const items = [];
  for (let n = 1; n <= TABLES_MAX_N; n++) {
    const boost = isFocusN(n) ? 4 : 1;
    for (let m = 1; m <= TABLES_MAX_M; m++) {
      const key = `${n}x${m}`;
      items.push({ n, m, key, weight: factWeight('tables', key, boost) });
    }
  }
  const p = weightedPick(items);
  return {
    category: 'tables', key: p.key, text: `${p.n} × ${p.m}`, equation: `${p.n} × ${p.m}`, answer: p.n * p.m,
    distract: () => {
      const correct = p.n * p.m;
      const cand = new Set([
        correct + p.n, correct - p.n, correct + p.m, correct - p.m,
        p.n * (p.m + 1), p.n * (p.m - 1), correct + 2, correct - 2,
        (p.n + 1) * p.m, (p.n - 1) * p.m,
      ]);
      return pickThree(cand, correct);
    },
  };
}
function pickSquaresFact() {
  const items = [];
  for (let n = 1; n <= SQUARES_MAX; n++) items.push({ n, key: String(n), weight: factWeight('squares', String(n), 1) });
  const p = weightedPick(items);
  return {
    category: 'squares', key: p.key, text: `${p.n}²`, equation: `${p.n}²`, answer: p.n * p.n,
    distract: () => {
      const correct = p.n * p.n;
      const cand = new Set([
        (p.n - 1) * (p.n - 1), (p.n + 1) * (p.n + 1),
        correct + p.n, correct - p.n, correct + 2 * p.n - 1, correct - (2 * p.n + 1),
        correct + 2, correct - 2,
      ]);
      return pickThree(cand, correct);
    },
  };
}
function pickCubesFact() {
  const items = [];
  for (let n = 1; n <= CUBES_MAX; n++) items.push({ n, key: String(n), weight: factWeight('cubes', String(n), 1) });
  const p = weightedPick(items);
  return {
    category: 'cubes', key: p.key, text: `${p.n}³`, equation: `${p.n}³`, answer: p.n * p.n * p.n,
    distract: () => {
      const correct = p.n * p.n * p.n;
      const cand = new Set([
        (p.n - 1) ** 3, (p.n + 1) ** 3,
        p.n * p.n * (p.n - 1), p.n * p.n * (p.n + 1),
        correct + p.n, correct - p.n, correct + 3 * p.n * p.n,
      ]);
      return pickThree(cand, correct);
    },
  };
}
function pickFractionFact() {
  const items = [];
  for (let x = 2; x <= FRACTIONS_MAX_X; x++) {
    const boost = (x >= FRACTIONS_HARD_LO && x <= FRACTIONS_HARD_HI) ? 3 : 1;
    const maxN = Math.min(FRACTIONS_MAX_N, x - 1);
    for (let n = 1; n <= maxN; n++) {
      const key = `${n}/${x}`;
      items.push({ n, x, key, weight: factWeight('fractions', key, boost) });
    }
  }
  const p = weightedPick(items);
  const correct = pctOf(p.n, p.x);
  return {
    category: 'fractions', key: p.key, text: `${p.n}/${p.x}`, equation: `${p.n}/${p.x}`, answer: correct,
    distract: () => {
      const cand = new Set([
        pctOf(p.n, p.x - 1), pctOf(p.n, p.x + 1),
        pctOf(p.n + 1, p.x), Math.max(0, pctOf(p.n - 1, p.x) || pctOf(1, p.x)),
        Math.round((correct + 1) * 100) / 100, Math.round((correct - 1) * 100) / 100,
        Math.round((correct * 2) * 100) / 100, Math.round((correct / 2) * 100) / 100,
      ]);
      return pickThree(cand, correct);
    },
  };
}

function nextFact(mode) {
  if (mode === 'tables') return pickTablesFact();
  if (mode === 'squares') return pickSquaresFact();
  if (mode === 'cubes') return pickCubesFact();
  if (mode === 'fractions') return pickFractionFact();
  // mixed: tables weighted heaviest since that's the bulk of the ask
  const r = Math.random();
  if (r < 0.4) return pickTablesFact();
  if (r < 0.6) return pickSquaresFact();
  if (r < 0.8) return pickCubesFact();
  return pickFractionFact();
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
let session = null; // { mode, total, correct }
let question = null;
let rafId = null;

const setupEl = document.getElementById('quizSetup');
const liveEl = document.getElementById('quizLive');
const summaryEl = document.getElementById('quizSummary');
const marginRule = document.getElementById('marginRule');
const nextBtn = document.getElementById('nextQuestionBtn');

document.getElementById('startQuiz').addEventListener('click', () => startSession(currentMode));
document.getElementById('stopQuiz').addEventListener('click', () => endLiveQuiz(true));
document.getElementById('againQuiz').addEventListener('click', () => startSession(currentMode));
nextBtn.addEventListener('click', () => { if (session) askQuestion(); });

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
  nextBtn.hidden = true;

  const grid = document.getElementById('optionsGrid');
  grid.innerHTML = '';
  options.forEach((val, i) => {
    const b = document.createElement('button');
    b.className = 'option-btn';
    b.dataset.val = val;
    b.innerHTML = `${formatValue(fact.category, val)}<span class="key-hint">${i + 1}</span>`;
    b.addEventListener('click', () => selectOption(val, b));
    grid.appendChild(b);
  });

  marginRule.style.transform = 'scaleY(1)';
  runTimer();

  const onKey = (e) => {
    if (!question || question.answered) { document.removeEventListener('keydown', onKey); return; }
    const idx = parseInt(e.key, 10) - 1;
    if (idx >= 0 && idx < options.length) {
      selectOption(options[idx], grid.children[idx]);
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);
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
  const correct = !timedOut && Math.abs(val - question.answer) < 0.001;
  const slow = elapsed > question.timeLimit * 0.65;

  document.querySelectorAll('.option-btn').forEach(b => {
    b.disabled = true;
    const v = parseFloat(b.dataset.val);
    if (Math.abs(v - question.answer) < 0.001) b.classList.add('is-correct');
    else if (b === btnEl) b.classList.add('is-wrong');
  });

  const answerDisplay = formatValue(question.category, question.answer);
  const fb = document.getElementById('feedbackText');
  if (timedOut) { fb.textContent = `Time's up — ${question.equation} = ${answerDisplay}`; fb.className = 'feedback is-timeout'; }
  else if (correct) { fb.textContent = `Right, in ${elapsed.toFixed(1)}s — ${question.equation} = ${answerDisplay}`; fb.className = 'feedback is-correct'; }
  else { fb.textContent = `Not quite — ${question.equation} = ${answerDisplay}`; fb.className = 'feedback is-wrong'; }

  recordFactResult(question.category, question.key, correct, slow);
  session.total++; if (correct) session.correct++;
  state.totals[session.mode].seen++; if (correct) state.totals[session.mode].correct++;

  adjustClock(session.mode, correct, slow);
  saveState();
  document.getElementById('quizScore').textContent = `${session.correct}/${session.total}`;
  document.getElementById('quizTimeLimitLabel').textContent = state.timeLimits[session.mode] + 's';

  nextBtn.hidden = false;
  nextBtn.focus();
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
