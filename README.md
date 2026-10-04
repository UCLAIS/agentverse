# AgentVerse

Landing page for AgentVerse, UCL AI Society's AI hackathon (7–8 November 2026).

Static site — no build step:

- `index.html` — markup
- `styles.css` — styles
- `main.js` — starfield, agent constellations, pixel comets, cursor trail, scroll reveal
- `assets/` — images

Effect settings (trail style, star count, toggles) live in the `CONFIG` object at the top of `main.js`.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

Deployed to GitHub Pages from `main`.
