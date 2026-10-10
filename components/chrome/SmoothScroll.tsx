'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis, setLenis } from '@/lib/scroll';
import { live, ui } from '@/lib/state';

/**
 * Lenis smooth scroll wired into GSAP's ticker.
 * On the homepage scroll stays locked until the loader opens; other pages start unlocked.
 */
export default function SmoothScroll() {
  const path = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    ui.set({ webgl: true });
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    const lenis = new Lenis({ duration: 1.35, smoothWheel: true, wheelMultiplier: 0.85 });
    setLenis(lenis);
    lenis.on('scroll', (l: Lenis) => {
      ScrollTrigger.update();
      const max = document.documentElement.scrollHeight - window.innerHeight;
      live.scroll = max > 0 ? l.scroll / max : 0;
    });
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // per page: lock behind the loader on home, unlock elsewhere
  useEffect(() => {
    window.scrollTo(0, 0);
    const l = getLenis();
    if (path !== '/') {
      ui.set({ loaded: true, inDark: false });
      l?.start();
      ScrollTrigger.refresh();
      return;
    }
    if (ui.get().loaded) {
      l?.start();
      return;
    }
    l?.stop();
    let started = false;
    const unsub = ui.subscribe(() => {
      if (ui.get().loaded && !started) {
        started = true;
        l?.start();
        ScrollTrigger.refresh();
      }
    });
    return () => {
      unsub();
    };
  }, [path]);

  return null;
}