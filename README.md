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
│  ├─ useGalaxy.ts           # spiral galaxy canvas animation
│  └─ useStarfield.ts        # warp-speed starfield canvas animation
├─ lib/
│  └─ scroll.ts              # smooth-scroll helpers
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

## Notes

- `design-reference.html` is the original single-file design, kept for reference.
- Animations respect `prefers-reduced-motion`.
