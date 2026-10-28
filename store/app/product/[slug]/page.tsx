import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductView from '@/components/ProductView';
import ProductCard from '@/components/ProductCard';
import { bySlug, products } from '@/lib/products';

export const generateStaticParams = () => products.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: PageProps<'/product/[slug]'>) {
  const p = bySlug((await params).slug);
  return { title: p ? `${p.name} — Beerunng` : 'Beerunng' };
}

// Every slug is prerendered; the Suspense boundary just keeps navigation instant (Next 16 rule).
export default function ProductPage({ params }: PageProps<'/product/[slug]'>) {
  return <Suspense fallback={<main className="product" />}><Product params={params} /></Suspense>;
}

async function Product({ params }: { params: PageProps<'/product/[slug]'>['params'] }) {
  const p = bySlug((await params).slug);
  if (!p) notFound();
  const others = products.filter((o) => o.slug !== p.slug);

  return (
    <main className="product">
      <Link href="/#collection" className="caps back">← Collection</Link>
      <ProductView p={p} />

      <section className="ref">
        <div className="ref-img"><img src={p.reference} alt="The cultural reference behind this design" /></div>
        <div className="ref-copy">
          <span className="caps">In process / The reference</span>
          <h2>Sometimes the reference is visible.</h2>
          <p>{p.referenceNote}</p>
          <p className="muted">Sometimes it exists quietly within a detail.</p>
        </div>
      </section>

      <section className="rung more">
        <div className="rung-head">
          <span className="rung-line" style={{ transform: 'none' }} />
          <span className="caps">On the same rung</span>
        </div>
        <div className="grid grid-2">
          {others.map((o, i) => <ProductCard key={o.slug} p={o} n={i + 1} />)}
        </div>
      </section>
    </main>
  );
}
