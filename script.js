/* ============================================================
   MARAUDERS MATH LEAGUE — script.js (Version 2 — Google Sheets)
   Mt. Vernon High School

   HOW TO SET UP:
   1. Make a copy of the Google Sheets template (link in instructions)
   2. In your sheet: File → Share → Publish to web → Entire document → CSV → Publish
   3. Copy your Sheet ID from the URL (the long string between /d/ and /edit)
   4. Paste it below where it says YOUR_SHEET_ID_HERE
   5. Upload this file to GitHub — done! Updates in Sheets appear on the site
      within about 30 seconds.
   ============================================================ */


/* ============================================================
   ★  ONLY THING YOU NEED TO EDIT IN THIS FILE  ★
   ============================================================ */

// Paste your Google Sheet ID here.
// Example: if your sheet URL is
//   https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit
// then your ID is:  1aBcDeFgHiJkLmNoPqRsTuVwXyZ
const SPREADSHEET_ID = "YOUR_SHEET_ID_HERE";

/* ============================================================
   ★  STOP — everything below runs automatically  ★
   ============================================================ */


// Tab names in your Google Sheet — must match exactly
const SHEET_TABS = {
  settings:      "Settings",
  classes:       "Classes",
  announcements: "Announcements",
  events:        "Events",
};

// These will be filled in from the sheet data
let WEEK_NUMBER   = 1;
let SCHOOL_YEAR   = "";
let CLASSES       = [];
let ANNOUNCEMENTS = [];
let EVENTS        = [];
let scoredClasses = [];


/* ---- BADGE DEFINITIONS (unchanged from v1) ---- */
const BADGE_DEFINITIONS = [
  {
    id: "biggest-growth",
    icon: "📈",
    name: "Biggest Growth",
    desc: "Most improved from last assessment",
    winner: (classes) => classes.reduce((best, cls) => cls.delta > (best?.delta ?? -Infinity) ? cls : best, null),
  },
  {
    id: "homework-heroes",
    icon: "✅",
    name: "Homework Heroes",
    desc: "Highest homework completion rate",
    winner: (classes) => classes.reduce((best, cls) => cls.hwCompletion > (best?.hwCompletion ?? -Infinity) ? cls : best, null),
  },
  {
    id: "exit-ticket-champs",
    icon: "🎫",
    name: "Exit Ticket Champs",
    desc: "Highest exit ticket average",
    winner: (classes) => classes.reduce((best, cls) => cls.exitTicketAvg > (best?.exitTicketAvg ?? -Infinity) ? cls : best, null),
  },
  {
    id: "most-improved",
    icon: "⬆️",
    name: "Most Improved",
    desc: "Largest positive growth bonus",
    winner: (classes) => classes.reduce((best, cls) => cls.growthBonus > (best?.growthBonus ?? -Infinity) ? cls : best, null),
  },
  {
    id: "perfect-participation",
    icon: "🙋",
    name: "Perfect Participation",
    desc: "Top behavior & participation points",
    winner: (classes) => classes.reduce((best, cls) => cls.behaviorPoints > (best?.behaviorPoints ?? -Infinity) ? cls : best, null),
  },
  {
    id: "quiz-crushers",
    icon: "💯",
    name: "Quiz Crushers",
    desc: "Highest quiz average this week",
    winner: (classes) => classes.reduce((best, cls) => cls.quizAvg > (best?.quizAvg ?? -Infinity) ? cls : best, null),
  },
];


/* ========== GOOGLE SHEETS FETCH & PARSE ========== */

// Builds the CSV export URL for a given sheet tab name
function sheetUrl(tabName) {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
}

// Fetches one sheet tab and returns parsed rows as an array of objects
async function fetchSheet(tabName) {
  const response = await fetch(sheetUrl(tabName));
  if (!response.ok) throw new Error(`Could not fetch sheet: ${tabName}`);
  const csvText = await response.text();
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return result.data;
}

