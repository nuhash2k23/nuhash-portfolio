'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { footer, menu, site } from '@/lib/content';
import { scrollToTarget } from '@/lib/scroll';
import { ui, useStore } from '@/lib/state';

const FooterRock = dynamic(() => import('./FooterRock'), { ssr: false });

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const webgl = useStore(ui, (s) => s.webgl);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    io.observe(el);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.footer__word',
        { yPercent: 110 },
        { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.footer__name', start: 'top 95%' } },
      );
    }, el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <footer ref={ref} className="footer" data-section="footer">
      <div className="footer__bg">
        {webgl ? <FooterRock active={active} stage={stage} /> : <div className="footer__rock footer__rock--static" />}
      </div>

      <div className="footer__grid">
        <nav aria-label="Footer">
          <ul>
            {menu.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className="disperse" data-cursor>
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ul>
          {site.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noreferrer" className="disperse" data-cursor>
                {s.label} ↗
              </a>
            </li>
          ))}
        </ul>
        <div>
          <p>{footer.line}</p>
          <a href={`mailto:${site.email}`} className="disperse" data-cursor>
            {site.email}
          </a>
        </div>
        <button className="footer__top disperse" onClick={() => scrollToTarget(0)} data-cursor>
          Back to top ↑
        </button>
      </div>

      {/* the stone floats in this space (measured by FooterRock) */}
      <div ref={stage} className="footer__stage" aria-hidden>
        <p className="footer__hint">Touch the stone</p>
      </div>

      <p className="footer__name" aria-label={site.name}>
        <span className="footer__mask">
          <span className="footer__word">{site.firstName}</span>
        </span>{' '}
        <span className="footer__mask">
          <em className="footer__word">{site.lastName}</em>
        </span>
      </p>
      <p className="footer__legal">
        © {new Date().getFullYear()} {site.name} — {site.role}, {site.city}
      </p>
    </footer>
  );
}
