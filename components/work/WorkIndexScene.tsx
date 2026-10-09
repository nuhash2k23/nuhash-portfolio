'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ui, useStore } from '@/lib/state';
import type { Project } from '@/lib/content';
import type { CoverLive } from './WorkCover';

const WorkCover = dynamic(() => import('./WorkCover'), { ssr: false });

/**
 * HUYML-style all-work index:
 *   left  — meta column (Team/Role · Launch · Recognition) for the active project
 *   centre— WebGL cover stack that tilts to the cursor; scroll swaps the active card
 *   right — vertical project list; active row is sharp, the rest greyed
 *   + a huge ghost index number, bottom-left, that counts as you scroll
 */
export default function WorkIndexScene({ projects }: { projects: Project[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const live = useRef<CoverLive>({ index: 0, prev: 0, blend: 1 });
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const webgl = useStore(ui, (s) => s.webgl);
  const n = projects.length;

  // scroll → active index (the section is tall; each project gets a slice)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const travel = el.offsetHeight - window.innerHeight;
        const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, travel)));
        const f = p * (n - 1);
        const idx = Math.round(f);
        setActive((prev) => {
          if (prev !== idx) {
            live.current.prev = prev;
            live.current.index = idx;
            live.current.blend = 0;
          }
          return idx;
        });
        // snap-commit: ramp blend quickly so the card locks to the new slot decisively
        live.current.blend = Math.min(1, live.current.blend + 0.14);
        live.current.index = idx;
      });
    };
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [n]);

  // let the user click a row to jump to it
  const jump = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (travel * i) / (n - 1), behavior: 'smooth' });
  };

  const p = projects[active];

  return (
    <section ref={sectionRef} className="workx" style={{ height: `${n * 42 + 100}vh` }} aria-label="All work">
      <div className="workx__sticky">
        {/* LEFT — meta column (key→remount so the text blur-in fires on change) */}
        <aside className="workx__meta" key={active} aria-hidden>
          <div className="workx__metarow">
            <span className="label">Team</span>
            <p>Role</p>
          </div>
          <div className="workx__metarow workx__metarow--role">
            <span className="label">&nbsp;</span>
            <p>
              {p.role}
              <br />
              <em>{p.category}</em>
            </p>
          </div>
          <div className="workx__metarow">
            <span className="label">Launch</span>
            <p>{p.year !== '—' ? p.year : 'TBA'}</p>
          </div>
          {p.recognition && p.recognition.length > 0 && (
            <div className="workx__metarow">
              <span className="label">Recognition</span>
              <p>
                {p.recognition.map((r) => (
                  <span key={r}>
                    {r}
                    <br />
                  </span>
                ))}
              </p>
            </div>
          )}
          {p.liveUrl && (
            <a className="workx__visit disperse" href={p.liveUrl} target="_blank" rel="noreferrer" data-cursor>
              Visit site →
            </a>
          )}
        </aside>

        {/* CENTRE — WebGL cover */}
        <div className="workx__stage">
          {webgl ? (
            <WorkCover projects={projects} state={live} active={inView} />
          ) : (
            <div
              className="workx__coverfallback"
              style={{ background: p.image ? `url(${p.image}) center/cover` : `linear-gradient(135deg, ${p.palette[0]}, ${p.palette[1]})` }}
            />
          )}
          <Link href={`/work/${p.slug}`} className="workx__open disperse" data-cursor>
            Open case study →
          </Link>
        </div>

        {/* RIGHT — project list */}
        <ol className="workx__list" style={{ transform: `translateY(${-active * 3.4}rem)` }}>
          {projects.map((pr, i) => (
            <li key={pr.slug} className={`workx__item ${i === active ? 'is-active' : ''}`}>
              <button onClick={() => jump(i)} data-cursor>
                <span className="workx__cat">{pr.category}</span>
                <span className="workx__name">{pr.title}</span>
                <span className="workx__rule" aria-hidden>—</span>
                <span className="workx__blurb">{pr.summary}</span>
              </button>
            </li>
          ))}
        </ol>

        {/* ghost index + counter */}
        <p className="workx__ghost" aria-hidden>{String(active + 1).padStart(2, '0')}</p>
        <p className="workx__counter" aria-hidden>
          <span>Selected work</span>
          <span>/{String(n).padStart(2, '0')}</span>
        </p>
      </div>

      {/* crawlable list for SEO */}
      <ol className="sr-only">
        {projects.map((pr) => (
          <li key={pr.slug}>
            <Link href={`/work/${pr.slug}`}>
              {pr.title} — {pr.category}: {pr.summary}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}