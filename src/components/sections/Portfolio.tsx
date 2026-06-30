import { projects, type Project } from '../../data/content';
import { SectionHeading, SectionLabel } from '../ui/SectionHeader';
import styles from './Portfolio.module.css';

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className={styles.card} tabIndex={0}>
      <div className={styles.cardBg}>
        <span>PROJECT SCREENSHOT</span>
      </div>
      <div className={styles.foot}>
        <span className={styles.name}>{project.name}</span>
        <span className={styles.tag}>{project.shortTag}</span>
      </div>
      <div className={styles.overlay}>
        <span className={styles.overlayName}>{project.name}</span>
        <span className={styles.overlayDesc}>{project.description}</span>
        <span className={styles.overlayTag}>{project.shortTag}</span>
      </div>
    </article>
  );
}

export function Portfolio() {
  return (
    <section id="portfolio" className={styles.portfolio}>
      <SectionLabel accent="pink">03 / PORTFOLIO — INSIDE THE GASES</SectionLabel>
      <SectionHeading>Things I've built</SectionHeading>
      <p className={styles.note}>Hover a card to reveal the mission log.</p>

      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </section>
  );
}
