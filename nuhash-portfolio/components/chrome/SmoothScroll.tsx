'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setLenis } from '@/lib/scroll';
import { live, ui } from '@/lib/state';

/** Lenis smooth scroll wired into GSAP's ticker. Scroll is locked until the loader opens. */
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const lenis = new Lenis({ duration: 1.25, smoothWheel: true, wheelMultiplier: 0.9 });
    setLenis(lenis);
    lenis.stop();
    lenis.on('scroll', (l: Lenis) => {
      ScrollTrigger.update();
      const max = document.documentElement.scrollHeight - window.innerHeight;
      live.scroll = max > 0 ? l.scroll / max : 0;
    });
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    let started = false;
    const unsub = ui.subscribe(() => {
      if (ui.get().loaded && !started) {
        started = true;
        lenis.start();
        ScrollTrigger.refresh();
      }
    });
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);

    return () => {
      unsub();
      window.removeEventListener('resize', onResize);
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}
