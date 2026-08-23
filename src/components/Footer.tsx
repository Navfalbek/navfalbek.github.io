import { scrollToTop } from '../lib/scroll';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <span className={styles.dot} />
        <span className={styles.label}>Navfal's Nebula · END OF TRANSMISSION</span>
      </div>
      <span className={styles.copy}>
        &copy; {new Date().getFullYear()} Navfal Makhfuzullaev — built among the stars
      </span>
      <button className={styles.btn} onClick={scrollToTop}>
        ↑ BACK TO ORBIT
      </button>
    </footer>
  );
}
