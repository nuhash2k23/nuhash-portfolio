import type { Metadata } from 'next';
import { projects } from '@/lib/content';
import WorkIndexScene from '@/components/work/WorkIndexScene';

export const metadata: Metadata = {
  title: 'All work — 3D product configurators & WebGL websites',
  description:
    'Every project: 3D product configurators, Shopify 3D configurators, interactive WebGL websites and scroll experiences, modeled in Blender and built with Three.js and React Three Fiber.',
  alternates: { canonical: '/work' },
};

export default function WorkIndex() {
  return (
    <main className="page page--paper workpage">
      <WorkIndexScene projects={projects} />
    </main>
  );
}