/* ============================================================
   MARAUDERS MATH LEAGUE — script.js (Version 2 — Google Sheets)
   Mt. Vernon High School
   ============================================================ */

/* ============================================================
   ★  ONLY THING YOU NEED TO EDIT IN THIS FILE  ★
   Paste your Google Sheet ID between the quotes below.
   ============================================================ */
const SPREADSHEET_ID = "1nsmDpswUsilujx0qRc-I1mJQ4c-uG6hFnL3EwffP5HI";

/* ============================================================
   ★  STOP — everything below runs automatically  ★
   ============================================================ */

const SHEET_TABS = {
  settings:      "Settings",
  classes:       "Classes",
  announcements: "Announcements",
  events:        "Events",
};

let WEEK_NUMBER   = 1;
let SCHOOL_YEAR   = "";
let CLASSES       = [];
let ANNOUNCEMENTS = [];
let EVENTS        = [];
let scoredClasses = [];

// Tracks which month the calendar is showing
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0 = January

// Maps 3-letter month abbreviations to JS month numbers (0-based)
const MONTH_MAP = {
  JAN:0, FEB:1, MAR:2, APR:3, MAY:4,  JUN:5,
  JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11
};
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];


/* ========== BADGE DEFINITIONS ========== */
const BADGE_DEFINITIONS = [
  {
    id: "biggest-growth", icon: "📈", name: "Biggest Growth",
    desc: "Most improved from last assessment",
    winner: (c) => c.reduce((b, x) => x.delta > (b?.delta ?? -Infinity) ? x : b, null),
  },
  {
    id: "homework-heroes", icon: "✅", name: "Homework Heroes",
    desc: "Highest homework completion rate",
    winner: (c) => c.reduce((b, x) => x.hwCompletion > (b?.hwCompletion ?? -Infinity) ? x : b, null),
  },
  {
    id: "exit-ticket-champs", icon: "🎫", name: "Exit Ticket Champs",
    desc: "Highest exit ticket average",
    winner: (c) => c.reduce((b, x) => x.exitTicketAvg > (b?.exitTicketAvg ?? -Infinity) ? x : b, null),
  },
  {
    id: "most-improved", icon: "⬆️", name: "Most Improved",
    desc: "Largest positive growth bonus",
    winner: (c) => c.reduce((b, x) => x.growthBonus > (b?.growthBonus ?? -Infinity) ? x : b, null),
  },
  {
    id: "perfect-participation", icon: "🙋", name: "Perfect Participation",
    desc: "Top behavior & participation points",
    winner: (c) => c.reduce((b, x) => x.behaviorPoints > (b?.behaviorPoints ?? -Infinity) ? x : b, null),
  },
  {
    id: "quiz-crushers", icon: "💯", name: "Quiz Crushers",
    desc: "Highest quiz average this week",
    winner: (c) => c.reduce((b, x) => x.quizAvg > (b?.quizAvg ?? -Infinity) ? x : b, null),
  },
];


/* ========== GOOGLE SHEETS FETCH ========== */

function sheetUrl(tabName) {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
}

async function fetchSheet(tabName) {
  const response = await fetch(sheetUrl(tabName));
  if (!response.ok) throw new Error(`Could not fetch sheet: ${tabName}`);
  const csvText = await response.text();
  return Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
}

async function loadFromSheets() {
  const [settingsRows, classRows, announcementRows, eventRows] = await Promise.all([
    fetchSheet(SHEET_TABS.settings),
    fetchSheet(SHEET_TABS.classes),
    fetchSheet(SHEET_TABS.announcements),
    fetchSheet(SHEET_TABS.events),
  ]);

  // Settings
  const settings = {};
  settingsRows.forEach(row => { if (row.Key) settings[row.Key.trim()] = row.Value; });
  WEEK_NUMBER = parseInt(settings["WeekNumber"]) || 1;
  SCHOOL_YEAR = settings["SchoolYear"] || "";

  // Classes
  CLASSES = classRows.map(row => ({
    id:                (row.Period || "").replace(/\s/g, "-").toLowerCase(),
    name:              row.Name             || "",
    period:            row.Period           || "",
    quizAvg:           parseFloat(row.QuizAvg)           || 0,
    exitTicketAvg:     parseFloat(row.ExitTicketAvg)     || 0,
    hwCompletion:      parseFloat(row.HWCompletion)      || 0,
    growthBonus:       parseFloat(row.GrowthBonus)       || 0,
    behaviorPoints:    parseFloat(row.BehaviorPoints)    || 0,
    prevAssessmentAvg: parseFloat(row.PrevAssessmentAvg) || 0,
    currAssessmentAvg: parseFloat(row.CurrAssessmentAvg) || 0,
    winStreak:         parseInt(row.WinStreak)            || 0,
  }));

  // Announcements
  ANNOUNCEMENTS = announcementRows.map(row => ({
    type:  row.Type  || "info",
    icon:  row.Icon  || "📢",
    title: row.Title || "",
    body:  row.Body  || "",
  }));

  // Events
  EVENTS = eventRows.map(row => ({
    month: (row.Month || "").toUpperCase().trim(),
    day:   parseInt(row.Day) || 0,
    title: row.Title || "",
    desc:  row.Desc  || "",
    type:  (row.Type || "event").toLowerCase().trim(),
  }));

  // Score & sort classes
  scoredClasses = CLASSES.map(cls => ({
    ...cls,
    weeklyScore: calculateScore(cls),
    delta: cls.currAssessmentAvg - cls.prevAssessmentAvg,
  })).sort((a, b) => b.weeklyScore - a.weeklyScore);
}

