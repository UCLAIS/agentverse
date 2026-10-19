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
Google DeepMind is the Main AI sponsor, shown prominently with the supplied white
Google DeepMind wordmark against the space background.
Jane Street is a supporting sponsor. Its supplied white SVG
wordmark sits directly on the space background. Phones use the same artwork's
compact emblem with a readable name; the emblem's SVG viewBox crops the wordmark.
NVIDIA is a supporting sponsor. Its supplied transparent PNG is framed with CSS
to remove the empty margins; phones show the emblem and a readable company name.
One remaining supporting sponsor slot awaits a name and logo.
The application section links directly to Builderbase at
`https://builderbase.com/event/agentverse/register`. Builderbase handles sign-in
and the application/dashboard flow. No API integration is needed for this link.

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
