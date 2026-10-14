import { useRef, type RefObject } from 'react';
import { useGalaxy } from '../../hooks/useGalaxy';
import { useStarfield } from '../../hooks/useStarfield';
import styles from './Background.module.css';

interface BackgroundProps {
  galaxyLayerRef: RefObject<HTMLDivElement>;
}

/**
 * The full-viewport cosmic backdrop: the 3D galaxy, warp-speed starfield and a
 * vignette. The galaxy layer wrapper is driven by `useScrollScene` (in App)
 * through the forwarded ref.
 */
export function Background({ galaxyLayerRef }: BackgroundProps) {
  const galaxyCanvasRef = useRef<HTMLCanvasElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);

  useGalaxy(galaxyCanvasRef);
  useStarfield(starCanvasRef);

  return (
    <>
      <div className={styles.galaxyLayer} ref={galaxyLayerRef}>
        <canvas className={styles.galaxyCanvas} ref={galaxyCanvasRef} />
      </div>

      <canvas className={styles.starCanvas} ref={starCanvasRef} />
      <div className={styles.vignette} />
    </>
  );
}
