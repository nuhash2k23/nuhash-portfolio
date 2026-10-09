'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { skills } from '@/lib/content';
import { scrollToTarget } from '@/lib/scroll';
import { audio } from '@/lib/audio';

export default function Skills() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.skills__statement-word',
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          stagger: 0.025,
          duration: 0.9,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.skills__statement', start: 'top 80%' },
        },
      );
      gsap.fromTo(
        '.skills__row',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.skills__list', start: 'top 80%' } },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="skills" className="skills" aria-labelledby="skills-title" data-section="skills">
      <div className="skills__left">
        <p className="label">{skills.label}</p>
        <span className="skills__count">{skills.count}</span>
        <h2 id="skills-title" className="skills__statement">
          {skills.statement.split(' ').map((w, i) => (
            <span className="skills__mask" key={i}>
              <span className="skills__statement-word">{w}</span>{' '}
            </span>
          ))}
        </h2>
        <button className="link-star" onClick={() => scrollToTarget('contact')} data-cursor>
          {skills.cta} <span aria-hidden>✦</span>
        </button>
      </div>

      <ul className="skills__list">
        {skills.groups.map((g, i) => {
          const isOpen = open === i;
          return (
            <li className={`skills__row ${isOpen ? 'is-open' : ''}`} key={g.title}>
              <button
                className="skills__toggle"
                aria-expanded={isOpen}
                aria-controls={`skill-${i}`}
                onClick={() => {
                  audio.tick();
                  setOpen(isOpen ? -1 : i);
                }}
                data-cursor
              >
                <span className="skills__name">{g.title}</span>
                <span className="skills__plus" aria-hidden />
              </button>
              <div className="skills__panel" id={`skill-${i}`} role="region">
                <div>
                  <ul className="skills__items">
                    {g.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
