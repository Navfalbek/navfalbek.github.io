import { sections } from '../data/content';

const NAV_OFFSET_FALLBACK = 62;

/** Height of the fixed nav, read from `--nav-h` so the two can't drift apart. */
function navOffset(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : NAV_OFFSET_FALLBACK;
}

/** Smooth-scroll to a section by id, accounting for the fixed nav height. */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - navOffset();
  window.scrollTo({ top, behavior: 'smooth' });
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Returns the index of the section currently considered "active", or -1. */
export function activeSectionIndex(): number {
  let active = -1;
  for (let i = 0; i < sections.length; i++) {
    const el = document.getElementById(sections[i].id);
    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.42) {
      active = i;
    }
  }
  return active;
}
