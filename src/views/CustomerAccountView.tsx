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
} from 'lucide-react';

export const CustomerAccountView: React.FC = () => {
  const {
    currentUser,
    login,
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

  // Dashboard Tab state
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'addresses' | 'profile'>('orders');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const success = login(email, password);
    if (success) {
      showToast(`Welcome back!`);
    } else {
      showToast('Invalid credentials. Please check your email and password.', 'error');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !phone) return;
    const success = register({
      email,
      fullName,
      phone,
      password,
      role: 'customer',
    });
    if (success) {
      showToast('Account successfully created! You are now logged in.');
    } else {
      showToast('An account with this email already exists.', 'error');
    }
  };

  // Quick Demo Logins
  const handleQuickDemoCustomer = () => {
    login('babatunde@example.ng', 'password123');
    showToast('Signed in as Babatunde Adeleke');
  };

  const handleQuickAdmin = () => {
    login('admin@ajmantech.ng', 'admin123');
    showToast('Signed in as AjmanTech Admin');
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
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Sign In
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
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08023456789"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Create My Account
              </button>
            </form>
          )}

          {/* Quick Demo Logins Box */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Quick Test Sign In:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickDemoCustomer}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-[#002D72] text-xs font-semibold cursor-pointer transition-colors"
              >
                Demo Customer
              </button>
              <button
                type="button"
                onClick={handleQuickAdmin}
                className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer transition-colors"
              >
                Store Admin
              </button>
            </div>
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
            <span>My Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'services' ? 'bg-[#0047AB] text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Installation Requests ({serviceRequests.length})</span>
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
            <span>My Wishlist ({wishlist.length})</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#002D72]">Order History</h2>
              {orders.length === 0 ? (
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
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0047AB] bg-[#0047AB]/10 px-2.5 py-0.5 rounded-full">
                            #{ord.orderNumber}
                          </span>
                          <span className="text-slate-400 font-light">• {new Date(ord.createdAt).toLocaleDateString()}</span>
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
                          <span className="font-bold text-[#002D72] text-sm">{formatNaira(ord.totalAmount)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                            <div className="flex items-center gap-2 truncate max-w-sm">
                              <img
                                src={item.productImage}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                              />
                              <span className="truncate font-medium">{item.productName}</span>
                              <span className="text-slate-400 font-light">x{item.quantity}</span>
                            </div>
                            <span className="font-semibold text-slate-900">{formatNaira(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 font-light">
                          Shipped to: {ord.deliveryAddress.city}, {ord.deliveryAddress.state}
                        </span>
                        <button
                          onClick={() => navigateTo('track-order')}
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

              {serviceRequests.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-3">
                  <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-light">You have no active electrical service bookings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceRequests.map((req) => (
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
