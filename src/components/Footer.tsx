import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  CreditCard,
  Building,
} from 'lucide-react';
import { ViewState } from '../types';

export const Footer: React.FC = () => {
  const { navigateTo, storeSettings, openWhatsApp } = useStore();

  const handleCategoryClick = (catSlug: string) => {
    navigateTo('shop', { categorySlug: catSlug });
  };

  return (
    <footer id="main-footer" className="bg-[#002D72] text-slate-200 border-t border-blue-900">
      {/* Top Value Proposition Grid */}
      <div className="border-b border-blue-800/80 bg-[#001F52] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">100% Genuine Products</h4>
              <p className="text-[11px] text-blue-200">Direct from certified global manufacturers</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Certified Electricians</h4>
              <p className="text-[11px] text-blue-200">NEMSA standard wiring & installations</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Nationwide Delivery</h4>
              <p className="text-[11px] text-blue-200">Fast door-to-door delivery across Nigeria</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">1–2 Years Warranty</h4>
              <p className="text-[11px] text-blue-200">Comprehensive replacement coverage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand & Bio Column */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={() => navigateTo('home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#002D72] flex items-center justify-center shadow-md font-bold">
                <Sparkles className="w-5 h-5 fill-[#002D72]" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  AJMANTECH SERVICES
                </span>
                <p className="text-xs font-semibold text-amber-300 uppercase tracking-widest">
                  “Let There Be Light”
                </p>
              </div>
            </div>

            <p className="text-xs text-blue-100/90 leading-relaxed max-w-sm font-light">
              AjmanTech Services is Nigeria's foremost one-stop electrical and lighting provider. We supply luxury chandeliers, energy-saving LED systems, CCTV cameras, solar power, and deploy certified electrical engineers for residential, commercial, and industrial projects nationwide.
            </p>

            {/* Direct Contact Snippets */}
            <div className="space-y-2 pt-2 text-xs text-blue-100 font-light">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                <span>{storeSettings.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{storeSettings.phone} / {storeSettings.altPhone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{storeSettings.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-300 shrink-0" />
                <span>{storeSettings.openingHours}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-3">
              <a
                href={storeSettings.socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={storeSettings.socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={storeSettings.socialLinks.twitter}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={storeSettings.socialLinks.linkedin}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop Categories */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-blue-800 pb-2">
              Shop Lighting
            </h3>
            <ul className="space-y-2 text-xs text-blue-100 font-light">
              <li>
                <button
                  onClick={() => handleCategoryClick('Bulbs')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  💡 LED & Energy Saving Bulbs
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Fancy Lights')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  ✨ Fancy & Wall Sconces
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Chandeliers')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  💎 Crystal & Luxury Chandeliers
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Rope & Strip Lights')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  🪢 Silicone Rope & Strip Lights
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Security & Solar Lights')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  🔦 Solar & Security Floodlights
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('CCTV & Surveillance')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  📹 CCTV & Smart Cameras
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Solar & Inverters')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  ☀️ Hybrid Inverters & Lithium Banks
                </button>
              </li>
            </ul>
          </div>

          {/* Electrical Services */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-blue-800 pb-2">
              Electrical Services
            </h3>
            <ul className="space-y-2 text-xs text-blue-100 font-light">
              <li>
                <button
                  onClick={() => navigateTo('services')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  ⚡ Home & Conduit Wiring
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('services')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  ☀️ Solar System Setup
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('services')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  💎 Chandelier Rigging & Hanging
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('services')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  💡 Architectural LED Design
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('services')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  📹 CCTV Security Cabling
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('services')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  🔧 Emergency Electrical Faults
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('services')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  📐 3D Lighting Design Consultation
                </button>
              </li>
            </ul>
          </div>

          {/* Customer & Company Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-blue-800 pb-2">
              Customer Care
            </h3>
            <ul className="space-y-2 text-xs text-blue-100 font-light">
              <li>
                <button
                  onClick={() => navigateTo('track-order')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  📦 Track Your Order
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('account')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  👤 My Customer Account
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('wishlist')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  ❤️ Saved Wishlist
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('portfolio')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  🏆 Projects & Previous Work
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('blog')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  📰 Electrical & Lighting Blog
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('contact')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  📞 Contact & Showroom Address
                </button>
              </li>
              <li>
                <button
                  onClick={() => openWhatsApp('Hello AjmanTech Services, I need assistance with an order/inquiry.')}
                  className="text-emerald-300 hover:text-emerald-200 font-semibold flex items-center gap-1.5 pt-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-emerald-300 text-emerald-950" />
                  Chat on WhatsApp
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Payment Methods */}
      <div className="border-t border-blue-900 bg-[#001F52] py-6 text-xs text-blue-200 font-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span>© {new Date().getFullYear()} AjmanTech Services Nigeria Ltd. All Rights Reserved.</span>
            <span className="text-amber-300 font-medium hidden sm:inline">• “Let There Be Light”</span>
            <span className="text-slate-500">•</span>
            <button
              id="footer-admin-link"
              onClick={() => navigateTo('admin')}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors inline-flex items-center gap-1 cursor-pointer font-normal"
              title="Admin Access"
            >
              Admin
            </button>
          </div>

          <div className="flex items-center gap-3 text-blue-200 text-[11px]">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-blue-300" />
              Direct Bank Transfer (Zenith Bank)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
              Mastercard / Visa / Verve
            </span>
            <span>•</span>
            <span>Pay on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
