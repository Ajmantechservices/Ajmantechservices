import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Star, ShoppingBag, Heart, MessageCircle, Check, Wrench, Shield, ArrowRight } from 'lucide-react';

export const QuickViewModal: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    formatNaira,
    addToCart,
    toggleWishlist,
    isInWishlist,
    navigateTo,
    openWhatsApp,
  } = useStore();

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);

  if (!quickViewProduct) return null;

  const inWish = isInWishlist(quickViewProduct.id);
  const currentPrice = quickViewProduct.discountPrice ?? quickViewProduct.price;
  const discountPercent = quickViewProduct.discountPrice
    ? Math.round(((quickViewProduct.price - quickViewProduct.discountPrice) / quickViewProduct.price) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(quickViewProduct, qty, selectedVariant);
  };

  const handleBuyNow = () => {
    addToCart(quickViewProduct, qty, selectedVariant);
    setQuickViewProduct(null);
    navigateTo('checkout');
  };

  const handleWhatsApp = () => {
    const msg = `Hello AjmanTech Services, I am inquiring about: ${quickViewProduct.name} ${
      selectedVariant ? `(${selectedVariant})` : ''
    }. Price: ${formatNaira(currentPrice)}. Is this in stock?`;
    openWhatsApp(msg);
  };

  return (
    <div
      id="quickview-modal"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setQuickViewProduct(null)}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Media Gallery */}
          <div className="p-6 bg-slate-50 border-r border-slate-100 flex flex-col justify-between">
            <div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-inner mb-4">
                <img
                  src={(quickViewProduct.images && quickViewProduct.images[selectedImageIdx]) || quickViewProduct.images?.[0] || quickViewProduct.image || ''}
                  alt={quickViewProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {(quickViewProduct.images || []).length > 1 && (
                <div className="flex gap-2">
                  {(quickViewProduct.images || []).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImageIdx === idx ? 'border-[#0047AB] scale-105 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Check className="w-4 h-4" /> In Stock ({quickViewProduct.stock} available)
              </span>
              <span>SKU: {quickViewProduct.specifications?.sku || quickViewProduct.sku || 'AJM-STD'}</span>
            </div>
          </div>

          {/* Product Details Column */}
          <div className="p-6 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold text-[#0047AB] uppercase tracking-wider">{quickViewProduct.category}</span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-800">{quickViewProduct.rating}</span>
                  <span className="text-slate-400">({quickViewProduct.reviewCount} customer reviews)</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#002D72] leading-snug mb-3">
                {quickViewProduct.name}
              </h2>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#002D72]">
                  {formatNaira(currentPrice)}
                </span>
                {quickViewProduct.discountPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatNaira(quickViewProduct.price)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Save {formatNaira(quickViewProduct.price - quickViewProduct.discountPrice!)}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5 font-light">
                {quickViewProduct.shortDescription}
              </p>

              {/* Variant Selector */}
              {(quickViewProduct.variants || []).length > 0 && (
                <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {(quickViewProduct.variants || []).map((v, i) => (
                    <div key={i}>
                      <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                        {v.name}:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(v.options || []).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSelectedVariant(opt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                              selectedVariant === opt
                                ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-xs'
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

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-[#002D72] uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-full overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-3 py-1.5 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold text-slate-900 bg-white">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(Math.min(quickViewProduct.stock, qty + 1))}
                    className="px-3 py-1.5 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleAddToCart}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#002D72] hover:bg-blue-900 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  Buy Now &rarr;
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  Inquire on WhatsApp
                </button>
                <button
                  onClick={() => toggleWishlist(quickViewProduct.id)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                    inWish
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${inWish ? 'fill-rose-600' : ''}`} />
                  {inWish ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    const id = quickViewProduct.id;
                    setQuickViewProduct(null);
                    navigateTo('product-detail', { productId: id });
                  }}
                  className="text-xs text-[#0047AB] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  View Full Product Specifications & Reviews <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
