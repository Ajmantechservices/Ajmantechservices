import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  Building,
  Wrench,
  CheckCircle2,
  Phone,
  MessageCircle,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  const { navigateTo, openWhatsApp } = useStore();

  return (
    <div id="about-us-page-view" className="space-y-16 sm:space-y-20 pb-16">
      {/* Hero Header */}
      <section className="bg-slate-950 text-white py-16 sm:py-24 text-center relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 fill-amber-400" />
            Our Heritage & Commitment
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Illuminating Nigerian Homes & Powering Sustainable Living
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            At AjmanTech Services, our mission is simple yet transformative: <strong>“Let There Be Light”</strong>. We combine premium certified lighting supplies with seasoned electrical engineering labor.
          </p>
        </div>
      </section>

      {/* Story & Vision */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">The AjmanTech Journey</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 leading-tight">
              Bridging the Gap Between Luxury Lighting & Reliable Workmanship
            </h2>
            <p>
              Founded in Lagos, Nigeria, <strong>AjmanTech Services</strong> was established to solve a critical frustration for Nigerian homeowners and building contractors: the prevalence of substandard, counterfeit electrical fixtures and unsafe wiring practices.
            </p>
            <p>
              We established direct distribution partnerships with global lighting manufacturers and solar fabricators, ensuring that every crystal chandelier, smart bulb, and inverter module delivers guaranteed performance and is built to withstand Nigerian grid fluctuations.
            </p>
            <p>
              Today, AjmanTech operates as a full-service electrical powerhouse — delivering luxury fixtures to your door and deploying licensed electrical engineers to execute flawless conduit piping, DB installations, and solar power plants.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
                <div className="font-bold text-slate-900 text-sm">Certified Quality</div>
                <p className="text-[11px] text-slate-600">All fixtures inspected and warrantied for 1–2 years.</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
                <div className="font-bold text-slate-900 text-sm">Engineering Depth</div>
                <p className="text-[11px] text-slate-600">Over 500+ projects completed across Nigeria.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 aspect-4/3 bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop"
                alt="AjmanTech Luxury Electrical Project"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Core Principles</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              What Defines AjmanTech Services
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
              <h3 className="font-bold text-white text-base">Uncompromising Integrity</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero fake products. Every bulb, driver, and breaker is 100% genuine and performance-tested.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
              <Wrench className="w-8 h-8 text-amber-400" />
              <h3 className="font-bold text-white text-base">Electrical Safety</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We follow rigid NEMSA electrical codes to prevent domestic fire hazards, surges, and shorts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
              <Users className="w-8 h-8 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Client-Centric Care</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated WhatsApp support, rapid response logistics, and post-installation follow-ups.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
              <Award className="w-8 h-8 text-purple-400" />
              <h3 className="font-bold text-white text-base">Craftsmanship</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clean cable dressing, invisible conduit chases, and immaculate crystal chandelier hanging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-blue-700 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl text-center sm:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Ready to Light Up Your Space?</h3>
            <p className="text-xs sm:text-sm text-blue-100">
              Browse our complete catalog or book our team for an on-site electrical survey.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigateTo('shop')}
              className="py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md"
            >
              Shop Catalog
            </button>
            <button
              onClick={() => openWhatsApp('Hello AjmanTech Services, I want to talk to your lighting specialists.')}
              className="py-3.5 px-6 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
