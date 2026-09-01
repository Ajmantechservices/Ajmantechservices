import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import {
  Star,
  ShoppingBag,
  Heart,
  MessageCircle,
  Wrench,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Share2,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

export const ProductDetailView: React.FC = () => {
  const {
    navigationState,
    products,
    formatNaira,
    addToCart,
    toggleWishlist,
    isInWishlist,
    openServiceModal,
    openWhatsApp,
    navigateTo,
    reviews,
    showToast,
  } = useStore();

  const productId = navigationState.productId || 'prod-01';
  const product = products.find((p) => p.id === productId) || products[0];

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    product.variants && product.variants[0] ? product.variants[0].options[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'delivery' | 'reviews'>('desc');

  // New review state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-[#002D72]">Product not found</h2>
        <button
          onClick={() => navigateTo('shop')}
          className="mt-4 px-6 py-2.5 bg-[#0047AB] text-white rounded-full text-xs font-bold hover:bg-[#002D72] transition-colors cursor-pointer"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const inWish = isInWishlist(product.id);
  const currentPrice = product.discountPrice ?? product.price;
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  const productReviews = reviews.filter((r) => r.productId === product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant);
    navigateTo('checkout');
  };

  const handleWhatsAppOrder = () => {
    const msg = `Hello AjmanTech Services, I want to order the: ${product.name} ${
      selectedVariant ? `[${selectedVariant}]` : ''
    }. Quantity: ${quantity}. Price: ${formatNaira(currentPrice * quantity)}. Please confirm delivery address in Nigeria.`;
    openWhatsApp(msg);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on AjmanTech Services Nigeria!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Product link copied to clipboard!');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;
    setReviewSubmitted(true);
    showToast('Thank you! Your verified review has been submitted for moderation.');
    setReviewComment('');
    setReviewName('');
  };

  return (
    <div id="product-detail-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => navigateTo('home')} className="hover:text-[#0047AB] cursor-pointer">
          Home
        </button>
        <span>/</span>
        <button
          onClick={() => navigateTo('shop', { categorySlug: product.category })}
          className="hover:text-[#0047AB] cursor-pointer"
        >
          {product.category}
        </button>
        <span>/</span>
        <span className="text-[#002D72] font-semibold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Section: Gallery + Purchase Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Canvas & Thumbnails (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-md">
            <img
              src={product.images[activeImageIdx] || product.images[0]}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {discountPercent > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-md">
                  -{discountPercent}% OFF
                </span>
              )}
              {product.isBestSeller && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md">
                  Best Seller
                </span>
              )}
            </div>

            {/* Wishlist & Share Floating Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-[#0047AB] flex items-center justify-center shadow-md transition-colors cursor-pointer"
                title="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer ${
                  inWish
                    ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-400'
                    : 'bg-white/90 backdrop-blur-xs text-slate-700 hover:text-rose-600'
                }`}
                title={inWish ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-4 h-4 ${inWish ? 'fill-rose-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Thumbnails list */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-slate-100 cursor-pointer ${
                    activeImageIdx === idx
                      ? 'border-[#0047AB] scale-105 shadow-md ring-2 ring-blue-200'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Title, Pricing, Add to Cart & Actions (7 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold text-[#0047AB] uppercase tracking-widest">{product.category}</span>
              <span className="font-mono text-slate-400">SKU: {product.specifications.sku || 'AJM-STD-100'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002D72] leading-tight">
              {product.name}
            </h1>

            {/* Rating and Stock */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-extrabold text-xs text-slate-900">{product.rating}</span>
                <span className="text-slate-500 text-xs">({product.reviewCount} customer reviews)</span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>In Stock ({product.stock} units ready in Lagos warehouse)</span>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#002D72]">
                {formatNaira(currentPrice)}
              </span>
              {product.discountPrice && (
                <span className="text-base sm:text-lg text-slate-400 line-through">
                  {formatNaira(product.price)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  Save {formatNaira(product.price - product.discountPrice!)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-light">
              Tax inclusive • Free delivery in Lagos/Abuja on qualifying orders over ₦150,000
            </p>
          </div>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
            {product.shortDescription}
          </p>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {product.variants.map((v, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#002D72] uppercase tracking-wider">
                      Select {v.name}:
                    </label>
                    <span className="text-xs text-[#0047AB] font-semibold">{selectedVariant}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedVariant(opt)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          selectedVariant === opt
                            ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-md ring-2 ring-blue-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-[#0047AB]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity & Buy Buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-[#002D72] uppercase tracking-wider">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-full overflow-hidden bg-slate-50 text-xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-5 py-2 font-bold text-[#002D72] bg-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-2 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                id="btn-add-cart-detail"
                onClick={handleAddToCart}
                className="py-3.5 px-6 rounded-full bg-[#0047AB] hover:bg-[#002D72] active:bg-blue-900 text-white text-xs font-extrabold shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Add To Cart
              </button>

              <button
                id="btn-buynow-detail"
                onClick={handleBuyNow}
                className="py-3.5 px-6 rounded-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Buy Now ({formatNaira(currentPrice * quantity)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Direct WhatsApp Ordering */}
            <button
              onClick={handleWhatsAppOrder}
              className="w-full py-3 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              Order This Item on WhatsApp Instantly
            </button>
          </div>

          {/* Need This Installed? Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Need Installation or Conduit Fitting?</h4>
                <p className="text-[11px] text-slate-600 font-light">Our certified electricians can hang or wire this safely for you.</p>
              </div>
            </div>
            <button
              onClick={() => openServiceModal(product.name)}
              className="py-2 px-4 rounded-full bg-[#002D72] hover:bg-blue-900 text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              Book Electrician
            </button>
          </div>

          {/* Assurance Icons */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-[11px] text-slate-500">
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-xs">
              <Truck className="w-4 h-4 text-[#0047AB] mx-auto" />
              <div className="font-semibold text-slate-800">Nationwide Delivery</div>
              <div className="font-light">24–48 hrs Lagos/Abuja</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto" />
              <div className="font-semibold text-slate-800">Warranty Backed</div>
              <div className="font-light">{product.specifications.warranty || '1 Year Coverage'}</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-xs">
              <RotateCcw className="w-4 h-4 text-amber-600 mx-auto" />
              <div className="font-semibold text-slate-800">Easy Returns</div>
              <div className="font-light">7-Day Return Policy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Detailed Description, Specs Table, Delivery, Reviews */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('desc')}
            className={`py-3.5 px-6 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
              activeTab === 'desc'
                ? 'bg-white text-[#002D72] border-b-2 border-[#002D72]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3.5 px-6 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
              activeTab === 'specs'
                ? 'bg-white text-[#002D72] border-b-2 border-[#002D72]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`py-3.5 px-6 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
              activeTab === 'delivery'
                ? 'bg-white text-[#002D72] border-b-2 border-[#002D72]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delivery & Warranty Info
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 px-6 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-white text-[#002D72] border-b-2 border-[#002D72]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reviews ({productReviews.length})
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Tab 1: Full Description */}
          {activeTab === 'desc' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
              <h3 className="text-base font-bold text-[#002D72]">Product Overview</h3>
              <p className="font-light">{product.description}</p>
              <h4 className="text-sm font-bold text-[#002D72] pt-2">Key Highlights</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 font-light">
                <li>Engineered specifically for Nigerian voltage stability (180V - 265V AC operation).</li>
                <li>Manufactured with high-grade materials for enduring durability and premium aesthetic appeal.</li>
                <li>Simple ceiling mount or surface installation with comprehensive hardware included.</li>
                <li>Full technical support and replacement parts availability through AjmanTech Services Lagos.</li>
              </ul>
            </div>
          )}

          {/* Tab 2: Technical Specifications Table */}
          {activeTab === 'specs' && (
            <div className="max-w-2xl">
              <table className="w-full text-xs text-left border border-slate-200 rounded-2xl overflow-hidden">
                <tbody className="divide-y divide-slate-200">
                  {product.specifications.wattage && (
                    <tr className="bg-slate-50">
                      <td className="p-3 font-bold text-[#002D72] w-1/3">Wattage / Power</td>
                      <td className="p-3 text-slate-900">{product.specifications.wattage}</td>
                    </tr>
                  )}
                  {product.specifications.voltage && (
                    <tr>
                      <td className="p-3 font-bold text-[#002D72]">Operating Voltage</td>
                      <td className="p-3 text-slate-900">{product.specifications.voltage}</td>
                    </tr>
                  )}
                  {product.specifications.colorTemperature && (
                    <tr className="bg-slate-50">
                      <td className="p-3 font-bold text-[#002D72]">Color Temperature</td>
                      <td className="p-3 text-slate-900">{product.specifications.colorTemperature}</td>
                    </tr>
                  )}
                  {product.specifications.lumenOutput && (
                    <tr>
                      <td className="p-3 font-bold text-[#002D72]">Luminous Flux / Lumens</td>
                      <td className="p-3 text-slate-900">{product.specifications.lumenOutput}</td>
                    </tr>
                  )}
                  {product.specifications.material && (
                    <tr className="bg-slate-50">
                      <td className="p-3 font-bold text-[#002D72]">Chassis & Crystal Material</td>
                      <td className="p-3 text-slate-900">{product.specifications.material}</td>
                    </tr>
                  )}
                  {product.specifications.ipRating && (
                    <tr>
                      <td className="p-3 font-bold text-[#002D72]">Ingress Protection (IP)</td>
                      <td className="p-3 text-slate-900">{product.specifications.ipRating}</td>
                    </tr>
                  )}
                  {product.specifications.dimensions && (
                    <tr className="bg-slate-50">
                      <td className="p-3 font-bold text-[#002D72]">Dimensions / Sizing</td>
                      <td className="p-3 text-slate-900">{product.specifications.dimensions}</td>
                    </tr>
                  )}
                  {product.specifications.warranty && (
                    <tr>
                      <td className="p-3 font-bold text-[#002D72]">Manufacturer Warranty</td>
                      <td className="p-3 text-slate-900 font-semibold text-emerald-700">
                        {product.specifications.warranty}
                      </td>
                    </tr>
                  )}
                  {product.specifications.brand && (
                    <tr className="bg-slate-50">
                      <td className="p-3 font-bold text-[#002D72]">Brand</td>
                      <td className="p-3 text-slate-900 font-bold text-[#0047AB]">
                        {product.specifications.brand}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Delivery & Warranty */}
          {activeTab === 'delivery' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 max-w-3xl leading-relaxed">
              <h3 className="text-base font-bold text-[#002D72]">Nigerian Delivery Logistics</h3>
              <p className="font-light">
                We provide fast, reliable door-to-door delivery across all 36 states in Nigeria:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 font-light">
                <li><strong>Lagos State:</strong> Same-day or next-day delivery (₦2,500 - ₦4,000).</li>
                <li><strong>Abuja (FCT) & Port Harcourt:</strong> 24–48 hours delivery (₦4,500 - ₦6,000).</li>
                <li><strong>Other States Nationwide:</strong> 2–4 business days via reliable courier partners (GIG, Peace Mass Logistics, etc.).</li>
                <li><strong>Free Delivery:</strong> Orders exceeding ₦150,000 qualify for free delivery within Lagos mainland and island.</li>
              </ul>

              <h4 className="text-sm font-bold text-[#002D72] pt-3">Warranty & Return Terms</h4>
              <p className="font-light">
                All lighting and electrical goods carry 1 to 2 years replacement warranty against manufacturer defects. If an item arrives defective or damaged during transit, contact us within 7 days for an immediate exchange.
              </p>
            </div>
          )}

          {/* Tab 4: Reviews & Write a Review */}
          {activeTab === 'reviews' && (
            <div className="space-y-8 max-w-3xl">
              {/* Existing Reviews */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#002D72]">Customer Feedback</h3>
                {productReviews.length === 0 ? (
                  <p className="text-xs text-slate-500 font-light">No written reviews yet for this specific item. Be the first to leave one below!</p>
                ) : (
                  <div className="space-y-3">
                    {productReviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#002D72]">{rev.customerName}</span>
                            {rev.location && <span className="text-slate-400">({rev.location})</span>}
                            {rev.isVerified && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 font-light">{rev.date}</span>
                        </div>
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-light">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Review Form */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-[#002D72]">Write a Customer Review</h4>
                {reviewSubmitted ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold border border-emerald-200">
                    Thank you! Your review has been submitted for review.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="Your Name (e.g. Babatunde O.) *"
                        className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                        required
                      />
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-700">Rating:</span>
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-600 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5/5 Outstanding)</option>
                          <option value={4}>⭐⭐⭐⭐ (4/5 Very Good)</option>
                          <option value={3}>⭐⭐⭐ (3/5 Average)</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="How does this light or product perform in your home/office? *"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                      required
                    />
                    <button
                      type="submit"
                      className="py-2.5 px-6 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      Submit Review
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">Similar Options</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#002D72] mt-0.5">
                You May Also Like
              </h2>
            </div>
            <button
              onClick={() => navigateTo('shop', { categorySlug: product.category })}
              className="text-xs font-bold text-[#0047AB] hover:underline cursor-pointer"
            >
              View More in {product.category} &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
