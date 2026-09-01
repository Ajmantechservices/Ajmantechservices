import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { MessageCircle, X, Sparkles, Send } from 'lucide-react';

export const WhatsAppFloatingButton: React.FC = () => {
  const { openWhatsApp, storeSettings } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  const quickPrompts = [
    'I want to inquire about chandelier prices and installation.',
    'I need an urgent electrician for electrical fault diagnostics.',
    'Can I get a solar system quote for my home/duplex?',
    'Is same-day delivery available to my location today?',
  ];

  const handleSend = (text: string) => {
    openWhatsApp(text);
    setIsOpen(false);
  };

  return (
    <div id="whatsapp-floating-widget" className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Pop-up Quick Chat Box */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#002D72] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 fill-white" />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#002D72]" />
              </div>
              <div>
                <h4 className="font-bold text-sm">AjmanTech WhatsApp</h4>
                <p className="text-[11px] text-blue-200 flex items-center gap-1 font-light">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Typically replies in minutes
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-[#F8F9FB] space-y-3">
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-xs border border-slate-200/80 text-xs text-slate-800 space-y-1">
              <p className="font-bold text-[#002D72]">Hello! 👋</p>
              <p className="font-light">Welcome to <strong>AjmanTech Services</strong>. How can our electrical and lighting team help you today?</p>
            </div>

            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Inquiries:</p>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left text-xs p-2.5 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80 text-slate-700 transition-colors flex items-center justify-between cursor-pointer shadow-xs"
                >
                  <span className="line-clamp-1 font-light">{prompt}</span>
                  <Send className="w-3 h-3 text-emerald-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="pt-2 flex gap-2">
              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customMsg.trim()) {
                    handleSend(customMsg);
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
              />
              <button
                onClick={() => handleSend(customMsg.trim() || 'Hello AjmanTech Services, I need assistance.')}
                className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors shadow-sm"
                title="Send to WhatsApp"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        id="btn-floating-whatsapp"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ring-4 ring-emerald-600/20"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
        <span className="hidden sm:inline">Order on WhatsApp</span>
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
        </span>
      </button>
    </div>
  );
};
