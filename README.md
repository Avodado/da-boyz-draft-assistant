# DA BOYZ Draft Assistant

GitHub Pages deployment for **DA BOYZ Draft Assistant v0.12.3**.

This repository hosts the Android/PWA deployment candidate. The football model and 331-player pool remain byte-bound to the validated v0.12.3 payload; the current release work is limited to delivery, cache safety, install metadata, and regression coverage.

Expected Pages URL: `https://avodado.github.io/da-boyz-draft-assistant/`

After Pages is enabled and `app.html.gz` is uploaded, open the Pages URL once online, install it from Chrome, then turn networking off and relaunch the installed app to verify offline operation and saved-draft recovery.

Run the repository acceptance checks with:

```text
python -m unittest discover -s tests -v
node --test tests/service-worker.test.mjs
```

TV casting is intentionally out of scope for this candidate.
