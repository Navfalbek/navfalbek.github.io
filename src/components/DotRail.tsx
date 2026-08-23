import { sections } from '../data/content';
import { scrollToSection } from '../lib/scroll';
import styles from './DotRail.module.css';

interface DotRailProps {
  activeIndex: number;
}

export function DotRail({ activeIndex }: DotRailProps) {
  return (
    <nav className={styles.rail} aria-label="Section">
      {sections.map((section, i) => (
        <button
          key={section.id}
          className={`${styles.dot} ${i === activeIndex ? styles.active : ''}`}
          title={section.label}
          aria-label={section.label}
          aria-current={i === activeIndex ? 'true' : undefined}
          onClick={() => scrollToSection(section.id)}
        />
      ))}
    </nav>
  );
}
