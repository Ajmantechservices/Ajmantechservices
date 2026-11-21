import React from 'react';
import { useStore } from '../context/StoreContext';

export const CategoriesView: React.FC = () => {
  const { categories, navigateTo } = useStore();

  return (
    <div id="categories-page-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-700">Shop Categories</span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950">
          Product Categories
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(categories || []).map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => navigateTo('shop', { categorySlug: cat.name })}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer flex flex-col text-center"
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={cat.image}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="p-4 sm:p-5 flex items-center justify-center min-h-[68px]">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#0047AB] transition-colors">
                {cat.name}
              </h3>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

