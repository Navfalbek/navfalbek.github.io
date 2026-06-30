import { Background } from './components/background/Background';
import { Nav } from './components/Nav';
import { DotRail } from './components/DotRail';
import { Footer } from './components/Footer';
import { Hero } from './components/sections/Hero';
import { About } from './components/sections/About';
import { Resume } from './components/sections/Resume';
import { Portfolio } from './components/sections/Portfolio';
import { Testimonials } from './components/sections/Testimonials';
import { Contact } from './components/sections/Contact';
import { useScrollScene } from './hooks/useScrollScene';
import styles from './App.module.css';

export default function App() {
  const { galaxyLayerRef, nebulaLayerRef, scrollBarRef, activeIndex } = useScrollScene();

  return (
    <div className={styles.wrapper}>
      <Background galaxyLayerRef={galaxyLayerRef} nebulaLayerRef={nebulaLayerRef} />

      <Nav activeIndex={activeIndex} scrollBarRef={scrollBarRef} />
      <DotRail activeIndex={activeIndex} />

      <main>
        <Hero />
        <About />
        <Resume />
        <Portfolio />
        <Testimonials />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
