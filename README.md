# AgentVerse

Landing page for AgentVerse, UCL AI Society's AI hackathon (7–8 November 2026).

Static site — no build step:

- `index.html` — markup
- `styles.css` — styles
- `main.js` — pixel starfield, square-node constellations, shooting stars,
  layered pixel horizons, cursor trail and scroll reveal
- `assets/` — images

The hero uses the designer's original wordmark (`agentverse-wordmark.png`) and
space artwork (`designer-space.webp`), extracted from the supplied SVG.
The WebP background preserves the PNG's pixels losslessly. A violet galaxy,
pixel stars and layered nebula landscapes carry the designer's palette through
the hero, sponsors, registration timeline, application section and footer.

Sponsor names, registration dates and the application link await confirmation.
The application button stays disabled until the real form is available.

Effect settings (trail style, star count, toggles) live in the `CONFIG` object at the top of `main.js`.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

Deployed to GitHub Pages from `main`.
