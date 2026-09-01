import React from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Star, ShoppingBag, Eye, Heart, MessageCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    formatNaira,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setQuickViewProduct,
    navigateTo,
    openWhatsApp,
  } = useStore();

  const inWish = isInWishlist(product.id);
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const currentPrice = product.discountPrice ?? product.price;

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `Hello AjmanTech Services, I am interested in: ${product.name}. Product price: ${formatNaira(currentPrice)}. Please confirm availability and delivery to my location.`;
    openWhatsApp(msg);
  };

  const handleCardClick = () => {
    navigateTo('product-detail', { productId: product.id });
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      {/* Badges Container */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {discountPercent > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
            -{discountPercent}% OFF
          </span>
        )}
        {product.isBestSeller && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 shadow-xs">
            Best Seller
          </span>
        )}
        {product.isNewArrival && !product.isBestSeller && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0047AB] text-white shadow-xs">
            New Arrival
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        id={`btn-wishlist-${product.id}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          inWish
            ? 'bg-rose-50 text-rose-600 shadow-md ring-2 ring-rose-300'
            : 'bg-white/90 backdrop-blur-xs text-slate-600 hover:text-rose-600 hover:bg-white shadow-xs'
        }`}
        title={inWish ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-4 h-4 ${inWish ? 'fill-rose-600' : ''}`} />
      </button>

      {/* Image Gallery Canvas */}
      <div className="relative w-full pt-[80%] bg-slate-100 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Quick View overlay button */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4">
          <button
            id={`btn-quickview-${product.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-[#002D72]/90 hover:bg-[#002D72] text-white text-xs font-semibold shadow-md backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-semibold text-[#0047AB] uppercase tracking-wider text-[10px]">{product.category}</span>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-800 text-xs">{product.rating}</span>
            <span className="text-slate-400 text-[10px]">({product.reviewCount})</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-[#0047AB] transition-colors">
          {product.name}
        </h3>

        {/* Short specs badge if available */}
        {product.specifications.wattage && (
          <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md w-fit mb-2 font-mono border border-slate-100">
            {product.specifications.wattage} {product.specifications.colorTemperature ? `• ${product.specifications.colorTemperature}` : ''}
          </div>
        )}

        {/* Price Row */}
        <div className="mt-auto pt-2 border-t border-slate-100 flex items-baseline gap-2">
          <span className="text-base font-bold text-[#0047AB]">
            {formatNaira(currentPrice)}
          </span>
          {product.discountPrice && (
            <span className="text-xs text-slate-400 line-through">
              {formatNaira(product.price)}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 grid grid-cols-5 gap-2">
          <button
            id={`btn-add-cart-${product.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1);
            }}
            className="col-span-4 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#0047AB] hover:bg-[#002D72] active:bg-blue-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </button>

          <button
            id={`btn-whatsapp-order-${product.id}`}
            type="button"
            onClick={handleWhatsAppOrder}
            className="col-span-1 flex items-center justify-center p-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
            title="Order via WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-emerald-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
