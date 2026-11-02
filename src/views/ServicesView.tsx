import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  Wrench,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageCircle,
  Calendar,
  Zap,
  ArrowRight,
  Sun,
  Camera,
  Layers,
  Award,
} from 'lucide-react';

import { ServicesList } from '../components/ServicesList';

export const ServicesView: React.FC = () => {
  const { services, openServiceModal, openWhatsApp, navigateTo } = useStore();

  return (
    <div id="services-page-view" className="space-y-16 sm:space-y-20 pb-16">
      {/* Top Banner */}
      <section className="bg-[#002D72] text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider">
            <Wrench className="w-4 h-4 text-amber-300" />
            Lead Engineer: Engr. Abiodun Ajayi (NEMSA & COREN Certified)
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Professional Installation & Electrical Solutions in Nigeria
          </h1>

          <p className="text-sm sm:text-base text-blue-100 font-light leading-relaxed">
            From luxury high-ceiling chandelier rigging and conduit house wiring to hybrid solar power and CCTV surveillance. Handled safely by licensed electrical engineer <strong className="text-white font-semibold">Engr. Abiodun Ajayi</strong>. All services go directly to WhatsApp for custom quote & price negotiation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <button
              onClick={() =>
                openWhatsApp(
                  'Hello Engr. Abiodun Ajayi, I would like to negotiate the price for electrical installation services with you.'
                )
              }
              className="px-8 py-3.5 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#16a34a]" />
              <span>Negotiate Price on WhatsApp</span>
            </button>
            <button
              onClick={() => navigateTo('services-portal')}
              className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-white/20"
            >
              <span>⚡</span>
              <span>Services Portal Directory</span>
            </button>
          </div>
        </div>
      </section>

      {/* Flagship Real Products & Solutions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <ServicesList
          title="Core Engineering & Installation Solutions"
          subtitle="Explore our 3 primary electrical engineering disciplines with transparent custom quote requests and instant WhatsApp consultation."
        />
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">Full Service Directory</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002D72] mt-1">
            Complete Installation & Maintenance Catalog
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(services || []).map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-60 overflow-hidden bg-slate-100">
                  <img
                    src={srv.image}
                    alt={srv.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-[#002D72]/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                    {srv.category}
                  </span>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <h3 className="text-xl font-bold text-[#002D72] group-hover:text-[#0047AB] transition-colors">
                    {srv.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
                    {srv.description}
                  </p>

                  {/* Included Scope List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-[#002D72] uppercase tracking-wider">
                      Service Inclusions:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(srv.features || []).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions - Direct to WhatsApp for Price Negotiation */}
              <div className="p-6 sm:p-8 pt-0 space-y-3">
                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <span>💰 Pricing: Custom Quote</span>
                  <span className="font-bold text-[#16a34a]">Negotiate on WhatsApp</span>
                </div>

                <button
                  onClick={() =>
                    openWhatsApp(
                      `Hello Engr. Abiodun Ajayi / AjmanTech Services, I would like to negotiate the price for your service: "${srv.name}" (${srv.category}). Please let me know your rates and project availability.`
                    )
                  }
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-[#16a34a]" />
                  <span>Negotiate Price on WhatsApp with Engr. Abiodun</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety & Compliance Assurance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#002D72] text-white rounded-3xl p-8 sm:p-12 border border-blue-900 shadow-md">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              NEMSA Compliant Engineering
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Strict Electrical Safety Standards Guaranteed
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-light leading-relaxed">
              Faulty electrical wiring and poor load balancing are leading causes of domestic fire hazards in Nigeria. At AjmanTech Services, every installation adheres strictly to standard electrical codes, proper earth grounding, surge protection, and high-tensile chandelier rigging anchors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 mt-8 border-t border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 text-blue-200 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Licensed Electricians</p>
                <p className="text-blue-200 font-light">Certified by technical boards</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 text-amber-300 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Surge & Earthing Checks</p>
                <p className="text-blue-200 font-light">Full grounding diagnostics</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 text-emerald-300 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Service Warranty</p>
                <p className="text-blue-200 font-light">6-month workmanship guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
