import { useEffect, useRef, useState, type RefObject } from 'react';
import { sections } from '../data/content';
import { scrollToSection, scrollToTop } from '../lib/scroll';
import styles from './Nav.module.css';

interface NavProps {
  activeIndex: number;
  scrollBarRef: RefObject<HTMLDivElement>;
}

export function Nav({ activeIndex, scrollBarRef }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the mobile panel on Escape, on an outside tap, and once the viewport
  // grows past the breakpoint where the inline links come back.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 769px)');
    const onDesktop = () => setMenuOpen(false);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    desktop.addEventListener('change', onDesktop);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      desktop.removeEventListener('change', onDesktop);
    };
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <nav className={styles.nav} aria-label="Main">
      <button className={styles.logo} onClick={scrollToTop} aria-label="Back to top">
        <span className={styles.dot} />
        <span className={styles.wordmark}>
          NAVFAL<em>.M</em>
        </span>
      </button>

      <div className={styles.links}>
        {sections.map((section, i) => (
          <button
            key={section.id}
            className={`${styles.btn} ${i === activeIndex ? styles.active : ''}`}
            aria-current={i === activeIndex ? 'true' : undefined}
            onClick={() => scrollToSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <button
        ref={toggleRef}
        className={`${styles.toggle} ${menuOpen ? styles.toggleOpen : ''}`}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </button>

      <div
        id="mobile-menu"
        ref={panelRef}
        className={`${styles.panel} ${menuOpen ? styles.panelOpen : ''}`}
        hidden={!menuOpen}
      >
        {sections.map((section, i) => (
          <button
            key={section.id}
            className={`${styles.panelBtn} ${i === activeIndex ? styles.active : ''}`}
            aria-current={i === activeIndex ? 'true' : undefined}
            onClick={() => go(section.id)}
          >
            <span className={styles.panelIndex}>{String(i + 1).padStart(2, '0')}</span>
            {section.label}
          </button>
        ))}
      </div>

      <div className={styles.scrollBar} ref={scrollBarRef} />
    </nav>
  );
}
