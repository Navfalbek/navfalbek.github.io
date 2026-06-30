import { type RefObject } from 'react';
import { sections } from '../data/content';
import { scrollToSection, scrollToTop } from '../lib/scroll';
import styles from './Nav.module.css';

interface NavProps {
  activeIndex: number;
  scrollBarRef: RefObject<HTMLDivElement>;
}

export function Nav({ activeIndex, scrollBarRef }: NavProps) {
  return (
    <nav className={styles.nav}>
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
            onClick={() => scrollToSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className={styles.scrollBar} ref={scrollBarRef} />
    </nav>
  );
}
