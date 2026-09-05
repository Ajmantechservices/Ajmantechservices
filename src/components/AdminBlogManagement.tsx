import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { BlogPost } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  BookOpen,
  X,
  Image as ImageIcon,
  Sparkles,
  Code,
  FileText,
  AlertTriangle,
  Globe,
} from 'lucide-react';

export const AdminBlogManagement: React.FC = () => {
  const {
    blogPosts,
    createPost,
    updatePost,
    deletePost,
    refreshPosts,
    navigateTo,
    showToast,
  } = useStore();

  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'edit' | 'preview'>('edit');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auto-generate clean slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    // If we are creating a new post or slug was not manually detached, auto-generate
    if (!editingPost || !slug) {
      setSlug(generateSlug(val));
    }
  };

  const handleOpenAdd = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setFeaturedImage('');
    setContent(
      '<h2>Overview</h2>\n<p>Write an introduction about this topic here...</p>\n\n<h2>Key Guidelines</h2>\n<ul>\n  <li>Step 1: Proper load calculation</li>\n  <li>Step 2: Quality circuit protection</li>\n  <li>Step 3: Professional installation and testing</li>\n</ul>\n\n<p>For expert assistance, contact AjmanTech Electrical Services.</p>'
    );
    setPublished(true);
    setActiveEditorTab('edit');
    setShowEditorModal(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || '');
    setFeaturedImage(post.featured_image || post.image || '');
    setContent(
      typeof post.content === 'string'
        ? post.content
        : Array.isArray(post.content)
        ? post.content.join('\n\n')
        : ''
    );
    setPublished(post.published !== false);
    setActiveEditorTab('edit');
    setShowEditorModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Article title is required.', 'error');
      return;
    }

    const cleanSlug = generateSlug(slug || title) || 'post-' + Date.now();
    setIsSaving(true);

    try {
      if (editingPost) {
        // PUT to public.posts
        await updatePost(editingPost.id, {
          title: title.trim(),
          slug: cleanSlug,
          excerpt: excerpt.trim(),
          featured_image: featuredImage.trim() || undefined,
          content: content,
          published: published,
        });
      } else {
        // POST to public.posts
        await createPost({
          title: title.trim(),
          slug: cleanSlug,
          excerpt: excerpt.trim(),
          featured_image: featuredImage.trim() || undefined,
          content: content,
          published: published,
        });
      }
      setShowEditorModal(false);
    } catch (err: any) {
      showToast(`Save failed: ${err?.message || 'Error communicating with Supabase'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, postTitle: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${postTitle}"?\nThis will remove the record directly from Supabase public.posts.`
      )
    ) {
      setDeletingId(id);
      try {
        await deletePost(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPosts();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper to insert quick HTML / Markdown tags into content
  const insertTag = (tagOpen: string, tagClose: string = '') => {
    setContent((prev) => `${prev}\n${tagOpen}Your text here${tagClose}\n`);
  };

  // Filtered posts
  const filteredPosts = blogPosts.filter((post) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.slug.toLowerCase().includes(q) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(q));

    if (statusFilter === 'published') return matchesSearch && post.published !== false;
    if (statusFilter === 'draft') return matchesSearch && post.published === false;
    return matchesSearch;
  });

  const publishedCount = blogPosts.filter((p) => p.published !== false).length;
  const draftCount = blogPosts.filter((p) => p.published === false).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Blog & Article Management</h2>
            <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-500/20">
              public.posts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Publish SEO guides, solar maintenance tips, and chandelier care articles to drive organic search traffic and AdSense revenue.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="admin-blog-refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Supabase'}</span>
          </button>

          <button
            id="admin-blog-create-btn"
            onClick={handleOpenAdd}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Post</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Articles</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">{blogPosts.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Live / Published</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{publishedCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Drafts / In Review</div>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{draftCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="admin-blog-search-input"
            type="text"
            placeholder="Search by title, slug, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All ({blogPosts.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'published'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Published ({publishedCount})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'draft'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Drafts ({draftCount})
          </button>
        </div>
      </div>

      {/* Posts Table View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Article</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No blog posts found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchQuery
                        ? 'Try modifying your search or filter criteria.'
                        : 'Create your first blog post to start driving organic traffic!'}
                    </p>
                    <button
                      onClick={handleOpenAdd}
                      className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create First Post</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const isPostPublished = post.published !== false;
                  const displayDate = post.created_at
                    ? new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : post.date || 'Recent';

                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Title & Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              post.featured_image ||
                              post.image ||
                              'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=200&auto=format&fit=crop'
                            }
                            alt={post.title}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700/60"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                              {post.title}
                            </div>
                            {post.excerpt && (
                              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {post.excerpt}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        <span className="bg-slate-800/80 px-2 py-1 rounded text-slate-300">
                          /{post.slug}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPostPublished ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {displayDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Live */}
                          <button
                            title="View published article on site"
                            onClick={() =>
                              navigateTo('blog-detail', { slug: post.slug, blogId: post.id })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            title="Edit article"
                            onClick={() => handleOpenEdit(post)}
                            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            title="Delete article permanently"
                            disabled={deletingId === post.id}
                            onClick={() => handleDelete(post.id, post.title)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BLOG POST EDITOR MODAL (Create & Edit Form) */}
      {/* ========================================================================= */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full text-white shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>{editingPost ? 'Edit Blog Article' : 'Create New Blog Post'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Directly saved to the Supabase <code className="text-amber-400">public.posts</code> table for automated live display and SEO indexing.
                </p>
              </div>
              <button
                onClick={() => setShowEditorModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4">
              {/* 1. Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Article Title *
                  </label>
                  <input
                    id="post-title-input"
                    type="text"
                    required
                    placeholder="e.g. How to Install a Solar Inverter in Nigeria"
                    value={title}
                    onChange={handleTitleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Slug (URL Key) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                      /blog/
                    </span>
                    <input
                      id="post-slug-input"
                      type="text"
                      required
                      placeholder="how-to-install-solar-inverter"
                      value={slug}
                      onChange={(e) => setSlug(generateSlug(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-14 pr-3.5 py-2.5 text-xs text-amber-300 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Auto-generated from title. Creates permanent URL for SEO & AdSense.
                  </p>
                </div>
              </div>

              {/* 2. Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Excerpt (Summary for Preview Cards & Meta Description)
                </label>
                <textarea
                  id="post-excerpt-input"
                  rows={2}
                  placeholder="A concise 1-2 sentence overview shown in Google search results and blog listing cards..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* 3. Featured Image URL with Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Featured Image URL
                  </label>
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">Presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFeaturedImage(
                          'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop'
                        )
                      }
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      Solar
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFeaturedImage(
                          'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=1200&auto=format&fit=crop'
                        )
                      }
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      Chandelier
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFeaturedImage(
                          'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop'
                        )
                      }
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      Wiring
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="post-image-input"
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {featuredImage && (
                    <div className="w-12 h-9 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-800">
                      <img
                        src={featuredImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Content Editor (HTML / Markdown Supported) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Article Content (Supports HTML & Markdown) *
                    </label>
                  </div>

                  {/* Edit vs Preview Toggle */}
                  <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('edit')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        activeEditorTab === 'edit'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Write Code / Markdown
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEditorTab('preview')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        activeEditorTab === 'preview'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>
                </div>

                {activeEditorTab === 'edit' ? (
                  <div className="space-y-2">
                    {/* Quick Formatting Helpers */}
                    <div className="flex items-center flex-wrap gap-1 bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/60 text-[11px] text-slate-300">
                      <span className="text-slate-500 px-1 font-mono">Insert:</span>
                      <button
                        type="button"
                        onClick={() => insertTag('<h2>', '</h2>')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono"
                      >
                        &lt;h2&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<p>', '</p>')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono"
                      >
                        &lt;p&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<ul>\n  <li>', '</li>\n</ul>')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono"
                      >
                        &lt;ul&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<strong>', '</strong>')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono"
                      >
                        &lt;strong&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertTag(
                            '<div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg my-4 text-amber-200">',
                            '</div>'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-mono"
                      >
                        Tip Callout
                      </button>
                    </div>

                    <textarea
                      id="post-content-textarea"
                      rows={10}
                      required
                      placeholder="Write your article in HTML or Markdown..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 min-h-[220px] max-h-[360px] overflow-y-auto text-slate-200 text-xs leading-relaxed space-y-3 prose prose-invert max-w-none">
                    {content ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: content.replace(/\n\n/g, '<br/><br/>'),
                        }}
                      />
                    ) : (
                      <p className="text-slate-500 italic">No content written yet.</p>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Published Toggle Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/70 border border-slate-700">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Publication Status</span>
                    {published ? (
                      <span className="text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Live on public website
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[10px] font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">
                        Draft - hidden from public
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Toggle whether this post is immediately accessible at <code className="text-amber-300">/blog/{slug || '[slug]'}</code>
                  </p>
                </div>

                <button
                  type="button"
                  id="post-published-toggle"
                  onClick={() => setPublished(!published)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    published ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      published ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="post-save-submit-btn"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSaving
                      ? 'Saving to Supabase...'
                      : editingPost
                      ? 'Update Post (PUT)'
                      : 'Publish Post (POST)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
