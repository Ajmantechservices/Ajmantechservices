import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  User,
  Package,
  Wrench,
  Heart,
  MapPin,
  LogOut,
  ShieldCheck,
  Calendar,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

export const CustomerAccountView: React.FC = () => {
  const {
    currentUser,
    login,
    loginWithGoogle,
    register,
    logout,
    orders,
    serviceRequests,
    wishlist,
    formatNaira,
    navigateTo,
    showToast,
    isAdmin,
  } = useStore();

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dashboard Tab state
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'addresses' | 'profile'>('orders');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both your email/phone and password.', 'error');
      return;
    }
    setIsSubmitting(true);
    const result = login(email, password);
    setIsSubmitting(false);
    if (!result.success) {
      showToast(result.message, 'error');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      showToast('Please fill in your name, email, and password.', 'error');
      return;
    }
    if (password.length < 4) {
      showToast('Password should be at least 4 characters long.', 'error');
      return;
    }
    setIsSubmitting(true);
    const result = register({
      email,
      fullName,
      phone: phone || '+234',
      password,
      role: 'customer',
    });
    setIsSubmitting(false);
    if (!result.success) {
      showToast(result.message, 'error');
    }
  };

  const handleGoogleSignIn = () => {
    if (loginWithGoogle) {
      const promptEmail = prompt('Enter your Gmail address to sign in:', email || 'joshua@gmail.com');
      if (promptEmail && promptEmail.trim()) {
        loginWithGoogle({ email: promptEmail.trim() });
      }
    }
  };

  // If Not Logged In
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#0047AB]/10 text-[#0047AB] flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#002D72]">
            {authMode === 'login' ? 'Sign In to Your Account' : 'Create Customer Account'}
          </h1>
          <p className="text-xs text-slate-500 font-light">
            Track orders, view electrical service bookings, and save delivery preferences.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-full bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 rounded-full transition-colors cursor-pointer ${
              authMode === 'login' ? 'bg-white text-[#002D72] shadow-xs' : 'text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 rounded-full transition-colors cursor-pointer ${
              authMode === 'register' ? 'bg-white text-[#002D72] shadow-xs' : 'text-slate-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Auth Forms */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Email Address or Phone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com or 08012345678"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>Sign In to Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Babatunde Adeleke"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Email Address (e.g. Gmail)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0802 345 6789"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>Create My Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Google / Gmail Sign-in Option */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <div className="relative flex items-center justify-center">
              <span className="absolute inset-x-0 h-px bg-slate-200" />
              <span className="relative bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Or Quick Login
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google / Gmail</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If Logged In: Show Customer Dashboard
  return (
    <div id="customer-account-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#002D72] to-[#0047AB] text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#002D72]">
                {currentUser.fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0047AB]/10 text-[#0047AB] text-[10px] font-bold uppercase">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-light mt-0.5">{currentUser.email} • {currentUser.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <button
              onClick={() => navigateTo('admin')}
              className="py-2 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin Portal
            </button>
          )}

          <button
            onClick={logout}
            className="py-2 px-4 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-[#002D72] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>

      {/* Main Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-3 space-y-1 shadow-xs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'orders' ? 'bg-[#0047AB] text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({(orders || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'services' ? 'bg-[#0047AB] text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Installation Requests ({(serviceRequests || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'addresses' ? 'bg-[#0047AB] text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery Addresses</span>
          </button>

          <button
            onClick={() => navigateTo('wishlist')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>My Wishlist ({(wishlist || []).length})</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#002D72]">Order History</h2>
              {(orders || []).length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-3">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-light">You have not placed any product orders yet.</p>
                  <button
                    onClick={() => navigateTo('shop')}
                    className="py-2.5 px-6 rounded-full bg-[#0047AB] text-white text-xs font-bold hover:bg-[#002D72] transition-colors cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {(orders || []).map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0047AB] bg-[#0047AB]/10 px-2.5 py-0.5 rounded-full">
                            #{ord.orderNumber}
                          </span>
                          <span className="text-slate-400 font-light">• {new Date(ord.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status}
                          </span>
                          <span className="font-bold text-[#002D72] text-sm">{formatNaira(ord.total ?? ord.totalAmount ?? 0)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {(ord.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                            <div className="flex items-center gap-2 truncate max-w-sm">
                              <img
                                src={item.productImage || item.image || ''}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                              />
                              <span className="truncate font-medium">{item.productName || item.title || 'Product'}</span>
                              <span className="text-slate-400 font-light">x{item.quantity}</span>
                            </div>
                            <span className="font-semibold text-slate-900">{formatNaira((item.price || 0) * (item.quantity || 1))}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 font-light">
                          Shipped to: {ord.deliveryAddress?.city || ord.customer?.city || 'Lagos'}, {ord.deliveryAddress?.state || ord.customer?.state || 'Lagos'}
                        </span>
                        <button
                          onClick={() =>
                            navigateTo('track-order', {
                              orderNumber: ord.orderNumber,
                              email: ord.customer?.email || ord.customerEmail || currentUser?.email,
                              token: ord.id,
                            })
                          }
                          className="text-xs font-bold text-[#0047AB] hover:text-[#002D72] cursor-pointer"
                        >
                          Track Package &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SERVICE BOOKINGS */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#002D72]">Electrical Service Requests</h2>
                <button
                  onClick={() => navigateTo('services')}
                  className="py-2 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  + Book New Service
                </button>
              </div>

              {(serviceRequests || []).length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-3">
                  <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-light">You have no active electrical service bookings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(serviceRequests || []).map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
                        <div>
                          <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
                            Ticket #{req.ticketNumber}
                          </span>
                          <h4 className="font-bold text-[#002D72] text-sm mt-1">{req.serviceName}</h4>
                        </div>
                        <span
                          className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            req.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-700">Scheduled Date:</span> {req.preferredDate} ({req.preferredTimeSlot})
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Site Location:</span> {req.address}, {req.city}, {req.state}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 font-light">
                        <strong className="text-slate-900 font-semibold">Job Description:</strong> {req.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-4 shadow-xs">
              <h2 className="text-lg font-bold text-[#002D72]">Primary Delivery Address</h2>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{currentUser.fullName}</span>
                  <span className="text-[10px] bg-[#0047AB]/10 text-[#0047AB] px-2.5 py-0.5 rounded-full font-bold">Default</span>
                </div>
                <p className="text-slate-600 font-light">
                  {currentUser.defaultAddress?.streetAddress || 'Plot 14 Admiralty Way, Lekki Phase 1'}
                </p>
                <p className="text-slate-600 font-light">
                  {currentUser.defaultAddress?.city || 'Lekki'}, {currentUser.defaultAddress?.state || 'Lagos State'}
                </p>
                <p className="text-slate-500 font-mono text-[11px]">Phone: {currentUser.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
