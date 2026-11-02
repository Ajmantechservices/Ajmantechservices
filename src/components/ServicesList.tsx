import React from 'react';
import { useStore } from '../context/StoreContext';
import { realProducts, ServiceProductItem } from '../data/services';
import {
  Sun,
  Cpu,
  Zap,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

// Also re-export realProducts from this component file for flexible imports
export { realProducts };
export type { ServiceProductItem };

interface ServicesListProps {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  className?: string;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  title = 'Flagship Electrical & Engineering Services',
  subtitle = 'Turnkey renewable power, smart home automation, and certified infrastructure wiring engineered by licensed specialists.',
  showHeader = true,
  className = '',
}) => {
  const { openServiceModal, openWhatsApp } = useStore();

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sun':
        return <Sun className="w-6 h-6 text-amber-500" />;
      case 'Cpu':
        return <Cpu className="w-6 h-6 text-indigo-500" />;
      case 'Zap':
      default:
        return <Zap className="w-6 h-6 text-blue-500" />;
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Power Systems':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          accent: 'from-amber-500 to-amber-600',
          borderHover: 'hover:border-amber-300',
        };
      case 'Automation':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          accent: 'from-indigo-500 to-indigo-600',
          borderHover: 'hover:border-indigo-300',
        };
      case 'Electrical':
      default:
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          accent: 'from-[#0047AB] to-[#002D72]',
          borderHover: 'hover:border-blue-300',
        };
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {showHeader && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0047AB]/10 text-[#0047AB] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Specialized Engineering Solutions
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002D72] tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-slate-500 font-light leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Guaranteed Workmanship & Safety Certified</span>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {realProducts.map((service) => {
          const theme = getCategoryTheme(service.category);
          return (
            <div
              key={service.id}
              className={`bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${theme.borderHover}`}
            >
              <div className="space-y-4">
                {/* Header row with Icon and Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    {getIcon(service.iconName)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${theme.bg}`}
                    >
                      {service.category}
                    </span>
                    {service.badge && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {service.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-[#002D72] group-hover:text-[#0047AB] transition-colors leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-light leading-relaxed mt-2">
                    {service.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 pb-1 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    Pricing
                  </span>
                  <span className="text-sm font-extrabold text-[#0047AB] bg-blue-50/80 px-2.5 py-0.5 rounded-md">
                    {service.price}
                  </span>
                </div>

                {/* Features Checklist */}
                {service.features && service.features.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Scope of Works Includes:
                    </p>
                    <ul className="space-y-1.5">
                      {service.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-600 font-light"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => openServiceModal(service.title)}
                  className="w-full py-2.5 px-3 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/10 transition-all cursor-pointer hover:translate-y-[-1px]"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Get Quote</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      `Hello Engr. Joshua / AjmanTech Services, I would like to request a Custom Quote for: "${service.title}" (${service.category}). Please let me know the details and schedule.`
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
