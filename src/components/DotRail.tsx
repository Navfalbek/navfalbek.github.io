import { sections } from '../data/content';
import { scrollToSection } from '../lib/scroll';
import styles from './DotRail.module.css';

interface DotRailProps {
  activeIndex: number;
}

export function DotRail({ activeIndex }: DotRailProps) {
  return (
    <div className={styles.rail}>
      {sections.map((section, i) => (
        <button
          key={section.id}
          className={`${styles.dot} ${i === activeIndex ? styles.active : ''}`}
          title={section.label}
          aria-label={section.label}
          onClick={() => scrollToSection(section.id)}
        />
      ))}
    </div>
  );
}
