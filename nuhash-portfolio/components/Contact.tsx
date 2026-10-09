'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { contact, site } from '@/lib/content';

function useDhakaTime() {
  const [t, setT] = useState('');
  useEffect(() => {
    const f = () =>
      setT(
        new Intl.DateTimeFormat('en-GB', { timeZone: site.timezone, hour: '2-digit', minute: '2-digit' }).format(new Date()),
      );
    f();
    const iv = window.setInterval(f, 15000);
    return () => window.clearInterval(iv);
  }, []);
  return t;
}

export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const time = useDhakaTime();
  const mail = `mailto:${site.email}?subject=${encodeURIComponent('Project enquiry — quote request')}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: true },
      });
      // red circle grows until it fills the screen
      tl.fromTo('.contact__circle', { clipPath: 'circle(0% at 50% 55%)' }, { clipPath: 'circle(150% at 50% 55%)', duration: 0.42, ease: 'power2.in' }, 0);
      // big word travels in
      tl.fromTo('.contact__big', { xPercent: 60 }, { xPercent: 0, duration: 0.5, ease: 'power2.out' }, 0.25);
      // parallax images at two speeds
      tl.fromTo('.contact__img--a', { yPercent: 40 }, { yPercent: -30, duration: 0.75 }, 0.25);
      tl.fromTo('.contact__img--b', { yPercent: 90 }, { yPercent: -10, duration: 0.75 }, 0.25);
      tl.fromTo('.contact__copy > *', { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.15 }, 0.45);
      tl.set({}, {}, 1);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="contact" className="contact" aria-labelledby="contact-title" data-section="contact">
      <div className="contact__sticky">
        <div className="contact__circle">
          <p className="label contact__label">{contact.label}</p>
          <h2 id="contact-title" className="contact__big">
            {contact.big}
          </h2>

          {/* TODO: two Blender renders of the rock fragments in brand colours */}
          <div className="contact__img contact__img--a" aria-hidden>
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
          </div>
          <div className="contact__img contact__img--b" aria-hidden>
            <span className="corner tl" />
            <span className="corner tr" />
          </div>

          <div className="contact__copy">
            <p className="contact__headline">{contact.headline}</p>
            {contact.lines.map((l) => (
              <p key={l} className="contact__line">
                {l}
              </p>
            ))}
            <div className="contact__actions">
              <a className="btn btn--light" href={mail} data-cursor>
                {contact.cta} →
              </a>
              <a className="contact__mail" href={`mailto:${site.email}`} data-cursor>
                {site.email}
              </a>
            </div>
            <ul className="contact__links">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" data-cursor>
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
            <p className="contact__time">
              {site.city} — {time} · {site.availability}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
