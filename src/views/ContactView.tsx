import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Send,
  Sparkles,
  CheckCircle2,
  Building,
} from 'lucide-react';

export const ContactView: React.FC = () => {
  const { storeSettings, openWhatsApp, showToast } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Product Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;
    setIsSubmitted(true);
    showToast('Your message has been sent to our customer care team!');
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
  };

  return (
    <div id="contact-page-view" className="space-y-12 sm:space-y-16 pb-16">
      {/* Top Banner */}
      <section className="bg-slate-950 text-white py-16 sm:py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            We are Here to Help
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Contact AjmanTech Services
          </h1>
          <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Visit our Lagos showroom, speak with our sales advisors, or chat directly on WhatsApp.
          </p>
        </div>
      </section>

      {/* Main Grid: Contact Info + Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Info Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Showroom & Office Location
              </h2>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Physical Address:</h4>
                    <p className="text-slate-600 mt-0.5">{storeSettings.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Hotlines:</h4>
                    <p className="text-slate-600 mt-0.5 font-semibold">
                      {storeSettings.phone} / {storeSettings.altPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Email:</h4>
                    <p className="text-slate-600 mt-0.5">{storeSettings.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Business Hours:</h4>
                    <p className="text-slate-600 mt-0.5">{storeSettings.openingHours}</p>
                  </div>
                </div>
              </div>

              {/* Instant WhatsApp Card */}
              <div className="pt-2">
                <button
                  onClick={() => openWhatsApp('Hello AjmanTech Services, I would like to contact your customer care.')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Start Instant WhatsApp Chat</span>
                </button>
              </div>
            </div>

            {/* Map Preview Card */}
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 p-4 text-center space-y-2">
              <div className="h-44 rounded-2xl bg-slate-200 flex flex-col items-center justify-center text-slate-500 space-y-1">
                <MapPin className="w-8 h-8 text-blue-700 animate-bounce" />
                <span className="font-bold text-xs text-slate-800">AjmanTech Lagos Showroom</span>
                <span className="text-[11px] text-slate-500">Ikeja / Allen Avenue Hub, Lagos</span>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Send Us an Inquiry</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Have a question about a product or bulk electrical order? Fill out the form below and we will get back to you promptly.
                </p>
              </div>

              {isSubmitted ? (
                <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="font-bold text-emerald-950 text-base">Message Sent Successfully!</h3>
                  <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                    Thank you for reaching out to AjmanTech Services. A customer service representative will call or email you shortly.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="py-2 px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Chukwuemeka Obi"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08023456789"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="Product Inquiry">Product Inquiry</option>
                        <option value="Chandelier Installation">Chandelier Installation</option>
                        <option value="Solar Quote">Solar & Inverter Quote</option>
                        <option value="Bulk Contractor Order">Bulk Contractor / Wholesale Order</option>
                        <option value="Warranty / Return">Warranty / Support</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Your Message *
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what product or service you need assistance with..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
