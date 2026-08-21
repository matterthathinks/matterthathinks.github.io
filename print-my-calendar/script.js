(function () {
  "use strict";

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW_FULL = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const DOW_INITIAL = ["S","M","T","W","T","F","S"];
  const MAX_MONTHS = 36; // safety cap: 3 years

  const state = { palette: "colour", orientation: "landscape" };

  // ---------- helpers ----------
  function pad2(n) { return String(n).padStart(2, "0"); }
  function monthInputValue(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1); }
  function dateOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function daysBetween(a, b) { return Math.round((dateOnly(b) - dateOnly(a)) / 86400000); }
  function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function formatGoal(d) {
    return d.getDate() + " " + MONTH_NAMES[d.getMonth()].slice(0, 3).toUpperCase() + " " + d.getFullYear();
  }

  function buildMonthGrid(year, m) {
    const first = new Date(year, m, 1);
    const startOffset = first.getDay();
    const gridStart = new Date(year, m, 1 - startOffset);
    const weeks = [];
    let cursor = new Date(gridStart);
    for (let w = 0; w < 6; w++) {
      const row = [];
      for (let d = 0; d < 7; d++) {
        row.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(row);
    }
    return weeks;
  }

  // ---------- default field values ----------
  const today = dateOnly(new Date());
  const startInput = document.getElementById("startMonth");
  const endInput = document.getElementById("endMonth");
  startInput.value = monthInputValue(today);
  const nextYearSameMonth = new Date(today.getFullYear() + 1, today.getMonth(), 1);
  endInput.value = monthInputValue(nextYearSameMonth);

  // ---------- toggle buttons ----------
  document.querySelectorAll(".toggle").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".toggle-btn");
      if (!btn) return;
      const groupName = btn.dataset.group;
      group.querySelectorAll(".toggle-btn").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      state[groupName] = btn.dataset.value;
    });
  });

  // ---------- mini month overview ----------
  function buildMiniCalendar(year, m, goalDate) {
    const grid = buildMonthGrid(year, m);
    const table = document.createElement("table");
    table.className = "mini-cal";

    const thead = document.createElement("tr");
    DOW_INITIAL.forEach((t) => {
      const th = document.createElement("th");
      th.textContent = t;
      thead.appendChild(th);
    });
    table.appendChild(thead);

    grid.forEach((week) => {
      const tr = document.createElement("tr");
      week.forEach((d) => {
        const td = document.createElement("td");
        const inMonth = d.getMonth() === m;
        if (inMonth) {
          td.textContent = d.getDate();
          if (goalDate && sameDate(d, goalDate)) td.classList.add("goal");
        } else {
          td.textContent = d.getDate();
          td.classList.add("out");
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    return table;
  }

  // ---------- one printable page ----------
  function buildPage(year, m, goalDate, todayForCountdown) {
    const page = document.createElement("section");
    page.className = "cal-page";

    // header (real <table> for maximum cross-engine reliability when printing)
    const header = document.createElement("table");
    header.className = "page-header";
    const headerBody = document.createElement("tbody");
    const headerRowEl = document.createElement("tr");

    const titleWrap = document.createElement("td");
    titleWrap.className = "title-cell";
    const titleLine = document.createElement("h2");
    titleLine.className = "page-title";
    titleLine.innerHTML = MONTH_NAMES[m] + ' <span class="yr">' + year + "</span>";
    titleWrap.appendChild(titleLine);

    if (goalDate) {
      const dayZero = daysBetween(todayForCountdown, goalDate);
      const sub = document.createElement("p");
      sub.className = "page-subtitle";
      sub.textContent = "GOAL COUNTDOWN  ·  DAY " + dayZero + " \u2192 DAY 0  ·  GOAL " + formatGoal(goalDate);
      titleWrap.appendChild(sub);
    }
    headerRowEl.appendChild(titleWrap);
    const miniWrap = document.createElement("td");
    miniWrap.className = "mini-cell";
    miniWrap.appendChild(buildMiniCalendar(year, m, goalDate));
    headerRowEl.appendChild(miniWrap);
    headerBody.appendChild(headerRowEl);
    header.appendChild(headerBody);
    page.appendChild(header);

    // rule
    const rule = document.createElement("hr");
    rule.className = "rule";
    page.appendChild(rule);

    // main grid
    const grid = document.createElement("table");
    grid.className = "grid";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    DOW_FULL.forEach((t, i) => {
      const dow = document.createElement("th");
      dow.className = "dow" + (i === 0 || i === 6 ? " weekend" : "");
      dow.textContent = t;
      headRow.appendChild(dow);
    });
    thead.appendChild(headRow);
    grid.appendChild(thead);

    const tbody = document.createElement("tbody");
    const weeks = buildMonthGrid(year, m);
    weeks.forEach((week) => {
      const tr = document.createElement("tr");
      week.forEach((d, i) => {
        const inMonth = d.getMonth() === m;
        const isWeekend = i === 0 || i === 6;
        const isGoal = goalDate && sameDate(d, goalDate);
        const cell = document.createElement("td");
        cell.className = "cell" + (isWeekend ? " weekend" : "") + (inMonth ? "" : " out") + (isGoal ? " goal" : "");

        const num = document.createElement("span");
        num.className = "num";
        num.textContent = d.getDate();
        cell.appendChild(num);

        if (isGoal) {
          const cd = document.createElement("span");
          cd.className = "cd";
          cd.textContent = "0";
          cell.appendChild(cd);
          const label = document.createElement("div");
          label.className = "goal-label";
          label.textContent = "Goal day";
          cell.appendChild(label);
        } else if (inMonth && goalDate) {
          const cdVal = daysBetween(d, goalDate);
          if (cdVal >= 0 && d >= todayForCountdown) {
            const cd = document.createElement("span");
            cd.className = "cd";
            cd.textContent = cdVal;
            cell.appendChild(cd);
          }
        }
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });
    grid.appendChild(tbody);
    page.appendChild(grid);

    return page;
  }

  // ---------- form submit ----------
  const form = document.getElementById("calendarForm");
  const errorBox = document.getElementById("formError");
  const setupView = document.getElementById("setupView");
  const printView = document.getElementById("printView");
  const pagesEl = document.getElementById("pages");

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.hidden = true;

    const [sy, sm] = startInput.value.split("-").map(Number);
    const [ey, em] = endInput.value.split("-").map(Number);
    if (!sy || !sm || !ey || !em) { showError("Pick both a start and an end month."); return; }

    const startIndex = sy * 12 + (sm - 1);
    const endIndex = ey * 12 + (em - 1);
    if (endIndex < startIndex) { showError("The end month needs to come after the start month."); return; }
    const span = endIndex - startIndex + 1;
    if (span > MAX_MONTHS) { showError("That's a long stretch — please keep it to " + MAX_MONTHS + " months or fewer."); return; }

    let goalDate = null;
    const goalVal = document.getElementById("goalDate").value;
    if (goalVal) {
      const [gy, gm, gd] = goalVal.split("-").map(Number);
      goalDate = new Date(gy, gm - 1, gd);
    }

    // build month list
    const months = [];
    for (let idx = startIndex; idx <= endIndex; idx++) {
      months.push({ y: Math.floor(idx / 12), m: idx % 12 });
    }

    // apply theme + orientation
    document.documentElement.classList.toggle("theme-mono", state.palette === "mono");
    document.body.classList.toggle("orient-portrait", state.orientation === "portrait");
    document.body.classList.toggle("orient-landscape", state.orientation !== "portrait");

    // build pages
    pagesEl.innerHTML = "";
    months.forEach(({ y, m }) => pagesEl.appendChild(buildPage(y, m, goalDate, today)));

    setupView.hidden = true;
    printView.hidden = false;
    window.scrollTo(0, 0);
  });

  // ---------- back / print ----------
  document.getElementById("backBtn").addEventListener("click", () => {
    printView.hidden = true;
    setupView.hidden = false;
  });

  document.getElementById("printBtn").addEventListener("click", () => {
    let styleTag = document.getElementById("pageSizeStyle");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "pageSizeStyle";
      document.head.appendChild(styleTag);
    }
    const size = state.orientation === "portrait" ? "A4 portrait" : "A4 landscape";
    styleTag.textContent = "@page { size: " + size + "; margin: 0; }";
    window.print();
  });
})();
