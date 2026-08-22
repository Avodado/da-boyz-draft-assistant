# DA BOYZ Draft Assistant

GitHub Pages deployment candidate for **DA BOYZ Draft Assistant v0.12.7**.

This release makes the existing strategy boundary explicit: historical profiles and live adaptation continue to predict opponents, while No Chumps recommendations and simulated selections cannot consume the No Chumps historical profile. Historical self predictions remain diagnostic, and the new tier-cliff/denial report is diagnostic-only. The validated football coefficients, owner data, Setup identity, PWA safety, and 331-player pool remain unchanged.

Expected Pages URL: `https://avodado.github.io/da-boyz-draft-assistant/`

After Pages is enabled and `app.html.gz` is uploaded, open the Pages URL once online, install it from Chrome, then turn networking off and relaunch the installed app to verify offline operation and saved-draft recovery.

Run the repository acceptance checks with:

```text
python -m unittest discover -s tests -v
node --test tests/*.test.mjs
```

TV casting is intentionally out of scope for this candidate.
