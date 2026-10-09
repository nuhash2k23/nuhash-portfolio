import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { posts, site } from '@/lib/content';
import Footer from '@/components/footer/Footer';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = posts.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `/blog/${p.slug}` },
    // drafts stay out of search until they are written
    robots: p.draft ? { index: false, follow: true } : undefined,
  };
}

/** Post template. TODO: move posts to MDX when the first one is written. */
export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = posts.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <>
      <main className="page page--paper">
        <article className="post">
          <Link href="/blog" className="post__back disperse">
            ← All notes
          </Link>
          <p className="label">
            {p.tag} · {p.date}
          </p>
          <h1 className="post__title" data-liquid>
            {p.title}
          </h1>
          <p className="post__lede">{p.excerpt}</p>
          {p.draft && <p className="post__draft">This post is being written. Check back soon.</p>}
          <p className="post__by">— {site.name}</p>
        </article>
      </main>
      <Footer />
    </>
  );
}
