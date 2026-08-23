import { email, locationLabel, locationUrl, resumeUrl, socials } from '../../data/content';
import { PillLink } from '../ui/PillLink';
import { SectionLabel } from '../ui/SectionHeader';
import styles from './Contact.module.css';

export function Contact() {
  return (
    <section id="contact" className={styles.contact}>
      <SectionLabel accent="purple" style={{ marginBottom: 16 }}>
        05 / CONTACT
      </SectionLabel>
      <h2 className={styles.heading}>Let's connect across the universe</h2>
      <p className={styles.desc}>
        Open to data, machine learning, and research opportunities — and to good conversations about
        space.
      </p>

      <a href={`mailto:${email}`} className={styles.email}>
        {email}
      </a>

      <div className={styles.meta}>
        <a
          className={styles.metaLink}
          href={locationUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          📍 {locationLabel}
        </a>
        <span className={styles.metaSep} aria-hidden="true">
          ·
        </span>
        <a
          className={styles.metaLink}
          href={resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Download résumé ↗
        </a>
      </div>

      <div className={styles.links}>
        {socials.map((link) => (
          <PillLink key={link.label} link={link} hover="purple" />
        ))}
      </div>
    </section>
  );
}
