import React from 'react';
import { createClient } from '../../../src/utils/supabase/client';

// Force dynamic rendering & dynamic route handling in Next.js / Vercel
// Prevents static generation 404s on reload and fetches live from Supabase
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

/**
 * Live dynamic Supabase fetch for a single product by ID or Slug.
 * Uses { cache: 'no-store' } to ensure no aggressive static caching occurs.
 */
export async function getProductByIdOrSlug(idOrSlug: string) {
  if (!idOrSlug) return null;
  try {
    const supabase = createClient();

    // 1. Try lookup by exact ID
    const { data: byId, error: idErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', idOrSlug)
      .maybeSingle();

    if (byId && !idErr) {
      return byId;
    }

    // 2. Try lookup by slug
    const { data: bySlug, error: slugErr } = await supabase
      .from('products')
      .select('*')
      .eq('slug', idOrSlug)
      .maybeSingle();

    if (bySlug && !slugErr) {
      return bySlug;
    }

    // 3. Fallback: Case-insensitive search on name or id
    const { data: allProds } = await supabase
      .from('products')
      .select('*')
      .limit(50);

    const matched = (allProds || []).find(
      (p: any) =>
        p.id === idOrSlug ||
        p.slug === idOrSlug ||
        (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === idOrSlug.toLowerCase())
    );

    return matched || null;
  } catch (err) {
    console.error('[Dynamic Product Page] Error loading product from Supabase:', err);
    return null;
  }
}

interface ProductPageProps {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DynamicProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id ? decodeURIComponent(resolvedParams.id) : '';
  const product = await getProductByIdOrSlug(rawId);

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <header className="bg-[#002D72] text-white py-6 px-4 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <a href="/" className="text-xl font-black tracking-tight text-white hover:text-blue-200 transition-colors">
                AjmanTech Services
              </a>
              <p className="text-xs text-blue-200 mt-0.5">“Let There Be Light” • Electrical Engineering</p>
            </div>
            <a
              href="/products"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              ← Back to Catalog
            </a>
          </div>
        </header>

        <section className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Product Not Found</h1>
          <p className="text-sm text-slate-600 mb-8 leading-relaxed">
            The requested product (ID: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">{rawId}</code>) could not be retrieved from the live Supabase catalog. It may have been updated or removed.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/products"
              className="px-6 py-3 bg-[#0047AB] hover:bg-[#002D72] text-white text-sm font-bold rounded-xl shadow transition-all"
            >
              Browse All Products
            </a>
            <a
              href="/"
              className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-sm font-semibold rounded-xl transition-all"
            >
              Return Home
            </a>
          </div>
        </section>

        <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-xs">
          <p className="font-semibold text-slate-300">AjmanTech Services Nigeria Ltd</p>
          <p className="mt-1">Folabi Oyeyemi, Royalty Road, Ikota Villa Estate, Lekki, Lagos, Nigeria</p>
          <p className="mt-1">Hotline / WhatsApp: +234 807 532 9182</p>
        </footer>
      </main>
    );
  }

  const primaryImage = product.image_url || product.image || (Array.isArray(product.gallery) ? product.gallery[0] : null) || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=800&auto=format&fit=crop';
  const priceNumber = Number(product.price || 0);
  const formattedPrice = '₦' + Math.round(priceNumber).toLocaleString('en-NG');
  const stockCount = typeof product.stock === 'number' ? product.stock : 10;
  const inStock = stockCount > 0;
  const categoryName = product.category_name || product.category || 'Electrical Fixture';
  const description = product.full_description || product.description || product.short_description || 'Certified electrical lighting and installation fixture from AjmanTech Services Nigeria Ltd.';

  const whatsappMessage = encodeURIComponent(
    `Hello AjmanTech Services, I am inquiring about: ${product.name} (Price: ${formattedPrice}). Please confirm availability and delivery to my address.`
  );
  const whatsappUrl = `https://wa.me/2348075329182?text=${whatsappMessage}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Top Banner */}
      <header className="bg-[#002D72] text-white py-6 px-4 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <a href="/" className="text-xl font-black tracking-tight text-white hover:text-blue-200 transition-colors">
              AjmanTech Services
            </a>
            <p className="text-xs text-blue-200 mt-0.5">“Let There Be Light” • Electrical Engineering</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ● Live Dynamic Route
            </span>
            <a
              href="/products"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              ← Catalog
            </a>
          </div>
        </div>
      </header>

      {/* Main Product Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <a href="/" className="hover:text-blue-600">Home</a>
          <span>/</span>
          <a href="/products" className="hover:text-blue-600">Catalog</a>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            {/* Gallery / Image */}
            <div className="flex flex-col gap-4">
              <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 relative">
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
                {inStock ? (
                  <span className="absolute top-4 left-4 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    In Stock ({stockCount})
                  </span>
                ) : (
                  <span className="absolute top-4 left-4 bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Secondary Thumbnails */}
              {Array.isArray(product.gallery) && product.gallery.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.gallery.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50"
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details & Actions */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">
                  {categoryName}
                </span>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {product.name}
                </h1>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-[#002D72]">
                    {formattedPrice}
                  </span>
                  {product.original_price && Number(product.original_price) > priceNumber && (
                    <span className="text-base text-slate-400 line-through">
                      ₦{Math.round(Number(product.original_price)).toLocaleString('en-NG')}
                    </span>
                  )}
                </div>

                <div className="mt-6 border-t border-b border-slate-100 py-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </div>

                {/* Specs Box */}
                <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Warranty</span>
                    <span className="font-bold text-slate-800">{product.warranty || '1 Year AjmanTech Warranty'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Voltage Rating</span>
                    <span className="font-bold text-slate-800">{product.voltage || '220V - 240V Standard'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Availability</span>
                    <span className={`font-bold ${inStock ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {inStock ? `${stockCount} units available` : 'Pre-order on request'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Origin</span>
                    <span className="font-bold text-slate-800">AjmanTech Certified Quality</span>
                  </div>
                </div>
              </div>

              {/* Order Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm text-center shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Order via WhatsApp</span>
                  <span>💬</span>
                </a>
                <a
                  href={`/shop?openProduct=${encodeURIComponent(product.id)}`}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-sm text-center shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Buy in Store</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 text-center text-xs mt-12 border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-bold text-white text-sm">AjmanTech Services Nigeria Ltd</p>
          <p className="text-slate-300">
            Showroom: Folabi Oyeyemi, Royalty Road, Ikota Villa Estate, Lekki, Lagos, Nigeria
          </p>
          <p>
            Hotline: <a href="tel:+2348075329182" className="text-blue-400 hover:underline">+234 807 532 9182</a> • 
            WhatsApp: <a href="https://wa.me/2348075329182" className="text-emerald-400 hover:underline">+234 807 532 9182</a>
          </p>
          <p className="text-[11px] text-slate-500 pt-3">
            “Let There Be Light” • Precision Electrical, Architectural & Commercial Lighting Solutions
          </p>
        </div>
      </footer>
    </main>
  );
}
