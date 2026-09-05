import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog & Engineering Guides | AjmanTech Electrical Services',
  description:
    'Expert advice on reducing NEPA/PHCN electricity bills, choosing luxury chandeliers, maintaining solar lithium batteries, and safe wiring in Nigeria.',
  openGraph: {
    title: 'Blog & Engineering Guides | AjmanTech Electrical Services',
    description:
      'Expert advice on reducing NEPA/PHCN electricity bills, choosing luxury chandeliers, maintaining solar lithium batteries, and safe wiring in Nigeria.',
    type: 'website',
  },
};

const DEFAULT_POSTS = [
  {
    title: 'How to Choose the Right Solar Inverter & Battery Size for Nigerian Homes',
    slug: 'how-to-choose-solar-inverter-battery-size-nigeria',
    excerpt:
      'A practical engineering guide to sizing solar panels, hybrid inverters, and lithium LiFePO4 batteries for 24/7 power without high fuel costs.',
    category: 'Solar & Inverters',
    date: 'May 14, 2024',
    readTime: '6 min read',
    image:
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1000&auto=format&fit=crop',
  },
  {
    title: 'Luxury Chandelier Installation: Ceiling Reinforcement and Wiring Safety',
    slug: 'luxury-chandelier-installation-ceiling-reinforcement-safety',
    excerpt:
      'Everything you need to know before hanging heavy crystal chandeliers in duplexes and commercial spaces across Lagos and Abuja.',
    category: 'Lighting Guides',
    date: 'Jun 2, 2024',
    readTime: '4 min read',
    image:
      'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=1000&auto=format&fit=crop',
  },
  {
    title: 'Preventing Electrical Fires in Nigeria: Earthing, Surge Protectors & Breakers',
    slug: 'preventing-electrical-fires-nigeria-earthing-surge-protectors',
    excerpt:
      'Why standard breakers fail during generator changeovers and how industrial surge protection shields sensitive appliances.',
    category: 'Electrical Safety',
    date: 'Jun 20, 2024',
    readTime: '5 min read',
    image:
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop',
  },
];

export default async function BlogListingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Banner */}
      <section className="bg-slate-950 text-white py-16 sm:py-24 text-center px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-amber-400 text-xs font-bold uppercase tracking-wider">
            AjmanTech Engineering Knowledge Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            Solar, Electrical & Smart Lighting Guides
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Practical guides to sizing solar inverters, cutting NEPA/PHCN electricity bills, choosing chandeliers, and safeguarding homes in Nigeria.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DEFAULT_POSTS.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-blue-700 text-white text-[11px] font-bold px-3 py-1 rounded-lg">
                    {post.category}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                    <Link href={`/blog/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
                <span className="font-medium text-slate-700">Joshua Ajayi</span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  Read Guide &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
