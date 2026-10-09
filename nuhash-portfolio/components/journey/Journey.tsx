'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { hero, intro, mysteryLines, site } from '@/lib/content';
import { T, JOURNEY_VH } from '@/lib/timeline';
import { live, ui, useStore } from '@/lib/state';
import { audio } from '@/lib/audio';
import { isLowPower, prefersReducedMotion, supportsWebGL2 } from '@/lib/device';

const JourneyScene = dynamic(() => import('./JourneyScene'), { ssr: false });

const dur = (r: readonly [number, number]) => r[1] - r[0];

export default function Journey() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);
  const [mode, setMode] = useState<{ webgl: boolean; low: boolean; reduced: boolean }>({
    webgl: true,
    low: false,
    reduced: false,
  });
  const loaded = useStore(ui, (s) => s.loaded);

  // decide WebGL / light / reduced once on the client
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const webgl = supportsWebGL2() && !reduced;
    const low = isLowPower();
    live.reducedMotion = reduced;
    live.lowPower = low;
    ui.set({ webgl });
    setMode({ webgl, low, reduced });
  }, []);

  // only render the canvas while the journey is on screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '0px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // scroll timeline for every DOM piece of the journey
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(el);
    const fired = new Set<number>();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            live.journey = self.progress;
            // audio cues, fired once each time you scroll forward past a line
            T.lines.forEach(([a], i) => {
              if (self.progress >= a && self.direction > 0 && !fired.has(i)) {
                fired.add(i);
                audio.cue(i);
              }
              if (self.progress < a - 0.02) fired.delete(i);
            });
          },
        },
      });

      // Hero
      tl.to(q('.hero__first'), { xPercent: -70, opacity: 0.0, duration: dur(T.nameSplit) }, T.nameSplit[0]);
      tl.to(q('.hero__last'), { xPercent: 70, opacity: 0.0, duration: dur(T.nameSplit) }, T.nameSplit[0]);
      tl.to(q('.hero__fade'), { opacity: 0, y: -30, duration: dur(T.heroOut) }, T.heroOut[0]);
      tl.to(q('.hero__portrait'), { opacity: 0, scale: 0.85, filter: 'blur(8px)', duration: dur(T.heroOut) }, T.heroOut[0]);
      tl.to(q('.hero__hint'), { opacity: 0, duration: 0.03 }, 0.01);

      // Intro
      tl.fromTo(
        q('.intro'),
        { autoAlpha: 0, y: 60 },
        { autoAlpha: 1, y: 0, duration: dur(T.introIn), ease: 'power2.out' },
        T.introIn[0],
      );
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

      // Mystery lines
      q('.mystery__line').forEach((line, i) => {
        const [a, b] = T.lines[i] ?? T.lines[T.lines.length - 1];
        const len = b - a;
        tl.fromTo(
          line,
          { autoAlpha: 0, filter: 'blur(14px)', letterSpacing: '0.2em' },
          { autoAlpha: 1, filter: 'blur(0px)', letterSpacing: '0em', duration: len * 0.35 },
          a,
        );
        tl.to(line, { autoAlpha: 0, filter: 'blur(10px)', duration: len * 0.3 }, b - len * 0.3);
      });

      // Into the white
      tl.fromTo(q('.whiteout'), { opacity: 0 }, { opacity: 1, duration: dur(T.whiteout) }, T.whiteout[0]);
      tl.set({}, {}, 1);
    }, el);

    return () => ctx.revert();
  }, []);

  // hero entrance after the shutter opens
  useEffect(() => {
    if (!loaded || !sectionRef.current) return;
    const q = gsap.utils.selector(sectionRef.current);
    gsap.fromTo(
      q('.hero__name-inner'),
      { yPercent: 110 },
      { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12, delay: 0.15 },
    );
    gsap.fromTo(q('.hero__enter'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, delay: 0.5 });
  }, [loaded]);

  const vh = mode.reduced ? JOURNEY_VH.reduced : mode.low ? JOURNEY_VH.mobile : JOURNEY_VH.desktop;
  const introWords = intro.body.split(' ');

  return (
    <section
      ref={sectionRef}
      id="journey"
      className={`journey ${mode.webgl ? '' : 'journey--static'}`}
      style={{ height: `${vh}vh` }}
      aria-label="Introduction"
    >
      {mode.webgl && (
        <div className="journey__canvas" style={{ visibility: active ? 'visible' : 'hidden' }}>
          <JourneyScene active={active} lowPower={mode.low} />
        </div>
      )}

      <div className="journey__sticky">
        {/* 01 — Hero */}
        <header className="hero" data-section="hero">
          <p className="hero__eyebrow hero__fade hero__enter">
            {hero.eyebrow} <em>{hero.eyebrowItalic}</em> {hero.eyebrowRest}
          </p>

          <h1 className="hero__name">
            <span className="hero__first">
              <span className="hero__name-inner">{site.firstName}</span>
            </span>
            <span className="hero__last">
              <span className="hero__name-inner">{site.lastName}</span>
            </span>
            <span className="sr-only"> — {hero.tagline}</span>
          </h1>

          {/* TODO: replace with your portrait: <Image src="/images/portrait.jpg" ... /> */}
          <figure className="hero__portrait hero__enter" aria-label="Portrait of Nuhash Jobayed">
            <div className="placeholder placeholder--portrait">
              <span>Portrait</span>
            </div>
          </figure>

          <div className="hero__bar hero__fade hero__enter">
            <span className="hero__tag">{hero.tagline}</span>
            <span className="hero__links">
              {site.socials.slice(0, 3).map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" data-cursor>
                  {s.label}
                </a>
              ))}
            </span>
            <span className="hero__hint">↓ {hero.scrollHint}</span>
          </div>
        </header>

        {/* 02 — Intro (your story) */}
        <article className="intro" id="intro" data-section="intro">
          {/* TODO: replace with your photo */}
          <figure className="intro__photo">
            <div className="placeholder placeholder--photo">
              <span>Your photo</span>
            </div>
            <figcaption>{site.city}, {site.country}</figcaption>
          </figure>
          <div className="intro__text">
            <p className="label">{intro.label}</p>
            <h2 className="intro__heading">{intro.heading}</h2>
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
          {mysteryLines.map((l, i) => (
            <p className="mystery__line" key={i}>
              {l}
            </p>
          ))}
        </div>

        <div className="whiteout" aria-hidden />
      </div>
    </section>
  );
}
