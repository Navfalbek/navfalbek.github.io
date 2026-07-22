import { testimonials } from '../../data/content';
import { SectionHeading, SectionLabel } from '../ui/SectionHeader';
import styles from './Testimonials.module.css';

export function Testimonials() {
  return (
    <section id="testimonials" className={styles.testimonials}>
      <SectionLabel accent="cyan">04 / TESTIMONIALS — SIGNALS FROM THE CREW</SectionLabel>
      <SectionHeading>Words from collaborators</SectionHeading>

      <div className={styles.grid}>
        {testimonials.map((testimonial, i) => (
          <figure className={styles.card} key={i}>
            <span className={styles.qmark}>&ldquo;</span>
            <blockquote className={styles.quote}>{testimonial.quote}</blockquote>
            <figcaption className={styles.author}>
              <span className={styles.avatar} />
              <div>
                <div className={styles.name}>{testimonial.name}</div>
                <div className={styles.role}>{testimonial.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
