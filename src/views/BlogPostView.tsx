import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Clock,
  User,
  ArrowLeft,
  Share2,
  Sparkles,
  MessageCircle,
  Wrench,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Bookmark,
  ExternalLink,
} from 'lucide-react';

export const BlogPostView: React.FC = () => {
  const {
    navigationState,
    selectedBlogSlug,
    selectedBlogPostId,
    blogPosts,
    navigateTo,
    openWhatsApp,
    openServiceModal,
    showToast,
  } = useStore();

  // Resolve post by slug first, then ID, then URL path, then fallback to first post
  const targetSlug =
    navigationState?.slug ||
    selectedBlogSlug ||
    (typeof window !== 'undefined'
      ? window.location.pathname.replace(/^\/blog\//, '').replace(/\/$/, '')
      : '');

  const targetId = navigationState?.blogId || selectedBlogPostId;

  const post =
    (targetSlug && blogPosts.find((p) => p.slug === targetSlug)) ||
    (targetId && blogPosts.find((p) => p.id === targetId)) ||
    blogPosts[0];

  // Dynamic SEO Meta Tags & JSON-LD Structured Data
  useEffect(() => {
    if (!post) return;

    // 1. Title
    document.title = `${post.title} | AjmanTech Electrical Services Blog`;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', post.excerpt || post.title);

    // 3. OpenGraph Tags
    const updateOgTag = (property: string, content: string) => {
      let og = document.querySelector(`meta[property="${property}"]`);
      if (!og) {
        og = document.createElement('meta');
        og.setAttribute('property', property);
        document.head.appendChild(og);
      }
      og.setAttribute('content', content);
    };

    updateOgTag('og:title', post.title);
    updateOgTag('og:description', post.excerpt || post.title);
    updateOgTag(
      'og:image',
      post.featured_image ||
        post.image ||
        'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200'
    );
    updateOgTag('og:type', 'article');
    if (typeof window !== 'undefined') {
      updateOgTag('og:url', window.location.href);
    }

    // 4. JSON-LD Structured Data (Schema.org / BlogPosting)
    const jsonLdId = 'schema-blog-posting';
    let script = document.getElementById(jsonLdId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = jsonLdId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      image: post.featured_image || post.image,
      datePublished: post.created_at || new Date().toISOString(),
      dateModified: post.updated_at || post.created_at || new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: post.author || 'Joshua Ajayi',
        jobTitle: 'Lead Electrical Engineer',
      },
      publisher: {
        '@type': 'Organization',
        name: 'AjmanTech Services',
        logo: {
          '@type': 'ImageObject',
          url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=300',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': typeof window !== 'undefined' ? window.location.href : `https://ajmantechservices.com/blog/${post.slug}`,
      },
    };

    script.textContent = JSON.stringify(structuredData);

    return () => {
      // Clean up JSON-LD on unmount
      const existingScript = document.getElementById(jsonLdId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [post]);

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Article Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested guide could not be located or may have been moved.
        </p>
        <button
          onClick={() => navigateTo('blog')}
          className="px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Blog Articles</span>
        </button>
      </div>
    );
  }

  const handleShare = (platform?: 'whatsapp' | 'twitter' | 'copy') => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://ajmantechservices.com/blog/${post.slug}`;
    const text = `Read "${post.title}" on AjmanTech Services:`;

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
      return;
    }

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
      return;
    }

    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.excerpt,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      showToast('Article link copied to clipboard!', 'success');
    }
  };

  // Find other related articles
  const relatedPosts = blogPosts
    .filter((p) => p.id !== post.id && p.published !== false)
    .slice(0, 3);

  const displayDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : post.date || 'Recent';

  // Render article body supporting both raw HTML and Markdown formatting
  const renderContent = () => {
    if (typeof post.content === 'string') {
      const isHtml = /<[a-z][\s\S]*>/i.test(post.content);
      if (isHtml) {
        return (
          <div
            className="article-rich-content leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        );
      }
      return (
        <div className="space-y-4 text-slate-700 leading-relaxed">
          {post.content.split('\n\n').map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      );
    }

    if (Array.isArray(post.content)) {
      return (
        <div className="space-y-4 text-slate-700 leading-relaxed">
          {post.content.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div id="blog-post-detail-view" className="bg-slate-50 min-h-screen pb-24">
      {/* Top Breadcrumbs & Back Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigateTo('blog')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Guides</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShare('whatsapp')}
              title="Share on WhatsApp"
              className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={() => handleShare('copy')}
              title="Copy Article Link"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Article Container */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Header Block */}
        <header className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="px-3.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
              {post.category || 'Guides'}
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-mono">/blog/{post.slug}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-tight tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-b border-slate-200 pb-5">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <User className="w-4 h-4 text-blue-700" />
              {post.author || 'Joshua Ajayi'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {displayDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {post.readTime || '5 min read'}
            </span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="rounded-3xl overflow-hidden shadow-xl aspect-video bg-slate-900 border border-slate-200 relative">
          <img
            src={
              post.featured_image ||
              post.image ||
              'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop'
            }
            alt={post.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Lead Excerpt Callout */}
        {post.excerpt && (
          <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-r-2xl p-5 text-slate-800 text-sm sm:text-base font-medium leading-relaxed shadow-xs">
            {post.excerpt}
          </div>
        )}

        {/* Article Body Content */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
          {renderContent()}

          {/* AdSense In-Article Monetization Placement */}
          <div className="my-8 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center not-prose">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Sponsored Advertisement
            </div>
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-5 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Need an Engineered Solar Inverter Setup in Lagos?</span>
                </div>
                <p className="text-xs text-slate-300">
                  AjmanTech engineers size your loads, install pure sine-wave systems, and guarantee warranty.
                </p>
              </div>
              <button
                onClick={() =>
                  openWhatsApp(
                    `Hello AjmanTech! I was reading your article "${post.title}" and would like a consultation on solar/electrical services.`
                  )
                }
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shrink-0 transition-all cursor-pointer"
              >
                Chat on WhatsApp
              </button>
            </div>
          </div>

          {/* Practical Safety / Checklist Section */}
          <div className="not-prose mt-8 p-6 bg-slate-900 text-white rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Nigerian Electrical & Solar Checklist</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">1.</span>
                <span>Ensure high-voltage surge arrestors are installed on all sub-distribution boards to prevent generator switchover burns.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">2.</span>
                <span>Use genuine copper cabling (Pure OFC) sized for minimum 1.5x of peak appliance start-up draw.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">3.</span>
                <span>For solar inverters, prioritize LiFePO4 (Lithium Iron Phosphate) battery chemistry over tubular gel for 10x longer cycle lifespans.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Share & Engage Strip */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-700">
            Did you find this guide helpful? Share it with homeowners and colleagues:
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShare('whatsapp')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>X (Twitter)</span>
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="space-y-6 pt-6">
            <h3 className="text-xl font-bold text-slate-950 tracking-tight">
              More Recommended Guides
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedPosts.map((rPost) => (
                <div
                  key={rPost.id}
                  onClick={() =>
                    navigateTo('blog-detail', { slug: rPost.slug, blogId: rPost.id })
                  }
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="h-36 overflow-hidden bg-slate-100 relative">
                      <img
                        src={rPost.featured_image || rPost.image}
                        alt={rPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 bg-blue-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                        {rPost.category}
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                        {rPost.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {rPost.excerpt}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 text-[11px] font-bold text-blue-700 flex items-center gap-1">
                    <span>Read Article &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};