// Loads all four tabs in parallel, then populates the global variables
async function loadFromSheets() {
  const [settingsRows, classRows, announcementRows, eventRows] = await Promise.all([
    fetchSheet(SHEET_TABS.settings),
    fetchSheet(SHEET_TABS.classes),
    fetchSheet(SHEET_TABS.announcements),
    fetchSheet(SHEET_TABS.events),
  ]);

  // ---- SETTINGS tab (two columns: Key, Value) ----
  const settings = {};
  settingsRows.forEach(row => {
    if (row.Key) settings[row.Key.trim()] = row.Value;
  });
  WEEK_NUMBER  = parseInt(settings["WeekNumber"]) || 1;
  SCHOOL_YEAR  = settings["SchoolYear"] || "";

  // ---- CLASSES tab ----
  CLASSES = classRows.map(row => ({
    id:               (row.Period || "").replace(/\s/g, "-").toLowerCase(),
    name:             row.Name             || "",
    period:           row.Period           || "",
    quizAvg:          parseFloat(row.QuizAvg)          || 0,
    exitTicketAvg:    parseFloat(row.ExitTicketAvg)    || 0,
    hwCompletion:     parseFloat(row.HWCompletion)     || 0,
    growthBonus:      parseFloat(row.GrowthBonus)      || 0,
    behaviorPoints:   parseFloat(row.BehaviorPoints)   || 0,
    prevAssessmentAvg: parseFloat(row.PrevAssessmentAvg) || 0,
    currAssessmentAvg: parseFloat(row.CurrAssessmentAvg) || 0,
    winStreak:        parseInt(row.WinStreak)           || 0,
  }));

  // ---- ANNOUNCEMENTS tab ----
  ANNOUNCEMENTS = announcementRows.map(row => ({
    type:  row.Type  || "info",
    icon:  row.Icon  || "📢",
    title: row.Title || "",
    body:  row.Body  || "",
  }));

  // ---- EVENTS tab ----
  EVENTS = eventRows.map(row => ({
    month: row.Month || "",
    day:   parseInt(row.Day) || 0,
    title: row.Title || "",
    desc:  row.Desc  || "",
    type:  row.Type  || "event",
  }));

  // ---- Compute weekly scores and sort ----
  scoredClasses = CLASSES.map(cls => ({
    ...cls,
    weeklyScore: calculateScore(cls),
    delta: cls.currAssessmentAvg - cls.prevAssessmentAvg,
  })).sort((a, b) => b.weeklyScore - a.weeklyScore);
}


/* ---- SCORING FORMULA ----
   Weekly Score = quizAvg + exitTicketAvg + hwCompletion + growthBonus + behaviorPoints
   Max raw = 320 → scaled to 0–100 display score
*/
function calculateScore(cls) {
  const raw = cls.quizAvg + cls.exitTicketAvg + cls.hwCompletion + cls.growthBonus + cls.behaviorPoints;
  return Math.round((raw / 320) * 100);
}


/* ========== RENDER FUNCTIONS (same as v1) ========== */

function renderHeader() {
  const dateEl = document.getElementById("live-date");
  const weekEl = document.getElementById("week-label");
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  dateEl.textContent = now.toLocaleDateString("en-US", options);
  weekEl.textContent = `Week ${WEEK_NUMBER} · ${SCHOOL_YEAR}`;
}

