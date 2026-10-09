'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { menu, site } from '@/lib/content';
import { getLenis, scrollToTarget } from '@/lib/scroll';
import { audio } from '@/lib/audio';
import { ui } from '@/lib/state';

const NavLogo = dynamic(() => import('./NavLogo'), { ssr: false });

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const home = path === '/';

  useEffect(() => {
    const l = getLenis();
    if (open) l?.stop();
    else if (ui.get().loaded) l?.start(); // never unlock scroll while the loader is up
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => setOpen(false), [path]);

  return (
    <>
      {/* the 3D logo sits outside the blended header so its colours stay true */}
      <Link href="/" className="nav-logo-link" data-cursor aria-label={`${site.name} — home`}>
        <NavLogo />
      </Link>
      <header className="nav">
        <Link href="/" className="nav__brand" data-cursor tabIndex={-1} aria-hidden>
          <span className="nav__name">
            <strong>{site.name}</strong>
            <span>
              {site.role} — {site.city}
            </span>
          </span>
        </Link>
        <div className="nav__right">
          {home && (
            <a
              className="nav__skip disperse"
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget('work');
              }}
              data-cursor
            >
              Skip to work ↓
            </a>
          )}
          <button
            className={`nav__menu-btn disperse ${open ? 'is-open' : ''}`}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => {
              audio.whoosh(0.5);
              setOpen((o) => !o);
            }}
            data-cursor
          >
            <span>{open ? 'Close' : 'Menu'}</span>
            <i aria-hidden />
          </button>
        </div>
      </header>

      <nav id="site-menu" className={`menu ${open ? 'is-open' : ''}`} aria-label="Site" aria-hidden={!open}>
        <ul>
          {menu.map((m, i) => (
            <li key={m.href} style={{ transitionDelay: open ? `${0.08 + i * 0.05}s` : '0s' }}>
              <Link href={m.href} className="menu__link disperse" data-cursor onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
                <span className="menu__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="menu__label">{m.label}</span>
                <em className="menu__note">{m.note}</em>
              </Link>
            </li>
          ))}
        </ul>
        <p className="menu__foot">
          <a href={`mailto:${site.email}`} tabIndex={open ? 0 : -1}>
            {site.email}
          </a>
          <span>{site.availability}</span>
        </p>
      </nav>
    </>
  );
}
