'use client';
import { nav, site } from '@/lib/content';
import { scrollToTarget } from '@/lib/scroll';

export default function Nav() {
  return (
    <header className="nav">
      <a
        className="nav__brand"
        href="#journey"
        onClick={(e) => {
          e.preventDefault();
          scrollToTarget(0);
        }}
        data-cursor
      >
        <strong>
          {site.firstName} / {site.lastName}
        </strong>
        <span>
          {site.role} — {site.city}, BD
        </span>
      </a>
      <nav aria-label="Main">
        <ul className="nav__list">
          {nav.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTarget(n.id);
                }}
                data-cursor
              >
                <span className="nav__index">{n.index}</span> {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a
        className="nav__skip"
        href="#work"
        onClick={(e) => {
          e.preventDefault();
          scrollToTarget('work');
        }}
        data-cursor
      >
        Skip to work ↓
      </a>
    </header>
  );
}
