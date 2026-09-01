import React from 'react';
import { useStore } from '../context/StoreContext';
import { Clock, User, ArrowLeft, Share2, Sparkles, MessageCircle, Wrench, ShoppingBag } from 'lucide-react';

export const BlogPostView: React.FC = () => {
  const { navigationState, blogPosts, navigateTo, openWhatsApp, openServiceModal, showToast } = useStore();

  const blogId = navigationState?.blogId || 'blog-01';
  const post = blogPosts.find((p) => p.id === blogId) || blogPosts[0];

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Article not found</h2>
        <button
          onClick={() => navigateTo('blog')}
          className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold"
        >
          Return to Blog
        </button>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Article link copied to clipboard!');
    }
  };

  return (
    <div id="blog-post-detail-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-8">
      {/* Top Nav & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('blog')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Guides
        </button>
        <button
          onClick={handleShare}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Article
        </button>
      </div>

      {/* Article Header */}
      <div className="space-y-4">
        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
          {post.category}
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-b border-slate-100 pb-4">
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <User className="w-3.5 h-3.5 text-blue-700" />
            {post.author}
          </span>
          <span>•</span>
          <span>{post.date}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {post.readTime}
          </span>
        </div>
      </div>

      {/* Featured Image */}
      <div className="rounded-3xl overflow-hidden shadow-lg aspect-video bg-slate-100">
        <img
          src={post.image}
          alt={post.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Body Content */}
      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-5">
        <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed border-l-4 border-amber-500 pl-4 bg-amber-50/50 py-2 rounded-r-xl">
          {post.excerpt}
        </p>

        <p>{post.content}</p>

        <h3 className="text-lg font-bold text-slate-900 pt-4">Key Takeaways for Property Owners in Nigeria:</h3>
        <ul className="list-disc pl-5 space-y-2 text-slate-600">
          <li>Always verify that lighting fixtures support wide voltage bands (180V - 265V) to withstand generator surges and low voltage from the national grid.</li>
          <li>For high-ceiling duplexes, prioritize warm white (3000K) or daylight (4000K) crystals with dimmable triac drivers for energy optimization.</li>
          <li>Employ certified technicians who verify earth grounding continuity before switching on heavy loads.</li>
        </ul>

        {/* In-article CTA */}
        <div className="mt-8 p-6 rounded-3xl bg-slate-900 text-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Need Expert Help with Your Lighting or Wiring?</h4>
              <p className="text-xs text-slate-400">Our electrical engineers are available for site inspections.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openServiceModal()}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" /> Book Inspection
            </button>
            <button
              onClick={() => openWhatsApp(`Hello AjmanTech Services, I was reading your article on "${post.title}" and would like assistance.`)}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Chat on WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