function calculateScore(cls) {
  const raw = cls.quizAvg + cls.exitTicketAvg + cls.hwCompletion + cls.growthBonus + cls.behaviorPoints;
  return Math.round((raw / 320) * 100);
}


/* ========== RENDER FUNCTIONS ========== */

function renderHeader() {
  const now = new Date();
  document.getElementById("live-date").textContent =
    now.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  document.getElementById("week-label").textContent = `Week ${WEEK_NUMBER} · ${SCHOOL_YEAR}`;
}

function renderTicker() {
  const topHW   = scoredClasses.reduce((a, b) => a.hwCompletion > b.hwCompletion ? a : b);
  const topQuiz = scoredClasses.reduce((a, b) => a.quizAvg > b.quizAvg ? a : b);
  const items = [
    `🏆 WEEK ${WEEK_NUMBER} LEADER: ${scoredClasses[0].name} – ${scoredClasses[0].period}`,
    `📢 Upcoming: ${EVENTS[0]?.title || "Check the calendar!"}`,
    `⭐ Top Quiz Avg: ${topQuiz.name} ${topQuiz.period} — ${topQuiz.quizAvg}%`,
    `✅ Best HW Completion: ${topHW.period} — ${topHW.hwCompletion}%`,
    `🎖️ Marauders Math League · Go get that gold!`,
  ];
  document.getElementById("ticker").textContent =
    "  ⚡  " + items.join("     |     ") + "  ⚡  ";
}

function renderAnnouncements() {
  const grid = document.getElementById("announcements-grid");
  grid.innerHTML = "";
  ANNOUNCEMENTS.forEach(ann => {
    const card = document.createElement("div");
    card.className = "announcement-card";
    card.innerHTML = `
      <div class="ann-type">${ann.icon} ${ann.type}</div>
      <div class="ann-title">${ann.title}</div>
      <div class="ann-body">${ann.body}</div>
    `;
    grid.appendChild(card);
  });
}

function renderLeaderboard() {
  const tbody = document.getElementById("leaderboard-body");
  tbody.innerHTML = "";
  const rankIcons = ["🥇","🥈","🥉"];
  scoredClasses.forEach((cls, idx) => {
    const rank = idx + 1;
    const tr = document.createElement("tr");
    tr.className = rank <= 3 ? `rank-${rank}` : "";
    tr.innerHTML = `
      <td><span class="rank-icon">${rankIcons[idx] || rank}</span></td>
      <td><strong>${cls.name}</strong><br/><span style="color:var(--gray);font-size:0.8rem">${cls.period}</span></td>
      <td>${cls.quizAvg}%</td>
      <td>${cls.exitTicketAvg}%</td>
      <td>${cls.hwCompletion}%</td>
      <td class="${cls.delta >= 0 ? 'text-gold' : ''}">${cls.delta >= 0 ? "+" : ""}${cls.delta}</td>
      <td>${cls.behaviorPoints}/10</td>
      <td><span class="score-value">${cls.weeklyScore}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderChampion() {
  const c = scoredClasses[0];
  document.getElementById("champion-card").innerHTML = `
    <div class="champion-trophy">🏆</div>
    <div class="champion-info">
      <div class="champion-label">⭐ Week ${WEEK_NUMBER} Champion</div>
      <div class="champion-class">${c.name} – ${c.period}</div>
      <div class="champion-score-wrap">
        <span class="champion-score">${c.weeklyScore}</span>
        <span class="champion-score-label">/ 100 points</span>
      </div>
      ${c.winStreak > 1 ? `<div class="champion-streak">🔥 ${c.winStreak}-Week Streak!</div>` : ""}
    </div>
  `;
}

function renderStats() {
  const grid = document.getElementById("stats-grid");
  grid.innerHTML = "";
  scoredClasses.forEach(cls => {
    const card = document.createElement("div");
    card.className = "stat-card";
    const bar = (label, value, max = 100) => {
      const pct = Math.min(100, Math.round((value / max) * 100));
      return `<div class="stat-bar-row">
        <div class="stat-bar-label"><span>${label}</span><span>${value}${max===100?"%":"/"+max}</span></div>
        <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    };
    card.innerHTML = `
      <div class="stat-card-header"><span class="stat-card-icon">📋</span><span class="stat-card-title">Class Stats</span></div>
      <div class="stat-card-class">${cls.name} – ${cls.period}</div>
      ${bar("Quiz Average", cls.quizAvg)}
      ${bar("Exit Ticket Avg", cls.exitTicketAvg)}
      ${bar("HW Completion", cls.hwCompletion)}
      ${bar("Behavior Points", cls.behaviorPoints, 10)}
      ${bar("Growth Bonus", cls.growthBonus, 10)}
    `;
    grid.appendChild(card);
  });
}

