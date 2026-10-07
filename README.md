# Alima Bazenova — portfolio website

Static site (HTML + CSS + JS, no build step).

## Run locally

```bash
cd "CV - portfolio/website"
python3 -m http.server 8000
```

Open http://localhost:8000

## Files

- `index.html`: all content. Project "case files" are the `<template id="case-…">` blocks at the bottom.
- `styles.css`: design tokens at the top (`--accent` is the blue highlight colour).
- `main.js`: badge drop/swing physics, scroll reveal, case-file dialog.
- `assets/img`, `assets/video`, `assets/docs`: optimised copies of figures, demos and the CV.

To add a project: copy one `<button class="folder">` in the archive section and one `<template id="case-…">`, with matching `data-case`.

## Deploy

Upload the whole `website/` folder to any static host (Nginx/Apache server, GitHub Pages, Netlify, Vercel, Cloudflare Pages).
Deep links work: `/#case-pollen`, `/#case-ct`, `/#case-safecam`, `/#case-passport`.
