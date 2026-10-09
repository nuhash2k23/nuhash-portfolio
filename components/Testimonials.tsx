'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { places, reviews, words } from '@/lib/content';
import { ui, useStore } from '@/lib/state';
import type { GlobeAnim } from '@/components/globe/Globe';

const Globe = dynamic(() => import('@/components/globe/Globe'), { ssr: false });

type Bubble = { id: number; place: string; text: string };

/** Show land as ASCII glyphs (true) or plain dots (false). */
const ASCII = true;

export default function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const anim = useRef<GlobeAnim>({ reveal: 0, markers: 0, arcs: 0, spin: 0, theme: 0 });
  const focus = useRef<string | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [live, setLive] = useState(false);
  const [active, setActive] = useState(false);
  const webgl = useStore(ui, (s) => s.webgl);

  const home = places.find((p) => p.home)!;
  const others = places.filter((p) => !p.home);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    io.observe(el);
    const a = anim.current;
    const ctx = gsap.context(() => {
      // white → black as you scroll in (the globe's glyphs follow via anim.theme)
      gsap.fromTo(
        el,
        { '--bg': '#f6f4f0', '--fg': '#0b0908' },
        {
          '--bg': '#0b0908',
          '--fg': '#f6f4f0',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'top top', scrub: true, onUpdate: (s) => (a.theme = s.progress) },
        },
      );

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate: (self) => setLive(self.progress > 0.45),
        },
      });
      tl.fromTo('.words__head > *', { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.1 }, 0.02);
      // the globe slowly turns with the scroll
      tl.fromTo(a, { spin: 0 }, { spin: 1, duration: 1 }, 0);
      // Dhaka lights up first, then the land is revealed outward from it
      tl.fromTo(a, { markers: 0 }, { markers: 0.1, duration: 0.06 }, 0.06);
      tl.fromTo(a, { reveal: 0 }, { reveal: Math.PI + 0.3, duration: 0.3, ease: 'power2.in' }, 0.1);
      tl.to(a, { markers: 1, duration: 0.16 }, 0.22);
      tl.fromTo(a, { arcs: 0 }, { arcs: 1, duration: 0.2 }, 0.26);
      tl.set({}, {}, 1);
    }, el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, []);

  // reviews appear one by one; the globe turns to face each country
  useEffect(() => {
    if (!live) {
      setBubbles([]);
      focus.current = null;
      return;
    }
    let id = 0;
    let i = Math.floor(Math.random() * reviews.length);
    const spawn = () => {
      const r = reviews[i++ % reviews.length];
      const place = places.find((p) => p.name === r.country);
      if (!place) return;
      const b: Bubble = { id: ++id, place: place.name, text: r.text };
      focus.current = place.name;
      setBubbles((prev) => [...prev.filter((p) => p.place !== b.place).slice(-1), b]);
      window.setTimeout(() => setBubbles((prev) => prev.filter((p) => p.id !== b.id)), 5600);
    };
    spawn();
    const iv = window.setInterval(spawn, 4200);
    return () => window.clearInterval(iv);
  }, [live]);

  return (
    <section ref={ref} id="words" className="words" aria-labelledby="words-title" data-section="words">
      <div className="words__sticky">
        <header className="words__head">
          <p className="label">{words.label}</p>
          <h2 id="words-title" data-liquid>
            {words.heading}
          </h2>
          <p className="words__sub">{words.sub}</p>
        </header>

        <div className="globe">
          {webgl ? (
            <Globe places={places} anim={anim} focus={focus} overlay={overlay} ascii={ASCII} active={active} />
          ) : (
            <ul className="globe__fallback">
              {others.map((p) => (
                <li key={p.name}>{p.name}</li>
              ))}
            </ul>
          )}

          {/* DOM layer: everything with data-anchor is pinned to its marker by the globe */}
          <div ref={overlay} className="globe__overlay" aria-live="polite">
            <span className="globe__label globe__label--home" data-anchor={home.name}>
              DHAKA — HOME
            </span>
            <span className="globe__label" data-anchor="@hover" />
            {bubbles.map((b) => (
              <figure key={b.id} className="bubble" data-anchor={b.place} style={{ opacity: 0 }}>
                <div className="bubble__inner">
                  <blockquote>“{b.text}”</blockquote>
                  <figcaption>— Client, {b.place}</figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </div>

      <ul className="sr-only">
        {reviews.map((r, i) => (
          <li key={i}>
            “{r.text}” — client in {r.country}
          </li>
        ))}
      </ul>
    </section>
  );
}
