#!/usr/bin/env python3
"""Reproducible, analysis-only RB red-zone role study for v0.13.0.

Inputs are public nflverse regular-season play-by-play/rosters and archived
Fantasy Football Calculator 12-team PPR ADP. Large raw inputs stay outside Git.
Outcome-season red-zone usage is never used as a predictor: season Y uses only
ADP for Y and football evidence completed by Y-1.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import math
import re
import unicodedata
import urllib.request
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUTCOME_SEASONS = [2022, 2023, 2024, 2025]
SOURCE_SEASONS = list(range(2020, 2026))
RETRIEVED = "2026-08-23"
PBP_URL = "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{season}.csv.gz"
ROSTER_URL = "https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_{season}.csv"
ADP_URL = "https://fantasyfootballcalculator.com/api/v1/adp/ppr?position=all&teams=12&year={season}"

TEAM_ALIASES = {"JAC": "JAX", "LA": "LAR", "STL": "LAR", "SD": "LAC", "OAK": "LV"}
NAME_ALIASES = {
    "ken walker": "kenneth walker", "kenneth walker iii": "kenneth walker",
    "james cook iii": "james cook", "deebo samuel sr": "deebo samuel",
    "dj moore": "d j moore", "dk metcalf": "d k metcalf",
    "gabe davis": "gabriel davis", "mike williams": "michael williams",
}


def norm_name(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode().lower()
    text = text.replace("'", "").replace("-", " ")
    text = re.sub(r"\b(jr|sr|ii|iii|iv)\b", "", text)
    text = re.sub(r"[^a-z0-9]+", " ", text).strip()
    return NAME_ALIASES.get(text, text)


def team(value: object) -> str:
    value = str(value or "")
    return TEAM_ALIASES.get(value, value)


def download(url: str, path: Path) -> None:
    if path.exists() and path.stat().st_size:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "DA-BOYZ-analysis/1.0"})
    with urllib.request.urlopen(req, timeout=180) as response, path.open("wb") as handle:
        while chunk := response.read(1024 * 1024):
            handle.write(chunk)


def ensure_sources(cache: Path) -> None:
    for season in SOURCE_SEASONS:
        download(PBP_URL.format(season=season), cache / f"play_by_play_{season}.csv.gz")
        download(ROSTER_URL.format(season=season), cache / f"roster_{season}.csv")
    for season in OUTCOME_SEASONS + [2026]:
        download(ADP_URL.format(season=season), cache / f"ffc_adp_ppr_{season}.json")


def safe_div(a: pd.Series | float, b: pd.Series | float):
    if isinstance(a, pd.Series) or isinstance(b, pd.Series):
        return np.divide(a, b, out=np.zeros_like(np.asarray(a), dtype=float), where=np.asarray(b) != 0)
    return float(a) / float(b) if b else 0.0


def load_rosters(cache: Path) -> pd.DataFrame:
    frames = []
    for season in SOURCE_SEASONS:
        frame = pd.read_csv(cache / f"roster_{season}.csv", low_memory=False)
        frame = frame[["season", "team", "position", "full_name", "gsis_id"]].dropna(subset=["gsis_id"])
        frame["team"] = frame["team"].map(team)
        frames.append(frame.drop_duplicates(["season", "gsis_id"], keep="first"))
    return pd.concat(frames, ignore_index=True).drop_duplicates(["season", "gsis_id"], keep="first")


PBP_COLS = [
    "season", "season_type", "week", "game_id", "posteam", "home_team", "away_team",
    "home_coach", "away_coach", "drive", "yardline_100", "desc", "play_type", "qb_kneel",
    "rush_attempt", "rusher_player_id", "rusher_player_name", "rushing_yards", "rush_touchdown",
    "pass_attempt", "receiver_player_id", "receiver_player_name", "receiving_yards", "complete_pass",
    "pass_touchdown",
]


def load_pbp(cache: Path) -> pd.DataFrame:
    frames = []
    for season in SOURCE_SEASONS:
        frame = pd.read_csv(cache / f"play_by_play_{season}.csv.gz", usecols=PBP_COLS, low_memory=False)
        frame = frame[frame["season_type"].eq("REG")].copy()
        frame["posteam"] = frame["posteam"].map(team)
        frame["home_team"] = frame["home_team"].map(team)
        frame["away_team"] = frame["away_team"].map(team)
        no_play = frame["desc"].fillna("").str.contains("No Play", case=False)
        frame = frame[~no_play & ~frame["play_type"].eq("no_play")]
        frames.append(frame)
    return pd.concat(frames, ignore_index=True)


def first_coaches(pbp: pd.DataFrame) -> pd.DataFrame:
    games = pbp.sort_values(["season", "week", "game_id"]).drop_duplicates(["season", "game_id"])
    home = games[["season", "week", "home_team", "home_coach"]].rename(columns={"home_team": "team", "home_coach": "head_coach"})
    away = games[["season", "week", "away_team", "away_coach"]].rename(columns={"away_team": "team", "away_coach": "head_coach"})
    return pd.concat([home, away]).sort_values(["season", "team", "week"]).drop_duplicates(["season", "team"])


def aggregate_usage(pbp: pd.DataFrame, rosters: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    rush = pbp[(pbp["rush_attempt"].eq(1)) & ~pbp["qb_kneel"].eq(1) & pbp["rusher_player_id"].notna()].copy()
    targ = pbp[(pbp["pass_attempt"].eq(1)) & pbp["receiver_player_id"].notna()].copy()
    for frame in (rush, targ):
        frame["yardline_100"] = pd.to_numeric(frame["yardline_100"], errors="coerce")

    thresholds = [20, 10, 5, 3, 2]
    rush_base = rush.groupby(["season", "posteam", "rusher_player_id"], as_index=False).agg(
        carries=("rush_attempt", "sum"), rushing_yards=("rushing_yards", "sum"),
        rushing_tds=("rush_touchdown", "sum"), rushing_games=("game_id", "nunique"),
        pbp_name=("rusher_player_name", "first"),
    )
    for threshold in thresholds:
        values = rush[rush["yardline_100"].le(threshold)].groupby(
            ["season", "posteam", "rusher_player_id"]
        ).agg(**{f"i{threshold}_carries": ("rush_attempt", "sum"), f"i{threshold}_rush_tds": ("rush_touchdown", "sum")}).reset_index()
        rush_base = rush_base.merge(values, how="left", on=["season", "posteam", "rusher_player_id"])

    target_base = targ.groupby(["season", "posteam", "receiver_player_id"], as_index=False).agg(
        targets=("pass_attempt", "sum"), receptions=("complete_pass", "sum"),
        receiving_yards=("receiving_yards", "sum"), receiving_tds=("pass_touchdown", "sum"),
        receiving_games=("game_id", "nunique"), target_name=("receiver_player_name", "first"),
    )
    for threshold in [20, 10]:
        values = targ[targ["yardline_100"].le(threshold)].groupby(
            ["season", "posteam", "receiver_player_id"]
        ).agg(**{f"i{threshold}_targets": ("pass_attempt", "sum")}).reset_index()
        target_base = target_base.merge(values, how="left", on=["season", "posteam", "receiver_player_id"])

    keys = pd.concat([
        rush_base[["season", "posteam", "rusher_player_id"]].rename(columns={"rusher_player_id": "player_id"}),
        target_base[["season", "posteam", "receiver_player_id"]].rename(columns={"receiver_player_id": "player_id"}),
    ]).drop_duplicates()
    players = keys.merge(rush_base.rename(columns={"rusher_player_id": "player_id"}), how="left", on=["season", "posteam", "player_id"])
    players = players.merge(target_base.rename(columns={"receiver_player_id": "player_id"}), how="left", on=["season", "posteam", "player_id"])
    numeric = [c for c in players.columns if c not in {"season", "posteam", "player_id", "pbp_name", "target_name"}]
    players[numeric] = players[numeric].fillna(0)
    players["games"] = players[["rushing_games", "receiving_games"]].max(axis=1)
    players["touches"] = players["carries"] + players["receptions"]
    players["total_tds"] = players["rushing_tds"] + players["receiving_tds"]
    players["ppr_points"] = players["rushing_yards"] * .1 + players["rushing_tds"] * 6 + players["receptions"] + players["receiving_yards"] * .1 + players["receiving_tds"] * 6
    players["ppr_ppg"] = safe_div(players["ppr_points"], players["games"])

    roster = rosters.rename(columns={"team": "posteam", "gsis_id": "player_id"})
    players = players.merge(roster, how="left", on=["season", "posteam", "player_id"])
    players["name"] = players["full_name"].fillna(players["pbp_name"]).fillna(players["target_name"])
    players["norm_name"] = players["name"].map(norm_name)
    players["position"] = players["position"].fillna("UNK")

    rb_rushers = players[players["position"].isin(["RB", "FB"])]
    rb_team_values = rb_rushers.groupby(["season", "posteam"], as_index=False).agg(
        **{f"team_rb_i{threshold}_carries": (f"i{threshold}_carries", "sum") for threshold in thresholds}
    )
    players = players.merge(rb_team_values, how="left", on=["season", "posteam"])
    for threshold in thresholds:
        players[f"team_rb_i{threshold}_carries"] = players[f"team_rb_i{threshold}_carries"].fillna(0)

    team_rush = rush.groupby(["season", "posteam"], as_index=False).agg(team_carries=("rush_attempt", "sum"), team_rush_tds=("rush_touchdown", "sum"), team_games=("game_id", "nunique"))
    for threshold in thresholds:
        values = rush[rush["yardline_100"].le(threshold)].groupby(["season", "posteam"])["rush_attempt"].sum().rename(f"team_i{threshold}_carries").reset_index()
        team_rush = team_rush.merge(values, how="left", on=["season", "posteam"])
    team_pass = targ.groupby(["season", "posteam"], as_index=False).agg(team_targets=("pass_attempt", "sum"), team_receptions=("complete_pass", "sum"), team_receiving_tds=("pass_touchdown", "sum"))
    for threshold in [20, 10]:
        values = targ[targ["yardline_100"].le(threshold)].groupby(["season", "posteam"])["pass_attempt"].sum().rename(f"team_i{threshold}_targets").reset_index()
        team_pass = team_pass.merge(values, how="left", on=["season", "posteam"])
    teams = team_rush.merge(team_pass, how="outer", on=["season", "posteam"]).fillna(0)
    teams["team_touches"] = teams["team_carries"] + teams["team_receptions"]
    teams["offensive_tds_per_game"] = safe_div(teams["team_rush_tds"] + teams["team_receiving_tds"], teams["team_games"])
    teams["i10_rush_rate"] = safe_div(teams["team_i10_carries"], teams["team_i10_carries"] + teams["team_i10_targets"])
    trips = pbp[pbp["yardline_100"].le(20) & pbp["posteam"].notna()].drop_duplicates(["season", "posteam", "game_id", "drive"]).groupby(["season", "posteam"]).size().rename("red_zone_trips").reset_index()
    teams = teams.merge(trips, how="left", on=["season", "posteam"]).fillna({"red_zone_trips": 0})
    teams = teams.merge(first_coaches(pbp), how="left", left_on=["season", "posteam"], right_on=["season", "team"]).drop(columns=["team", "week"], errors="ignore")

    players = players.merge(teams, how="left", on=["season", "posteam"])
    players["touch_share"] = safe_div(players["touches"], players["team_touches"])
    players["target_share"] = safe_div(players["targets"], players["team_targets"])
    for threshold in thresholds:
        players[f"i{threshold}_share"] = safe_div(players[f"i{threshold}_carries"], players[f"team_i{threshold}_carries"])
        players[f"i{threshold}_rb_share"] = safe_div(players[f"i{threshold}_carries"], players[f"team_rb_i{threshold}_carries"])
    players["i20_target_share"] = safe_div(players["i20_targets"], players["team_i20_targets"])
    players["i10_target_share"] = safe_div(players["i10_targets"], players["team_i10_targets"])
    players["i5_td_conversion"] = safe_div(players["i5_rush_tds"], players["i5_carries"])

    # Primary team preserves full-season player totals while associating one team context.
    players["team_touch_count"] = players["touches"]
    primary = players.sort_values(["season", "player_id", "team_touch_count"], ascending=[True, True, False]).drop_duplicates(["season", "player_id"])
    sums = players.groupby(["season", "player_id"], as_index=False).agg({
        "carries": "sum", "targets": "sum", "receptions": "sum", "touches": "sum",
        "rushing_yards": "sum", "receiving_yards": "sum", "rushing_tds": "sum", "receiving_tds": "sum",
        "total_tds": "sum", "ppr_points": "sum", "games": "max", **{f"i{x}_carries": "sum" for x in thresholds},
        **{f"i{x}_rush_tds": "sum" for x in thresholds}, "i20_targets": "sum", "i10_targets": "sum",
    })
    context_cols = [c for c in primary.columns if c not in sums.columns]
    player_seasons = sums.merge(primary[["season", "player_id"] + context_cols], on=["season", "player_id"], how="left")
    player_seasons["ppr_ppg"] = safe_div(player_seasons["ppr_points"], player_seasons["games"])
    return player_seasons, players, teams


def add_competition(player_seasons: pd.DataFrame, team_players: pd.DataFrame) -> pd.DataFrame:
    rushers = team_players[team_players["carries"].gt(0)].copy()
    out = player_seasons.copy()
    metrics = []
    for row in out.itertuples():
        group = rushers[(rushers["season"] == row.season) & (rushers["posteam"] == row.posteam)]
        others = group[group["player_id"] != row.player_id]
        item = {"season": row.season, "player_id": row.player_id}
        for threshold in [20, 10, 5]:
            denom = float(getattr(row, f"team_i{threshold}_carries") or 0)
            values = others.sort_values(f"i{threshold}_carries", ascending=False)
            leader = values.iloc[0] if len(values) else None
            item[f"highest_teammate_i{threshold}_share"] = float(leader[f"i{threshold}_carries"] / denom) if leader is not None and denom else 0
            item[f"highest_teammate_i{threshold}_name"] = str(leader["name"]) if leader is not None else ""
            item[f"highest_teammate_i{threshold}_position"] = str(leader["position"]) if leader is not None else ""
            item[f"highest_teammate_i{threshold}_rush_tds"] = float(leader[f"i{threshold}_rush_tds"]) if leader is not None else 0
            rb = values[values["position"].isin(["RB", "FB"])]
            item[f"highest_other_rb_i{threshold}_share"] = float(rb.iloc[0][f"i{threshold}_carries"] / denom) if len(rb) and denom else 0
            nonrb = others[~others["position"].isin(["RB", "FB"])]
            item[f"non_rb_i{threshold}_share"] = float(nonrb[f"i{threshold}_carries"].sum() / denom) if denom else 0
            qb = others[others["position"].eq("QB")]
            item[f"qb_i{threshold}_share"] = float(qb[f"i{threshold}_carries"].sum() / denom) if denom else 0
            hybrid = others[others["position"].isin(["TE", "WR"])]
            item[f"te_hybrid_i{threshold}_share"] = float(hybrid[f"i{threshold}_carries"].sum() / denom) if denom else 0
        candidate = others.sort_values("i5_carries", ascending=False).iloc[0] if len(others) else None
        item["short_yardage_specialist"] = int(candidate is not None and candidate["i5_carries"] >= 3 and item["highest_teammate_i5_share"] >= .20)
        item["specialist_name"] = str(candidate["name"]) if item["short_yardage_specialist"] else ""
        item["specialist_position"] = str(candidate["position"]) if item["short_yardage_specialist"] else ""
        rb_i5 = group[group["position"].isin(["RB", "FB"])]["i5_carries"]
        total = rb_i5.sum()
        item["rb_i5_hhi"] = float(((rb_i5 / total) ** 2).sum()) if total else 0
        metrics.append(item)
    return out.merge(pd.DataFrame(metrics), on=["season", "player_id"], how="left")


def load_adp(cache: Path, season: int) -> pd.DataFrame:
    payload = json.loads((cache / f"ffc_adp_ppr_{season}.json").read_text(encoding="utf-8"))
    frame = pd.DataFrame(payload["players"])
    frame = frame[frame["position"].eq("RB")].copy()
    frame["season"] = season
    frame["norm_name"] = frame["name"].map(norm_name)
    frame["team"] = frame["team"].map(team)
    frame = frame.sort_values("adp").drop_duplicates("norm_name")
    frame["adp_rb_rank"] = np.arange(1, len(frame) + 1)
    frame["adp_start_date"] = payload["meta"].get("start_date")
    frame["adp_end_date"] = payload["meta"].get("end_date")
    frame["adp_drafts"] = payload["meta"].get("total_drafts")
    return frame[["season", "name", "norm_name", "team", "adp", "adp_rb_rank", "adp_start_date", "adp_end_date", "adp_drafts"]].rename(columns={"name": "adp_name", "team": "adp_team", "adp": "adp_overall"})


def build_model_rows(cache: Path, usage: pd.DataFrame) -> pd.DataFrame:
    adp = pd.concat([load_adp(cache, season) for season in OUTCOME_SEASONS], ignore_index=True)
    actual_cols = ["season", "norm_name", "player_id", "name", "posteam", "position", "ppr_points", "ppr_ppg", "games", "carries", "targets", "touches", "rushing_tds", "receiving_tds", "total_tds"]
    actual = usage[actual_cols].sort_values(["season", "ppr_points"], ascending=[True, False]).drop_duplicates(["season", "norm_name"])
    rb_ranks = actual[actual["position"].isin(["RB", "FB"])].copy()
    rb_ranks["actual_rb_rank"] = rb_ranks.groupby("season")["ppr_points"].rank(method="min", ascending=False).astype(int)
    actual = actual.merge(rb_ranks[["season", "norm_name", "actual_rb_rank"]], on=["season", "norm_name"], how="left")
    rows = adp.merge(actual, how="left", on=["season", "norm_name"])
    for col in ["ppr_points", "ppr_ppg", "games", "carries", "targets", "touches", "rushing_tds", "receiving_tds", "total_tds"]:
        rows[col] = rows[col].fillna(0)
    undrafted_finish = actual.groupby("season")["actual_rb_rank"].max().add(1)
    rows["actual_rb_rank"] = rows["actual_rb_rank"].fillna(rows["season"].map(undrafted_finish)).astype(int)
    rows["rank_outperformance"] = rows["adp_rb_rank"] - rows["actual_rb_rank"]

    prior_cols = [
        "norm_name", "season", "posteam", "name", "carries", "targets", "touches", "touch_share", "target_share",
        "i20_carries", "i10_carries", "i5_carries", "i20_targets", "i10_targets", "i20_share", "i10_share", "i5_share",
        "i20_rb_share", "i10_rb_share", "i5_rb_share", "i20_target_share",
        "i5_td_conversion", "offensive_tds_per_game", "red_zone_trips", "i10_rush_rate", "head_coach",
        "team_i20_carries", "team_i10_carries", "team_i5_carries", "team_rb_i20_carries", "team_rb_i10_carries", "team_rb_i5_carries",
        "highest_teammate_i20_share", "highest_teammate_i10_share", "highest_teammate_i5_share",
        "highest_teammate_i20_name", "highest_teammate_i10_name", "highest_teammate_i5_name",
        "highest_teammate_i20_position", "highest_teammate_i10_position", "highest_teammate_i5_position",
        "highest_teammate_i20_rush_tds", "highest_teammate_i10_rush_tds", "highest_teammate_i5_rush_tds",
        "highest_other_rb_i5_share", "non_rb_i10_share", "non_rb_i5_share", "qb_i5_share", "te_hybrid_i5_share",
        "short_yardage_specialist", "specialist_name", "specialist_position", "rb_i5_hhi",
    ]
    prior = usage[prior_cols].copy()
    prior["season"] += 1
    prior = prior.rename(columns={c: f"prior_{c}" for c in prior.columns if c not in {"season", "norm_name"}})
    rows = rows.merge(prior, how="left", on=["season", "norm_name"])
    older = usage[["norm_name", "season", "touch_share", "target_share", "i20_share", "i10_share", "i5_share", "i20_rb_share", "i10_rb_share", "i5_rb_share", "highest_teammate_i5_share", "posteam", "head_coach"]].copy()
    older["season"] += 2
    older = older.rename(columns={c: f"older_{c}" for c in older.columns if c not in {"season", "norm_name"}})
    rows = rows.merge(older, how="left", on=["season", "norm_name"])
    rows["prior_available"] = rows["prior_carries"].notna().astype(int)
    rows["two_year_available"] = rows["older_i5_share"].notna().astype(int)
    fill_cols = [c for c in rows.columns if c.startswith("prior_") and pd.api.types.is_numeric_dtype(rows[c])]
    rows[fill_cols] = rows[fill_cols].fillna(0)
    rows["i20_share_delta"] = rows["prior_i20_share"] - rows["older_i20_share"].fillna(rows["prior_i20_share"])
    rows["i10_share_delta"] = rows["prior_i10_share"] - rows["older_i10_share"].fillna(rows["prior_i10_share"])
    rows["i5_share_delta"] = rows["prior_i5_share"] - rows["older_i5_share"].fillna(rows["prior_i5_share"])
    rows["i20_rb_share_delta"] = rows["prior_i20_rb_share"] - rows["older_i20_rb_share"].fillna(rows["prior_i20_rb_share"])
    rows["i10_rb_share_delta"] = rows["prior_i10_rb_share"] - rows["older_i10_rb_share"].fillna(rows["prior_i10_rb_share"])
    rows["i5_rb_share_delta"] = rows["prior_i5_rb_share"] - rows["older_i5_rb_share"].fillna(rows["prior_i5_rb_share"])
    rows["touch_share_delta"] = rows["prior_touch_share"] - rows["older_touch_share"].fillna(rows["prior_touch_share"])
    rows["target_share_delta"] = rows["prior_target_share"] - rows["older_target_share"].fillna(rows["prior_target_share"])
    rows["teammate_i5_delta"] = rows["prior_highest_teammate_i5_share"] - rows["older_highest_teammate_i5_share"].fillna(rows["prior_highest_teammate_i5_share"])
    rows["team_changed"] = (rows["prior_posteam"].fillna(rows["adp_team"]) != rows["adp_team"]).astype(int)
    rows["head_coach_change"] = ((rows["prior_head_coach"].fillna("") != rows["older_head_coach"].fillna(rows["prior_head_coach"]).fillna("")) & rows["two_year_available"].eq(1)).astype(int)
    return rows


BASE_FEATURES = ["adp_overall"]
WORKLOAD_FEATURES = BASE_FEATURES + ["prior_carries", "prior_targets", "prior_touch_share", "prior_target_share", "prior_available", "team_changed"]
MODEL_FEATURES = {
    "M1_MARKET": BASE_FEATURES,
    "M2_MARKET_WORKLOAD": WORKLOAD_FEATURES,
    "M3_ADD_INSIDE20": WORKLOAD_FEATURES + ["prior_i20_rb_share"],
    "M4_ADD_INSIDE10": WORKLOAD_FEATURES + ["prior_i10_rb_share"],
    "M5_ADD_INSIDE5": WORKLOAD_FEATURES + ["prior_i5_rb_share"],
    "M6_FULL_RED_ZONE": WORKLOAD_FEATURES + ["prior_i20_rb_share", "prior_i10_rb_share", "prior_i5_rb_share", "prior_i20_target_share", "prior_offensive_tds_per_game", "prior_i10_rush_rate", "prior_highest_teammate_i5_share", "prior_non_rb_i10_share", "prior_non_rb_i5_share"],
    "M7_ROLE_CHANGE": WORKLOAD_FEATURES + ["touch_share_delta", "target_share_delta", "i20_rb_share_delta", "i10_rb_share_delta", "i5_rb_share_delta", "teammate_i5_delta", "head_coach_change", "two_year_available"],
    "M2_RB_DEPTH_COMP": WORKLOAD_FEATURES + ["prior_highest_other_rb_i5_share"],
    "M2_ALL_TEAMMATE_COMP": WORKLOAD_FEATURES + ["prior_highest_teammate_i5_share", "prior_non_rb_i10_share", "prior_non_rb_i5_share", "prior_qb_i5_share", "prior_te_hybrid_i5_share", "prior_short_yardage_specialist"],
}


def fit_predict(train: pd.DataFrame, test: pd.DataFrame, features: list[str], outcome: str) -> tuple[np.ndarray, np.ndarray]:
    x_train = train[features].fillna(0).to_numpy(float)
    x_test = test[features].fillna(0).to_numpy(float)
    mean, std = x_train.mean(axis=0), x_train.std(axis=0)
    std[std == 0] = 1
    x_train = (x_train - mean) / std
    x_test = (x_test - mean) / std
    design = np.column_stack([np.ones(len(x_train)), x_train])
    coef = np.linalg.lstsq(design, train[outcome].to_numpy(float), rcond=None)[0]
    return np.column_stack([np.ones(len(x_test)), x_test]) @ coef, coef[1:]


def model_results(rows: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    records, prediction_rows = [], rows.copy()
    m2_r2 = {}
    for outcome in ["ppr_points", "ppr_ppg"]:
        for name, features in MODEL_FEATURES.items():
            predictions = pd.Series(index=rows.index, dtype=float)
            for season in OUTCOME_SEASONS:
                test = rows[rows["season"].eq(season)]
                train = rows[~rows["season"].eq(season)]
                pred, _ = fit_predict(train, test, features, outcome)
                predictions.loc[test.index] = pred
            y = rows[outcome].to_numpy(float)
            pred = predictions.to_numpy(float)
            oos_r2 = 1 - np.square(y - pred).sum() / np.square(y - y.mean()).sum()
            mae = np.abs(y - pred).mean()
            rmse = np.sqrt(np.square(y - pred).mean())
            full_pred, coef = fit_predict(rows, rows, features, outcome)
            in_r2 = 1 - np.square(y - full_pred).sum() / np.square(y - y.mean()).sum()
            if name == "M2_MARKET_WORKLOAD":
                m2_r2[outcome] = oos_r2
            records.append({
                "outcome": outcome, "model": name, "n": len(rows), "features": ";".join(features),
                "in_sample_r2": in_r2, "oos_r2": oos_r2, "oos_mae": mae, "oos_rmse": rmse,
                "incremental_oos_r2_vs_m2": oos_r2 - m2_r2.get(outcome, oos_r2),
                "standardized_coefficients": json.dumps(dict(zip(features, coef)), sort_keys=True),
            })
            prediction_rows[f"pred_{outcome}_{name}"] = predictions
    prediction_rows["adp_expected_ppr"] = prediction_rows["pred_ppr_points_M1_MARKET"]
    prediction_rows["adp_residual_ppr"] = prediction_rows["ppr_points"] - prediction_rows["adp_expected_ppr"]
    residual_models = {
        "A0_INTERCEPT": [],
        "A1_ESTABLISHED_RED_ZONE": ["prior_i20_rb_share", "prior_i10_rb_share", "prior_i5_rb_share", "prior_offensive_tds_per_game"],
        "A2_ROLE_CHANGE": ["touch_share_delta", "target_share_delta", "i20_rb_share_delta", "i10_rb_share_delta", "i5_rb_share_delta", "teammate_i5_delta", "two_year_available"],
        "A3_RB_DEPTH_COMP": ["prior_highest_other_rb_i5_share"],
        "A4_ALL_TEAMMATE_COMP": ["prior_highest_teammate_i5_share", "prior_non_rb_i10_share", "prior_non_rb_i5_share", "prior_qb_i5_share", "prior_te_hybrid_i5_share", "prior_short_yardage_specialist"],
        "A5_COMBINED": ["prior_i5_rb_share", "prior_offensive_tds_per_game", "i5_rb_share_delta", "teammate_i5_delta", "prior_highest_teammate_i5_share", "prior_non_rb_i5_share", "two_year_available"],
    }
    residual_baseline_r2 = None
    for name, features in residual_models.items():
        predictions = pd.Series(index=rows.index, dtype=float)
        for season in OUTCOME_SEASONS:
            test = prediction_rows[prediction_rows["season"].eq(season)]
            train = prediction_rows[~prediction_rows["season"].eq(season)]
            pred, _ = fit_predict(train, test, features, "adp_residual_ppr")
            predictions.loc[test.index] = pred
        y = prediction_rows["adp_residual_ppr"].to_numpy(float)
        pred = predictions.to_numpy(float)
        oos_r2 = 1 - np.square(y - pred).sum() / np.square(y - y.mean()).sum()
        if name == "A0_INTERCEPT": residual_baseline_r2 = oos_r2
        full_pred, coef = fit_predict(prediction_rows, prediction_rows, features, "adp_residual_ppr")
        records.append({
            "outcome": "adp_residual_ppr", "model": name, "n": len(rows), "features": ";".join(features),
            "in_sample_r2": 1 - np.square(y - full_pred).sum() / np.square(y - y.mean()).sum(),
            "oos_r2": oos_r2, "oos_mae": np.abs(y - pred).mean(), "oos_rmse": np.sqrt(np.square(y - pred).mean()),
            "incremental_oos_r2_vs_m2": oos_r2 - residual_baseline_r2,
            "standardized_coefficients": json.dumps(dict(zip(features, coef)), sort_keys=True),
        })
        prediction_rows[f"pred_adp_residual_{name}"] = predictions
    models = pd.DataFrame(records)
    for outcome in ["ppr_points", "ppr_ppg"]:
        baseline = models[(models.outcome == outcome) & (models.model == "M2_MARKET_WORKLOAD")].iloc[0].oos_r2
        models.loc[models.outcome == outcome, "incremental_oos_r2_vs_m2"] = models.loc[models.outcome == outcome, "oos_r2"] - baseline
    prediction_rows["workload_expected_ppr"] = prediction_rows["pred_ppr_points_M2_MARKET_WORKLOAD"]
    prediction_rows["workload_residual_ppr"] = prediction_rows["ppr_points"] - prediction_rows["workload_expected_ppr"]
    return models, prediction_rows


def compact_player_rows(rows: pd.DataFrame) -> pd.DataFrame:
    keep = [
        "season", "adp_name", "adp_team", "adp_overall", "adp_rb_rank", "adp_start_date", "adp_end_date", "adp_drafts",
        "ppr_points", "ppr_ppg", "games", "actual_rb_rank", "rank_outperformance", "adp_expected_ppr", "adp_residual_ppr",
        "workload_expected_ppr", "workload_residual_ppr", "prior_available", "prior_carries", "prior_targets", "prior_touches",
        "prior_touch_share", "prior_target_share", "prior_i20_carries", "prior_i10_carries", "prior_i5_carries", "prior_i20_targets",
        "prior_i10_targets", "prior_i20_share", "prior_i10_share", "prior_i5_share", "prior_i20_rb_share", "prior_i10_rb_share", "prior_i5_rb_share", "prior_i5_td_conversion",
        "prior_team_i20_carries", "prior_team_i10_carries", "prior_team_i5_carries", "prior_team_rb_i20_carries", "prior_team_rb_i10_carries", "prior_team_rb_i5_carries",
        "prior_offensive_tds_per_game", "prior_red_zone_trips", "prior_i10_rush_rate", "touch_share_delta", "target_share_delta", "i20_share_delta", "i10_share_delta",
        "i5_share_delta", "i20_rb_share_delta", "i10_rb_share_delta", "i5_rb_share_delta", "teammate_i5_delta", "team_changed", "head_coach_change",
    ]
    return rows[keep].sort_values(["season", "adp_overall"])


def cannibalization_rows(rows: pd.DataFrame) -> pd.DataFrame:
    keep = [
        "season", "adp_name", "adp_team", "adp_overall", "ppr_points", "ppr_ppg", "adp_residual_ppr", "workload_residual_ppr",
        "prior_carries", "prior_targets", "prior_touch_share", "prior_i20_share", "prior_i10_share", "prior_i5_share",
        "prior_highest_teammate_i20_name", "prior_highest_teammate_i20_position", "prior_highest_teammate_i20_share",
        "prior_highest_teammate_i20_rush_tds",
        "prior_highest_teammate_i10_name", "prior_highest_teammate_i10_position", "prior_highest_teammate_i10_share",
        "prior_highest_teammate_i10_rush_tds",
        "prior_highest_teammate_i5_name", "prior_highest_teammate_i5_position", "prior_highest_teammate_i5_share",
        "prior_highest_teammate_i5_rush_tds",
        "prior_highest_other_rb_i5_share", "prior_non_rb_i10_share", "prior_non_rb_i5_share", "prior_qb_i5_share",
        "prior_te_hybrid_i5_share", "prior_short_yardage_specialist", "prior_specialist_name", "prior_specialist_position", "prior_rb_i5_hhi",
    ]
    return rows[keep].sort_values(["prior_highest_teammate_i5_share", "prior_non_rb_i5_share"], ascending=False)


def role_change_rows(rows: pd.DataFrame) -> pd.DataFrame:
    out = rows[["season", "adp_name", "adp_team", "adp_overall", "ppr_points", "ppr_ppg", "adp_residual_ppr", "workload_residual_ppr", "touch_share_delta", "target_share_delta", "i20_share_delta", "i10_share_delta", "i5_share_delta", "i20_rb_share_delta", "i10_rb_share_delta", "i5_rb_share_delta", "teammate_i5_delta", "head_coach_change", "team_changed", "two_year_available"]].copy()
    out["role_change_category"] = np.select([out.i5_rb_share_delta >= .15, out.i5_rb_share_delta <= -.15], ["RISING", "DECLINING"], default="STABLE")
    return out.sort_values("i5_rb_share_delta", ascending=False)


def case_rows(usage: pd.DataFrame, rows: pd.DataFrame, team_players: pd.DataFrame) -> dict:
    indexed = usage.set_index(["season", "norm_name"], drop=False)
    outcomes = rows.set_index(["season", "norm_name"], drop=False)
    def row(season: int, name: str):
        key = (season, norm_name(name))
        if key not in indexed.index:
            return None
        value = indexed.loc[key]
        if isinstance(value, pd.DataFrame): value = value.iloc[0]
        fields = ["name", "posteam", "position", "carries", "targets", "touches", "i20_carries", "i10_carries", "i5_carries", "i20_targets", "i10_targets", "i20_share", "i10_share", "i5_share", "i20_rb_share", "i10_rb_share", "i5_rb_share", "rushing_tds", "receiving_tds", "total_tds", "ppr_points", "ppr_ppg", "games", "highest_teammate_i5_name", "highest_teammate_i5_position", "highest_teammate_i5_share", "non_rb_i10_share", "non_rb_i5_share", "qb_i5_share", "te_hybrid_i5_share"]
        result = {field: value[field] for field in fields}
        outcome_key = (season, norm_name(name))
        if outcome_key in outcomes.index:
            outcome = outcomes.loc[outcome_key]
            if isinstance(outcome, pd.DataFrame): outcome = outcome.iloc[0]
            for field in ["adp_overall", "adp_rb_rank", "actual_rb_rank", "rank_outperformance", "adp_expected_ppr", "adp_residual_ppr", "workload_expected_ppr", "workload_residual_ppr"]:
                result[field] = outcome[field]
        return result

    def saints_season(season: int) -> dict:
        kamara = row(season, "Alvin Kamara")
        hill = row(season, "Taysom Hill")
        group = team_players[(team_players.season.eq(season)) & (team_players.posteam.eq("NO"))]
        team_i5 = float(group.i5_carries.sum())
        other = group[~group.norm_name.isin([norm_name("Alvin Kamara"), norm_name("Taysom Hill")])]
        other_rbs = other[other.position.isin(["RB", "FB"])]
        other_qbs = other[other.position.eq("QB")]
        league_rbs = usage[(usage.season.eq(season)) & usage.position.isin(["RB", "FB"])]
        rb_i5_conversion = safe_div(float(league_rbs.i5_rush_tds.sum()), float(league_rbs.i5_carries.sum()))
        team_rbs = group[group.position.isin(["RB", "FB"])]
        kamara_rb_share = safe_div(kamara["i5_carries"], float(team_rbs.i5_carries.sum())) if kamara else 0
        designation = {2022: "TE", 2023: "TE/hybrid", 2024: "TE (CBS); QB/TE (Yahoo)"}.get(season, "hybrid")
        return {
            "kamara": kamara,
            "hill": hill,
            "hill_fantasy_designation": designation,
            "team_inside5_attempts": team_i5,
            "kamara_inside5_opportunity_share": safe_div(kamara["i5_carries"], team_i5) if kamara else 0,
            "hill_inside5_opportunity_share": safe_div(hill["i5_carries"], team_i5) if hill else 0,
            "other_player_inside5_opportunity_share": safe_div(float(other.i5_carries.sum()), team_i5),
            "non_rb_inside5_share": safe_div(float(group[~group.position.isin(["RB", "FB"])].i5_carries.sum()), team_i5),
            "other_rb_i20_carries": float(other_rbs.i20_carries.sum()),
            "other_rb_i10_carries": float(other_rbs.i10_carries.sum()),
            "other_rb_i5_carries": float(other_rbs.i5_carries.sum()),
            "other_qb_i10_carries": float(other_qbs.i10_carries.sum()),
            "other_qb_i5_carries": float(other_qbs.i5_carries.sum()),
            "league_rb_inside5_td_conversion": rb_i5_conversion,
            "estimated_kamara_td_opportunity_removed": (hill["i5_carries"] * kamara_rb_share * rb_i5_conversion) if hill and kamara else 0,
            "estimate_note": "Counterfactual allocates only Hill inside-5 attempts by Kamara's share of Saints RB inside-5 work and league RB conversion; it does not assign every Hill TD to Kamara.",
        }
    return {
        "saints": {str(s): saints_season(s) for s in [2022, 2023, 2024]},
        "lions": {str(s): {"gibbs": row(s, "Jahmyr Gibbs"), "montgomery": row(s, "David Montgomery")} for s in [2023, 2024, 2025]},
        "falcons": {str(s): {"bijan": row(s, "Bijan Robinson"), "allgeier": row(s, "Tyler Allgeier")} for s in [2023, 2024, 2025]},
        "skattebo_2025": row(2025, "Cam Skattebo"),
    }


def parse_pool() -> list[dict]:
    text = gzip.decompress((ROOT / "app.html.gz").read_bytes()).decode("utf-8")
    match = re.search(r"const DEFAULT_MASTER_POOL=(\[.*\]);\nfunction freshMasterPool", text)
    return json.loads(match.group(1))


def audit_2026(cache: Path, usage: pd.DataFrame) -> pd.DataFrame:
    adp = load_adp(cache, 2026)
    pool = pd.DataFrame(parse_pool())
    pool["norm_name"] = pool["name"].map(norm_name)
    current = adp.merge(pool[["norm_name", "name", "nfl_team", "planning_adp", "situation_score", "breakout_score", "competition_score", "depth_role", "situation_summary"]], how="left", on="norm_name")
    prior = usage[usage.season.eq(2025)].sort_values("touches", ascending=False).drop_duplicates("norm_name")
    older = usage[usage.season.eq(2024)].sort_values("touches", ascending=False).drop_duplicates("norm_name")
    cols = ["norm_name", "posteam", "i20_share", "i10_share", "i5_share", "i20_carries", "i10_carries", "i5_carries", "offensive_tds_per_game", "highest_teammate_i5_name", "highest_teammate_i5_position", "highest_teammate_i5_share", "non_rb_i5_share", "qb_i5_share", "te_hybrid_i5_share", "short_yardage_specialist"]
    current = current.merge(prior[cols].rename(columns={c: f"y2025_{c}" for c in cols if c != "norm_name"}), how="left", on="norm_name")
    current = current.merge(older[["norm_name", "i5_share"]].rename(columns={"i5_share": "y2024_i5_share"}), how="left", on="norm_name")
    current["roleChangeMagnitude"] = current["y2025_i5_share"] - current["y2024_i5_share"]
    current["historicalOwnRoleDelta"] = current["roleChangeMagnitude"]
    current["roleChangeDirection"] = np.select([
        current.y2024_i5_share.isna() & current.y2025_i5_share.notna(), current.roleChangeMagnitude >= .15, current.roleChangeMagnitude <= -.15
    ], ["NEW_ROLE", "RISING", "DECLINING"], default="STABLE")
    current["same_team"] = current["nfl_team"].map(team).eq(current["y2025_posteam"])
    pool_team = pool.set_index("norm_name")["nfl_team"].map(team).to_dict()
    current["historicalGoalLineCompetition"] = current[["y2025_highest_teammate_i5_share", "y2025_non_rb_i5_share"]].max(axis=1)
    current["topHistoricalCompetitor2026Team"] = current["y2025_highest_teammate_i5_name"].map(lambda value: pool_team.get(norm_name(value), "UNKNOWN"))
    current["topCompetitorStillTeammate"] = current.apply(lambda r: bool(r.same_team and r.topHistoricalCompetitor2026Team == team(r.nfl_team)), axis=1)
    current["goalLineCompetition"] = np.where(current["topCompetitorStillTeammate"], current["historicalGoalLineCompetition"], np.nan)
    competitor_departed = current.same_team & ~current.topCompetitorStillTeammate & current.historicalGoalLineCompetition.ge(.20)
    current.loc[~current.same_team, "roleChangeDirection"] = "SYSTEM_CHANGED"
    current.loc[competitor_departed, "roleChangeDirection"] = "PROJECTED_RELIEF"
    current.loc[~current.same_team, "roleChangeMagnitude"] = np.nan
    current.loc[competitor_departed, "roleChangeMagnitude"] = current.loc[competitor_departed, "historicalGoalLineCompetition"]
    current["confidence"] = np.select([
        current.norm_name.eq(norm_name("Cam Skattebo")),
        current.same_team & current.y2025_i10_carries.ge(8),
        current.same_team & current.y2025_i10_carries.ge(4),
    ], ["MEDIUM", "MEDIUM", "LOW_MEDIUM"], default="LOW")
    context = {
        norm_name("Cam Skattebo"): "Giants official camp report: returned and good to go; Matt Nagy is the 2026 OC. Preseason role reporting remained uncertain, so no current goal-line share is asserted.",
        norm_name("Jahmyr Gibbs"): "Established 2025 role; 2025 top inside-5 competitor David Montgomery is on Houston in the current pool, creating projected relief but no quantified current share.",
        norm_name("Bijan Robinson"): "Established role under the post-Arthur Smith offense; 2025 top inside-5 competitor Tyler Allgeier is on Arizona in the current pool, creating projected relief but no quantified current share.",
        norm_name("David Montgomery"): "Moved from Detroit to Houston; prior Lions shares are descriptive only and are not projected onto the new system.",
        norm_name("Kenneth Walker"): "Moved from Seattle to Kansas City; prior Seahawks shares and Zach Charbonnet competition are not projected onto the new system.",
    }
    current["currentSystemContext"] = current.norm_name.map(context).fillna("No independently verified 2026 role report; prior-season evidence only.")
    current["evidenceSummary"] = current.apply(lambda r: f"2025 retrospective all-rusher shares i20/i10/i5={r.y2025_i20_share:.2f}/{r.y2025_i10_share:.2f}/{r.y2025_i5_share:.2f}; top i5 teammate {r.y2025_highest_teammate_i5_name or 'none'} ({r.y2025_highest_teammate_i5_position or '?'}) {r.y2025_highest_teammate_i5_share:.2f}; {'same team' if r.same_team else 'team/system changed'}; current competitor continuity={'yes' if r.topCompetitorStillTeammate else 'no/unknown'}" if pd.notna(r.y2025_i5_share) else "No 2025 NFL rushing-role evidence", axis=1)
    return current.rename(columns={"adp_name": "player", "adp_overall": "current_adp", "y2025_i20_share": "rz20Role", "y2025_i10_share": "rz10Role", "y2025_i5_share": "rz5Role", "y2025_offensive_tds_per_game": "teamScoringEnvironment", "y2025_qb_i5_share": "qbGoalLineShare", "y2025_te_hybrid_i5_share": "teHybridGoalLineShare", "y2025_short_yardage_specialist": "shortYardageSpecialist"})[[
        "player", "nfl_team", "current_adp", "planning_adp", "situation_score", "breakout_score", "competition_score", "depth_role", "rz20Role", "rz10Role", "rz5Role", "historicalOwnRoleDelta", "historicalGoalLineCompetition", "goalLineCompetition", "topHistoricalCompetitor2026Team", "topCompetitorStillTeammate", "qbGoalLineShare", "teHybridGoalLineShare", "shortYardageSpecialist", "teamScoringEnvironment", "roleChangeDirection", "roleChangeMagnitude", "confidence", "currentSystemContext", "evidenceSummary", "situation_summary"
    ]].sort_values("current_adp")


def group_summary(rows: pd.DataFrame) -> dict:
    data = rows.copy()
    data["adp_group"] = np.where(data.adp_overall <= data.adp_overall.median(), "EXPENSIVE", "CHEAP")
    data["rz_group"] = np.where(data.prior_i5_rb_share >= data.prior_i5_rb_share.median(), "HIGH_RZ", "LOW_RZ")
    market = data.groupby(["rz_group", "adp_group"]).agg(n=("adp_name", "size"), mean_ppr=("ppr_points", "mean"), mean_adp_residual=("adp_residual_ppr", "mean"), mean_rank_outperformance=("rank_outperformance", "mean")).reset_index().to_dict("records")
    data["role_change"] = np.select([data.i5_rb_share_delta >= .15, data.i5_rb_share_delta <= -.15], ["RISING", "DECLINING"], default="STABLE")
    changes = data.groupby("role_change").agg(n=("adp_name", "size"), mean_ppr=("ppr_points", "mean"), mean_adp_residual=("adp_residual_ppr", "mean"), mean_workload_residual=("workload_residual_ppr", "mean")).reset_index().to_dict("records")
    return {"market_efficiency": market, "role_change": changes}


def write_csv(frame: pd.DataFrame, path: Path) -> None:
    frame.to_csv(path, index=False, float_format="%.6f", quoting=csv.QUOTE_MINIMAL)


def clean_json(value):
    if isinstance(value, dict):
        return {str(key): clean_json(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [clean_json(item) for item in value]
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir", type=Path, required=True)
    parser.add_argument("--download", action="store_true")
    args = parser.parse_args()
    if args.download:
        ensure_sources(args.cache_dir)
    rosters = load_rosters(args.cache_dir)
    pbp = load_pbp(args.cache_dir)
    usage, team_players, teams = aggregate_usage(pbp, rosters)
    usage = add_competition(usage, team_players)
    rows = build_model_rows(args.cache_dir, usage)
    models, rows = model_results(rows)
    player_csv = compact_player_rows(rows)
    cannibal = cannibalization_rows(rows)
    role_changes = role_change_rows(rows)
    audit = audit_2026(args.cache_dir, usage)
    cases = case_rows(usage, rows, team_players)
    groups = group_summary(rows)

    write_csv(player_csv, ROOT / "diagnostics/v0130-red-zone-player-seasons.csv")
    write_csv(models, ROOT / "diagnostics/v0130-red-zone-models.csv")
    write_csv(role_changes, ROOT / "diagnostics/v0130-red-zone-role-changes.csv")
    write_csv(cannibal, ROOT / "diagnostics/v0130-red-zone-cannibalization.csv")
    write_csv(audit, ROOT / "diagnostics/v0130-red-zone-2026-audit.csv")
    summary = {
        "generated_at": RETRIEVED,
        "analysis_only": True,
        "outcome_seasons": OUTCOME_SEASONS,
        "sample_size": len(rows),
        "leakage_contract": {
            "outcome_usage_in_predictors": False,
            "football_predictor_cutoff": "end of season Y-1",
            "adp_timing": rows.groupby("season")[["adp_start_date", "adp_end_date", "adp_drafts"]].first().reset_index().to_dict("records"),
            "coaching_flag": "first regular-season head coach for Y versus Y-1; identity was known before Week 1",
        },
        "sources": {
            "pbp": PBP_URL, "rosters": ROSTER_URL, "adp": ADP_URL,
            "licenses": "nflverse CC-BY 4.0; FFC public ADP API with attribution",
        },
        "models": models.to_dict("records"),
        "groups": groups,
        "case_studies": cases,
        "data_sha256": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(args.cache_dir.glob("*"))},
    }
    (ROOT / "diagnostics/v0130-red-zone-role-study.json").write_text(json.dumps(clean_json(summary), indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({"sample": len(rows), "models": models[["outcome", "model", "oos_r2", "oos_mae", "incremental_oos_r2_vs_m2"]].to_dict("records"), "outputs": 6}, indent=2))


if __name__ == "__main__":
    main()
