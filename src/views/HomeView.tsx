import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Wrench,
  MessageCircle,
  Sun,
  Lightbulb,
  Gem,
  Cable,
  ShieldAlert,
  Camera,
  SunMedium,
  ToggleRight,
  CheckCircle2,
  Star,
  Clock,
  ChevronDown,
  ShoppingBag,
  Zap,
  Award,
  Users,
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    products,
    categories,
    services,
    projects,
    blogPosts,
    faqs,
    navigateTo,
    openServiceModal,
    openWhatsApp,
    formatNaira,
  } = useStore();

  const [activeFaq, setActiveFaq] = useState<string | null>('faq-01');

  // Flash sale countdown simulation
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 20 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 6);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 6);

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
    <div className="space-y-12 sm:space-y-16 pb-16 bg-[#F8F9FB]">
      {/* 3. HERO SECTION - PROFESSIONAL POLISH */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <section id="hero-section" className="relative min-h-[440px] lg:h-[480px] bg-slate-900 flex items-center px-6 sm:px-12 lg:px-16 overflow-hidden rounded-3xl shadow-xl">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent z-10" />
          <div
            className="absolute inset-0 opacity-60 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1540608801476-6e9858653267?auto=format&fit=crop&q=80&w=1200')`,
            }}
          />

          {/* Hero Content */}
          <div className="relative z-20 max-w-xl py-12 sm:py-0">
            <span className="inline-block bg-[#0047AB] text-white text-[10px] font-bold px-3.5 py-1 rounded-full mb-4 uppercase tracking-[0.2em] shadow-sm">
              Premium Lighting & Electrical
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 tracking-tight">
              LET THERE BE <span className="text-blue-400">LIGHT</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-200 mb-8 leading-relaxed font-light">
              High-end electrical components, architectural lighting, and professional installation services for luxury Nigerian homes and offices.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                id="hero-shop-cta"
                onClick={() => navigateTo('shop')}
                className="bg-white text-[#002D72] hover:bg-slate-100 px-8 py-3.5 rounded-full font-bold text-sm shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                id="hero-services-cta"
                onClick={() => navigateTo('services')}
                className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 px-8 py-3.5 rounded-full font-bold text-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <Wrench className="w-4 h-4 text-blue-300" />
                <span>Our Services</span>
              </button>
            </div>
          </div>

          {/* Hero Floating Stats Card */}
          <div className="hidden lg:flex absolute right-12 bottom-8 z-20 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl gap-6 shadow-2xl">
            <div className="text-center min-w-[70px]">
              <div className="text-white text-2xl font-bold">1.5k+</div>
              <div className="text-white/70 text-[10px] uppercase tracking-wider font-medium mt-0.5">Products</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center min-w-[70px]">
              <div className="text-white text-2xl font-bold">500+</div>
              <div className="text-white/70 text-[10px] uppercase tracking-wider font-medium mt-0.5">Projects</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center min-w-[70px]">
              <div className="text-white text-2xl font-bold">24/7</div>
              <div className="text-white/70 text-[10px] uppercase tracking-wider font-medium mt-0.5">Support</div>
            </div>
          </div>
        </section>
      </div>

      {/* 4. SHOP BY CATEGORY - PROFESSIONAL POLISH */}
      <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-6">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold text-[#002D72]">Shop By Category</h2>
            <div className="h-1 w-12 bg-[#0047AB] rounded-full mt-1.5" />
          </div>
          <button
            onClick={() => navigateTo('categories')}
            className="text-sm font-semibold text-[#0047AB] hover:text-[#002D72] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All Collections</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigateTo('shop', { categorySlug: cat.name })}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all group flex flex-col items-center text-center cursor-pointer"
            >
              <div className="w-16 h-16 bg-blue-50 text-[#0047AB] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                {getCategoryIcon(cat.iconName)}
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1 group-hover:text-[#0047AB] transition-colors">
                {cat.name}
              </h3>
              <p className="text-[10px] text-slate-500 line-clamp-1">
                {cat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* DUAL PROMO BANNERS: FEATURED PRODUCT + INSTALLATION SERVICE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Featured Highlight Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center gap-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-100 rounded-xl overflow-hidden shrink-0">
              <img
                src="https://images.unsplash.com/photo-1558211583-d28f610b15a0?auto=format&fit=crop&q=80&w=300"
                alt="Modern Crystal Chandelier"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                <span className="text-amber-400 text-xs">★★★★★</span>
                <span className="text-slate-400 text-[10px] uppercase font-bold ml-1">(48 Reviews)</span>
              </div>
              <h4 className="font-bold text-base text-slate-900">Modern Crystal Chandelier</h4>
              <div className="text-[#0047AB] font-bold text-lg mb-3">
                ₦245,000 <span className="text-slate-400 font-normal text-xs line-through ml-2">₦280,000</span>
              </div>
              <button
                onClick={() => navigateTo('product-detail', { productId: 'prod-01' })}
                className="text-xs font-bold bg-[#0047AB] hover:bg-[#002D72] text-white px-5 py-2 rounded-full shadow-md transition-colors cursor-pointer"
              >
                Add to Cart
              </button>
            </div>
          </div>

          {/* Installation Promo Card */}
          <div className="bg-[#002D72] p-6 sm:p-7 rounded-2xl shadow-lg relative overflow-hidden text-white flex flex-col justify-between">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
            <div className="relative z-10">
              <h4 className="text-white font-bold text-lg mb-1">Need Installation?</h4>
              <p className="text-blue-100 text-xs mb-5 max-w-sm leading-relaxed">
                Professional electrical wiring, solar setup, and lighting design by our certified engineering team in Lagos & Abuja.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => openServiceModal()}
                  className="bg-white text-[#002D72] hover:bg-slate-100 px-5 py-2.5 rounded-full text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  Request Service
                </button>
                <button
                  onClick={() => openWhatsApp('Hello AjmanTech Services, I need an electrical installation / inspection.')}
                  className="text-white hover:text-green-300 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-green-400 fill-green-400" />
                  <span>Chat on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURED LIGHTING */}
      <section id="featured-products" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">Handpicked Quality</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002D72] mt-1">
              Featured Lighting & Electricals
            </h2>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="text-xs font-bold text-[#0047AB] hover:text-[#002D72] flex items-center gap-1 group cursor-pointer"
          >
            <span>Browse Full Shop</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 6. WHY CHOOSE AJMANTECH */}
      <section id="why-choose-us" className="bg-[#002D72] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">The AjmanTech Advantage</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Why Homeowners & Contractors Choose AjmanTech
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-light">
              Combining world-class electrical products with certified on-site engineering expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Guaranteed Quality Products</h3>
              <p className="text-xs text-blue-100/90 leading-relaxed font-light">
                Carefully selected, heavy-duty lighting and electrical accessories engineered to withstand Nigerian voltage fluctuations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Professional Installation</h3>
              <p className="text-xs text-blue-100/90 leading-relaxed font-light">
                Experienced electrical engineers for safe chandelier rigging, conduit wiring, solar setups, and smart automation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Reliable Nigerian Support</h3>
              <p className="text-xs text-blue-100/90 leading-relaxed font-light">
                Direct communication before and after purchase via WhatsApp, phone, and at our physical Lagos showroom.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Lighting & Lux Expertise</h3>
              <p className="text-xs text-blue-100/90 leading-relaxed font-light">
                Helping you choose the ideal color temperature, lumens, and sizing tailored to your specific architectural layout.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Convenient Shopping</h3>
              <p className="text-xs text-blue-100/90 leading-relaxed font-light">
                Shop online with bank transfer/card or order in 1-click via WhatsApp with real-time stock confirmations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Trusted Service & Warranty</h3>
              <p className="text-xs text-blue-100/90 leading-relaxed font-light">
                Every purchase is backed by 1 to 2 years full replacement warranty and professional workmanship guarantee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SPECIAL OFFERS & FLASH SALES */}
      <section id="special-offers" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-[#002D72] p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-blue-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold uppercase">
                <Zap className="w-3.5 h-3.5 fill-white" /> Special Flash Sale
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                Up to 25% Off Luxury Chandeliers & Solar Floodlights
              </h3>

              <p className="text-xs sm:text-sm text-blue-100 max-w-lg leading-relaxed font-light">
                Upgrade your home lighting with premium crystals and zero-electricity outdoor solar fixtures. Use coupon code <strong className="text-white font-mono bg-white/20 px-2 py-0.5 rounded">AJMANLIGHT10</strong> at checkout.
              </p>

              {/* Countdown Stepper */}
              <div className="flex items-center gap-3 pt-2">
                <div className="bg-black/30 border border-white/20 px-3.5 py-2 rounded-xl text-center min-w-[60px]">
                  <div className="text-lg sm:text-xl font-bold text-amber-300">{timeLeft.hours}</div>
                  <div className="text-[10px] text-blue-200 uppercase font-medium">Hours</div>
                </div>
                <span className="text-amber-300 font-bold">:</span>
                <div className="bg-black/30 border border-white/20 px-3.5 py-2 rounded-xl text-center min-w-[60px]">
                  <div className="text-lg sm:text-xl font-bold text-amber-300">{timeLeft.minutes}</div>
                  <div className="text-[10px] text-blue-200 uppercase font-medium">Mins</div>
                </div>
                <span className="text-amber-300 font-bold">:</span>
                <div className="bg-black/30 border border-white/20 px-3.5 py-2 rounded-xl text-center min-w-[60px]">
                  <div className="text-lg sm:text-xl font-bold text-amber-300">{timeLeft.seconds}</div>
                  <div className="text-[10px] text-blue-200 uppercase font-medium">Secs</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <button
                onClick={() => navigateTo('shop')}
                className="py-3.5 px-6 rounded-full bg-white hover:bg-slate-100 text-[#002D72] font-bold text-xs shadow-lg transition-colors text-center cursor-pointer"
              >
                Shop Discounted Deals &rarr;
              </button>
              <button
                onClick={() => openWhatsApp('Hello AjmanTech Services, I want to claim the Special Flash Offer discounts.')}
                className="py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition-colors text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Claim Deal on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. ELECTRICAL SERVICES SHOWCASE */}
      <section id="services-section" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">Engineering & Labor</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002D72] mt-1">
              Professional Electrical Services
            </h2>
          </div>
          <button
            onClick={() => navigateTo('services')}
            className="text-xs font-bold text-[#0047AB] hover:text-[#002D72] flex items-center gap-1 group cursor-pointer"
          >
            <span>Explore All 8 Services</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.slice(0, 4).map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={srv.image}
                    alt={srv.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#002D72]/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {srv.category}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#0047AB] transition-colors">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {srv.shortDesc}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 space-y-2">
                <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                  {srv.pricingNote}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openServiceModal(srv.name)}
                    className="w-full py-2 px-2 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-[11px] font-bold text-center cursor-pointer transition-colors"
                  >
                    Request
                  </button>
                  <button
                    onClick={() => openWhatsApp(`Hello AjmanTech Services, I want to book: ${srv.name}.`)}
                    className="w-full py-2 px-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FEATURED PROJECTS / PORTFOLIO */}
      <section id="portfolio-section" className="bg-slate-100/70 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">Proof of Excellence</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002D72] mt-1">
                Featured Projects & Previous Work
              </h2>
            </div>
            <button
              onClick={() => navigateTo('portfolio')}
              className="text-xs font-bold text-[#0047AB] hover:text-[#002D72] flex items-center gap-1 group cursor-pointer"
            >
              <span>View Full Gallery</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.slice(0, 3).map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigateTo('portfolio')}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col"
              >
                <div className="relative h-56 overflow-hidden bg-slate-200">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-3 left-3 bg-[#002D72]/90 text-white text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-xs">
                    📍 {proj.location}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#0047AB] uppercase tracking-wider">
                      {proj.category}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 group-hover:text-[#0047AB] transition-colors">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
                    <span>{proj.serviceProvided}</span>
                    <span className="font-bold text-[#0047AB]">&rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. BEST SELLERS */}
      <section id="best-sellers" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">Top Rated by Customers</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002D72] mt-1">
              AjmanTech Best Sellers
            </h2>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="text-xs font-bold text-[#0047AB] hover:text-[#002D72] flex items-center gap-1 group cursor-pointer"
          >
            <span>View All Best Sellers</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestSellers.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 11. HOW ORDERING WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">Simple & Fast</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002D72]">
            How Ordering Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Seamless shopping and delivery tailored to Nigerian clients.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs relative">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0047AB] font-extrabold text-sm flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Find Your Product</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Browse categories or search for chandeliers, solar floodlights, switches, or CCTV cameras.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs relative">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0047AB] font-extrabold text-sm flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Add to Cart</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose your quantity, wattage, or color temperature options and check instant availability.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs relative">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0047AB] font-extrabold text-sm flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Checkout</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter delivery address and pay via Bank Transfer, Card, or Pay on Delivery in Lagos/Abuja.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs relative">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0047AB] font-extrabold text-sm flex items-center justify-center mb-4">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Receive & Install</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track your parcel door-to-door, and have our licensed electricians install it safely.
            </p>
          </div>
        </div>

        {/* WhatsApp Alternative Banner */}
        <div className="mt-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <MessageCircle className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">Prefer Ordering on WhatsApp?</h4>
              <p className="text-xs text-emerald-700">Contact our sales reps directly for instant product quotes and custom inquiries.</p>
            </div>
          </div>
          <button
            onClick={() => openWhatsApp('Hello AjmanTech Services, I would like to order directly on WhatsApp.')}
            className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors shrink-0 cursor-pointer"
          >
            Chat With Sales Rep
          </button>
        </div>
      </section>

      {/* 12. CUSTOMER TESTIMONIALS */}
      <section id="testimonials" className="bg-[#002D72] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">Client Reviews</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              What Our Nigerian Customers Say
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-light">
              Trusted by luxury homeowners, facility managers, and business owners nationwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-300">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-300" />
                  ))}
                </div>
                <p className="text-xs text-blue-50 italic leading-relaxed font-light">
                  "The 3-ring crystal chandelier is breathtaking in my new duplex in Ikoyi! The crystal quality is top-notch, and the AjmanTech installation team came the very next day to fix it safely. Excellent service."
                </p>
              </div>
              <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">Chief Emeka Okonkwo</div>
                  <div className="text-[11px] text-blue-200">Ikoyi, Lagos</div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full">Verified Buyer</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-300">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-300" />
                  ))}
                </div>
                <p className="text-xs text-blue-50 italic leading-relaxed font-light">
                  "The 300W solar floodlight stays on until 6:30 AM every morning even during cloudy days. It lit up my whole compound in Gwarinpa. Truly worth every naira!"
                </p>
              </div>
              <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">Amina Bello</div>
                  <div className="text-[11px] text-blue-200">Gwarinpa, Abuja</div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full">Verified Buyer</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-amber-300">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-300" />
                  ))}
                </div>
                <p className="text-xs text-blue-50 italic leading-relaxed font-light">
                  "Installed their 8-channel CCTV system for our church premises. The color night vision is crystal clear and remote viewing on my phone works smoothly."
                </p>
              </div>
              <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">Pastor David Adebayo</div>
                  <div className="text-[11px] text-blue-200">Ikeja, Lagos</div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full">Verified Buyer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13. ELECTRICAL & LIGHTING BLOG */}
      <section id="blog-section" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">Guides & Tips</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002D72] mt-1">
              Electrical & Lighting Resources
            </h2>
          </div>
          <button
            onClick={() => navigateTo('blog')}
            className="text-xs font-bold text-[#0047AB] hover:text-[#002D72] flex items-center gap-1 group cursor-pointer"
          >
            <span>Read All Articles</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts.slice(0, 3).map((post) => (
            <div
              key={post.id}
              onClick={() => navigateTo('blog-detail', { blogId: post.id })}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-[#0047AB] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#0047AB] transition-colors leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <span className="text-xs font-bold text-[#0047AB] group-hover:underline flex items-center gap-1">
                  Read Article &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 14. FAQ ACCORDION */}
      <section id="faq-section" className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002D72]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Everything you need to know about purchasing, delivery, and installation.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.slice(0, 6).map((faq) => {
            const isOpen = activeFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-xs transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-[#0047AB] cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-[#0047AB]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 15. WHATSAPP CALL TO ACTION */}
      <section id="whatsapp-banner" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-slate-900 p-8 sm:p-12 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-200 flex items-center gap-1.5 justify-center sm:justify-start">
              <Sparkles className="w-4 h-4" /> Instant Response Guarantee
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Need Lighting Advice or An Urgent Electrical Inspection?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 font-light">
              Chat directly with our licensed electrical consultants and chandelier mounting engineers right now on WhatsApp.
            </p>
          </div>

          <button
            onClick={() => openWhatsApp('Hello AjmanTech Services, I would like to speak with an electrical consultant.')}
            className="py-3.5 px-8 rounded-full bg-white text-emerald-950 font-extrabold text-sm shadow-xl hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            <span>Chat on WhatsApp</span>
          </button>
        </div>
      </section>
    </div>
  );
};
