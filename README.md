# AgentVerse

Landing page for AgentVerse, UCL AI Society's AI hackathon (7–8 November 2026).

Static site — no build step:

- `index.html` — markup
- `styles.css` — styles
- `main.js` — pixel starfield, square-node constellations, shooting stars,
  layered pixel horizons, cursor trail and scroll reveal
- `assets/` — images

The hero uses the designer's original wordmark (the PNG is retained, while
`agentverse-wordmark.webp` serves the same pixels in a smaller file) and
space artwork, extracted from the supplied SVG. `designer-space.webp` retains
the lossless source; the page serves `designer-space-display.webp`, a compressed
copy with the same dimensions and composition. A soft mask hides the baked-in
constellation labels while keeping the planet and nebula. Phones receive a smaller
background variant, and responsive wordmark and logo variants avoid oversized
downloads. A violet galaxy,
pixel stars and layered nebula landscapes carry the designer's palette through
the hero, sponsors, registration timeline, application section and footer.

Sponsor names, registration dates and the application link await confirmation.
The application button stays disabled until the real form is available.

Effect settings (trail style, star count, toggles) live in the `CONFIG` object at the top of `main.js`.
The short pixel cursor trail keeps the native cursor, ignores touch and pen
gestures, and respects reduced motion. Its particle count is capped and its fade
is based on elapsed time so it behaves consistently across screen refresh rates.

Each main section fills at least the current viewport and grows for longer
content. Registration uses a heading above the timeline, with vertical steps
on phones. Section links use browser-native scrolling and respect reduced motion.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

Deployed to GitHub Pages from `main`.
