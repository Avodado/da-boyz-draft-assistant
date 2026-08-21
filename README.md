# DA BOYZ Draft Assistant

GitHub Pages deployment candidate for **DA BOYZ Draft Assistant v0.12.5**.

This release separates current owner name, current team name, and the optional historical-profile link. New and replacement owners default to neutral/no-history, renamed teams retain their explicit profile link, and v0.12.4 autosaves migrate without losing picks, cards, player availability, or recovery behavior. The validated football model and 331-player pool remain byte-bound to v0.12.4.

Expected Pages URL: `https://avodado.github.io/da-boyz-draft-assistant/`

After Pages is enabled and `app.html.gz` is uploaded, open the Pages URL once online, install it from Chrome, then turn networking off and relaunch the installed app to verify offline operation and saved-draft recovery.

Run the repository acceptance checks with:

```text
python -m unittest discover -s tests -v
node --test tests/*.test.mjs
```

TV casting is intentionally out of scope for this candidate.
