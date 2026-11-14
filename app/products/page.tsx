import React from 'react';
import { createClient } from '../../src/utils/supabase/client';

// Force dynamic rendering - disable aggressive static caching in Next.js / ISR
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Ensures new admin updates show up immediately

/**
 * Fetches product catalog directly from Supabase with no-store cache.
 * Ensures added, edited, or removed products in Supabase immediately update on refresh.
 */
export async function getStoreProducts() {
  const supabase = createClient();
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase Catalog Fetch] Error fetching products:', error);
    return [];
  }
  return products || [];
}

export const getCatalogProducts = getStoreProducts;

export default async function ProductsPage() {
  const products = await getStoreProducts();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">Product Catalog</h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time inventory from Supabase (Dynamic route, cache: 'no-store')
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 bg-blue-100 text-[#002D72] rounded-xl">
              {products.length} Products Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p: any) => (
            <a
              key={p.id}
              href={`/product/${encodeURIComponent(p.id)}`}
              className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 mb-4 group-hover:scale-[1.02] transition-transform">
                  <img src={p.image_url || p.image || p.gallery?.[0]} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  {p.category_name || p.category}
                </div>
                <h2 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-700 transition-colors">{p.name}</h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.short_description || p.full_description || p.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-black text-[#002D72] text-base">
                  ₦{Number(p.price || 0).toLocaleString('en-NG')}
                </span>
                <span className="text-xs text-blue-600 font-semibold group-hover:underline">
                  View Details →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
