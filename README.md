# Anas Alnagar — Desktop Portfolio

My personal portfolio, designed like a computer desktop: a menu bar, desktop icons, draggable windows, a dock and a small terminal that types out who I am.

Built with **HTML, CSS and vanilla JavaScript** — no dependencies, no build step.

## Features
- Boot screen with a progress bar on the first visit (click or press any key to skip; it doesn't replay on refresh)
- Draggable windows (drag the title bar), double-click or the green button to maximize
- Dock buttons toggle their window: click to open, click again to close
- Project screenshots scroll through the full page on hover; click one to view it full size
- The letters of the name grow as the mouse gets close, and the dock magnifies like macOS
- A small cursor trail of code-style particles follows the mouse
- Desktop icons and the terminal can be dragged around
- The resume is shown inside its window with PDF.js (English / Spanish), so it's displayed instead of downloaded
- Dark theme by default, light theme on the dock button (remembered between visits)
- Animated terminal widget
- Live clock in the menu bar
- `Esc` closes the top window
- Responsive layout for mobile
- Respects `prefers-reduced-motion`, and mouse effects are off on touch screens

## Sections
| Window | What's inside |
| --- | --- |
| About | Short bio and background |
| Projects | Featured React/TypeScript apps and earlier work, with screenshots, demo and code links |
| Skills | Tools and technologies I use |
| Experience | Work history, education and certifications |
| Resume | CV in English and Spanish (PDF) |
| now.md | What I'm working on right now |
| Contact | Ways to reach me |

## Run locally
Use the VS Code Live Server extension (or any local server, e.g. `npx serve .`).
Opening `index.html` straight from the file system works too.

## Project structure
```
index.html   → content and layout
style.css    → theme colors, layout and responsive rules
script.js    → boot screen, windows, dragging, dock, theme, clock and terminal
assets/      → project screenshots, CV PDFs, certificates, tech logos, favicon
assets/vendor/pdfjs → PDF.js 3.11 (Apache-2.0), used to show the CV pages
```

## Customize
- **Colors:** edit the variables at the top of `style.css` (`--accent`, `--bg`, …). The `.light` block holds the light theme.
- **Terminal text:** edit the `terminalScript` array in `script.js`.
- **Projects / experience:** edit the matching `<section class="window">` in `index.html`.
- **CV:** replace the PDFs in `assets/cv/` keeping the same file names, then run `python3 scripts/embed-cv.py`. That refreshes `assets/cv/cv-data.js`, the embedded copy the resume window uses where browsers block reading the PDF file directly.

## Deploy on GitHub Pages
1. Push these files to the `main` branch of a public repository.
2. Go to **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Pick `main` and `/ (root)`, then save. The site will be live at `https://<username>.github.io/<repo-name>/`.