function renderTicker() {
  const el = document.getElementById("ticker");
  const topHW  = scoredClasses.reduce((a, b) => a.hwCompletion  > b.hwCompletion  ? a : b);
  const topQuiz = scoredClasses.reduce((a, b) => a.quizAvg > b.quizAvg ? a : b);
  const items = [
    `🏆 WEEK ${WEEK_NUMBER} LEADER: ${scoredClasses[0].name} – ${scoredClasses[0].period}`,
    `📢 Upcoming: ${EVENTS[0]?.title || "Check the calendar!"}`,
    `⭐ Top Quiz Avg: ${topQuiz.name} ${topQuiz.period} — ${topQuiz.quizAvg}%`,
    `✅ Best HW Completion: ${topHW.period} — ${topHW.hwCompletion}%`,
    `🎖️ Marauders Math League · Go get that gold!`,
  ];
  el.textContent = "  ⚡  " + items.join("     |     ") + "  ⚡  ";
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
  const rankIcons = ["🥇", "🥈", "🥉"];
  scoredClasses.forEach((cls, idx) => {
    const rank = idx + 1;
    const tr = document.createElement("tr");
    tr.className = rank <= 3 ? `rank-${rank}` : "";
    tr.innerHTML = `
      <td><span class="rank-icon">${rankIcons[idx] || rank}</span></td>
      <td>
        <strong>${cls.name}</strong><br/>
        <span style="color:var(--gray);font-size:0.8rem">${cls.period}</span>
      </td>
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
  const champion = scoredClasses[0];
  const card = document.getElementById("champion-card");
  card.innerHTML = `
    <div class="champion-trophy">🏆</div>
    <div class="champion-info">
      <div class="champion-label">⭐ Week ${WEEK_NUMBER} Champion</div>
      <div class="champion-class">${champion.name} – ${champion.period}</div>
      <div class="champion-score-wrap">
        <span class="champion-score">${champion.weeklyScore}</span>
        <span class="champion-score-label">/ 100 points</span>
      </div>
      ${champion.winStreak > 1
        ? `<div class="champion-streak">🔥 ${champion.winStreak}-Week Streak!</div>`
        : ""}
    </div>
  `;
}

function renderStats() {
  const grid = document.getElementById("stats-grid");
  grid.innerHTML = "";
  scoredClasses.forEach(cls => {
    const card = document.createElement("div");
    card.className = "stat-card";
    function barRow(label, value, max = 100) {
      const pct = Math.min(100, Math.round((value / max) * 100));
      return `
        <div class="stat-bar-row">
          <div class="stat-bar-label">
            <span>${label}</span>
            <span>${value}${max === 100 ? "%" : "/" + max}</span>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    }
    card.innerHTML = `
      <div class="stat-card-header">
        <span class="stat-card-icon">📋</span>
        <span class="stat-card-title">Class Stats</span>
      </div>
      <div class="stat-card-class">${cls.name} – ${cls.period}</div>
      ${barRow("Quiz Average", cls.quizAvg)}
      ${barRow("Exit Ticket Avg", cls.exitTicketAvg)}
      ${barRow("HW Completion", cls.hwCompletion)}
      ${barRow("Behavior Points", cls.behaviorPoints, 10)}
      ${barRow("Growth Bonus", cls.growthBonus, 10)}
    `;
    grid.appendChild(card);
  });
}

function renderGrowthTracker() {
  const grid = document.getElementById("growth-grid");
  grid.innerHTML = "";
  scoredClasses.forEach(cls => {
    const delta = cls.currAssessmentAvg - cls.prevAssessmentAvg;
    const deltaClass = delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";
    const deltaText  = delta > 0 ? `+${delta}` : `${delta}`;
    const card = document.createElement("div");
    card.className = "growth-card";
    card.innerHTML = `
      <div class="growth-class-name">${cls.name} – ${cls.period}</div>
      <div class="growth-numbers">
        <span class="growth-prev">${cls.prevAssessmentAvg}</span>
        <span class="growth-arrow">➡️</span>
        <span class="growth-current">${cls.currAssessmentAvg}</span>
      </div>
      <span class="growth-delta ${deltaClass}">${deltaText} pts</span>
    `;
    grid.appendChild(card);
  });
}

function renderBadges() {
  const grid = document.getElementById("badges-grid");
  grid.innerHTML = "";
  BADGE_DEFINITIONS.forEach(badge => {
    const winner = badge.winner(scoredClasses);
    const earned = winner !== null;
    const card = document.createElement("div");
    card.className = `badge-card ${earned ? "earned" : "badge-unearned"}`;
    card.innerHTML = `
      <span class="badge-icon">${badge.icon}</span>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-class">${earned ? `${winner.name} – ${winner.period}` : "Not yet awarded"}</div>
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
}


/* ========== MAIN — fetch data then render ========== */
document.addEventListener("DOMContentLoaded", async () => {
  const overlay = document.getElementById("loading-overlay");
  const errorBanner = document.getElementById("error-banner");

  try {
    await loadFromSheets();
    overlay.classList.add("hidden");
    renderAll();
    // Auto-refresh date every minute
    setInterval(renderHeader, 60000);
  } catch (err) {
    console.error("Sheets load error:", err);
    overlay.classList.add("hidden");
    errorBanner.style.display = "block";
  }
});
