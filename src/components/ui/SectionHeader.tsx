import { type CSSProperties } from 'react';
import styles from './SectionHeader.module.css';

type Accent = 'cyan' | 'purple' | 'pink';

const ACCENT_VARS: Record<Accent, string> = {
  cyan: 'var(--cyan)',
  purple: 'var(--purple)',
  pink: 'var(--pink)',
};

interface SectionLabelProps {
  accent: Accent;
  children: React.ReactNode;
  style?: CSSProperties;
}

/** The monospace "01 / ABOUT — …" eyebrow above each section heading. */
export function SectionLabel({ accent, children, style }: SectionLabelProps) {
  return (
    <div className={styles.label} style={{ color: ACCENT_VARS[accent], ...style }}>
      {children}
    </div>
  );
}

interface SectionHeadingProps {
  children: React.ReactNode;
  style?: CSSProperties;
}

export function SectionHeading({ children, style }: SectionHeadingProps) {
  return (
    <h2 className={styles.heading} style={style}>
      {children}
    </h2>
  );
}
