/* ============================================================
   MARAUDERS MATH LEAGUE — script.js
   Mt. Vernon High School | Version 1.0

   HOW TO EDIT:
   1. Update CLASSES array with your real scores each week.
   2. Update ANNOUNCEMENTS with new messages.
   3. Update EVENTS with upcoming dates.
   4. All scores are per-class — NO individual student names.
   ============================================================ */


/* ============================================================
   ★  TEACHER EDIT ZONE — START HERE  ★
   ============================================================ */

// ---- CURRENT WEEK INFO ----
const WEEK_NUMBER = 1;         // Change this each week
const SCHOOL_YEAR = "2026–27"; // School year label

// ---- YOUR CLASSES ----
// Edit the values below to match your actual class data.
// All scores are class-level averages, NOT individual student grades.
const CLASSES = [
  {
    id: "p1",
    name: "Algebra 1",
    period: "Period 1",
    color: "#F5C518", // optional per-class accent (currently unused but available)

    // ---- CURRENT WEEK SCORES ----
    quizAvg: 84,          // Average quiz score (0–100)
    exitTicketAvg: 88,    // Average exit ticket score (0–100)
    hwCompletion: 92,     // Homework completion rate (0–100 percent)
    growthBonus: 8,       // Points added for improvement over last assessment (0–10)
    behaviorPoints: 9,    // Teacher-assigned participation/behavior score (0–10)

    // ---- PREVIOUS ASSESSMENT (for growth tracker) ----
    prevAssessmentAvg: 76,  // Class average from last quiz/test
    currAssessmentAvg: 84,  // Class average from most recent quiz/test

    // ---- STREAK ----
    winStreak: 2,  // Consecutive weeks this class ranked #1 (0 if not current #1)
  },
  {
    id: "p2",
    name: "Algebra 1",
    period: "Period 2",
    color: "#F5C518",

    quizAvg: 79,
    exitTicketAvg: 81,
    hwCompletion: 75,
    growthBonus: 5,
    behaviorPoints: 8,

    prevAssessmentAvg: 72,
    currAssessmentAvg: 79,

    winStreak: 0,
  },
  {
    id: "p3",
    name: "Geometry",
    period: "Period 3",
    color: "#F5C518",

    quizAvg: 91,
    exitTicketAvg: 86,
    hwCompletion: 88,
    growthBonus: 7,
    behaviorPoints: 10,

    prevAssessmentAvg: 80,
    currAssessmentAvg: 91,

    winStreak: 0,
  },
  {
    id: "p4",
    name: "Algebra 2",
    period: "Period 4",
    color: "#F5C518",

    quizAvg: 72,
    exitTicketAvg: 75,
    hwCompletion: 68,
    growthBonus: 6,
    behaviorPoints: 7,

    prevAssessmentAvg: 69,
    currAssessmentAvg: 72,

    winStreak: 0,
  },
];

// ---- ANNOUNCEMENTS ----
// Add as many as you like. Types: "info", "alert", "celebration"
const ANNOUNCEMENTS = [
  {
    type: "celebration",
    icon: "🎉",
    title: "Geometry Period 3 Wins Week 8!",
    body: "Period 3 crushed it this week with a 91 quiz average and PERFECT behavior points. Keep it up, Marauders!",
  },
  {
    type: "alert",
    icon: "📝",
    title: "Unit 5 Test — Next Wednesday",
    body: "All Algebra 1 classes: Unit 5 test is scheduled for Wednesday, June 12. Study guides have been distributed.",
  },
  {
    type: "info",
    icon: "📊",
    title: "Homework Counts!",
    body: "Homework completion is factored into your class score every week. Period 4 — let's push that percentage up!",
  },
  {
    type: "info",
    icon: "🏅",
    title: "Badge Ceremony — Friday",
    body: "Badge winners will be announced Friday during class. Current leaders in every category are posted above.",
  },
];

// ---- UPCOMING EVENTS ----
// month: 3-letter abbreviation, day: number, type: "quiz", "test", "event", "review"
const EVENTS = [
  { month: "JUN", day: 10, title: "Algebra 1 Quiz — Factoring", desc: "Periods 1 & 2 — Factoring polynomials", type: "quiz" },
  { month: "JUN", day: 12, title: "Unit 5 Test (Algebra 1)", desc: "Periods 1 & 2 — Full unit assessment", type: "test" },
  { month: "JUN", day: 13, title: "Geometry Quiz — Circles", desc: "Period 3 — Arc length & sector area", type: "quiz" },
  { month: "JUN", day: 14, title: "Badge Ceremony", desc: "All classes — Weekly achievement awards", type: "event" },
  { month: "JUN", day: 17, title: "Review Day (All Classes)", desc: "No new content — exam prep", type: "review" },
  { month: "JUN", day: 19, title: "Algebra 2 Test — Quadratics", desc: "Period 4 — Unit exam", type: "test" },
];

