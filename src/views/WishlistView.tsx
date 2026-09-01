import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';

export const WishlistView: React.FC = () => {
  const { wishlist, products, navigateTo, addToCart, formatNaira } = useStore();

  const wishProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div id="wishlist-page-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 fill-rose-600" />
            <span>Saved Products</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
            My Wishlist ({wishProducts.length})
          </h1>
        </div>

        {wishProducts.length > 0 && (
          <button
            onClick={() => {
              wishProducts.forEach((p) => addToCart(p, 1));
            }}
            className="py-2.5 px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Add All to Cart
          </button>
        )}
      </div>

      {wishProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Your wishlist is empty</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click the heart icon on any chandelier, bulb, or solar system to save it for later or compare specifications.
          </p>
          <button
            onClick={() => navigateTo('shop')}
            className="py-2.5 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
};
