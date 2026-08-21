# DA BOYZ Draft Assistant

GitHub Pages deployment candidate for **DA BOYZ Draft Assistant v0.12.6**.

This release restores known historical team presets as an optional one-time Setup shortcut while retaining v0.12.5's independent owner, team, and profile fields. Preset mappings come directly from the existing profile IDs and owner data; edits remain authoritative afterward. Existing v0.12.5 states load without preset inference or identity changes. The validated football model and 331-player pool remain byte-bound to v0.12.4.

Expected Pages URL: `https://avodado.github.io/da-boyz-draft-assistant/`

After Pages is enabled and `app.html.gz` is uploaded, open the Pages URL once online, install it from Chrome, then turn networking off and relaunch the installed app to verify offline operation and saved-draft recovery.

Run the repository acceptance checks with:

```text
python -m unittest discover -s tests -v
node --test tests/*.test.mjs
```

TV casting is intentionally out of scope for this candidate.
