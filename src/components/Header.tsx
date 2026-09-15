import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Phone,
  MessageCircle,
  Truck,
  Sparkles,
  ShieldCheck,
  Wrench,
  ChevronDown,
  ChevronRight,
  LogOut,
  Package,
  Zap,
  Camera,
  Lightbulb,
  Sun,
  SunMedium,
  Sliders,
  Activity,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Gem,
  Cable,
  ShieldAlert,
  ToggleRight,
  Grid,
  Layers,
} from 'lucide-react';
import { ViewState } from '../types';

export interface CompanyServiceItem {
  id: string;
  name: string;
  shortDesc: string;
  categoryTag: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  iconBg: string;
}

export const ALL_COMPANY_SERVICES: CompanyServiceItem[] = [
  {
    id: 'srv-electrical-services',
    name: 'Electrical services',
    shortDesc: 'Residential & commercial troubleshooting, load balancing & preventative maintenance.',
    categoryTag: 'Core Electrical',
    icon: Zap,
    accentColor: 'text-blue-600',
    iconBg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
  },
  {
    id: 'srv-cctv-installation',
    name: 'CCTV installation',
    shortDesc: 'HD & IP surveillance systems, 360° PTZ smart cameras & mobile live view setup.',
    categoryTag: 'Surveillance',
    icon: Camera,
    accentColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
  },
  {
    id: 'srv-light-fixture-installation',
    name: 'Light fixture installation',
    shortDesc: 'Luxury chandeliers, ceiling flush mounts, magnetic track lights & pendant rigs.',
    categoryTag: 'Lighting',
    icon: Lightbulb,
    accentColor: 'text-amber-600',
    iconBg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
  },
  {
    id: 'srv-outdoor-lighting-installation',
    name: 'Outdoor lighting installation',
    shortDesc: 'Weatherproof facade illumination, security floodlights, garden bollards & sconces.',
    categoryTag: 'Exterior',
    icon: SunMedium,
    accentColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
  },
  {
    id: 'srv-electrical-panel-repair',
    name: 'Electrical panel repair',
    shortDesc: 'Circuit breaker diagnosis, changeover switch replacement & distribution board overhaul.',
    categoryTag: 'Repairs & Safety',
    icon: Sliders,
    accentColor: 'text-rose-600',
    iconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
  },
  {
    id: 'srv-electrical-wiring-installation',
    name: 'Electrical wiring installation',
    shortDesc: 'Conduit piping, surface cabling, building phase distribution & certified earthing.',
    categoryTag: 'Wiring & Piping',
    icon: Activity,
    accentColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white',
  },
  {
    id: 'srv-general-repairs',
    name: 'General repairs',
    shortDesc: 'Rapid response for tripped breakers, burnt sockets, loose terminals & short circuits.',
    categoryTag: 'Maintenance',
    icon: Wrench,
    accentColor: 'text-orange-600',
    iconBg: 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white',
  },
  {
    id: 'srv-security-system-installation',
    name: 'Security system installation',
    shortDesc: 'Motion detectors, smart video doorbells, access control keypad & siren systems.',
    categoryTag: 'Smart Security',
    icon: ShieldCheck,
    accentColor: 'text-violet-600',
    iconBg: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
  },
  {
    id: 'srv-solar-installation',
    name: 'Solar installation',
    shortDesc: 'Hybrid inverter design, high-capacity lithium storage & rooftop PV panel mounting.',
    categoryTag: 'Clean Energy',
    icon: Sun,
    accentColor: 'text-amber-500',
    iconBg: 'bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white',
  },
  {
    id: 'srv-switch-and-rope-light-installation',
    name: 'Switch and rope light installation',
    shortDesc: 'Smart touch wall switches, dimmer automation, hidden cove LED & neon flex rope runs.',
    categoryTag: 'Interior Finish',
    icon: Sparkles,
    accentColor: 'text-teal-600',
    iconBg: 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
  },
];

