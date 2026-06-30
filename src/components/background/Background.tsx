import { useRef, type RefObject } from 'react';
import { useGalaxy } from '../../hooks/useGalaxy';
import { useStarfield } from '../../hooks/useStarfield';
import styles from './Background.module.css';

interface BackgroundProps {
  galaxyLayerRef: RefObject<HTMLDivElement>;
  nebulaLayerRef: RefObject<HTMLDivElement>;
}

/**
 * The full-viewport cosmic backdrop: animated galaxy, nebula blobs, warp-speed
 * starfield and a vignette. The two layer wrappers are driven by `useScrollScene`
 * (in App) through the forwarded refs.
 */
export function Background({ galaxyLayerRef, nebulaLayerRef }: BackgroundProps) {
  const galaxyCanvasRef = useRef<HTMLCanvasElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);

  useGalaxy(galaxyCanvasRef);
  useStarfield(starCanvasRef);

  return (
    <>
      <div className={styles.galaxyLayer} ref={galaxyLayerRef}>
        <canvas className={styles.galaxyCanvas} ref={galaxyCanvasRef} />
      </div>

      <div className={styles.nebulaLayer} ref={nebulaLayerRef}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
        <div className={`${styles.blob} ${styles.blob4}`} />
      </div>

      <canvas className={styles.starCanvas} ref={starCanvasRef} />
      <div className={styles.vignette} />
    </>
  );
}
