import { education, experience, skills, tools, type TimelineEntry } from '../../data/content';
import { SectionHeading, SectionLabel } from '../ui/SectionHeader';
import styles from './Resume.module.css';

type Accent = 'blue' | 'purple';

function TimelineItem({ entry, accent }: { entry: TimelineEntry; accent: Accent }) {
  return (
    <div className={`${styles.item} ${styles[accent]}`}>
      <span className={`${styles.itemDot} ${styles[accent]}`} />
      <div className={styles.date}>{entry.date}</div>
      <div className={styles.title}>{entry.title}</div>
      <div className={styles.org}>{entry.org}</div>
      {entry.detail && <div className={styles.detail}>{entry.detail}</div>}
      {entry.points && (
        <ul className={styles.points}>
          {entry.points.map((point) => (
            <li className={styles.point} key={point}>
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Resume() {
  return (
    <section id="resume" className={styles.resume}>
      <SectionLabel accent="purple">02 / RESUME — DEEPER INTO THE CLOUD</SectionLabel>
      <SectionHeading style={{ marginBottom: 44 }}>Trajectory</SectionHeading>

      <div className={styles.grid}>
        <div>
          <h3 className={`${styles.colTitle} ${styles.blue}`}>Education</h3>
          {education.map((entry) => (
            <TimelineItem key={entry.title} entry={entry} accent="blue" />
          ))}
        </div>

        <div>
          <h3 className={`${styles.colTitle} ${styles.purple}`}>Experience</h3>
          {experience.map((entry) => (
            <TimelineItem key={entry.title} entry={entry} accent="purple" />
          ))}
        </div>
      </div>

      <h3 className={styles.skillsHeading}>Skills &amp; Tools</h3>
      <div className={styles.tags}>
        {skills.map((skill) => (
          <span className={`${styles.tag} ${styles.skill}`} key={skill}>
            {skill}
          </span>
        ))}
      </div>
      <div className={styles.tags}>
        {tools.map((tool) => (
          <span className={`${styles.tag} ${styles.tool}`} key={tool}>
            {tool}
          </span>
        ))}
      </div>
    </section>
  );
}
