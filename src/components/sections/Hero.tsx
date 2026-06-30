import { socials } from '../../data/content';
import { PillLink } from '../ui/PillLink';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="home" className={styles.hero}>
      <div className={styles.eyebrow}>// WELCOME, CREW</div>
      <h1 className={styles.title}>Navfal Makhfuzullaev</h1>
      <div className={styles.sub}>
        Data Analyst · Machine&nbsp;Learning · Space&nbsp;Enthusiast
      </div>
      <p className={styles.desc}>
        Computer Science graduate charting a course through machine learning and data — with a
        lifelong fascination for the nebulae where stars are born.
      </p>

      <div className={styles.links}>
        {socials.map((link) => (
          <PillLink key={link.label} link={link} hover="cyan" />
        ))}
      </div>

      <div className={styles.scrollHint}>
        <span className={styles.scrollHintText}>SCROLL TO BEGIN THE JOURNEY</span>
        <span className={styles.scrollArrow} />
      </div>
    </section>
  );
}
