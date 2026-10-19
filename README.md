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
One main sponsor and three supporting sponsor slots await names and logos.
The application section lists the dates and contact email; a replacement
application link has not yet been supplied.

Effect settings (star count, toggles) live in the `CONFIG` object at the top of `main.js`.
The crisp pixel cursor trail samples the full mouse path every 3px, including
coalesced input and the latest position. It fades over 220ms, caps live pixels at
240, and resets at page/iframe boundaries, blur, visibility changes and resize.
The native cursor, touch gestures and reduced-motion support are preserved.

Each main section fills at least the current viewport and grows for longer
content. Registration uses a heading above the timeline, with vertical steps
on phones. The persistent top navigation uses browser-native smooth scrolling
and respects reduced motion; bottom previous/next controls have been removed.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

Deployed to GitHub Pages from `main`.
