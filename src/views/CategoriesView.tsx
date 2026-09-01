import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Lightbulb, Sparkles, Gem, Cable, ShieldAlert, Camera, SunMedium, ToggleRight } from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { categories, navigateTo } = useStore();

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Lightbulb': return <Lightbulb className="w-6 h-6" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6" />;
      case 'Gem': return <Gem className="w-6 h-6" />;
      case 'Cable': return <Cable className="w-6 h-6" />;
      case 'ShieldAlert': return <ShieldAlert className="w-6 h-6" />;
      case 'Camera': return <Camera className="w-6 h-6" />;
      case 'SunMedium': return <SunMedium className="w-6 h-6" />;
      case 'ToggleRight': return <ToggleRight className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div id="categories-page-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-700">All Collections</span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950">
          Browse Lighting & Electrical Categories
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          From luxury indoor crystals to industrial solar arrays and conduit accessories, find genuine electrical products by category.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(categories || []).map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigateTo('shop', { categorySlug: cat.name })}
            className="group bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 mb-4">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xs text-blue-700 flex items-center justify-center shadow-md">
                  {getCategoryIcon(cat.iconName)}
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-bold">
              <span>{cat.productCount} Products in Stock</span>
              <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Shop <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
