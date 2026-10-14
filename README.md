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

Applications open on 19 October 2026 at 00:00 and close on 30 October at 23:59.
Hacking runs from 09:00 on 7 November to 18:00 on 8 November. All times are London time.
Three track sponsor names await confirmation. Devfolio is credited as the
community partner in the footer, using its official white logo and required alt text.

The custom muted-purple "Apply on Devfolio" button opens
`https://agentverse.devfolio.co/` in a new tab. Registration happens on Devfolio;
the embedded SDK was replaced at the organiser's request to allow site-matched
typography and colours. The Devfolio event must be available for applications.

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
