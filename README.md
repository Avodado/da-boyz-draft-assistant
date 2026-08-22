# DA BOYZ Draft Assistant

GitHub Pages deployment candidate for **DA BOYZ Draft Assistant v0.13.0**.

This controlled data release refreshes the 2026 PPR market snapshot, injury/availability evidence, situation overlays, and six current-market pool entries. The validated football coefficients, grading weights, owner profiles, tier architecture, Setup/randomizer behavior, and PWA safety are unchanged. The audited master pool now contains 337 unique players; season-ending and reserve players remain identifiable rather than being silently removed.

Expected Pages URL: `https://avodado.github.io/da-boyz-draft-assistant/`

After Pages is enabled and `app.html.gz` is uploaded, open the Pages URL once online, install it from Chrome, then turn networking off and relaunch the installed app to verify offline operation and saved-draft recovery.

Run the repository acceptance checks with:

```text
python -m unittest discover -s tests -v
node --test tests/*.test.mjs
```

Reproduce the source snapshots and apply the refresh with:

```text
node diagnostics/v0130-data-refresh.mjs snapshot --source-dir path/to/retrieved-html
node diagnostics/v0130-data-refresh.mjs apply
```

The refresh methodology, source URLs, deltas, frozen hashes, and the public Matthew Berry/Fantasy Life comparison are documented under `diagnostics/v0130-*`.

Aggregate completed mock exports offline with:

```text
node diagnostics/aggregate_mock_grades.mjs path/to/exports --output mock-aggregate.json
node diagnostics/aggregate_mock_grades.mjs path/to/exports --actual path/to/actual-draft.json --output actual-comparison.json
```

The utility keys known owners by historical profile first, then preset, and only falls back to normalized owner name. Team names remain display metadata, so a rename does not split a known owner's history. It reads completed v1 grade reports and never writes back to source exports.

TV casting is intentionally out of scope for this candidate.
