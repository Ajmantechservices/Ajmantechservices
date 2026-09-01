import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  MapPin,
  Calendar,
  Wrench,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';

export const PortfolioView: React.FC = () => {
  const { projects, openServiceModal, openWhatsApp } = useStore();
  const [filterCat, setFilterCat] = useState<string>('All');

  const categories = ['All', 'Residential Lighting', 'Solar Power', 'Commercial Security', 'Architectural Wiring'];

  const filteredProjects =
    filterCat === 'All'
      ? (projects || [])
      : (projects || []).filter((p) => (p.category || '').toLowerCase().includes(filterCat.toLowerCase()));

  return (
    <div id="portfolio-page-view" className="space-y-12 sm:space-y-16 pb-16">
      {/* Hero Header */}
      <section className="bg-slate-950 text-white py-16 sm:py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-slate-900/80 px-3.5 py-1 rounded-full border border-slate-800">
            Proven Track Record Across Nigeria
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Our Featured Electrical & Lighting Projects
          </h1>
          <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Take a look inside private mansions, luxury duplexes, corporate headquarters, and estates completed by the AjmanTech engineering crew.
          </p>
        </div>
      </section>

      {/* Main Filter & Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterCat === cat
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(filteredProjects || []).map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-64 overflow-hidden bg-slate-200">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-lg">
                    {proj.category}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs text-slate-900 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-blue-700" />
                    <span>{proj.location}</span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="text-[11px] text-slate-400 font-medium">{proj.completedDate}</div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-700">
                    <div>
                      <strong className="text-slate-900">Service Scope:</strong> {proj.serviceProvided}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-2">
                <button
                  onClick={() => openServiceModal(proj.serviceProvided)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Request Similar Installation
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp Custom Project Inquiry */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white">Have a Unique Architectural Project?</h3>
            <p className="text-xs text-slate-400">
              Send your building blueprints, AutoCAD drawings, or room ceiling measurements to our chief electrical consultant on WhatsApp.
            </p>
          </div>
          <button
            onClick={() => openWhatsApp('Hello AjmanTech Services, I would like to share architectural plans for a project quotation.')}
            className="py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors flex items-center gap-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            Send Plans on WhatsApp
          </button>
        </div>
      </section>
    </div>
  );
};
