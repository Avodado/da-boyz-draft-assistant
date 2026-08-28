(function (root) {
  "use strict";

  const OVERLAY_VERSION = "2026-08-28.1";
  const MARKET_AS_OF = "2026-08-28";
  const SITUATION_AS_OF = "2026-08-28T15:49:00Z";
  const MARKET_SOURCE = "ADPWire six-platform seven-day redraft ADP, week of 2026-08-24, retrieved 2026-08-28";

  const MARKET_UPDATES = Object.freeze({
    "Ashton Jeanty": 10.0,
    "George Pickens": 25.0,
    "Josh Jacobs": 35.0,
    "Malik Nabers": 39.4,
    "Emeka Egbuka": 40.0,
    "Garrett Wilson": 42.8,
    "Jaylen Waddle": 44.0,
    "TreVeyon Henderson": 51.0,
    "Quinshon Judkins": 61.2,
    "Bucky Irving": 62.1,
    "Jaylen Warren": 68.0,
    "Jordyn Tyson": 70.0,
    "Kyle Pitts": 80.0,
    "RJ Harvey": 85.0,
    "Jordan Addison": 105.1,
    "Jayden Reed": 107.0,
    "Bo Nix": 111.0,
    "Isaiah Likely": 116.6,
    "Xavier Worthy": 118.6,
    "Matthew Golden": 122.0,
    "T.J. Hockenson": 158.9,
    "Cam Ward": 160.0,
    "Dylan Sampson": 164.4,
    "Adonai Mitchell": 174.7,
    "Sean Tucker": 182.2
  });

  const SITUATION_UPDATES = Object.freeze({
    "Ashton Jeanty": {
      availability_status: "QUESTIONABLE",
      health_score: "68",
      situation_score: "68",
      injury: "Ankle sprain",
      injury_summary: "Believed to have suffered an ankle sprain; the Raiders do not consider it long-term, but the return timetable remains unknown.",
      injury_source: "https://www.nfl.com/news/raiders-rb-ashton-jeanty-apparent-right-leg-injury",
      situation_source: "https://www.nfl.com/news/raiders-rb-ashton-jeanty-apparent-right-leg-injury"
    },
    "Quinshon Judkins": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "88",
      situation_score: "66",
      injury: "Resolved minor issue",
      injury_summary: "Returned full-go to team drills on Aug. 25 after a brief minor absence.",
      injury_source: "https://www.fantasypros.com/nfl/news/604176/quinshon-judkins-returns-to-team-drills.php",
      situation_source: "https://www.fantasypros.com/nfl/news/604176/quinshon-judkins-returns-to-team-drills.php"
    },
    "Alec Pierce": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "82",
      situation_score: "76",
      injury: "Ankle rehabilitation",
      injury_summary: "Activated from PUP on Aug. 27 and returned to individual practice work; still ramping toward Week 1.",
      injury_source: "https://www.colts.com/news/wr-alec-pierce-returns-to-practice-after-pup-stint",
      situation_source: "https://www.colts.com/news/wr-alec-pierce-returns-to-practice-after-pup-stint"
    },
    "Keon Coleman": {
      availability_status: "QUESTIONABLE",
      health_score: "74",
      situation_score: "75",
      injury: "Right foot/toe sprain",
      injury_summary: "Shed the walking boot on Aug. 27 but remained out of the final preseason game; Week 1 recovery is still being monitored.",
      injury_source: "https://www.cbssports.com/nfl/players/26717289/keon-coleman/fantasy/",
      situation_source: "https://www.cbssports.com/nfl/players/26717289/keon-coleman/fantasy/"
    }
  });

  const IDENTITY_ONLY_UPDATES = Object.freeze({
    "Jayden Higgins": {
      draft_eligibility: "IDENTITY_ONLY_UNAVAILABLE",
      availability_status: "OUT_SEASON"
    }
  });

  function applyPlayerUpdate(player) {
    if (!player || !player.name) return false;
    if (player.draft_day_overlay_version === OVERLAY_VERSION) return false;
    let changed = false;
    const market = MARKET_UPDATES[player.name];
    if (Number.isFinite(market)) {
      if (player.draft_day_prior_planning_adp == null) player.draft_day_prior_planning_adp = player.planning_adp ?? "";
      player.planning_adp = String(market);
      player.adp = String(market);
      player.market_as_of = MARKET_AS_OF;
      player.market_refresh_version = `v0.13.1-draft-day-${OVERLAY_VERSION}`;
      player.market_confidence = "MEDIUM";
      player.market_source = MARKET_SOURCE;
      player.market_summary = `Draft-day cross-platform ADP ${market.toFixed(1)}; ${MARKET_SOURCE}.`;
      changed = true;
    }

    const situation = SITUATION_UPDATES[player.name];
    if (situation) {
      if (player.draft_day_prior_situation_score == null) player.draft_day_prior_situation_score = player.situation_score ?? "";
      Object.assign(player, situation, {
        injury_as_of: SITUATION_AS_OF,
        situation_as_of: SITUATION_AS_OF,
        situation_confidence: player.name === "Ashton Jeanty" ? "90" : "88"
      });
      changed = true;
    }

    const identityOnly = IDENTITY_ONLY_UPDATES[player.name];
    if (identityOnly) {
      Object.assign(player, identityOnly);
      player.drafted = true;
      changed = true;
    }

    if (changed) player.draft_day_overlay_version = OVERLAY_VERSION;
    return changed;
  }

  function recomputeRanks(players) {
    const ranked = players
      .filter(Boolean)
      .map((player, index) => ({ player, index, adp: Number(player.planning_adp) }))
      .sort((a, b) => {
        const aa = Number.isFinite(a.adp) && a.adp > 0 ? a.adp : 9999;
        const bb = Number.isFinite(b.adp) && b.adp > 0 ? b.adp : 9999;
        return aa - bb || String(a.player.name).localeCompare(String(b.player.name)) || a.index - b.index;
      });
    const positions = {};
    ranked.forEach(({ player }, index) => {
      player.rank = String(index + 1);
      positions[player.position] = (positions[player.position] || 0) + 1;
      player.position_rank = String(positions[player.position]);
      player.rank_source = "DRAFT_DAY_ADP_OVERLAY_V0131";
    });
  }

  function applyToCollection(players) {
    if (!Array.isArray(players)) return { changed: 0, total: 0 };
    let changed = 0;
    players.forEach(player => { if (applyPlayerUpdate(player)) changed += 1; });
    if (changed) recomputeRanks(players);
    return { changed, total: players.length };
  }

  function mount() {
    let changed = 0;
    try {
      if (typeof DEFAULT_MASTER_POOL !== "undefined") changed += applyToCollection(DEFAULT_MASTER_POOL).changed;
      if (typeof state !== "undefined" && state) {
        changed += applyToCollection(state.players).changed;
        if (Array.isArray(state.picks)) state.picks.forEach(pick => applyPlayerUpdate(pick && pick.player));
        state.draftDayOverlayVersion = OVERLAY_VERSION;
        if (changed && typeof resetCalcMemo === "function") resetCalcMemo();
        if (changed && typeof save === "function") save("draft-day-overlay");
        if (changed && typeof renderAll === "function") renderAll();
      }
    } catch (error) {
      root.console?.error?.("Draft-day data overlay failed safely; existing draft state was retained.", error);
    }
    return changed;
  }

  root.DaBoyzDraftDayOverlay = Object.freeze({
    OVERLAY_VERSION,
    MARKET_AS_OF,
    MARKET_UPDATES,
    SITUATION_UPDATES,
    applyPlayerUpdate,
    applyToCollection,
    mount
  });

  mount();
})(typeof window !== "undefined" ? window : globalThis);