/* ============================================================
   ★  TEACHER EDIT ZONE — END  ★
   Below this line: app logic. Only edit if you're comfortable!
   ============================================================ */


/* ---- SCORING FORMULA ----
   Weekly Score = quizAvg + exitTicketAvg + hwCompletion + growthBonus + behaviorPoints
   Max possible ≈ 100 + 100 + 100 + 10 + 10 = 320
   We scale this to a 0–100 display score below.
*/
function calculateScore(cls) {
  const raw = cls.quizAvg + cls.exitTicketAvg + cls.hwCompletion + cls.growthBonus + cls.behaviorPoints;
  // Scale to 0–100 range (max raw = 320)
  return Math.round((raw / 320) * 100);
}

// Add computed scores to each class object
const scoredClasses = CLASSES.map(cls => ({
  ...cls,
  weeklyScore: calculateScore(cls),
  delta: cls.currAssessmentAvg - cls.prevAssessmentAvg,
})).sort((a, b) => b.weeklyScore - a.weeklyScore); // sort descending by score


/* ---- BADGE DEFINITIONS ----
   Each badge has a condition function that receives the sorted class array
   and returns the winning class id (or null if no winner yet).
*/
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


/* ========== RENDER FUNCTIONS ========== */

// ---- Date & Header ----
function renderHeader() {
  const dateEl = document.getElementById("live-date");
  const weekEl = document.getElementById("week-label");
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  dateEl.textContent = now.toLocaleDateString("en-US", options);
  weekEl.textContent = `Week ${WEEK_NUMBER} · ${SCHOOL_YEAR}`;
}

// ---- Ticker ----
function renderTicker() {
  const el = document.getElementById("ticker");
  const items = [
    `🏆 WEEK ${WEEK_NUMBER} LEADER: ${scoredClasses[0].name} – ${scoredClasses[0].period}`,
    `📢 Upcoming: ${EVENTS[0]?.title || "Check the calendar!"}`,
    `⭐ Top Quiz Avg: ${scoredClasses.reduce((a,b) => a.quizAvg > b.quizAvg ? a : b).name} ${scoredClasses.reduce((a,b) => a.quizAvg > b.quizAvg ? a : b).period} — ${scoredClasses.reduce((a,b) => a.quizAvg > b.quizAvg ? a : b).quizAvg}%`,
    `✅ Best HW Completion: ${scoredClasses.reduce((a,b) => a.hwCompletion > b.hwCompletion ? a : b).period} — ${scoredClasses.reduce((a,b) => a.hwCompletion > b.hwCompletion ? a : b).hwCompletion}%`,
    `🎖️ Marauders Math League · Go get that gold!`,
  ];
  el.textContent = "  ⚡  " + items.join("     |     ") + "  ⚡  ";
}

// ---- Announcements ----
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

// ---- Leaderboard ----
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
      <td class="${cls.delta >= 0 ? 'text-gold' : ''}">
        ${cls.delta >= 0 ? "+" : ""}${cls.delta}
      </td>
      <td>${cls.behaviorPoints}/10</td>
      <td><span class="score-value">${cls.weeklyScore}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ---- Weekly Champion Card ----
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

// ---- Stat Cards ----
function renderStats() {
  const grid = document.getElementById("stats-grid");
  grid.innerHTML = "";

  scoredClasses.forEach(cls => {
    const card = document.createElement("div");
    card.className = "stat-card";

    // Helper to build a progress bar row
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

// ---- Growth Tracker ----
function renderGrowthTracker() {
  const grid = document.getElementById("growth-grid");
  grid.innerHTML = "";

  scoredClasses.forEach(cls => {
    const delta = cls.currAssessmentAvg - cls.prevAssessmentAvg;
    const deltaClass = delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";
    const arrow = delta > 0 ? "➡️" : delta < 0 ? "➡️" : "➡️";
    const deltaText = delta > 0 ? `+${delta}` : `${delta}`;

    const card = document.createElement("div");
    card.className = "growth-card";
    card.innerHTML = `
      <div class="growth-class-name">${cls.name} – ${cls.period}</div>
      <div class="growth-numbers">
        <span class="growth-prev">${cls.prevAssessmentAvg}</span>
        <span class="growth-arrow">${arrow}</span>
        <span class="growth-current">${cls.currAssessmentAvg}</span>
      </div>
      <span class="growth-delta ${deltaClass}">${deltaText} pts</span>
    `;
    grid.appendChild(card);
  });
}

// ---- Badges ----
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

// ---- Events ----
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


/* ========== MAIN — run all renderers on page load ========== */
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderTicker();
  renderAnnouncements();
  renderLeaderboard();
  renderChampion();
  renderStats();
  renderGrowthTracker();
  renderBadges();
  renderEvents();

  // Auto-refresh the date/time display every minute
  setInterval(renderHeader, 60000);
});
