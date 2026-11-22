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
let scorecardReturnTab = "results";

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

  scorecardReturnTab = "results";
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
    scorecardContent.replaceChildren();
    showTab(scorecardReturnTab);
    const returnPanel = panels[scorecardReturnTab];
    if (returnPanel) {
      returnPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}


async function loadDataSportsScorecard(matchId, matchSummary) {
  if (!matchId || !scorecardSection || !scorecardStatus || !scorecardContent) {
    return;
  }

  scorecardReturnTab = "live";
  showTab("live");
  scorecardSection.hidden = false;
  if (panels.live) panels.live.hidden = true;
  scorecardContent.replaceChildren();
  scorecardStatus.textContent = "పూర్తి స్కోర్‌కార్డ్ లోడ్ అవుతోంది...";
  scorecardSection.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const response = await fetch(
      `${API_BASE}/api/cricket/scorecard/${encodeURIComponent(matchId)}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const matchData = payload?.data?.data;
    const innings = matchData?.innings;

    if (!Array.isArray(innings) || !innings.length) {
      throw new Error("Scorecard innings missing");
    }

    const homeName = matchSummary?.home?.name || "Home";
    const awayName = matchSummary?.away?.name || "Away";
    scorecardStatus.textContent =
      `${homeName} vs ${awayName} · ${matchSummary?.status?.description || "మ్యాచ్ స్కోర్‌కార్డ్"}`;

    innings.forEach((inning, index) => {
      const card = makeElement("section", "innings-card");
      const teamName = inning.battingTeam?.name ||
        (inning.battingSide === "home" ? homeName : awayName);

      card.append(makeElement(
        "h3",
        "innings-heading",
        `${teamName} — ${inning.runs ?? 0}/${inning.wickets ?? 0} (${inning.overs ?? "-"})`
      ));

      card.append(makeElement("h4", "", "బ్యాటింగ్ వివరాలు"));

      const battingRows = (inning.batting || []).map(player => {
        const batter = player.batter || {};
        let dismissal = player.description || "నాటౌట్";

        if (player.state === "didNotBat") dismissal = "బ్యాటింగ్ చేయలేదు";
        else if (player.state === "notOut") dismissal = "నాటౌట్";
        else if (player.bowler?.name && player.description) {
          dismissal += ` · ${player.bowler.name}`;
          if (player.fielder?.name) dismissal += ` (${player.fielder.name})`;
        }

        return [
          batter.name || "-",
          dismissal,
          player.runs ?? 0,
          player.balls ?? 0,
          player.fours ?? 0,
          player.sixes ?? 0,
          player.strikeRate ?? "-"
        ];
      });

      if (battingRows.length) {
        addTable(card, ["బ్యాటర్", "వివరాలు", "R", "B", "4s", "6s", "SR"], battingRows);
      } else {
        card.append(makeElement("p", "", "బ్యాటింగ్ వివరాలు అందుబాటులో లేవు."));
      }

      card.append(makeElement("h4", "", "బౌలింగ్ వివరాలు"));

      const bowlingRows = (inning.bowling || []).map(player => [
        player.bowler?.name || "-",
        player.overs ?? "-",
        player.maidens ?? 0,
        player.runs ?? 0,
        player.wickets ?? 0,
        player.economy ?? "-"
      ]);

      if (bowlingRows.length) {
        addTable(card, ["బౌలర్", "O", "M", "R", "W", "Econ"], bowlingRows);
      } else {
        card.append(makeElement("p", "", "బౌలింగ్ వివరాలు అందుబాటులో లేవు."));
      }

      const extras = inning.extras || {};
      const extrasText = [
        `మొత్తం: ${extras.total ?? 0}`,
        `వైడ్స్: ${extras.wides ?? 0}`,
        `నోబాల్స్: ${extras.noBalls ?? 0}`,
        `బైస్: ${extras.byes ?? 0}`,
        `లెగ్‌బైస్: ${extras.legByes ?? 0}`
      ].join(" · ");
      card.append(makeElement("p", "scorecard-extra", `ఎక్స్‌ట్రాలు: ${extrasText}`));

      const wickets = inning.fallOfWickets || [];
      if (wickets.length) {
        const wicketText = wickets.map(wicket =>
          `${wicket.wicket ?? ""}వ వికెట్: ${wicket.runs ?? "-"} పరుగులు · ${wicket.batter?.name || ""} (${wicket.overs ?? "-"} ఓవర్లు)`
        ).join(" | ");
        card.append(makeElement("p", "scorecard-extra", `వికెట్ల పతనం: ${wicketText}`));
      }

      scorecardContent.append(card);
    });

  } catch (error) {
    console.error("DataSportsAPI scorecard error:", error);
    scorecardStatus.textContent =
      "స్కోర్‌కార్డ్ లోడ్ కాలేదు. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";
  }
}

/* RVP DATASPORTS LIVE SCORE UI */

const livePanel = document.getElementById("livePanel");
const liveMessage = document.getElementById("liveMessage");
const liveList = document.createElement("div");
liveList.className = "live-match-list";
if (liveMessage) liveMessage.insertAdjacentElement("afterend", liveList);

let liveRefreshTimer = null;
let liveLastUpdated = null;

function isIndiaTeam(team) {
  const name = String(team?.name || "").trim().toLowerCase();
  const code = String(team?.code || team?.shortName || "").trim().toUpperCase();

  return (
    name === "india" ||
    name.startsWith("india ") ||
    code === "IND" ||
    code === "IND-W" ||
    code === "IND-A" ||
    code === "IND U19"
  );
}

function getTeamInnings(score) {
  const innings = score?.innings || {};
  return Object.entries(innings)
    .filter(([, value]) => value && typeof value === "object")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      label: key.replace(/([a-z])([0-9])/i, "$1 $2"),
      runs: value.runs ?? 0,
      wickets: value.wickets ?? 0,
      overs: value.overs
    }));
}

function formatTeamScore(score) {
  if (!score) return "స్కోరు లేదు";

  const innings = getTeamInnings(score);

  if (innings.length) {
    return innings.map(item => {
      const total = `${item.runs}/${item.wickets}`;
      return item.overs !== null && item.overs !== undefined
        ? `${total} (${item.overs})`
        : total;
    }).join("  ·  ");
  }

  return score.current !== null && score.current !== undefined
    ? String(score.current)
    : "స్కోరు లేదు";
}

function createLiveTeam(team, score, isIndia) {
  const block = makeElement("div", "live-team");
  const flag = makeElement("div", "live-team-flag", isIndia ? "🇮🇳" : "🏏");
  const name = makeElement(
    "div",
    "live-team-name",
    team?.shortName || team?.name || "జట్టు"
  );
  const fullName = makeElement(
    "div",
    "live-team-fullname",
    team?.name || ""
  );
  const scoreText = makeElement(
    "div",
    "live-team-score",
    formatTeamScore(score)
  );

  block.append(flag, name, fullName, scoreText);
  return block;
}

function createLiveCard(match, indiaMatch) {
  const card = makeElement(
    "article",
    indiaMatch ? "live-score-card india-live-card" : "live-score-card"
  );

  const top = makeElement("div", "live-card-top");
  top.append(
    makeElement("span", "live-league", match.league?.name || "క్రికెట్ మ్యాచ్"),
    makeElement("span", "live-badge", "● LIVE")
  );

  const teams = makeElement("div", "live-score-teams");
  teams.append(
    createLiveTeam(match.home, match.homeScore, isIndiaTeam(match.home)),
    makeElement("span", "live-vs", "VS"),
    createLiveTeam(match.away, match.awayScore, isIndiaTeam(match.away))
  );

  const status = makeElement(
    "div",
    "live-innings-status",
    match.status?.description || "మ్యాచ్ కొనసాగుతోంది"
  );

  const meta = makeElement(
    "div",
    "live-match-meta",
    [
      match.season?.name,
      match.group,
      match.venue?.name,
      match.venue?.city
    ].filter(Boolean).join(" · ")
  );

  card.append(top, teams, status, meta);

  card.classList.add("live-score-clickable");
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `${match.home?.name || ""} vs ${match.away?.name || ""} పూర్తి స్కోర్‌కార్డ్ చూడండి`);

  const openScorecard = () => loadDataSportsScorecard(match.id, match);
  card.addEventListener("click", openScorecard);
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openScorecard();
    }
  });

  return card;
}

async function loadLiveScores() {
  if (!liveList || !liveMessage) return;

  liveMessage.textContent = "Live స్కోర్లు లోడ్ అవుతున్నాయి...";

  try {
    const response = await fetch(`${API_BASE}/api/cricket/live`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const matches = payload?.data?.data;

    if (!Array.isArray(matches)) {
      throw new Error("Invalid live score response");
    }

    const indiaMatches = matches.filter(match =>
      isIndiaTeam(match.home) || isIndiaTeam(match.away)
    );

    const otherMatches = matches.filter(match =>
      !isIndiaTeam(match.home) && !isIndiaTeam(match.away)
    );

    const orderedMatches = [...indiaMatches, ...otherMatches];

    liveList.replaceChildren();

    if (!orderedMatches.length) {
      liveMessage.textContent = "ప్రస్తుతం Live మ్యాచ్‌లు అందుబాటులో లేవు.";
    } else {
      liveMessage.textContent = indiaMatches.length
        ? `🇮🇳 భారత్ మ్యాచ్‌లు: ${indiaMatches.length} · మొత్తం Live మ్యాచ్‌లు: ${matches.length}`
        : `ప్రస్తుతం భారత్ Live మ్యాచ్ లేదు · ఇతర Live మ్యాచ్‌లు: ${matches.length}`;

      orderedMatches.forEach(match => {
        const indiaMatch =
          isIndiaTeam(match.home) || isIndiaTeam(match.away);
        liveList.append(createLiveCard(match, indiaMatch));
      });
    }

    liveLastUpdated = new Date();

  } catch (error) {
    console.error("RVP Live cricket error:", error);
    liveMessage.textContent =
      "Live స్కోర్లు ప్రస్తుతం అందుబాటులో లేవు. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";
  }
}

function startLiveRefresh() {
  if (liveRefreshTimer) clearInterval(liveRefreshTimer);

  loadLiveScores();

  liveRefreshTimer = setInterval(() => {
    if (document.visibilityState === "visible") {
      loadLiveScores();
    }
  }, 900000);
}

tabs.forEach(tab => {
  if (tab.dataset.tab === "live") {
    tab.addEventListener("click", () => {
      if (!liveLastUpdated ||
          Date.now() - liveLastUpdated.getTime() > 900000) {
        loadLiveScores();
      }
    });
  }
});

startLiveRefresh();


showTab("results");
loadResults();
