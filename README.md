# DA BOYZ Draft Assistant

GitHub Pages deployment candidate for **DA BOYZ Draft Assistant v0.12.8**.

This release adds explicit randomization for the ten active 2026 room identities, pre-pick top-10 decision snapshots for No Chumps, and deterministic completed-draft grades for all ten teams. Completed exports include stable machine-readable grade records, and `diagnostics/aggregate_mock_grades.mjs` aggregates directories of exports or compares them with an optional actual draft. These layers are diagnostic-only; the validated football coefficients, full owner-profile catalog, Setup identity, PWA safety, and 331-player pool remain unchanged.

Expected Pages URL: `https://avodado.github.io/da-boyz-draft-assistant/`

After Pages is enabled and `app.html.gz` is uploaded, open the Pages URL once online, install it from Chrome, then turn networking off and relaunch the installed app to verify offline operation and saved-draft recovery.

Run the repository acceptance checks with:

```text
python -m unittest discover -s tests -v
node --test tests/*.test.mjs
```

Aggregate completed mock exports offline with:

```text
node diagnostics/aggregate_mock_grades.mjs path/to/exports --output mock-aggregate.json
node diagnostics/aggregate_mock_grades.mjs path/to/exports --actual path/to/actual-draft.json --output actual-comparison.json
```

The utility keys known owners by historical profile first, then preset, and only falls back to normalized owner name. Team names remain display metadata, so a rename does not split a known owner's history. It reads completed v1 grade reports and never writes back to source exports.

TV casting is intentionally out of scope for this candidate.
