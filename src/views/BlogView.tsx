import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Clock, User, ArrowRight, Sparkles, BookOpen } from 'lucide-react';

export const BlogView: React.FC = () => {
  const { blogPosts, navigateTo } = useStore();
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const categories = ['All', 'Lighting Guides', 'Solar & Inverters', 'Electrical Safety', 'Home Automation'];

  const filteredPosts =
    selectedCat === 'All'
      ? (blogPosts || [])
      : (blogPosts || []).filter((p) => (p.category || '').toLowerCase() === selectedCat.toLowerCase());

  return (
    <div id="blog-page-view" className="space-y-12 sm:space-y-16 pb-16">
      {/* Top Banner */}
      <section className="bg-slate-950 text-white py-16 sm:py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            AjmanTech Knowledge Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Electrical & Lighting Guides for Nigerians
          </h1>
          <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Expert advice on reducing NEPA/PHCN electricity bills, choosing luxury chandeliers, maintaining solar lithium batteries, and childproofing home wiring.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCat === cat
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(filteredPosts || []).map((post) => (
            <div
              key={post.id}
              onClick={() => navigateTo('blog-detail', { blogId: post.id })}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    referrerPolicy="no-referrer"
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
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <User className="w-3.5 h-3.5 text-blue-700" />
                  {post.author}
                </span>
                <span className="font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read Guide &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
