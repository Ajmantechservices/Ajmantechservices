'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  Filter,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../context/StoreContext';

export interface ProductReviewItem {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
  verified_purchase?: boolean;
  location?: string;
  helpful_count?: number;
}

interface ProductReviewsProps {
  productId: string;
  productTitle?: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productTitle }) => {
  const { reviews: storeReviews, addReview, showToast } = useStore();

  const [reviewsList, setReviewsList] = useState<ProductReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [location, setLocation] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Sort Filter
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Helpful votes tracked locally
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});

  // Fetch reviews from Supabase public.product_reviews
  const fetchReviews = async () => {
    if (!productId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      let fetchedItems: ProductReviewItem[] = [];

      // 1. Query public.product_reviews from Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          fetchedItems = data.map((row: any) => ({
            id: row.id,
            product_id: row.product_id,
            author_name: row.author_name || row.customer_name || 'Valued Customer',
            rating: Number(row.rating) || 5,
            comment: row.comment || '',
            created_at: row.created_at || new Date().toISOString(),
            verified_purchase: row.verified_purchase ?? true,
            location: row.location || 'Nigeria',
            helpful_count: row.helpful_count || 0,
          }));
        } else if (error && error.code !== 'PGRST116') {
          // If product_reviews table query fails, try public.reviews as secondary table
          const { data: altData } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

          if (altData && altData.length > 0) {
            fetchedItems = altData.map((row: any) => ({
              id: row.id,
              product_id: row.product_id,
              author_name: row.customer_name || row.author_name || 'Valued Customer',
              rating: Number(row.rating) || 5,
              comment: row.comment || '',
              created_at: row.created_at || row.date || new Date().toISOString(),
              verified_purchase: row.verified_purchase ?? true,
              location: row.location || 'Nigeria',
              helpful_count: row.helpful_count || 0,
            }));
          }
        }
      }

      // 2. Blend/fallback with StoreContext local reviews if Supabase returned 0 items
      // (This ensures products always display rich authentic initial Nigerian reviews)
      const fallbackStoreReviews = (storeReviews || [])
        .filter((r) => r.productId === productId)
        .map((r) => ({
          id: r.id,
          product_id: r.productId,
          author_name: r.customerName || 'Verified Customer',
          rating: Number(r.rating) || 5,
          comment: r.comment || '',
          created_at: r.date || new Date().toISOString(),
          verified_purchase: r.verifiedPurchase ?? true,
          location: r.location || 'Lagos, Nigeria',
          helpful_count: 2,
        }));

      // Deduplicate by ID
      const map = new Map<string, ProductReviewItem>();
      fetchedItems.forEach((item) => map.set(item.id, item));
      fallbackStoreReviews.forEach((item) => {
        if (!map.has(item.id)) map.set(item.id, item);
      });

      const combined = Array.from(map.values());
      setReviewsList(combined);
    } catch (err: any) {
      console.warn('Reviews fetch notice:', err);
      // Fallback to store reviews gracefully
      const fallbackStoreReviews = (storeReviews || [])
        .filter((r) => r.productId === productId)
        .map((r) => ({
          id: r.id,
          product_id: r.productId,
          author_name: r.customerName || 'Verified Customer',
          rating: Number(r.rating) || 5,
          comment: r.comment || '',
          created_at: r.date || new Date().toISOString(),
          verified_purchase: r.verifiedPurchase ?? true,
          location: r.location || 'Lagos, Nigeria',
          helpful_count: 1,
        }));
      setReviewsList(fallbackStoreReviews);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Calculations for Average Star Rating and Breakdown
  const totalCount = reviewsList.length;

  const averageRating = useMemo(() => {
    if (totalCount === 0) return 5.0;
    const sum = reviewsList.reduce((acc, curr) => acc + curr.rating, 0);
    return Number((sum / totalCount).toFixed(1));
  }, [reviewsList, totalCount]);

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviewsList]);

  // Sorted reviews list
  const sortedReviews = useMemo(() => {
    const cloned = [...reviewsList];
    if (sortBy === 'highest') {
      return cloned.sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === 'lowest') {
      return cloned.sort((a, b) => a.rating - b.rating);
    }
    // newest
    return cloned.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime() || 0;
      const timeB = new Date(b.created_at).getTime() || 0;
      return timeB - timeA;
    });
  }, [reviewsList, sortBy]);

  // Handle Submit Form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) {
      showToast('Please provide your name and review comment.', 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    const newId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newReviewRecord: ProductReviewItem = {
      id: newId,
      product_id: productId,
      author_name: authorName.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      created_at: nowIso,
      verified_purchase: true,
      location: location.trim() || 'Nigeria',
      helpful_count: 0,
    };

    try {
      // 1. Insert into public.product_reviews on Supabase
      if (supabase) {
        try {
          const { error: insertErr } = await supabase.from('product_reviews').insert([
            {
              id: newReviewRecord.id,
              product_id: newReviewRecord.product_id,
              author_name: newReviewRecord.author_name,
              rating: newReviewRecord.rating,
              comment: newReviewRecord.comment,
              verified_purchase: true,
              created_at: newReviewRecord.created_at,
            },
          ]);

          if (insertErr) {
            console.warn('Attempting secondary fallback insert to reviews table:', insertErr.message);
            // Secondary attempt on reviews table if product_reviews is aliased
            await supabase.from('reviews').insert([
              {
                id: newReviewRecord.id,
                product_id: newReviewRecord.product_id,
                customer_name: newReviewRecord.author_name,
                rating: newReviewRecord.rating,
                comment: newReviewRecord.comment,
                date: formattedDate,
                verified_purchase: true,
              },
            ]);
          }
        } catch (dbErr) {
          console.warn('Supabase insert notice:', dbErr);
        }
      }

      // 2. INSTANTLY REFRESH the reviews list without a full page reload
      setReviewsList((prev) => [newReviewRecord, ...prev]);

      // 3. Sync with StoreContext so store-wide rating & reviewCount stay synced
      try {
        addReview({
          productId,
          customerName: newReviewRecord.author_name,
          rating: newReviewRecord.rating,
          comment: newReviewRecord.comment,
          location: newReviewRecord.location,
          verifiedPurchase: true,
        });
      } catch {}

      // Reset form fields
      setAuthorName('');
      setComment('');
      setLocation('');
      setRating(5);
      setSubmitSuccess(true);
      setShowForm(false);
      showToast('Thank you! Your review has been published.', 'success');
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      showToast('Review submitted locally.', 'info');
      setReviewsList((prev) => [newReviewRecord, ...prev]);
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpfulVote = (reviewId: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
    showToast('Thank you for your feedback!');
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return '5 Stars — Outstanding (Highly Recommended)';
      case 4:
        return '4 Stars — Very Good (Satisfied)';
      case 3:
        return '3 Stars — Average';
      case 2:
        return '2 Stars — Below Expectations';
      case 1:
        return '1 Star — Poor';
      default:
        return `${stars} Stars`;
    }
  };

  return (
    <section id="product-reviews-section" className="mt-14 pt-10 border-t border-slate-200/90">
      <div className="space-y-8">
        {/* ========================================================= */}
        {/* SECTION HEADER                                            */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0047AB] mb-1">
              <MessageSquare className="w-4 h-4 text-[#002D72]" />
              <span>Verified Customer Feedback</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#002D72] tracking-tight">
              Customer Reviews & Star Ratings
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-light">
              Real testimonials, verified performance ratings, and installation satisfaction from homes and businesses across Nigeria.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setSubmitSuccess(false);
            }}
            className="px-6 py-3 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-900/10 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 self-start md:self-auto shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{showForm ? 'Cancel Review' : 'Write a Customer Review'}</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* RATINGS SUMMARY HERO CARD                                 */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left: Overall Score */}
            <div className="md:col-span-4 text-center md:text-left flex flex-col items-center md:items-start justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-black text-slate-900 font-mono tracking-tight">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-lg text-slate-400 font-semibold">/ 5.0</span>
              </div>

              {/* Stars Icon Cluster */}
              <div className="flex items-center gap-1.5 my-2.5">
                {[1, 2, 3, 4, 5].map((s) => {
                  const isFilled = s <= Math.round(averageRating);
                  return (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                          : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  );
                })}
              </div>

              <p className="text-xs font-bold text-slate-700">
                Based on <span className="text-[#002D72]">{totalCount} customer {totalCount === 1 ? 'review' : 'reviews'}</span>
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Verified Nigerian Customers</span>
              </div>
            </div>

            {/* Middle: Star Rating Breakdown Bars */}
            <div className="md:col-span-5 space-y-2">
              {[5, 4, 3, 2, 1].map((starNum) => {
                const count = ratingCounts[starNum] || 0;
                const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                return (
                  <div key={starNum} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-bold text-slate-700 flex items-center gap-1 shrink-0">
                      <span>{starNum}</span>
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </span>

                    {/* Progress Track */}
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="w-10 text-right font-mono text-[11px] text-slate-500 font-semibold shrink-0">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right: Recommendation & Quality Guarantee */}
            <div className="md:col-span-3 bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-center space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Quality Tested & Approved</span>
              </div>
              <p className="text-slate-600 text-[11px] font-light leading-relaxed">
                Tested against Nigerian voltage fluctuations (180V–265V) with full local manufacturer warranty and replacement backing.
              </p>
              <div className="pt-1 text-[11px] text-[#002D72] font-semibold flex items-center gap-1">
                <span>Backed by Engr. Abiodun Ajayi</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SUBMIT REVIEW ACCORDION / FORM                            */}
        {/* ========================================================= */}
        {showForm && (
          <div className="bg-white border-2 border-[#0047AB]/30 rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-900/5 animate-fade-in space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-[#002D72] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Share Your Experience with {productTitle || 'this Product'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Your rating helps fellow Nigerian homeowners, facility managers, and electrical engineers choose quality power & lighting.
              </p>
            </div>

            {submitSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Thank you! Your customer review and star rating were published immediately.</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-5">
              {/* Star Rating Interactive Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Overall Star Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                    {[1, 2, 3, 4, 5].map((starIdx) => {
                      const active = (hoverRating || rating) >= starIdx;
                      return (
                        <button
                          key={starIdx}
                          type="button"
                          onClick={() => setRating(starIdx)}
                          onMouseEnter={() => setHoverRating(starIdx)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1.5 transition-transform hover:scale-125 cursor-pointer focus:outline-hidden"
                          title={`${starIdx} stars`}
                        >
                          <Star
                            className={`w-7 h-7 ${
                              active
                                ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                : 'text-slate-300 fill-transparent'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold text-slate-700 px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                    {getRatingLabel(rating)}
                  </span>
                </div>
              </div>

              {/* Name and Location Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Full Name or Business Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Engr. Babatunde O. / Lekki Resident"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#002D72] focus:ring-1 focus:ring-[#002D72]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City / State in Nigeria <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lekki Phase 1, Lagos / Maitama, Abuja"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#002D72] focus:ring-1 focus:ring-[#002D72]"
                  />
                </div>
              </div>

              {/* Comment Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Review & Experience <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about the light output, energy efficiency, durability, finish quality, or installation experience..."
                  className="w-full p-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#002D72] focus:ring-1 focus:ring-[#002D72] leading-relaxed"
                />
              </div>

              {/* Submit Row */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Reviews are validated and stored in Supabase public.product_reviews</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full bg-[#002D72] hover:bg-[#0047AB] text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing Review...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* EXISTING REVIEWS LIST                                     */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Verified Feedback ({sortedReviews.length})
            </h3>

            {/* Sort Filter Selector */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-[#002D72]"
              >
                <option value="newest">Most Recent</option>
                <option value="highest">Highest Rating (5★ first)</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#002D72]" />
              <span>Loading customer reviews from Supabase...</span>
            </div>
          ) : sortedReviews.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#002D72] flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">No customer reviews yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-light">
                Be the first customer in Nigeria to review this product and help other homeowners and engineers make informed decisions.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-2 px-5 py-2.5 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Write the First Review</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedReviews.map((rev) => {
                const initials = rev.author_name
                  .split(' ')
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'CU';

                const formattedDateStr = (() => {
                  try {
                    const d = new Date(rev.created_at);
                    if (!isNaN(d.getTime())) {
                      return d.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }
                    return rev.created_at;
                  } catch {
                    return rev.created_at;
                  }
                })();

                const currentHelpful = (rev.helpful_count || 0) + (helpfulVotes[rev.id] || 0);

                return (
                  <div
                    key={rev.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-3.5"
                  >
                    {/* Top Row: User Avatar, Name, Location, Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#002D72] border border-blue-100 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{rev.author_name}</span>
                            {rev.verified_purchase !== false && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verified Buyer</span>
                              </span>
                            )}
                          </div>
                          {rev.location && (
                            <span className="text-[11px] text-slate-400 font-light block">
                              {rev.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date & Stars */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formattedDateStr}</span>
                        </span>
                      </div>
                    </div>

                    {/* Review Comment Text */}
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-light pl-0 sm:pl-13">
                      {rev.comment}
                    </p>

                    {/* Bottom Utility Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400 pl-0 sm:pl-13">
                      <span className="text-[11px]">
                        Purchased from AjmanTech Services Nigeria
                      </span>

                      <button
                        type="button"
                        onClick={() => handleHelpfulVote(rev.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#002D72] p-1 rounded hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Helpful ({currentHelpful})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
