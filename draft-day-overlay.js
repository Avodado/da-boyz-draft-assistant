(function (root) {
  "use strict";

  const OVERLAY_VERSION = "2026-08-28.2";
  const MARKET_AS_OF = "2026-08-28";
  const SITUATION_AS_OF = "2026-08-28T23:22:00Z";
  const MARKET_SOURCE = "ADPWire live six-platform redraft ADP, continuously updating board, re-verified 2026-08-28";

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
      situation_confidence: "92",
      injury: "Right ankle sprain",
      injury_summary: "Sprained the right ankle on Aug. 23; reports say the injury is not expected to be long-term, but a firm return timetable has not been established.",
      injury_source: "https://www.reuters.com/sports/report-raiders-rb-ashton-jeanty-believed-have-sprained-ankle--flm-2026-08-24/; https://www.cbssports.com/nfl/injuries/",
      situation_source: "https://www.reuters.com/sports/report-raiders-rb-ashton-jeanty-believed-have-sprained-ankle--flm-2026-08-24/; https://www.cbssports.com/nfl/injuries/"
    },
    "Quinshon Judkins": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "88",
      situation_score: "66",
      situation_confidence: "90",
      injury: "Resolved minor issue",
      injury_summary: "Returned full-go to team drills on Aug. 25 after a brief minor absence.",
      injury_source: "https://www.fantasypros.com/nfl/news/604176/quinshon-judkins-returns-to-team-drills.php",
      situation_source: "https://www.fantasypros.com/nfl/news/604176/quinshon-judkins-returns-to-team-drills.php"
    },
    "Alec Pierce": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "82",
      situation_score: "76",
      situation_confidence: "90",
      injury: "Ankle rehabilitation",
      injury_summary: "Activated from PUP on Aug. 27 and returned to workouts; Indianapolis is hopeful he will be ready for the opener while his workload ramps up.",
      injury_source: "https://www.reuters.com/sports/colts-wr-alec-pierce-ankle-activated-pup-list--flm-2026-08-27/",
      situation_source: "https://www.reuters.com/sports/colts-wr-alec-pierce-ankle-activated-pup-list--flm-2026-08-27/"
    },
    "Keon Coleman": {
      availability_status: "QUESTIONABLE",
      health_score: "74",
      situation_score: "75",
      situation_confidence: "88",
      injury: "Right foot/toe sprain",
      injury_summary: "Shed the walking boot on Aug. 27 but remained out of the final preseason game; Week 1 recovery is still being monitored.",
      injury_source: "https://www.cbssports.com/fantasy/football/news/bills-keon-coleman-sheds-walking-boot/",
      situation_source: "https://www.cbssports.com/fantasy/football/news/bills-keon-coleman-sheds-walking-boot/"
    },
    "Christian McCaffrey": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "90",
      situation_confidence: "94",
      adjust_situation_from_health: true,
      injury: "Resolved tightness / load management",
      injury_summary: "Returned to practice Aug. 23 and said the recent absences were planned load management; he reported feeling great and fresh for Week 1.",
      injury_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/christian-mccaffrey-says-recent-practice-absences-were-planned-as-part-of-load-management",
      situation_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/christian-mccaffrey-says-recent-practice-absences-were-planned-as-part-of-load-management"
    },
    "Ja'Marr Chase": {
      availability_status: "QUESTIONABLE",
      health_score: "82",
      situation_confidence: "92",
      adjust_situation_from_health: true,
      injury: "Left knee hyperextension",
      injury_summary: "Hyperextended the left knee Aug. 25 and missed the next practice; Chase said he could have played if a game had been scheduled and the team treated the absence as precautionary.",
      injury_source: "https://www.reuters.com/sports/bengals-wr-jamarr-chase-sits-out-practice-after-knee-issue--flm-2026-08-26/; https://www.cbssports.com/nfl/injuries/",
      situation_source: "https://www.reuters.com/sports/bengals-wr-jamarr-chase-sits-out-practice-after-knee-issue--flm-2026-08-26/; https://www.cbssports.com/nfl/injuries/"
    },
    "Puka Nacua": {
      availability_status: "QUESTIONABLE",
      health_score: "68",
      situation_confidence: "94",
      injury: "Psoas soreness",
      injury_summary: "The Rams said Aug. 24 that Nacua was still a non-participant because of the psoas issue; Week 1 remains the working target without a full-practice clearance yet.",
      injury_source: "https://www.therams.com/news/injury-updates-ol-justin-dedich-hand-and-te-davis-allen-quad-return-to-practice-wr-puka-nacua-psoas-and-de-myles-garrett-knee-still-non-participants",
      situation_source: "https://www.therams.com/news/injury-updates-ol-justin-dedich-hand-and-te-davis-allen-quad-return-to-practice-wr-puka-nacua-psoas-and-de-myles-garrett-knee-still-non-participants"
    },
    "Jeremiyah Love": {
      availability_status: "QUESTIONABLE",
      health_score: "58",
      situation_confidence: "92",
      adjust_situation_from_health: true,
      injury: "High-ankle sprain",
      injury_summary: "Suffered a high-ankle sprain Aug. 13 and remained out of all practice work the week of Aug. 24; Arizona is hopeful but not certain he can return for Week 1.",
      injury_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/jeremiyah-love-will-remain-out-of-practice-this-week",
      situation_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/jeremiyah-love-will-remain-out-of-practice-this-week"
    },
    "TreVeyon Henderson": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "82",
      situation_confidence: "90",
      adjust_situation_from_health: true,
      injury: "Right ankle sprain",
      injury_summary: "Precautionary testing followed an Aug. 24 practice slip; a league source reported Aug. 27 that Henderson avoided a serious injury and should be good to go for Week 1.",
      injury_source: "https://www.nbcsports.com/fantasy/football/player-news/2026-08-27/beat-henderson-ankle-should-be-good-for-week-1",
      situation_source: "https://www.nbcsports.com/fantasy/football/player-news/2026-08-27/beat-henderson-ankle-should-be-good-for-week-1"
    },
    "DeVonta Smith": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "88",
      situation_confidence: "92",
      adjust_situation_from_health: true,
      injury: "Hamstring - returned full",
      injury_summary: "Returned as a full participant on Aug. 24 after the hamstring issue and is ramping normally toward Week 1.",
      injury_source: "https://www.cbssports.com/fantasy/football/news/eagles-devonta-smith-full-participant-monday/",
      situation_source: "https://www.cbssports.com/fantasy/football/news/eagles-devonta-smith-full-participant-monday/"
    },
    "Makai Lemon": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "88",
      situation_confidence: "95",
      adjust_situation_from_health: true,
      injury: "Hamstring - returned full",
      injury_summary: "Returned to full participation in all team drills Aug. 24 and said he felt great after the hamstring absence.",
      injury_source: "https://www.philadelphiaeagles.com/news/eagles-makai-lemon-returns-to-full-participation-at-practice",
      situation_source: "https://www.philadelphiaeagles.com/news/eagles-makai-lemon-returns-to-full-participation-at-practice"
    },
    "Sam LaPorta": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "82",
      situation_confidence: "90",
      adjust_situation_from_health: true,
      injury: "Hip - returned to practice",
      injury_summary: "Returned to practice Aug. 25 after the hip issue and is trending positively with more than two weeks before Week 1.",
      injury_source: "https://www.cbssports.com/fantasy/football/news/lions-sam-laporta-practicing-tuesday/",
      situation_source: "https://www.cbssports.com/fantasy/football/news/lions-sam-laporta-practicing-tuesday/"
    },
    "George Kittle": {
      availability_status: "QUESTIONABLE",
      health_score: "72",
      situation_confidence: "90",
      adjust_situation_from_health: true,
      injury: "Achilles rehabilitation",
      injury_summary: "Activated from active/PUP on Aug. 23 and beginning a practice ramp-up; Week 1 is possible but not yet assured after January Achilles surgery.",
      injury_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/49ers-activate-george-kittle-from-pup-list",
      situation_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/49ers-activate-george-kittle-from-pup-list"
    },
    "Mike Evans": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "78",
      situation_confidence: "90",
      adjust_situation_from_health: true,
      injury: "Groin / quad management",
      injury_summary: "The latest groin issue is described as minor and Evans expects to play Week 1; the 49ers expect him back at practice next week after an injury-managed camp.",
      injury_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/report-mike-evans-expects-to-play-week-1",
      situation_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/report-mike-evans-expects-to-play-week-1"
    },
    "Josh Downs": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "82",
      situation_confidence: "88",
      adjust_situation_from_health: true,
      injury: "Calf - minor",
      injury_summary: "Called the calf injury very minor on Aug. 26 and said he expects to resume practicing soon; no extended absence is currently indicated.",
      injury_source: "https://new.cbssports.com/fantasy/football/news/colts-josh-downs-calf-injury-appears-minor/",
      situation_source: "https://new.cbssports.com/fantasy/football/news/colts-josh-downs-calf-injury-appears-minor/"
    },
    "Isiah Pacheco": {
      availability_status: "QUESTIONABLE",
      health_score: "58",
      situation_confidence: "92",
      adjust_situation_from_health: true,
      injury: "Back injury; MCL no longer primary concern",
      injury_summary: "Detroit says the knee is no longer the concern, but a new back issue has made the timeline uncertain as of Aug. 27.",
      injury_source: "https://www.reuters.com/sports/lions-rb-isiah-pacheco-dealing-with-back-injury--flm-2026-08-27/",
      situation_source: "https://www.reuters.com/sports/lions-rb-isiah-pacheco-dealing-with-back-injury--flm-2026-08-27/"
    },
    "Patrick Mahomes": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "82",
      situation_confidence: "94",
      adjust_situation_from_health: true,
      injury: "ACL/LCL rehabilitation",
      injury_summary: "Has taken full first-team reps throughout camp and says Week 1 has always been the plan; final coach and medical approval is still pending.",
      injury_source: "https://www.reuters.com/sports/week-1-always-plan-chiefs-qb-patrick-mahomes--flm-2026-08-25/",
      situation_source: "https://www.reuters.com/sports/week-1-always-plan-chiefs-qb-patrick-mahomes--flm-2026-08-25/"
    },
    "Malik Nabers": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "78",
      situation_confidence: "90",
      adjust_situation_from_health: true,
      injury: "ACL rehabilitation",
      injury_summary: "Shed the non-contact jersey Aug. 24 and took limited team reps; the Giants said it is reasonable to assume he will play Week 1 if progress continues without a setback.",
      injury_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/john-harbaugh-reasonable-to-assume-malik-nabers-plays-in-week-1",
      situation_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/john-harbaugh-reasonable-to-assume-malik-nabers-plays-in-week-1"
    },
    "Breece Hall": {
      availability_status: "EXPECTED_WEEK1_READY",
      health_score: "76",
      situation_confidence: "92",
      adjust_situation_from_health: true,
      injury: "Groin strain",
      injury_summary: "Working on a side field and moving well; the Jets said Aug. 24 that Hall is on track to play Week 1.",
      injury_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/aaron-glenn-breece-hall-kenyon-sadiq-on-track-for-week-1",
      situation_source: "https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/aaron-glenn-breece-hall-kenyon-sadiq-on-track-for-week-1"
    },
    "J.J. McCarthy": {
      availability_status: "QUESTIONABLE",
      health_score: "82",
      situation_confidence: "88",
      adjust_situation_from_health: true,
      injury: "Ankle sprain",
      injury_summary: "Will miss the Aug. 28 preseason finale with the ankle injury; the issue has been described as mild, but he has not yet returned to game action.",
      injury_source: "https://www.cbssports.com/fantasy/football/news/vikings-j-j-mccarthy-wont-play-friday/",
      situation_source: "https://www.cbssports.com/fantasy/football/news/vikings-j-j-mccarthy-wont-play-friday/"
    },
    "Emeka Egbuka": {
      availability_status: "QUESTIONABLE",
      health_score: "70",
      situation_confidence: "92",
      injury: "Toe",
      injury_summary: "Still resting and recovering from the toe injury as of Aug. 28; Week 1 remains the goal but current availability is still up in the air.",
      injury_source: "https://www.cbssports.com/fantasy/football/news/buccaneers-emeka-egbuka-focus-remains-on-week-1/",
      situation_source: "https://www.cbssports.com/fantasy/football/news/buccaneers-emeka-egbuka-focus-remains-on-week-1/"
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
      const oldHealth = Number(player.health_score);
      const oldSituation = Number(player.situation_score);
      const update = { ...situation };
      const adjustSituationFromHealth = update.adjust_situation_from_health === true;
      delete update.adjust_situation_from_health;
      const explicitConfidence = update.situation_confidence;
      Object.assign(player, update, {
        injury_as_of: SITUATION_AS_OF,
        situation_as_of: SITUATION_AS_OF,
        situation_confidence: explicitConfidence || (player.name === "Ashton Jeanty" ? "90" : "88")
      });
      if (adjustSituationFromHealth && Number.isFinite(oldHealth) && Number.isFinite(oldSituation)) {
        const newHealth = Number(player.health_score);
        if (Number.isFinite(newHealth)) {
          const delta = Math.max(-20, Math.min(20, Math.round((newHealth - oldHealth) * 0.25)));
          player.situation_score = String(Math.max(0, Math.min(100, oldSituation + delta)));
        }
      }
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