function renderGrowthTracker() {
  const grid = document.getElementById("growth-grid");
  grid.innerHTML = "";
  scoredClasses.forEach(cls => {
    const d = cls.delta;
    const card = document.createElement("div");
    card.className = "growth-card";
    card.innerHTML = `
      <div class="growth-class-name">${cls.name} – ${cls.period}</div>
      <div class="growth-numbers">
        <span class="growth-prev">${cls.prevAssessmentAvg}</span>
        <span class="growth-arrow">➡️</span>
        <span class="growth-current">${cls.currAssessmentAvg}</span>
      </div>
      <span class="growth-delta ${d>0?"positive":d<0?"negative":"neutral"}">${d>0?"+":""}${d} pts</span>
    `;
    grid.appendChild(card);
  });
}

function renderBadges() {
  const grid = document.getElementById("badges-grid");
  grid.innerHTML = "";
  BADGE_DEFINITIONS.forEach(badge => {
    const winner = badge.winner(scoredClasses);
    const card = document.createElement("div");
    card.className = `badge-card ${winner ? "earned" : "badge-unearned"}`;
    card.innerHTML = `
      <span class="badge-icon">${badge.icon}</span>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-class">${winner ? `${winner.name} – ${winner.period}` : "Not yet awarded"}</div>
      <div class="badge-desc">${badge.desc}</div>
    `;
    grid.appendChild(card);
  });
}

function renderEvents() {
  const grid = document.getElementById("events-grid");
  grid.innerHTML = "";
  EVENTS.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <div class="event-date-block">
        <div class="event-month">${ev.month}</div>
        <div class="event-day">${ev.day}</div>
      </div>
      <div class="event-details">
        <div class="event-title">${ev.title}</div>
        <div class="event-desc">${ev.desc}</div>
        <span class="event-type-tag ${ev.type}">${ev.type.toUpperCase()}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}


/* ========== CALENDAR ========== */

function renderCalendar() {
  // Update month label
  document.getElementById("cal-month-label").textContent =
    `${MONTH_NAMES[calMonth]} ${calYear}`;

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  const today = new Date();
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // Build a lookup: day number → array of events on that day
  const eventsByDay = {};
  EVENTS.forEach(ev => {
    const evMonthNum = MONTH_MAP[ev.month];
    if (evMonthNum === calMonth && ev.day > 0) {
      // Check year: if the event year matches or we're not tracking year
      if (!eventsByDay[ev.day]) eventsByDay[ev.day] = [];
      eventsByDay[ev.day].push(ev);
    }
  });

  // Empty cells before day 1
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "cal-day";

    const isToday = (
      day === today.getDate() &&
      calMonth === today.getMonth() &&
      calYear  === today.getFullYear()
    );
    if (isToday) cell.classList.add("today");

    const dayEvents = eventsByDay[day] || [];
    if (dayEvents.length > 0) cell.classList.add("has-event");

    // Day number
    const dayNum = document.createElement("span");
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    // Colored dots
    if (dayEvents.length > 0) {
      const dotsWrap = document.createElement("div");
      dotsWrap.className = "cal-dots";
      dayEvents.forEach(ev => {
        const dot = document.createElement("span");
        dot.className = `cal-dot ${ev.type}`;
        dotsWrap.appendChild(dot);
      });
      cell.appendChild(dotsWrap);

      // Tooltip with event titles
      const tooltip = document.createElement("div");
      tooltip.className = "cal-tooltip";
      tooltip.innerHTML = dayEvents.map(ev =>
        `<div><strong style="color:var(--gold)">${ev.title}</strong></div>`
      ).join("");
      cell.appendChild(tooltip);
    }

    grid.appendChild(cell);
  }
}

// Wire up prev/next buttons — called after DOM is ready
function setupCalendarNav() {
  document.getElementById("cal-prev").addEventListener("click", () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
}


/* ========== MAIN ========== */
function renderAll() {
  renderHeader();
  renderTicker();
  renderAnnouncements();
  renderLeaderboard();
  renderChampion();
  renderStats();
  renderGrowthTracker();
  renderBadges();
  renderEvents();
  renderCalendar();
  setupCalendarNav();
}

document.addEventListener("DOMContentLoaded", async () => {
  const overlay     = document.getElementById("loading-overlay");
  const errorBanner = document.getElementById("error-banner");

  try {
    await loadFromSheets();
    overlay.classList.add("hidden");
    renderAll();
    setInterval(renderHeader, 60000);
  } catch (err) {
    console.error("Sheets load error:", err);
    overlay.classList.add("hidden");
    errorBanner.style.display = "block";
  }
});
