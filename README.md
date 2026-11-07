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
the hero, sponsors, participant timetable and footer.

The 1200×630 social-sharing image, `assets/og-image-2026.jpg`, uses the same
designer wordmark, pixel duck, cyan planet and violet artwork. Open Graph and
Twitter metadata share this versioned URL so previews can fetch the current design.

The participant timetable covers 7-8 November 2026, from Saturday check-in
at 09:00 to Sunday's closing ceremony and awards at 16:00-17:00.
All 15 entries are transcribed from `assets/participant-timetable.pdf`, also
available to download from the page. All times are London time.
All seven sponsors share one grid with equal billing: Canva, Encode Club,
Google DeepMind, Jane Street, Modal, NVIDIA and Redberry. Optical sizing balances
the different logo proportions. CSS renders Redberry and Encode Club in white
using the original transparent assets, without light background panels.
Five participant FAQs use native details and summary controls that work with
keyboard, touch and without JavaScript. The section
fills at least the viewport and grows as answers open. Questions go to
`info@uclai.co.uk` throughout the page.

Effect settings (star count, toggles) live in the `CONFIG` object at the top of `main.js`.
The crisp pixel cursor trail samples the full mouse path every 3px, including
coalesced input and the latest position. It fades over 220ms, caps live pixels at
240, and resets at page/iframe boundaries, blur, visibility changes and resize.
The native cursor, touch gestures and reduced-motion support are preserved.

Each main section fills at least the current viewport and grows for longer
content. The timetable snakes across three columns on desktop and follows a winding
vertical path on smaller screens. Key moments and deadlines have cyan highlights.
A ResizeObserver keeps the path aligned with the stops when copy wraps or the
viewport changes; all event text remains accessible without JavaScript. The persistent top navigation uses browser-native smooth scrolling
and respects reduced motion; bottom previous/next controls have been removed.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

Deployed to GitHub Pages from `main`.
