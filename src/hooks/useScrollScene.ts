import { useEffect, useRef, useState, type RefObject } from 'react';
import { activeSectionIndex } from '../lib/scroll';

interface ScrollScene {
  /** Wrapper around the galaxy canvas — faded/zoomed as you scroll in. */
  galaxyLayerRef: RefObject<HTMLDivElement>;
  /** Wrapper around the nebula blobs — revealed as you scroll in. */
  nebulaLayerRef: RefObject<HTMLDivElement>;
  /** Thin progress bar under the nav. */
  scrollBarRef: RefObject<HTMLDivElement>;
  /** Index of the active section (drives nav + dot rail highlight). */
  activeIndex: number;
}

/**
 * Drives the scroll-reactive backdrop: the galaxy fades out and zooms past the
 * viewer while the nebula clouds bloom into view. DOM is mutated directly via
 * refs (rather than React state) so scrolling stays at 60fps; only the active
 * section index — which changes rarely — flows through state.
 */
export function useScrollScene(): ScrollScene {
  const galaxyLayerRef = useRef<HTMLDivElement>(null);
  const nebulaLayerRef = useRef<HTMLDivElement>(null);
  const scrollBarRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));

      if (scrollBarRef.current) {
        scrollBarRef.current.style.width = (p * 100).toFixed(2) + '%';
      }

      const g = Math.min(1, p / 0.34);
      if (galaxyLayerRef.current) {
        galaxyLayerRef.current.style.opacity = (1 - g * 0.95).toFixed(3);
        galaxyLayerRef.current.style.transform = `scale(${(1 + g * 3.4).toFixed(3)})`;
      }

      if (nebulaLayerRef.current) {
        nebulaLayerRef.current.style.opacity = (Math.min(1, p / 0.3) * 0.62 + p * 0.22).toFixed(3);
        nebulaLayerRef.current.style.transform = `scale(${(1 + p * 0.7).toFixed(3)})`;
      }

      setActiveIndex((prev) => {
        const next = activeSectionIndex();
        return next === prev ? prev : next;
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { galaxyLayerRef, nebulaLayerRef, scrollBarRef, activeIndex };
}