export const Header: React.FC = () => {
  const {
    currentView,
    navigateTo,
    cartCount,
    wishlistCount,
    setIsCartOpen,
    openServiceModal,
    currentUser,
    logout,
    isAdmin,
    products,
    categories,
    services,
    formatNaira,
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll when hamburger menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Filter search results
  const searchResults = searchInput.trim()
    ? {
        products: products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchInput.toLowerCase()) ||
              p.category.toLowerCase().includes(searchInput.toLowerCase()) ||
              p.tags.some((t) => t.toLowerCase().includes(searchInput.toLowerCase()))
          )
          .slice(0, 5),
        services: services
          .filter(
            (s) =>
              s.name.toLowerCase().includes(searchInput.toLowerCase()) ||
              s.shortDesc.toLowerCase().includes(searchInput.toLowerCase())
          )
          .slice(0, 3),
      }
    : { products: [], services: [] };

  const hasSearchResults = searchResults.products.length > 0 || searchResults.services.length > 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setIsSearchFocused(false);
      navigateTo('shop');
    }
  };

  const handleServiceSelect = (serviceName: string) => {
    setIsMobileMenuOpen(false);
    openServiceModal(serviceName);
  };

  const handleCategorySelect = (categoryName: string) => {
    setIsMobileMenuOpen(false);
    navigateTo('shop', { categorySlug: categoryName });
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Lightbulb': return <Lightbulb className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Gem': return <Gem className="w-4 h-4" />;
      case 'Cable': return <Cable className="w-4 h-4" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4" />;
      case 'Camera': return <Camera className="w-4 h-4" />;
      case 'SunMedium': return <SunMedium className="w-4 h-4" />;
      case 'ToggleRight': return <ToggleRight className="w-4 h-4" />;
      case 'Layers': return <Layers className="w-4 h-4" />;
      case 'Grid': return <Grid className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full bg-white shadow-xs">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
        <div className="flex items-center justify-between gap-3 md:gap-8">
          {/* Left Cluster: Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Logo */}
            <div
              id="brand-logo"
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            >
              <div className="w-10 h-10 bg-[#0047AB] rounded-xl flex items-center justify-center shadow-md shadow-blue-200 group-hover:bg-[#002D72] transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-[#002D72]">
                  AJMANTECH
                </span>
                <span className="text-[10px] uppercase tracking-widest font-medium text-slate-500 -mt-1">
                  Let There Be Light
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Search Bar (Centered) */}
          <div ref={searchRef} className="relative hidden md:block flex-1 max-w-lg lg:max-w-xl mx-4 sm:mx-6">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="relative px-4 py-2 bg-slate-100/90 hover:bg-slate-100 rounded-full flex items-center gap-2.5 w-full focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0047AB] focus-within:border-transparent transition-all border border-slate-200/80">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="search-input-desktop"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search products, lighting fixtures, solar, electrical services..."
                  className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
                />
              </div>
            </form>

            {/* Live Autocomplete Dropdown */}
            {isSearchFocused && searchInput.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 min-w-[320px] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {hasSearchResults ? (
                  <>
                    {(searchResults?.products || []).length > 0 && (
                      <div className="p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Products ({(searchResults?.products || []).length})
                        </div>
                        <div className="space-y-1.5">
                          {(searchResults?.products || []).map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setIsSearchFocused(false);
                                navigateTo('product-detail', { productId: prod.id });
                              }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/80 cursor-pointer transition-colors"
                            >
                              <img
                                src={prod.images?.[0] || prod.image || ''}
                                alt={prod.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 truncate">
                                  {prod.name}
                                </h4>
                                <div className="text-[11px] text-[#0047AB] font-bold">
                                  {formatNaira(prod.discountPrice ?? prod.price)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(searchResults?.services || []).length > 0 && (
                      <div className="p-3 bg-slate-50/60">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Electrical Services ({(searchResults?.services || []).length})
                        </div>
                        <div className="space-y-1.5">
                          {(searchResults?.services || []).map((srv) => (
                            <div
                              key={srv.id}
                              onClick={() => {
                                setIsSearchFocused(false);
                                navigateTo('services');
                              }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white cursor-pointer transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0047AB] flex items-center justify-center shrink-0">
                                <Wrench className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 truncate">
                                  {srv.name}
                                </h4>
                                <span className="text-[10px] text-slate-500 line-clamp-1">
                                  {srv.shortDesc}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-2.5 text-center bg-slate-100 text-xs">
                      <button
                        onClick={handleSearchSubmit}
                        className="text-[#0047AB] font-semibold hover:underline cursor-pointer"
                      >
                        View all results for "{searchInput}" &rarr;
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No products or services found for "{searchInput}". Try searching "Bulb", "Chandelier", or "Solar".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Center on Right */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">

            {/* Action Icons */}
            <div className="flex items-center gap-3 text-slate-600">
              {/* Wishlist Button */}
              <button
                id="header-wishlist-btn"
                onClick={() => navigateTo('wishlist')}
                className="relative p-2 rounded-full text-slate-600 hover:text-[#0047AB] hover:bg-slate-100 transition-colors cursor-pointer"
                title="Saved Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <div className="relative">
                <button
                  id="header-cart-btn"
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 rounded-full text-slate-600 hover:text-[#0047AB] hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Shopping Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#0047AB] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>

              {/* User Account Menu */}
              <div className="relative">
                <button
                  id="header-account-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-2 rounded-full text-slate-600 hover:text-[#0047AB] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <User className="w-5 h-5" />
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                </button>

                {/* Account Dropdown */}
                {isUserMenuOpen && (
                  <div
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 divide-y divide-slate-100"
                  >
                    <div className="px-4 py-2">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {currentUser ? currentUser.fullName : 'Guest Visitor'}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigateTo('account');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-[#0047AB] font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile & Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigateTo('track-order');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-[#0047AB] font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        Track An Order
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigateTo('wishlist');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-[#0047AB] font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        My Wishlist ({wishlistCount})
                      </button>
                      <button
                        id="header-admin-portal-link"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigateTo(isAdmin ? 'admin-dashboard' : 'admin-login');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        Admin Portal {isAdmin && <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full">Active</span>}
                      </button>
                    </div>

                    {currentUser && (
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Shop Now Primary Pill Button */}
            <button
              id="header-shop-now-btn"
              onClick={() => navigateTo('shop')}
              className="hidden xl:inline-flex bg-[#0047AB] hover:bg-[#002D72] text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-md shadow-blue-200 transition-all cursor-pointer"
            >
              Shop Now
            </button>

            {/* Hamburger Menu Toggle (Right Side Above) */}
            <button
              id="hamburger-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0047AB] border border-slate-200/90 transition-all flex items-center gap-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#0047AB] shadow-2xs hover:shadow-xs active:scale-95"
              aria-label="Open Navigation Menu and Categories"
              title="Open Menu & Store Highlights"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-[#0047AB]" />
              ) : (
                <Menu className="w-5 h-5 text-[#002D72]" />
              )}
              <span className="hidden sm:inline text-xs font-bold tracking-wide uppercase text-slate-700">
                Menu
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden mt-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative px-3.5 py-2 bg-slate-100 rounded-full flex items-center gap-2.5 w-full border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Hamburger Drawer Menu (Desktop & Mobile) containing all Top Information, Announcements, Shortcuts & Full Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div
            className="relative w-full max-w-md sm:max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu and Highlights"
          >
            <div className="p-5 sm:p-6 space-y-6">
              {/* Drawer Top Header: Brand & Close */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('home');
                  }}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-[#0047AB] rounded-xl flex items-center justify-center shadow-md shadow-blue-200 group-hover:bg-[#002D72] transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg tracking-tight text-[#002D72]">
                      AJMANTECH
                    </span>
                    <span className="text-[10px] uppercase tracking-widest font-medium text-slate-500 -mt-1">
                      Let There Be Light
                    </span>
                  </div>
                </div>

                <button
                  id="drawer-close-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  aria-label="Close menu"
                >
                  <span className="hidden sm:inline">Close</span>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STORE ANNOUNCEMENT & HIGHLIGHTS BANNER (Moved from Top of Website) */}
              <div className="bg-gradient-to-br from-[#002D72] via-[#00388D] to-[#0047AB] text-white rounded-2xl p-4 shadow-lg shadow-blue-900/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-400/20">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Special Store Announcements
                  </span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white/10 text-amber-300 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white tracking-wide uppercase text-[11px] sm:text-xs">
                        FREE DELIVERY ON ORDERS OVER ₦150,000
                      </p>
                      <p className="text-[11px] text-blue-200/90 leading-tight">
                        Safe nationwide dispatch across Lagos, Abuja, Port Harcourt & all states.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-2 border-t border-white/10">
                    <div className="p-1.5 rounded-lg bg-white/10 text-cyan-300 shrink-0 mt-0.5">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white tracking-wide uppercase text-[11px] sm:text-xs">
                        INSTALLATION SERVICES AVAILABLE IN LAGOS & ABUJA
                      </p>
                      <p className="text-[11px] text-blue-200/90 leading-tight">
                        Certified engineers for solar setups, CCTV security, and industrial 3-phase wiring.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-2 border-t border-white/10">
                    <div className="p-1.5 rounded-lg bg-white/10 text-emerald-300 shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white tracking-wide uppercase text-[11px] sm:text-xs">
                        100% GENUINE ELECTRICAL PRODUCTS
                      </p>
                      <p className="text-[11px] text-blue-200/90 leading-tight">
                        Official manufacturer warranties and authentic electrical safety guarantees.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS: TRACK ORDER & DIRECT HOTLINE (Moved from Top of Website) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('track-order');
                  }}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <Package className="w-4 h-4 text-[#0047AB] mb-1.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Track Order</p>
                    <p className="text-[10px] text-slate-500">Live shipment tracking</p>
                  </div>
                </button>

                <a
                  href="https://wa.me/2348075329182"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with us on WhatsApp"
                  className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <Phone className="w-4 h-4 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-emerald-950">+234 807 532 9182</p>
                    <p className="text-[10px] text-emerald-700">WhatsApp & Direct Call</p>
                  </div>
                </a>
              </div>

              {/* ALL PRODUCT CATEGORIES TILES (In Menu Drawer) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-[#0047AB]" />
                    All Categories ({categories?.length || 8})
                  </span>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('categories');
                    }}
                    className="text-[11px] font-bold text-[#0047AB] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Grid</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.name)}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-left transition-all cursor-pointer group flex items-start gap-2.5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 group-hover:border-blue-200 flex items-center justify-center text-[#0047AB] shrink-0 shadow-2xs group-hover:scale-105 transition-transform mt-0.5">
                        {getCategoryIcon(cat.iconName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-[#0047AB] truncate leading-tight">
                          {cat.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {cat.productCount} items
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* QUICK EXPLORE SHORTCUTS (Moved from Sub-navigation Bar) */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Explore Shortcuts
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('shop');
                    }}
                    className="text-left px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>💡</span>
                    <span>Lighting & Fixtures</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('services');
                    }}
                    className="text-left px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Installation & Repairs</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('portfolio');
                    }}
                    className="text-left px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>🏗️</span>
                    <span>Verified Projects</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('services-portal');
                    }}
                    className="text-left px-3 py-2 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-xs font-bold text-cyan-800 transition-colors flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Services Directory</span>
                  </button>
                </div>
              </div>

              {/* PRIMARY SITE NAVIGATION */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                  Main Navigation
                </div>
                <nav className="flex flex-col space-y-1">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('home');
                    }}
                    className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors ${
                      currentView === 'home'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Home
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('shop');
                    }}
                    className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors ${
                      currentView === 'shop'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Shop
                  </button>

                  {/* Accordion for Categories */}
                  <div className="rounded-lg overflow-hidden border border-slate-100">
                    <button
                      onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                      className="w-full flex items-center justify-between text-left text-sm font-semibold py-2.5 px-3 bg-slate-50 text-slate-900"
                    >
                      <span className="flex items-center gap-2">
                        <Grid className="w-4 h-4 text-[#0047AB]" />
                        Shop by Category
                        <span className="text-[10px] bg-blue-100 text-[#0047AB] font-bold px-1.5 py-0.5 rounded-full">
                          {categories?.length || 8}
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform ${
                          isMobileCategoriesOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isMobileCategoriesOpen && (
                      <div className="p-2 space-y-1 bg-white border-t border-slate-100 max-h-64 overflow-y-auto">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat.name)}
                            className="w-full text-left p-2 rounded-md hover:bg-blue-50 text-xs font-medium text-slate-700 flex items-center justify-between group transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="p-1 rounded-md bg-slate-100 group-hover:bg-blue-100 text-[#0047AB] transition-colors shrink-0">
                                {getCategoryIcon(cat.iconName)}
                              </span>
                              <span className="truncate group-hover:text-[#0047AB] font-medium text-slate-800">
                                {cat.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-mono">
                                {cat.productCount}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0047AB]" />
                            </div>
                          </button>
                        ))}
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              navigateTo('categories');
                            }}
                            className="w-full text-center py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs font-bold text-[#0047AB] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Browse All Categories Grid &rarr;</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accordion for Services */}
                  <div className="rounded-lg overflow-hidden border border-slate-100">
                    <button
                      onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                      className="w-full flex items-center justify-between text-left text-sm font-semibold py-2.5 px-3 bg-slate-50 text-slate-900"
                    >
                      <span className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[#0047AB]" />
                        Our Services
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform ${
                          isMobileServicesOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isMobileServicesOpen && (
                      <div className="p-2 space-y-1 bg-white border-t border-slate-100 max-h-60 overflow-y-auto">
                        {ALL_COMPANY_SERVICES.map((srv) => (
                          <button
                            key={srv.id}
                            onClick={() => handleServiceSelect(srv.name)}
                            className="w-full text-left p-2 rounded-md hover:bg-blue-50 text-xs font-medium text-slate-700 flex items-center justify-between group"
                          >
                            <span className="truncate group-hover:text-[#0047AB]">{srv.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0047AB] shrink-0" />
                          </button>
                        ))}
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              navigateTo('services-portal');
                            }}
                            className="w-full text-center py-1.5 px-3 rounded-md bg-cyan-50 text-xs font-bold text-cyan-700 hover:bg-cyan-100 flex items-center justify-center gap-1.5"
                          >
                            <span>⚡</span>
                            <span>Interactive Services Portal</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              navigateTo('services');
                            }}
                            className="w-full text-center py-1.5 text-xs font-bold text-[#0047AB] hover:underline"
                          >
                            View Full Services Page &rarr;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('portfolio');
                    }}
                    className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors ${
                      currentView === 'portfolio'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Projects
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('about');
                    }}
                    className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors ${
                      currentView === 'about'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    About Us
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('blog');
                    }}
                    className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors ${
                      currentView === 'blog'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Blog
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('contact');
                    }}
                    className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors ${
                      currentView === 'contact'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Contact
                  </button>
                </nav>
              </div>

              {/* BOOK INSTALLATION CTA */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openServiceModal();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold text-center flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/10 transition-transform active:scale-[0.99]"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Book A Certified Electrician</span>
                </button>
              </div>
            </div>

            {/* DRAWER FOOTER: SHOWROOM ADDRESS, HOURS & SOCIAL MEDIA */}
            <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 space-y-3.5 text-xs text-slate-600">
              <div>
                <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <span>AjmanTech Services</span>
                  <span className="text-[10px] text-[#0047AB] font-normal italic">“Let There Be Light”</span>
                </p>
                <div className="mt-1.5 space-y-1 text-[11px] text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0047AB] shrink-0" />
                    <span>Plot 14 Commercial Ave, Ikeja / Lekki, Lagos</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Mon – Sat: 8:00 AM – 6:30 PM (Sun: On-Call)</span>
                  </p>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Connect with us:</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://web.facebook.com/profile.php?id=61552688677268"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="AjmanTech on Facebook"
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a
                    href="https://instagram.com/AJMANTECHSERVICES"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="AjmanTech on Instagram"
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href="https://wa.me/2348075329182"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with us on WhatsApp"
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

