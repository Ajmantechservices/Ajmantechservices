import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Clock, User, ArrowRight, BookOpen, Search, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

export const BlogView: React.FC = () => {
  const { blogPosts, navigateTo, isAdmin } = useStore();
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    document.title = 'Solar, Inverter & Electrical Guides | AjmanTech Services Blog';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Read expert electrical installation, solar inverter sizing, luxury chandelier maintenance, and power safety guides in Nigeria. By AjmanTech Services.'
    );
  }, []);

  // Filter only published posts for public users; admins can see drafts with an indicator
  const availablePosts = (blogPosts || []).filter((p) => {
    if (isAdmin) return true;
    return p.published !== false;
  });

  // Extract unique categories
  const categories = [
    'All',
    ...Array.from(new Set(availablePosts.map((p) => p.category || 'Guides'))),
  ];

  const filteredPosts = availablePosts.filter((post) => {
    const matchesCat =
      selectedCat === 'All' ||
      (post.category || '').toLowerCase() === selectedCat.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.slug.toLowerCase().includes(q) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(q));

    return matchesCat && matchesQuery;
  });

  return (
    <div id="blog-page-view" className="space-y-12 sm:space-y-16 pb-20">
      {/* Top Hero Banner */}
      <section className="bg-slate-950 text-white py-16 sm:py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            AjmanTech Engineering Knowledge Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Solar, Electrical & Smart Lighting Guides
          </h1>
          <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Practical guides to sizing solar inverters, cutting NEPA/PHCN electricity bills, choosing chandeliers, and safeguarding homes against electrical surges in Nigeria.
          </p>

          {isAdmin && (
            <div className="pt-2">
              <button
                onClick={() => navigateTo('admin-dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                <span>Manage Blog Posts in Admin Portal &rarr;</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Search & Category Filter Toolbar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search guides & articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* AdSense Top Leaderboard Banner Placeholder */}
        <div className="w-full bg-slate-100 border border-dashed border-slate-300 rounded-2xl p-4 text-center my-6">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            Advertisement & Partner Network
          </div>
          <div className="min-h-[90px] flex items-center justify-center bg-white rounded-xl border border-slate-200/80 px-4 py-3">
            <div className="space-y-1 text-center">
              <span className="text-xs font-bold text-slate-800">
                AjmanTech Certified Solar Installations
              </span>
              <p className="text-[11px] text-slate-500">
                Get zero-down solar financing and 24/7 technical support in Lagos and surrounding states.
              </p>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No articles matched your filter</h3>
            <p className="text-xs text-slate-500">
              Try searching with different keywords or switch category filter to "All".
            </p>
            <button
              onClick={() => {
                setSelectedCat('All');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const postSlug = post.slug;
              const displayDate = post.created_at
                ? new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : post.date || 'Recent';

              return (
                <article
                  key={post.id}
                  onClick={() =>
                    navigateTo('blog-detail', { slug: postSlug, blogId: post.id })
                  }
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group hover:-translate-y-1 duration-300"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="relative h-56 overflow-hidden bg-slate-100">
                      <img
                        src={
                          post.featured_image ||
                          post.image ||
                          'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=600&auto=format&fit=crop'
                        }
                        alt={post.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=600&auto=format&fit=crop';
                        }}
                      />
                      <span className="absolute top-3 left-3 bg-blue-700 text-white text-[11px] font-bold px-3 py-1 rounded-lg shadow-md">
                        {post.category || 'Guides'}
                      </span>

                      {post.published === false && (
                        <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md">
                          Draft Preview
                        </span>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{displayDate}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {post.readTime || '5 min read'}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                        {post.title}
                      </h2>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {post.excerpt ||
                          'Read our in-depth practical advice on electrical systems, inverters, and lighting installations.'}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-blue-700" />
                      {post.author || 'Joshua Ajayi'}
                    </span>
                    <span className="font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Article &rarr;
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Newsletter / CTA Section */}
        <section className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-4 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Stay Ahead of Power Failures
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Get Technical Electrical Guides Delivered Free
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join thousands of property owners, facility managers, and electrical engineers in Nigeria receiving our weekly solar power and lighting recommendations.
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 pt-2">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => alert('Thank you for subscribing to AjmanTech Engineering Guides!')}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Subscribe
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
