import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { projects, site } from '@/lib/content';
import Footer from '@/components/footer/Footer';

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: `${p.title} — ${p.category}`,
    description: `${p.summary} ${p.services.join(', ')}. Built by ${site.name}, creative developer.`,
    alternates: { canonical: `/work/${p.slug}` },
  };
}

/** Case study stub. The full case study layout is the next page we design. */
export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = projects.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = projects[i];
  const next = projects[(i + 1) % projects.length];

  return (
    <>
    <main className="case">
      <Link href="/work" className="case__back disperse">
        ← All work
      </Link>
      <p className="label">
        Case study {String(i + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
      </p>
      <h1 className="case__title" data-liquid>
        {p.title}
      </h1>
      <p className="case__summary">{p.summary}</p>
      <dl className="case__facts">
        <div>
          <dt>Category</dt>
          <dd>{p.category}</dd>
        </div>
        <div>
          <dt>Services</dt>
          <dd>{p.services.join(', ')}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{p.role}</dd>
        </div>
        <div>
          <dt>Stack</dt>
          <dd>{p.stack.join(', ')}</dd>
        </div>
        <div>
          <dt>Year</dt>
          <dd>{p.year}</dd>
        </div>
      </dl>
      <div className="case__media" style={{ background: `linear-gradient(135deg, ${p.palette[0]}, ${p.palette[1]})` }} />
      <Link href={`/work/${next.slug}`} className="case__next">
        Next — {next.title} →
      </Link>
    </main>
    <Footer />
    </>
  );
}
