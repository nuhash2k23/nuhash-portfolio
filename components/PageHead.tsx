import Link from 'next/link';

/** Shared header for inner pages: label, big title, optional intro. */
export default function PageHead({ label, title, italic, intro }: { label: string; title: string; italic?: string; intro?: string }) {
  return (
    <header className="page-head">
      <p className="label">{label}</p>
      <h1 className="page-head__title" data-liquid>
        {title} {italic && <em>{italic}</em>}
      </h1>
      {intro && <p className="page-head__intro">{intro}</p>}
    </header>
  );
}

export function PageCta() {
  return (
    <section className="page-cta">
      <p className="page-cta__line" data-liquid>
        Got something that deserves to be <em>felt</em>, not just explained?
      </p>
      <Link href="/contact" className="btn btn--red disperse" data-cursor>
        Get a quote →
      </Link>
    </section>
  );
}