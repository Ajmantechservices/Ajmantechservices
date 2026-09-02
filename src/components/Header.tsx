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
    services,
    formatNaira,
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const servicesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsServicesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleServicesMouseEnter = () => {
    if (servicesTimeoutRef.current) {
      clearTimeout(servicesTimeoutRef.current);
    }
    setIsServicesDropdownOpen(true);
  };

  const handleServicesMouseLeave = () => {
    servicesTimeoutRef.current = setTimeout(() => {
      setIsServicesDropdownOpen(false);
    }, 200);
  };

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
    setIsServicesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    openServiceModal(serviceName);
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full bg-white shadow-xs">
      {/* Top Announcement Bar */}
      <div className="bg-[#002D72] text-white text-xs py-1.5 px-4 sm:px-8 border-b border-[#002255]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-semibold tracking-wider">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              FREE DELIVERY ON ORDERS OVER ₦150,000
            </span>
            <span className="hidden md:inline text-blue-300/40">—</span>
            <span className="hidden md:inline-flex items-center gap-1 text-white">
              <Truck className="w-3.5 h-3.5 text-blue-300" />
              INSTALLATION SERVICES AVAILABLE IN LAGOS & ABUJA
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => navigateTo('track-order')}
              className="hover:text-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-blue-300" />
              <span>Track Order</span>
            </button>
            <span className="text-blue-300/40">|</span>
            <a
              href="tel:+2348023456789"
              className="hover:text-blue-200 transition-colors flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5 text-blue-300" />
              <span className="font-semibold">+234 802 345 6789</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4 md:gap-8">
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

          {/* Desktop Navigation Links Strip */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 font-medium text-sm text-slate-600">
            <button
              onClick={() => navigateTo('home')}
              className={`transition-all relative pb-1 cursor-pointer ${
                currentView === 'home'
                  ? 'text-[#0047AB] font-bold border-b-2 border-[#0047AB]'
                  : 'hover:text-[#0047AB] text-slate-600'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => navigateTo('shop')}
              className={`transition-all relative pb-1 cursor-pointer ${
                currentView === 'shop'
                  ? 'text-[#0047AB] font-bold border-b-2 border-[#0047AB]'
                  : 'hover:text-[#0047AB] text-slate-600'
              }`}
            >
              Shop
            </button>

            <button
              onClick={() => navigateTo('categories')}
              className={`transition-all relative pb-1 cursor-pointer ${
                currentView === 'categories'
                  ? 'text-[#0047AB] font-bold border-b-2 border-[#0047AB]'
                  : 'hover:text-[#0047AB] text-slate-600'
              }`}
            >
              Categories
            </button>

            {/* OUR SERVICES INTERACTIVE DROPDOWN */}
            <div
              ref={servicesDropdownRef}
              className="relative"
              onMouseEnter={handleServicesMouseEnter}
              onMouseLeave={handleServicesMouseLeave}
            >
              <button
                id="header-services-menu-btn"
                onClick={() => {
                  setIsServicesDropdownOpen(!isServicesDropdownOpen);
                }}
                className={`transition-all relative pb-1 cursor-pointer flex items-center gap-1.5 font-medium ${
                  currentView === 'services' || isServicesDropdownOpen
                    ? 'text-[#0047AB] font-bold border-b-2 border-[#0047AB]'
                    : 'hover:text-[#0047AB] text-slate-600'
                }`}
                aria-haspopup="true"
                aria-expanded={isServicesDropdownOpen}
              >
                <span>Our Services</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isServicesDropdownOpen ? 'rotate-180 text-[#0047AB]' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* SERVICES DROPDOWN MEGA-MENU */}
              {isServicesDropdownOpen && (
                <div
                  id="services-dropdown-panel"
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[720px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0047AB] flex items-center justify-center">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#002D72] uppercase tracking-wider">
                          Our Engineering & Installation Services
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal">
                          Certified electrical engineers serving Lagos, Abuja, and nationwide
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsServicesDropdownOpen(false);
                        navigateTo('services');
                      }}
                      className="text-xs font-bold text-[#0047AB] hover:text-[#002D72] flex items-center gap-1 group cursor-pointer"
                    >
                      <span>View All Services</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* 2-Column Multi-Grid for 10 Services */}
                  <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {ALL_COMPANY_SERVICES.map((service) => {
                      const IconComponent = service.icon;
                      return (
                        <div
                          key={service.id}
                          onClick={() => handleServiceSelect(service.name)}
                          className="group relative flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition-all cursor-pointer text-left"
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${service.iconBg}`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#0047AB] transition-colors leading-tight">
                                {service.name}
                              </h5>
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 group-hover:bg-white group-hover:text-[#0047AB] transition-colors">
                                {service.categoryTag}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-light leading-snug mt-0.5 line-clamp-2">
                              {service.shortDesc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dropdown Bottom Quick-Action CTA Banner */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 p-3.5 rounded-b-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>COREN & NEMSA standard compliance • Guaranteed workmanship</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsServicesDropdownOpen(false);
                          openServiceModal();
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Book An Electrician</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigateTo('portfolio')}
              className={`transition-all relative pb-1 cursor-pointer ${
                currentView === 'portfolio'
                  ? 'text-[#0047AB] font-bold border-b-2 border-[#0047AB]'
                  : 'hover:text-[#0047AB] text-slate-600'
              }`}
            >
              Projects
            </button>

            <button
              onClick={() => navigateTo('about')}
              className={`transition-all relative pb-1 cursor-pointer ${
                currentView === 'about'
                  ? 'text-[#0047AB] font-bold border-b-2 border-[#0047AB]'
                  : 'hover:text-[#0047AB] text-slate-600'
              }`}
            >
              About Us
            </button>

            <button
              onClick={() => navigateTo('blog')}
              className={`transition-all relative pb-1 cursor-pointer ${
                currentView === 'blog'
                  ? 'text-[#0047AB] font-bold border-b-2 border-[#0047AB]'
                  : 'hover:text-[#0047AB] text-slate-600'
              }`}
            >
              Blog
            </button>

            <button
              onClick={() => navigateTo('contact')}
              className={`transition-all relative pb-1 cursor-pointer ${
                currentView === 'contact'
                  ? 'text-[#0047AB] font-bold border-b-2 border-[#0047AB]'
                  : 'hover:text-[#0047AB] text-slate-600'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Desktop Search Bar & Action Center */}
          <div className="flex items-center gap-4 xl:gap-5">
            {/* Desktop Search Bar with Live Suggestions */}
            <div ref={searchRef} className="relative hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative px-3.5 py-2 bg-slate-100/90 hover:bg-slate-100 rounded-full flex items-center gap-2.5 w-44 lg:w-56 focus-within:w-72 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0047AB] focus-within:border-transparent transition-all border border-slate-200/80">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    id="search-input-desktop"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search products..."
                    className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
                  />
                </div>
              </form>

              {/* Live Autocomplete Dropdown */}
              {isSearchFocused && searchInput.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 min-w-[300px] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100 max-h-96 overflow-y-auto">
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
              className="hidden sm:inline-flex bg-[#0047AB] hover:bg-[#002D72] text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg shadow-blue-200 transition-all cursor-pointer"
            >
              Shop Now
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-full text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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

      {/* Desktop Main Sub-Navigation Bar Strip */}
      <div className="hidden lg:block bg-slate-50/90 border-t border-slate-100 py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs font-semibold text-slate-700">
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">
              Quick Explore:
            </span>
            <button
              onClick={() => navigateTo('shop')}
              className="hover:text-[#0047AB] transition-colors cursor-pointer"
            >
              Lighting & Fixtures
            </button>
            <button
              onClick={() => navigateTo('services')}
              className="hover:text-[#0047AB] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              Installation & Repairs
            </button>
            <button
              onClick={() => navigateTo('portfolio')}
              className="hover:text-[#0047AB] transition-colors cursor-pointer"
            >
              Verified Projects
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Genuine Electrical Products
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[110px] bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-4/5 max-w-xs bg-white h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                Menu Navigation
              </div>
              <nav className="flex flex-col space-y-1.5">
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

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigateTo('categories');
                  }}
                  className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors ${
                    currentView === 'categories'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Categories
                </button>

                {/* Mobile Accordion for Services */}
                <div className="rounded-lg overflow-hidden border border-slate-100">
                  <button
                    onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                    className="w-full flex items-center justify-between text-left text-sm font-semibold py-2 px-3 bg-slate-50 text-slate-900"
                  >
                    <span className="flex items-center gap-1.5">
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
                      <div className="pt-2 border-t border-slate-100">
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

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openServiceModal();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Wrench className="w-4 h-4" />
                  Book An Installation
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 text-xs text-slate-500">
              <p className="font-semibold text-slate-900 mb-1">AjmanTech Services</p>
              <p>“Let There Be Light”</p>
              <p className="mt-2 text-emerald-600 font-medium">+234 802 345 6789</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

