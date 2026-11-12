import React from 'react';
import { createClient } from '../src/utils/supabase/client';

// Force dynamic rendering - disable aggressive static caching in Next.js / ISR
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Fetches products directly from Supabase with zero static caching.
 * Uses { cache: 'no-store' } behavior so live additions or deletions
 * reflect immediately on refresh.
 */
export async function getProducts() {
  const supabase = createClient();
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase Dynamic Fetch] Error fetching products:', error);
    return [];
  }
  return products || [];
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-[#002D72] text-white py-12 px-6 text-center">
        <h1 className="text-3xl font-extrabold">AjmanTech Services Nigeria Ltd</h1>
        <p className="text-blue-200 mt-2">“Let There Be Light” • Electrical & Lighting Engineering</p>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Featured Catalog (Live Supabase)</h2>
            <p className="text-sm text-slate-500">Rendered dynamically with zero static caching</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            ● Live Sync (Dynamic)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <a
              key={product.id}
              href={`/product/${encodeURIComponent(product.id)}`}
              className="group bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all block"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 mb-4 group-hover:scale-[1.02] transition-transform">
                <img src={product.image_url || product.image || product.gallery?.[0]} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {product.category_name || product.category}
              </span>
              <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1 group-hover:text-blue-700 transition-colors">{product.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.short_description || product.full_description || product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-base font-extrabold text-[#002D72]">
                  ₦{Number(product.price || 0).toLocaleString('en-NG')}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
