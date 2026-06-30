import type { SocialLink } from '../../data/content';
import styles from './PillLink.module.css';

interface PillLinkProps {
  link: SocialLink;
  hover?: 'cyan' | 'purple';
}

export function PillLink({ link, hover = 'cyan' }: PillLinkProps) {
  return (
    <a
      className={`${styles.pill} ${styles[hover]}`}
      href={link.href}
      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </a>
  );
}
