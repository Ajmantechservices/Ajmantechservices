import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Wrench,
  Calendar,
  Clock,
  MapPin,
  UploadCloud,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Phone,
  User,
  Mail,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

export const ServiceBookingModal: React.FC = () => {
  const {
    isServiceModalOpen,
    setIsServiceModalOpen,
    serviceModalDefaultType,
    services,
    createServiceRequest,
    currentUser,
    openWhatsApp,
  } = useStore();

  const [serviceId, setServiceId] = useState<string>(() => {
    if (serviceModalDefaultType) {
      const match = services.find((s) => s.slug === serviceModalDefaultType || s.name === serviceModalDefaultType);
      if (match) return match.id;
    }
    return services[0]?.id || 'srv-home-wiring';
  });

  const [customerName, setCustomerName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [state, setState] = useState('Lagos');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<
    'Morning (9:00 AM - 12:00 PM)' | 'Afternoon (1:00 PM - 4:00 PM)' | 'Evening (4:00 PM - 7:00 PM)'
  >('Morning (9:00 AM - 12:00 PM)');
  const [description, setDescription] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  if (!isServiceModalOpen) return null;

  const selectedServiceObj = services.find((s) => s.id === serviceId) || services[0];

  const handleSimulatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Create local object URL for instant preview
      const fakeUrl = URL.createObjectURL(e.target.files[0]);
      setUploadedPhotos((prev) => [...prev, fakeUrl]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address || !description) {
      alert('Please fill in your name, phone, address, and job description.');
      return;
    }

    const req = createServiceRequest({
      serviceId: selectedServiceObj.id,
      serviceName: selectedServiceObj.name,
      customerName,
      email,
      phone,
      state,
      city: city || state,
      address,
      preferredDate,
      preferredTimeSlot,
      description,
      imageAttachments: uploadedPhotos,
    });

    setSubmittedTicket(req.ticketNumber);
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setIsServiceModalOpen(false);
  };

  const handleWhatsAppBooking = () => {
    const msg = `Hello AjmanTech Services, I would like to request an installation/electrical service: ${selectedServiceObj?.name}. Location: ${city ? city + ', ' : ''}${state}. Date: ${preferredDate}. Details: ${description || 'Please call me to discuss.'}`;
    openWhatsApp(msg);
  };

  const nigerianStates = [
    'Lagos',
    'Abuja (FCT)',
    'Rivers',
    'Oyo',
    'Ogun',
    'Enugu',
    'Anambra',
    'Edo',
    'Delta',
    'Kano',
    'Kaduna',
    'Akwa Ibom',
    'Cross River',
    'Imo',
    'Abia',
    'Ondo',
    'Osun',
    'Ekiti',
    'Kwara',
    'Plateau',
    'Other State',
  ];

  return (
    <div
      id="service-booking-modal"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleResetAndClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-[#002D72] text-white p-5 sm:p-6 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-[#002D72] flex items-center justify-center font-bold shadow-md">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Request Electrical Service / Installation</h3>
              <p className="text-xs text-blue-200 font-light">Certified technicians deployed across Nigeria</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {submittedTicket ? (
          <div className="p-8 sm:p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Ticket Generated: {submittedTicket}
              </span>
              <h3 className="text-2xl font-extrabold text-[#002D72]">
                Your Service Request Has Been Received!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-light">
                An AjmanTech senior electrical engineer has been assigned to review your request for{' '}
                <strong>{selectedServiceObj.name}</strong>. We will call you on <strong>{phone}</strong> to confirm the exact schedule and quote.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-left max-w-md mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-800">{selectedServiceObj.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Preferred Date:</span>
                <span className="font-semibold text-slate-800">{preferredDate} ({preferredTimeSlot})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Site Location:</span>
                <span className="font-semibold text-slate-800">{city || state}, {state}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleWhatsAppBooking}
                className="w-full sm:w-auto py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Follow up on WhatsApp with Ticket #{submittedTicket}
              </button>
              <button
                onClick={handleResetAndClose}
                className="w-full sm:w-auto py-3 px-6 rounded-full bg-[#002D72] hover:bg-blue-900 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Service Selection */}
            <div>
              <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-2">
                1. Select Required Service *
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.pricingNote})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0047AB]" />
                  Preferred Inspection Date *
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0047AB]" />
                  Time Slot *
                </label>
                <select
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                >
                  <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                  <option value="Afternoon (1:00 PM - 4:00 PM)">Afternoon (1:00 PM - 4:00 PM)</option>
                  <option value="Evening (4:00 PM - 7:00 PM)">Evening (4:00 PM - 7:00 PM)</option>
                </select>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider">
                2. Contact & Site Location
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name *"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number (WhatsApp preferred) *"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                >
                  {nigerianStates.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City / Area (e.g. Lekki, Ikeja, Maitama) *"
                  className="w-full sm:col-span-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  required
                />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full Street Address & Landmark *"
                  className="w-full sm:col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  required
                />
              </div>
            </div>

            {/* Description & Photo Upload */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider">
                3. Job Details & Photos
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe your requirement (e.g. ceiling height for chandelier, number of rooms for wiring, solar load details, or nature of electrical fault) *"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                required
              />

              {/* Upload Simulation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                  <span>Upload Site Photos (Room ceiling, DB Panel, or Floorplan)</span>
                  <span className="text-slate-400 font-normal">Optional</span>
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-[#0047AB] rounded-2xl p-4 text-center bg-slate-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSimulatePhotoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-700 font-medium">Click or Drag images to upload</p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, PDF up to 10MB</p>
                </div>

                {uploadedPhotos.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {uploadedPhotos.map((url, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200">
                        <img src={url} alt="upload" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                className="w-full sm:flex-1 py-3 px-5 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wrench className="w-4 h-4" />
                Submit Service Request
              </button>

              <button
                type="button"
                onClick={handleWhatsAppBooking}
                className="w-full sm:w-auto py-3 px-5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                Book via WhatsApp
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
