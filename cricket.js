"use strict";

const API_BASE = "https://rambantu-vayu-putrudu-server.onrender.com";

const tabs = document.querySelectorAll("[data-tab]");
const panels = {
  live: document.getElementById("livePanel"),
  results: document.getElementById("resultsPanel"),
  fixtures: document.getElementById("fixturesPanel")
};

const resultsList = document.getElementById("resultsList");
const resultsStatus = document.getElementById("resultsStatus");
const refreshButton = document.getElementById("refreshResults");
const scorecardSection = document.getElementById("scorecardSection");
const scorecardStatus = document.getElementById("scorecardStatus");
const scorecardContent = document.getElementById("scorecardContent");
const backToResults = document.getElementById("backToResults");

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) {
    element.textContent = String(text);
  }
  return element;
}

function showTab(name) {
  Object.entries(panels).forEach(([key, panel]) => {
    if (panel) panel.hidden = key !== name;
  });

  tabs.forEach(tab => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  if (scorecardSection) scorecardSection.hidden = true;
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    showTab(tab.dataset.tab);
  });
});

function formatDate(value) {
  if (!value) return "తేదీ అందుబాటులో లేదు";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("te-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function createMatchCard(item) {
  const card = makeElement("article", "match-card");
  const competition = makeElement(
    "div",
    "match-competition",
    item.competition || item.format || "క్రికెట్ మ్యాచ్"
  );

  const details = makeElement(
    "p",
    "match-meta",
    `${formatDate(item.date)}${item.format ? " • " + item.format : ""}`
  );

  const teams = makeElement("div", "match-teams");

  (Array.isArray(item.teams) ? item.teams : []).forEach(team => {
    const row = makeElement("div", "match-team-row");
    const name = makeElement("strong", "match-team-name", team.name || team.team || "జట్టు");
    const score = makeElement(
      "span",
      "match-team-score",
      [team.score, team.overs ? `(${team.overs})` : ""].filter(Boolean).join(" ")
    );

    row.append(name, score);
    teams.append(row);
  });

  const result = makeElement(
    "p",
    "match-result",
    item.result || "ఫలితం అందుబాటులో లేదు"
  );

  const button = makeElement("button", "scorecard-button", "పూర్తి స్కోర్‌కార్డ్");
  button.type = "button";
  button.addEventListener("click", () => {
    loadScorecard(item.match);
  });

  card.append(competition, details, teams, result, button);
  return card;
}

async function loadResults() {
  if (!resultsList || !resultsStatus) return;

  resultsList.replaceChildren();
  resultsStatus.textContent = "మ్యాచ్ ఫలితాలు లోడ్ అవుతున్నాయి...";
  if (refreshButton) refreshButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/cricket/results`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const results = payload?.data?.data?.results;

    if (!Array.isArray(results) || results.length === 0) {
      resultsStatus.textContent = "ప్రస్తుతం మ్యాచ్ ఫలితాలు అందుబాటులో లేవు.";
      return;
    }

    results.forEach(item => {
      if (item && item.match) {
        resultsList.append(createMatchCard(item));
      }
    });

    resultsStatus.textContent =
      `${results.length} మ్యాచ్ ఫలితాలు అందుబాటులో ఉన్నాయి.`;

  } catch (error) {
    console.error("Cricket results error:", error);
    resultsStatus.textContent =
      "మ్యాచ్ ఫలితాలు లోడ్ కాలేదు. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";
  } finally {
    if (refreshButton) refreshButton.disabled = false;
  }
}

function addTable(container, headings, rows) {
  const wrapper = makeElement("div", "score-table-wrap");
  const table = makeElement("table", "score-table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headings.forEach(heading => {
    headerRow.append(makeElement("th", "", heading));
  });

  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement("tbody");

  rows.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(value => {
      tr.append(makeElement("td", "", value ?? "-"));
    });
    tbody.append(tr);
  });

  table.append(tbody);
  wrapper.append(table);
  container.append(wrapper);
}

function renderInnings(innings, index) {
  const card = makeElement("section", "innings-card");

  const heading = makeElement(
    "h3",
    "innings-heading",
    `${innings.name || innings.team || "జట్టు"} — ${innings.runs ?? 0}/${innings.wickets ?? 0} (${innings.overs ?? "-"})`
  );

  card.append(heading);

  card.append(makeElement("h4", "", "బ్యాటింగ్ వివరాలు"));

  const battingRows = (innings.batting || []).map(player => {
    const runs = Number(player.runs || 0);
    const balls = Number(player.balls || 0);
    const strikeRate = balls > 0 ? (runs / balls * 100).toFixed(2) : "-";

    return [
      player.name || "-",
      player.dismissal || (player.out === false ? "నాటౌట్" : "-"),
      runs,
      balls,
      player.fours ?? 0,
      player.sixes ?? 0,
      strikeRate
    ];
  });

  if (battingRows.length) {
    addTable(
      card,
      ["బ్యాటర్", "వివరాలు", "R", "B", "4s", "6s", "SR"],
      battingRows
    );
  } else {
    card.append(makeElement("p", "", "బ్యాటింగ్ వివరాలు అందుబాటులో లేవు."));
  }

  if (Array.isArray(innings.did_not_bat) && innings.did_not_bat.length) {
    const names = innings.did_not_bat.map(player =>
      typeof player === "string" ? player : player.name
    ).filter(Boolean);

    if (names.length) {
      card.append(makeElement("p", "scorecard-extra", `బ్యాటింగ్ చేయనివారు: ${names.join(", ")}`));
    }
  }

  card.append(makeElement("h4", "", "బౌలింగ్ వివరాలు"));

  const bowlingRows = (innings.bowling || []).map(player => [
    player.name || "-",
    player.overs ?? "-",
    player.maidens ?? 0,
    player.runs ?? 0,
    player.wickets ?? 0,
    player.economy ?? "-",
    player.dots ?? "-"
  ]);

  if (bowlingRows.length) {
    addTable(
      card,
      ["బౌలర్", "O", "M", "R", "W", "Econ", "Dots"],
      bowlingRows
    );
  } else {
    card.append(makeElement("p", "", "బౌలింగ్ వివరాలు అందుబాటులో లేవు."));
  }

  const extras = innings.extras_detail || {};
  const extrasText = Object.entries(extras)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" • ");

  card.append(
    makeElement(
      "p",
      "scorecard-extra",
      `ఎక్స్‌ట్రాలు: ${innings.extras ?? 0}${extrasText ? " (" + extrasText + ")" : ""}`
    )
  );

  const wickets = innings.fall_of_wickets || [];
  if (wickets.length) {
    const wicketText = wickets.map(wicket => {
      if (typeof wicket === "string") return wicket;
      const score = wicket.score ?? wicket.runs ?? "";
      const over = wicket.over ?? wicket.overs ?? "";
      const batter = wicket.name || wicket.player || "";
      return [score, batter, over ? `(${over})` : ""].filter(Boolean).join(" ");
    }).join(" | ");

    card.append(makeElement("p", "scorecard-extra", `వికెట్ల పతనం: ${wicketText}`));
  }

  return card;
}

async function loadScorecard(matchId) {
  if (!matchId || !scorecardSection || !scorecardStatus || !scorecardContent) {
    return;
  }

  scorecardSection.hidden = false;
  scorecardContent.replaceChildren();
  scorecardStatus.textContent = "పూర్తి స్కోర్‌కార్డ్ లోడ్ అవుతోంది...";

  if (panels.results) panels.results.hidden = true;

  scorecardSection.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const response = await fetch(
      `${API_BASE}/cricket/scorecard/${encodeURIComponent(matchId)}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const match = payload?.data?.data;

    if (!match) {
      throw new Error("Scorecard data missing");
    }

    scorecardStatus.textContent = match.result || "మ్యాచ్ స్కోర్‌కార్డ్";

    if (Array.isArray(match.innings) && match.innings.length) {
      match.innings.forEach((innings, index) => {
        scorecardContent.append(renderInnings(innings, index));
      });
    } else {
      scorecardContent.append(
        makeElement("p", "", "ఇన్నింగ్స్ వివరాలు అందుబాటులో లేవు.")
      );
    }

  } catch (error) {
    console.error("Cricket scorecard error:", error);
    scorecardStatus.textContent =
      "స్కోర్‌కార్డ్ లోడ్ కాలేదు. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";
  }
}

if (refreshButton) {
  refreshButton.addEventListener("click", loadResults);
}

if (backToResults) {
  backToResults.addEventListener("click", () => {
    scorecardSection.hidden = true;
    if (panels.results) panels.results.hidden = false;
    scorecardContent.replaceChildren();
    scorecardSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

showTab("results");
loadResults();
