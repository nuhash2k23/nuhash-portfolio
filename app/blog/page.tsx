import type { Metadata } from 'next';
import Link from 'next/link';
import { posts } from '@/lib/content';
import PageHead from '@/components/PageHead';
import Footer from '@/components/footer/Footer';

export const metadata: Metadata = {
  title: 'Blog — notes on WebGL, 3D configurators and Blender',
  description: 'Writeups from the workbench: WebGL, Three.js, WebGPU, 3D product configurators and the Blender-to-browser pipeline.',
  alternates: { canonical: '/blog' },
};

export default function Blog() {
  return (
    <>
      <main className="page page--light">
        <PageHead
          label="Blog"
          title="Notes from"
          italic="the workbench."
          intro="How things on this site and in client work were built — shaders, pipelines and the small decisions that make a configurator sell."
        />
        <ol className="postlist">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="postlist__row" data-cursor>
                <span className="postlist__date">{p.date}</span>
                <span className="postlist__title disperse">{p.title}</span>
                <span className="postlist__tag">{p.draft ? 'Coming soon' : p.tag}</span>
                <p className="postlist__excerpt">{p.excerpt}</p>
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </>
  );
}
