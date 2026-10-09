'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { hero, intro, poeticLines, site } from '@/lib/content';
import { T, JOURNEY_VH } from '@/lib/timeline';
import { live, ui, useStore } from '@/lib/state';
import { audio } from '@/lib/audio';
import { isLowPower, prefersReducedMotion, supportsWebGL2 } from '@/lib/device';
import HeroVideo from './HeroVideo';

const JourneyScene = dynamic(() => import('./JourneyScene'), { ssr: false });

const dur = (r: readonly [number, number]) => r[1] - r[0];

/** Split a line around its key word: [before, key, after]. */
function splitKey(text: string, key: string): [string, string, string] {
  const i = text.toLowerCase().indexOf(key.toLowerCase());
  if (i < 0) return [text, '', ''];
  return [text.slice(0, i), text.slice(i, i + key.length), text.slice(i + key.length)];
}

export default function Journey() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);
  const [mode, setMode] = useState({ webgl: true, low: false, reduced: false });
  const loaded = useStore(ui, (s) => s.loaded);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const webgl = supportsWebGL2() && !reduced;
    const low = isLowPower();
    live.reducedMotion = reduced;
    live.lowPower = low;
    ui.set({ webgl });
    setMode({ webgl, low, reduced });
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(el);

    // one-shot sounds, fired when scrolling forward past a point
    const once = new Set<string>();
    const fire = (id: string, at: number, p: number, dir: number, fn: () => void) => {
      if (p >= at && dir > 0 && !once.has(id)) {
        once.add(id);
        fn();
      }
      if (p < at - 0.02) once.delete(id);
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2, // a little lag → softer motion
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            live.journey = self.progress;
            const p = self.progress;
            const d = self.direction;
            fire('boom', T.explode, p, d, () => audio.boom());
            fire('burn', T.dissolve[0], p, d, () => audio.whoosh(2.4));
            T.lines.forEach(([a], i) => fire(`line${i}`, a, p, d, () => audio.cue(i)));
            fire('riser', T.riser, p, d, () => audio.riser(5));
          },
        },
      });

      // Hero
      tl.to(q('.hero__first'), { xPercent: -70, opacity: 0, duration: dur(T.nameSplit) }, T.nameSplit[0]);
      tl.to(q('.hero__last'), { xPercent: 70, opacity: 0, duration: dur(T.nameSplit) }, T.nameSplit[0]);
      tl.to(q('.hero__fade'), { opacity: 0, y: -30, duration: dur(T.heroOut) }, T.heroOut[0]);
      tl.to(q('.hero__video'), { opacity: 0, scale: 0.85, filter: 'blur(8px)', duration: dur(T.heroOut) }, T.heroOut[0]);

      // Intro
      tl.fromTo(q('.intro'), { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: dur(T.introIn), ease: 'power2.out' }, T.introIn[0]);
      const words = q('.intro__word');
      tl.fromTo(
        words,
        { opacity: 0.06, filter: 'blur(12px)', y: 8 },
        {
          opacity: 1,
          filter: 'blur(0px)',
          y: 0,
          duration: dur(T.introWords) * 0.35,
          stagger: (dur(T.introWords) * 0.65) / Math.max(1, words.length),
        },
        T.introWords[0],
      );
      tl.to(q('.intro'), { autoAlpha: 0, y: -60, filter: 'blur(10px)', duration: dur(T.introOut) }, T.introOut[0]);

      // River lines: the line appears, the rest fades, the red key word drops into the phrase
      q('.mystery__line').forEach((line: HTMLElement, i: number) => {
        const [a, b] = T.lines[i];
        const len = b - a;
        const rest = line.querySelectorAll('.mystery__rest');
        const key = line.querySelector('.mystery__key');
        const slot = q(`.collect__word--${i}`)[0];
        tl.fromTo(line, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, a);
        tl.fromTo(
          line.querySelectorAll('.mystery__rest, .mystery__key'),
          { opacity: 0, filter: 'blur(14px)', y: 14 },
          { opacity: 1, filter: 'blur(0px)', y: 0, duration: len * 0.3, stagger: len * 0.04 },
          a,
        );
        tl.to(rest, { opacity: 0, filter: 'blur(10px)', duration: len * 0.22 }, a + len * 0.55);
        if (key && slot) {
          // the key word travels to its place in the phrase
          tl.to(key, {
            x: () => slot.getBoundingClientRect().left - key.getBoundingClientRect().left + (gsap.getProperty(key, 'x') as number),
            y: () => slot.getBoundingClientRect().top - key.getBoundingClientRect().top + (gsap.getProperty(key, 'y') as number),
            scale: 0.42,
            duration: len * 0.2,
            ease: 'power2.inOut',
          }, a + len * 0.74);
          tl.to(key, { opacity: 0, duration: 0.004 }, b - 0.002);
          tl.fromTo(slot, { opacity: 0 }, { opacity: 1, duration: 0.004 }, b - 0.004);
        }
      });
      tl.to(q('.collect'), { opacity: 0, filter: 'blur(8px)', y: 20, duration: dur(T.collectOut) }, T.collectOut[0]);

      // Into the white
      tl.fromTo(q('.whiteout'), { opacity: 0 }, { opacity: 1, duration: dur(T.whiteout) }, T.whiteout[0]);
      tl.set({}, {}, 1);
    }, el);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!loaded || !sectionRef.current) return;
    const q = gsap.utils.selector(sectionRef.current);
    gsap.fromTo(q('.hero__name-inner'), { yPercent: 110 }, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12, delay: 0.15 });
    gsap.fromTo(q('.hero__enter'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, delay: 0.5 });
  }, [loaded]);

  const vh = mode.reduced ? JOURNEY_VH.reduced : mode.low ? JOURNEY_VH.mobile : JOURNEY_VH.desktop;
  const introWords = intro.body.split(' ');

  return (
    <section ref={sectionRef} id="journey" className={`journey ${mode.webgl ? '' : 'journey--static'}`} style={{ height: `${vh}vh` }} aria-label="Introduction">
      {mode.webgl && (
        <div className="journey__canvas" style={{ visibility: active ? 'visible' : 'hidden' }}>
          <JourneyScene active={active} lowPower={mode.low} />
        </div>
      )}

      <div className="journey__sticky">
        {/* 01 — Hero */}
        <header className="hero" data-section="hero">
          <h1 className="hero__name" data-liquid>
            <span className="hero__first">
              <span className="hero__name-inner">{site.firstName}</span>
            </span>
            <span className="hero__last">
              <span className="hero__name-inner">{site.lastName}</span>
            </span>
            <span className="sr-only"> — {hero.tagline}</span>
          </h1>

          <HeroVideo />

          <div className="hero__bar hero__fade hero__enter">
            <span className="hero__tag">{hero.tagline}</span>
            <span className="hero__links">
              {site.socials.slice(0, 3).map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="disperse" data-cursor>
                  {s.label}
                </a>
              ))}
            </span>
          </div>
        </header>

        {/* 02 — Intro (your story) */}
        <article className="intro" id="intro" data-section="intro">
          {/* TODO: replace with your photo */}
          <figure className="intro__photo" data-liquid>
            <div className="placeholder placeholder--photo">
              <span>Your photo</span>
            </div>
            <figcaption>
              {site.city}, {site.country}
            </figcaption>
          </figure>
          <div className="intro__text">
            <p className="label">{intro.label}</p>
            <h2 className="intro__heading" data-liquid>
              {intro.heading}
            </h2>
            <p className="intro__body">
              {introWords.map((w, i) => (
                <span className="intro__word" key={i}>
                  {w}{' '}
                </span>
              ))}
            </p>
            <dl className="intro__facts">
              {intro.facts.map((f) => (
                <div key={f.k}>
                  <dt>{f.k}</dt>
                  <dd>{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>

        {/* 03 — Into the dark */}
        <div className="mystery" data-section="dark">
          {poeticLines.map((l: { text: string; key: string }, i: number) => {
            const [before, key, after] = splitKey(l.text, l.key);
            return (
              <p className="mystery__line" key={i}>
                <span className="mystery__rest">{before}</span>
                <span className="mystery__key">{key}</span>
                <span className="mystery__rest">{after}</span>
              </p>
            );
          })}
          <p className="collect" aria-hidden>
            {poeticLines.map((l: { text: string; key: string }, i: number) => (
              <span key={i} className={`collect__word collect__word--${i}`}>
                {l.key}
              </span>
            ))}
          </p>
        </div>

        <div className="whiteout" aria-hidden />
      </div>
    </section>
  );
}