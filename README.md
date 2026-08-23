# Navfal Makhfuzullaev — Portfolio (v2)

A space-themed personal portfolio, rebuilt from a single-file design into a real,
component-based front-end project with **React + Vite + TypeScript**.

The visual result is identical to the original design — animated spiral galaxy,
warp-speed starfield, drifting nebula clouds and scroll-driven scene transitions —
but the code is now modular, typed and maintainable.

## Tech stack

- **React 18** — component model
- **Vite 6** — dev server & build
- **TypeScript** — strict mode
- **CSS Modules** — scoped styling, with design tokens in `src/styles/global.css`
- **Canvas 2D** — galaxy & starfield rendering (no animation libraries)

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build locally
```

## Project structure

```
src/
├─ main.tsx                  # entry point
├─ App.tsx                   # page composition + scroll scene wiring
├─ data/
│  └─ content.ts             # all copy/content as typed data
├─ hooks/
│  ├─ useScrollScene.ts      # scroll-driven backdrop + active section
│  ├─ useGalaxy.ts           # galaxy plate canvas animation
│  ├─ useNebula.ts           # drifting nebula plates
│  └─ useStarfield.ts        # warp-speed starfield canvas animation
├─ lib/
│  ├─ scroll.ts              # smooth-scroll helpers
│  ├─ motion.ts              # rAF driver: reduced-motion + background-tab pause
│  └─ plate.ts               # decodes the AI-generated plates to additive sprites
├─ components/
│  ├─ background/Background.tsx
│  ├─ Nav.tsx, DotRail.tsx, Footer.tsx
│  ├─ ui/                    # SectionHeader, PillLink (reusable primitives)
│  └─ sections/             # Hero, About, Resume, Portfolio, Testimonials, Contact
└─ styles/
   ├─ global.css             # tokens, reset, keyframes
   └─ primitives.css         # shared utilities (.glass)
```

## Editing content

All text — bio, resume timeline, projects, skills, testimonials, social links —
lives in [`src/data/content.ts`](src/data/content.ts). Update that file to change
what the site shows; no component edits required.

## Deployment

`.github/workflows/deploy.yml` builds on every push to `master` and publishes
`dist/` to the **`Navfalbek/navfalbek.github.io`** repo, which GitHub serves at
<https://navfalbek.github.io/>.

Before the first run, add a repo-scoped
[personal access token](https://github.com/settings/tokens) to this repository as
the secret **`PAGES_TOKEN`** (Settings → Secrets and variables → Actions). The
workflow force-replaces the contents of the `main` branch on the user-page repo,
so make sure nothing else lives there that you want to keep.

Deployment URLs are baked into `index.html` (canonical, Open Graph) and
`src/data/content.ts` (`siteUrl`). Change both if the site ever moves.

## Notes

- `design-reference.html` is the original single-file design, kept for reference.
- Animations respect `prefers-reduced-motion` and pause while the tab is hidden.
- Fonts are self-hosted via `@fontsource-variable` — no requests to Google.
- `public/og.png` is the share card; regenerate it if the tagline changes.
