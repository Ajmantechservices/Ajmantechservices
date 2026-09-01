import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import {
  Filter,
  SlidersHorizontal,
  Search,
  Grid,
  List,
  X,
  Sparkles,
  RotateCcw,
  Check,
  ChevronDown,
} from 'lucide-react';

export const ShopView: React.FC = () => {
  const { products, categories, navigationState, navigateTo, formatNaira } = useStore();

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(
    navigationState?.categorySlug || 'All'
  );

  useEffect(() => {
    if (navigationState?.categorySlug) {
      setSelectedCategory(navigationState.categorySlug);
    }
  }, [navigationState?.categorySlug]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<number>(300000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'
  >('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Available tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return (products || [])
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'All' && (p.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            (p.name || '').toLowerCase().includes(q) ||
            (p.shortDescription || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q) ||
            (p.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Price range
        const actualPrice = p.discountPrice ?? p.price ?? 0;
        if (actualPrice > priceRange) return false;

        // Stock filter
        if (inStockOnly && (p.stock || 0) <= 0) return false;

        // Tags filter
        if (selectedTags.length > 0) {
          const hasTag = selectedTags.some((tag) => (p.tags || []).includes(tag));
          if (!hasTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discountPrice ?? a.price ?? 0;
        const priceB = b.discountPrice ?? b.price ?? 0;

        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, priceRange, inStockOnly, selectedTags, sortBy]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setPriceRange(300000);
    setInStockOnly(false);
    setSelectedTags([]);
    setSortBy('featured');
  };

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (priceRange < 300000 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    selectedTags.length;

  return (
    <div id="shop-catalog-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Top Breadcrumb & Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button onClick={() => navigateTo('home')} className="hover:text-[#0047AB] cursor-pointer">
            Home
          </button>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Shop Lighting & Electricals</span>
          {selectedCategory !== 'All' && (
            <>
              <span>/</span>
              <span className="text-[#0047AB] font-bold">{selectedCategory}</span>
            </>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002D72]">
              {selectedCategory === 'All' ? 'Complete Electrical & Lighting Store' : selectedCategory}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Showing {filteredProducts.length} certified products with nationwide delivery
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden flex items-center justify-center gap-2 py-2.5 px-5 rounded-full bg-[#002D72] text-white text-xs font-bold shadow-md cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            <span>Filters & Sort ({activeFiltersCount})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Product Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters (Desktop & Mobile Drawer) */}
        <aside
          className={`lg:block ${
            isMobileFilterOpen
              ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto'
              : 'hidden'
          } lg:relative lg:p-0 bg-white rounded-2xl border border-slate-100 p-5 space-y-6 shadow-xs`}
        >
          {isMobileFilterOpen && (
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 lg:hidden">
              <h3 className="font-bold text-base text-slate-900">Filter Products</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Search Box */}
          <div>
            <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-2">
              Search Products
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, specs..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Categories List */}
          <div>
            <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-2">
              Categories
            </label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`w-full text-left px-3.5 py-2 rounded-full text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-[#0047AB] text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[11px] opacity-80">{products.length}</span>
              </button>

              {(categories || []).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left px-3.5 py-2 rounded-full text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    (selectedCategory || '').toLowerCase() === (cat.name || '').toLowerCase()
                      ? 'bg-[#0047AB] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[11px] opacity-75">{cat.productCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#002D72] uppercase tracking-wider">
                Max Price
              </label>
              <span className="text-xs font-bold text-[#0047AB]">
                {formatNaira(priceRange)}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={300000}
              step={2000}
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-[#0047AB] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₦1,000</span>
              <span>₦300,000+</span>
            </div>
          </div>

          {/* In-Stock Only Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#0047AB] focus:ring-[#0047AB] cursor-pointer"
              />
              <span>In-Stock Only</span>
            </label>
          </div>

          {/* Feature Tags */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-2">
              Popular Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(allTags || []).map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0047AB] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Filters CTA */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 px-4 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          )}

          {isMobileFilterOpen && (
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 rounded-full bg-[#0047AB] text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Apply Filters ({filteredProducts.length} Results)
            </button>
          )}
        </aside>

        {/* Product Catalog Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-[#002D72]">{filteredProducts.length}</span> items found
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <label className="text-xs font-semibold text-slate-600 shrink-0">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0047AB] cursor-pointer"
              >
                <option value="featured">Featured / Best Match</option>
                <option value="price-asc">Price: Low to High (₦)</option>
                <option value="price-desc">Price: High to Low (₦)</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Active:</span>
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0047AB] font-semibold border border-blue-200">
                  Category: {selectedCategory}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-blue-900"
                    onClick={() => setSelectedCategory('All')}
                  />
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  Query: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer hover:text-slate-900" onClick={() => setSearchQuery('')} />
                </span>
              )}
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold"
                >
                  #{tag}
                  <X className="w-3 h-3 cursor-pointer hover:text-slate-900" onClick={() => handleTagToggle(tag)} />
                </span>
              ))}
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0047AB] flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#002D72]">No products match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Try adjusting your price range, searching for a different keyword, or resetting filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="py-2.5 px-6 rounded-full bg-[#0047AB] text-white text-xs font-bold shadow-md hover:bg-[#002D72] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
