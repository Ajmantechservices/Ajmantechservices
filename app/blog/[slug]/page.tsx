import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

const POSTS: Record<
  string,
  {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    date: string;
    readTime: string;
    image: string;
    author: string;
  }
> = {
  'how-to-choose-solar-inverter-battery-size-nigeria': {
    title: 'How to Choose the Right Solar Inverter & Battery Size for Nigerian Homes',
    excerpt:
      'A practical engineering guide to sizing solar panels, hybrid inverters, and lithium LiFePO4 batteries for 24/7 power without high fuel costs.',
    content: `
      <h2>1. Sizing Your Essential Household Loads</h2>
      <p>Before buying any inverter or solar equipment in Nigeria, calculate your continuous running load vs surge start loads. A typical 3-bedroom flat in Lagos runs lighting (150W), 2 refrigerators (400W), smart TVs (200W), and occasional water pumping (1100W).</p>
      
      <h2>2. Why Pure Sine Wave Inverters Are Essential</h2>
      <p>Modified sine wave inverters generate electrical harmonics that overheat copper coils in AC motors, inverter air conditioners, and sound amplifiers. Always insist on Pure Sine Wave technology with high-efficiency MPPT solar charge controllers.</p>
      
      <h2>3. Tubular vs LiFePO4 Lithium Batteries</h2>
      <p>While tubular wet-cell batteries have a lower upfront price, lithium iron phosphate (LiFePO4) offers over 4,000 charge cycles compared to just 800 cycles on tubular cells. Lithium systems are significantly cheaper per kilowatt-hour over a 5-year period.</p>
    `,
    category: 'Solar & Inverters',
    date: 'May 14, 2024',
    readTime: '6 min read',
    image:
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop',
    author: 'Joshua Ajayi',
  },
  'luxury-chandelier-installation-ceiling-reinforcement-safety': {
    title: 'Luxury Chandelier Installation: Ceiling Reinforcement and Wiring Safety',
    excerpt:
      'Everything you need to know before hanging heavy crystal chandeliers in duplexes and commercial spaces across Lagos and Abuja.',
    content: `
      <h2>1. Structural Weight Assessment</h2>
      <p>Heavy crystal chandeliers exceeding 15kg must never be suspended from standard plasterboard or POP ceiling boards. AjmanTech engineers install reinforced unistrut crossbeams directly into concrete soffits or steel roof purlins.</p>

      <h2>2. Heat Dissipation and LED Driver Housing</h2>
      <p>Modern crystal fixtures use LED drivers that produce heat during prolonged nighttime use. Ensure proper heat-sink ventilation above the ceiling to prevent premature LED failures.</p>
    `,
    category: 'Lighting Guides',
    date: 'Jun 2, 2024',
    readTime: '4 min read',
    image:
      'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=1200&auto=format&fit=crop',
    author: 'Joshua Ajayi',
  },
  'preventing-electrical-fires-nigeria-earthing-surge-protectors': {
    title: 'Preventing Electrical Fires in Nigeria: Earthing, Surge Protectors & Breakers',
    excerpt:
      'Why standard breakers fail during generator changeovers and how industrial surge protection shields sensitive appliances.',
    content: `
      <h2>1. High-Voltage Surge Arrestors on Changeover Switches</h2>
      <p>When switching between NEPA/PHCN mains and diesel/petrol generators, voltage spikes exceeding 400V are common. Type 2 SPD surge arrestors safely clamp excess voltage to ground within nanoseconds.</p>

      <h2>2. Copper Earthing Rod Impedance Testing</h2>
      <p>An earth resistance below 5 Ohms is critical. Dry seasonal soil in Northern Nigeria and coastal salinity in Lagos require dedicated copper-bonded earth rods with bentonite conductivity backfill.</p>
    `,
    category: 'Electrical Safety',
    date: 'Jun 20, 2024',
    readTime: '5 min read',
    image:
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
    author: 'Joshua Ajayi',
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug] || {
    title: slug.replace(/-/g, ' ').toUpperCase() + ' | AjmanTech Services',
    excerpt: 'Comprehensive electrical, solar, and lighting guide from AjmanTech Services.',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200',
  };

  return {
    title: `${post.title} | AjmanTech Services`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.image }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = POSTS[slug];

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AjmanTech Services',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/blog" className="text-xs font-bold text-blue-700 hover:underline">
            &larr; Back to All Guides
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-4">
          <span className="px-3.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
            {post.category}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-slate-500 border-b border-slate-200 pb-4">
            <span className="font-bold text-slate-800">{post.author}</span>
            <span>•</span>
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
        </header>

        <div className="rounded-3xl overflow-hidden aspect-video bg-slate-900 shadow-xl">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-r-2xl p-5 text-slate-800 text-sm font-medium">
          {post.excerpt}
        </div>

        <div
          className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
