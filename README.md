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

This is the source of <https://navfalbek.uz/>, served by GitHub Pages from the
`Navfalbek/navfalbek.github.io` repository.

`.github/workflows/deploy.yml` builds on every push to `main` and publishes
`dist/` with `actions/deploy-pages`. It uses the built-in `GITHUB_TOKEN` — no
secrets to configure. The repo's Pages setting must stay on
**Build and deployment → Source: GitHub Actions**.

`public/CNAME` pins the custom domain so it survives a redeploy.

The origin is baked into four places — change all of them if the site ever moves:

| File | What |
|---|---|
| `index.html` | canonical, `og:url`, `og:image`, JSON-LD |
| `src/data/content.ts` | `siteUrl` |
| `public/sitemap.xml` | `<loc>` |
| `public/robots.txt` | `Sitemap:` |

## Notes

- `design-reference.html` is the original single-file design, kept for reference.
- Animations respect `prefers-reduced-motion` and pause while the tab is hidden.
- Fonts are self-hosted via `@fontsource-variable` — no requests to Google.
- `public/og.png` is the share card; regenerate it if the tagline changes.
