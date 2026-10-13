# AgentVerse

Landing page for AgentVerse, UCL AI Society's AI hackathon (7–8 November 2026).

Static site — no build step:

- `index.html` — markup
- `styles.css` — styles
- `main.js` — starfield, agent constellations, pixel comets, cursor trail, scroll reveal
- `assets/` — images

The hero uses the designer's original wordmark (`agentverse-wordmark.png`) and
space artwork (`designer-space.webp`), extracted from the supplied SVG.
The WebP background preserves the PNG's pixels losslessly. The existing live
starfield, galaxy, constellations and cursor effects remain layered over it.

Effect settings (trail style, star count, toggles) live in the `CONFIG` object at the top of `main.js`.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

Deployed to GitHub Pages from `main`.
