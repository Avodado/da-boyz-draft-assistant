# DA BOYZ Draft Assistant

GitHub Pages deployment candidate for **DA BOYZ Draft Assistant v0.12.9**.

This focused release hardens completed-draft export preparation and adds machine-readable export-build/schema provenance. Completed exports reliably carry the existing decision snapshots and ten-team grade report, and `diagnostics/aggregate_mock_grades.mjs` continues to aggregate them offline. The validated football coefficients, grading weights, full owner-profile catalog, Setup/randomizer behavior, PWA safety, and 331-player pool remain unchanged.

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
