import { facts } from '../../data/content';
import { SectionHeading, SectionLabel } from '../ui/SectionHeader';
import styles from './About.module.css';

export function About() {
  return (
    <section id="about" className={styles.about}>
      <SectionLabel accent="cyan">01 / ABOUT — ENTERING THE NEBULA</SectionLabel>
      <SectionHeading style={{ marginBottom: 36 }}>Where the stars are born</SectionHeading>

      <div className={styles.grid}>
        <div className={`glass ${styles.bio}`}>
          <p>
            Hello, crew. I'm <strong>Navfal Makhfuzullaev</strong> — a Computer Science graduate
            from Inha University in Tashkent, drawn to the physics of space and to nebulae, the
            clouds of gas where stars first take shape.
          </p>
          <p>
            My work lives at the intersection of machine learning, data, and a long-running
            curiosity about quantum computing. I'm an open, outward-looking person — always ready
            for the next journey — and when I step away from the keyboard you'll usually find me at
            a piano or a violin.
          </p>
        </div>

        <div className={styles.facts}>
          {facts.map((fact) => (
            <div className={styles.fact} key={fact.label}>
              <div className={styles.factLabel}>{fact.label}</div>
              <div className={styles.factValue}>{fact.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
