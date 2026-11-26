import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { UserAddress } from '../types';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';
import { Order } from '../types';
import {
  User,
  Package,
  Wrench,
  Heart,
  MapPin,
  LogOut,
  Lock,
  Mail,
  Phone,
  LayoutDashboard,
  Eye,
  EyeOff,
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ShoppingBag,
  Settings,
  FileText,
  ShieldAlert,
  Clock,
  Truck,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const NIGERIAN_STATES = [
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

export const CustomerAccountView: React.FC = () => {
  const {
    currentUser,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUserProfile,
    orders,
    serviceRequests,
    wishlist,
    toggleWishlist,
    products,
    addToCart,
    customerAddresses,
    addCustomerAddress,
    updateCustomerAddress,
    deleteCustomerAddress,
    setDefaultCustomerAddress,
    formatNaira,
    navigateTo,
    showToast,
    isAdmin,
    accessDeniedMessage,
    clearAccessDeniedMessage,
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
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'addresses' | 'wishlist' | 'profile'>('orders');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Personal Profile Editor state
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address Book Editor state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('Lagos');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileFullName(currentUser.fullName || '');
      setProfilePhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Please enter both your email address and password.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        showToast(result.message, 'error');
      } else if (result.role === 'admin') {
        navigateTo('admin-dashboard');
      } else {
        navigateTo('account');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) {
      showToast('Please fill in your full name, email address, and password.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password should be at least 6 characters long.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await register({
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
      });
      if (!result.success) {
        showToast(result.message, 'error');
      } else if (result.requiresEmailConfirmation) {
        setAuthMode('login');
      } else {
        navigateTo('account');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        showToast(res.message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddrLabel('Home');
    setAddrFullName(currentUser?.fullName || '');
    setAddrPhone(currentUser?.phone || '');
    setAddrStreet('');
    setAddrCity('');
    setAddrState('Lagos');
    setAddrIsDefault(customerAddresses.length === 0);
    setShowAddressForm(true);
  };

  const handleOpenEditAddress = (addr: UserAddress) => {
    setEditingAddress(addr);
    setAddrLabel(addr.title || 'Home');
    setAddrFullName(addr.fullName || currentUser?.fullName || '');
    setAddrPhone(addr.phone || currentUser?.phone || '');
    setAddrStreet(addr.streetAddress || addr.fullAddress || '');
    setAddrCity(addr.city || '');
    setAddrState(addr.state || 'Lagos');
    setAddrIsDefault(Boolean(addr.isDefault));
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim() || !addrCity.trim() || !addrState.trim()) {
      showToast('Please enter street address, city, and state.', 'error');
      return;
    }
    setIsSavingAddress(true);
    try {
      if (editingAddress) {
        await updateCustomerAddress({
          ...editingAddress,
          title: addrLabel.trim() || 'Home',
          fullName: addrFullName.trim() || currentUser?.fullName || '',
          phone: addrPhone.trim() || currentUser?.phone || '',
          streetAddress: addrStreet.trim(),
          fullAddress: addrStreet.trim(),
          city: addrCity.trim(),
          state: addrState.trim(),
          isDefault: addrIsDefault,
        });
      } else {
        await addCustomerAddress({
          title: addrLabel.trim() || 'Home',
          fullName: addrFullName.trim() || currentUser?.fullName || '',
          phone: addrPhone.trim() || currentUser?.phone || '',
          streetAddress: addrStreet.trim(),
          fullAddress: addrStreet.trim(),
          city: addrCity.trim(),
          state: addrState.trim(),
          isDefault: addrIsDefault,
        });
      }
      setShowAddressForm(false);
      setEditingAddress(null);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFullName.trim()) {
      showToast('Full name cannot be empty.', 'error');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateUserProfile({
        fullName: profileFullName.trim(),
        phone: profilePhone.trim(),
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Resolve customer wishlist products strictly from their own wishlist IDs
  const wishProductIds = new Set(
    (wishlist || []).map((w: any) => (typeof w === 'string' ? w : w?.productId))
  );
  const wishlistProducts = (products || []).filter((p) => wishProductIds.has(p.id));

  // If Not Logged In
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16 space-y-8">
        {accessDeniedMessage && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{accessDeniedMessage}</span>
            </div>
            <button
              type="button"
              onClick={clearAccessDeniedMessage}
              className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#0047AB]/10 text-[#0047AB] flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#002D72]">
            {authMode === 'login' ? 'Sign In to Your Account' : 'Create Customer Account'}
          </h1>
          <p className="text-xs text-slate-500 font-light">
            Track orders, view electrical service bookings, and manage your saved delivery addresses.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-full bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 rounded-full transition-colors cursor-pointer ${
              authMode === 'login' ? 'bg-white text-[#002D72] shadow-xs' : 'text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
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
                    placeholder="e.g. yourname@gmail.com"
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
                <span>{isSubmitting ? 'Signing In...' : 'Sign In to Account'}</span>
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
                  Email Address
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
                    placeholder="At least 6 characters"
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
                <span>{isSubmitting ? 'Creating Account...' : 'Create My Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Google OAuth Sign-in Option */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <div className="relative flex items-center justify-center">
              <span className="absolute inset-x-0 h-px bg-slate-200" />
              <span className="relative bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Or Quick Login
              </span>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
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
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged In: Show Private Customer Dashboard
  return (
    <div id="customer-account-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {accessDeniedMessage && (
        <div
          id="customer-access-denied-banner"
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Access Denied</p>
              <p className="text-rose-700 font-light mt-0.5">{accessDeniedMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearAccessDeniedMessage}
            className="p-1 text-rose-500 hover:text-rose-800 cursor-pointer shrink-0"
            aria-label="Dismiss access denied alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#002D72] to-[#0047AB] text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {(currentUser.fullName || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#002D72]">
                {currentUser.fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0047AB]/10 text-[#0047AB] text-[10px] font-bold uppercase">
                {isAdmin ? 'Admin' : 'Customer'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-light mt-0.5">
              {currentUser.email} {currentUser.phone ? `• ${currentUser.phone}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <button
              onClick={() => navigateTo('admin-dashboard')}
              className="py-2 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin Control Center
            </button>
          )}

          <button
            onClick={() => void logout()}
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
            <span>Delivery Addresses ({customerAddresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'wishlist' ? 'bg-[#0047AB] text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'wishlist' ? 'text-white' : 'text-rose-500'}`} />
            <span>My Wishlist ({wishlistProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'profile' ? 'bg-[#0047AB] text-white' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Account Details</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#002D72]">My Order History</h2>
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
                          <span className="text-slate-400 font-light">
                            • {new Date(ord.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'shipped' || ord.status === 'out_for_delivery'
                                ? 'bg-blue-100 text-blue-800'
                                : ord.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {String(ord.status || 'pending').replace(/_/g, ' ')}
                          </span>
                          <span className="font-bold text-[#002D72] text-sm">
                            {formatNaira(ord.total ?? ord.totalAmount ?? 0)}
                          </span>
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
                            <span className="font-semibold text-slate-900">
                              {formatNaira((item.price || 0) * (item.quantity || 1))}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 font-light">
                          Delivery: {ord.deliveryAddress?.streetAddress || ord.customer?.address || 'Address provided at checkout'}, {ord.deliveryAddress?.city || ord.customer?.city || ''}, {ord.deliveryAddress?.state || ord.customer?.state || ''}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setReceiptOrder(ord)}
                            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#002D72] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrderId((prev) => (prev === ord.id ? null : ord.id))
                            }
                            className="px-3.5 py-1.5 rounded-full bg-[#0047AB]/10 hover:bg-[#0047AB]/20 text-[#0047AB] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Truck className="w-3 h-3" />
                            <span>{expandedOrderId === ord.id ? 'Hide Status' : 'View Status'}</span>
                            {expandedOrderId === ord.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {expandedOrderId === ord.id && (
                        <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#002D72] uppercase tracking-wider text-[11px]">
                              Order Status & Shipment Progress
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              Payment: <strong className="uppercase text-slate-800">{ord.paymentStatus || 'pending'}</strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { key: 'pending', label: 'Order Placed' },
                              { key: 'processing', label: 'Processing' },
                              { key: 'shipped', label: 'Dispatched' },
                              { key: 'delivered', label: 'Delivered' },
                            ].map((st, idx) => {
                              const statusRank =
                                ord.status === 'delivered'
                                  ? 3
                                  : ord.status === 'shipped' || ord.status === 'out_for_delivery' || ord.status === 'dispatched'
                                  ? 2
                                  : ord.status === 'processing' || ord.status === 'confirmed'
                                  ? 1
                                  : ord.status === 'cancelled'
                                  ? -1
                                  : 0;
                              const active = statusRank >= 0 && idx <= statusRank;
                              return (
                                <div
                                  key={st.key}
                                  className={`p-2.5 rounded-xl border flex items-center gap-1.5 ${
                                    active
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                                      : 'bg-white border-slate-200 text-slate-400'
                                  }`}
                                >
                                  {active ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                  )}
                                  <span className="text-[11px] truncate">{st.label}</span>
                                </div>
                              );
                            })}
                          </div>

                          {ord.trackingHistory && ord.trackingHistory.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
                              {ord.trackingHistory.map((step, sIdx) => (
                                <div key={sIdx} className="flex items-start justify-between gap-2 text-[11px] text-slate-600">
                                  <span>
                                    <strong className="text-slate-800">{step.title}:</strong> {step.description}
                                  </span>
                                  {step.timestamp && (
                                    <span className="text-slate-400 shrink-0">
                                      {new Date(step.timestamp).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INSTALLATION & SERVICE REQUESTS */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#002D72]">My Installation & Service Requests</h2>
                <button
                  onClick={() => navigateTo('services')}
                  className="py-2 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  + Book New Installation
                </button>
              </div>

              {(serviceRequests || []).length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-3">
                  <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-light">You have no active electrical installation requests.</p>
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
                              : req.status === 'scheduled'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-700">Appointment:</span> {req.preferredDate} ({req.preferredTimeSlot})
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Site Location:</span> {req.address}, {req.city}, {req.state}
                        </div>
                        {req.assignedTechnician && (
                          <div>
                            <span className="font-semibold text-slate-700">Assigned Engineer:</span> {req.assignedTechnician}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 font-light">
                        <strong className="text-slate-900 font-semibold">Job Description:</strong> {req.description}
                      </p>

                      {req.internalNotes && (
                        <p className="text-xs text-blue-900 bg-blue-50/70 p-3 rounded-2xl border border-blue-100 font-light">
                          <strong className="font-semibold">Team Update:</strong> {req.internalNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DELIVERY ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#002D72]">My Delivery Addresses</h2>
                  <p className="text-xs text-slate-500 font-light">
                    Add, update, or remove delivery addresses for faster checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="py-2 px-4 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Address
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleSaveAddress} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#002D72]">
                      {editingAddress ? 'Edit Delivery Address' : 'New Delivery Address'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Label</label>
                      <input
                        type="text"
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value)}
                        placeholder="Home, Office..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Recipient Name *</label>
                      <input
                        type="text"
                        required
                        value={addrFullName}
                        onChange={(e) => setAddrFullName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      placeholder="House number, street name, landmark..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">City / LGA *</label>
                      <input
                        type="text"
                        required
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        placeholder="e.g. Lekki, Ikeja"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">State *</label>
                      <select
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                      >
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addrIsDefault}
                      onChange={(e) => setAddrIsDefault(e.target.checked)}
                      className="rounded text-[#0047AB]"
                    />
                    <span>Set as my default delivery address</span>
                  </label>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={isSavingAddress}
                      className="py-2 px-5 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isSavingAddress ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              )}

              {customerAddresses.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">
                    No saved delivery addresses yet. Add one for faster checkout.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border text-xs space-y-2 ${
                        addr.isDefault ? 'bg-blue-50/40 border-[#0047AB]/40' : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{addr.title || 'Delivery Address'}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-[#0047AB]/10 text-[#0047AB] px-2.5 py-0.5 rounded-full font-bold">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAddress(addr)}
                            className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-600 hover:text-[#0047AB] border border-slate-200 cursor-pointer"
                            title="Edit address"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteCustomerAddress(addr.id)}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 cursor-pointer"
                            title="Delete address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="font-semibold text-slate-800">{addr.fullName || currentUser.fullName}</p>
                      <p className="text-slate-600 font-light">{addr.streetAddress || addr.fullAddress}</p>
                      <p className="text-slate-600 font-light">
                        {addr.city}, {addr.state}
                      </p>
                      <p className="text-slate-500 font-mono text-[11px]">Phone: {addr.phone || currentUser.phone || 'N/A'}</p>
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => void setDefaultCustomerAddress(addr.id)}
                          className="pt-1 text-[11px] font-bold text-[#0047AB] hover:underline cursor-pointer"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MY WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#002D72]">My Saved Wishlist ({wishlistProducts.length})</h2>
                <button
                  onClick={() => navigateTo('shop')}
                  className="text-xs font-bold text-[#0047AB] hover:underline cursor-pointer"
                >
                  Browse Shop &rarr;
                </button>
              </div>

              {wishlistProducts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                  <Heart className="w-8 h-8 text-rose-300 mx-auto" />
                  <p className="text-xs text-slate-500">Your wishlist is currently empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60"
                    >
                      <img
                        src={prod.images?.[0] || ''}
                        alt={prod.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer"
                        onClick={() => navigateTo('product-detail', { productId: prod.id })}
                      />
                      <div className="flex-1 min-w-0">
                        <h4
                          onClick={() => navigateTo('product-detail', { productId: prod.id })}
                          className="text-xs font-bold text-slate-900 truncate hover:text-[#0047AB] cursor-pointer"
                        >
                          {prod.name}
                        </h4>
                        <p className="text-xs font-extrabold text-[#0047AB] mt-0.5">
                          {formatNaira(prod.discountPrice ?? prod.price)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => addToCart(prod, 1)}
                            className="px-3 py-1 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            Add to Cart
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(prod.id)}
                            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-[10px] font-semibold text-slate-600 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PERSONAL ACCOUNT DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-5 shadow-xs max-w-xl">
              <div>
                <h2 className="text-lg font-bold text-[#002D72]">Personal Account Details</h2>
                <p className="text-xs text-slate-500 font-light">
                  Update your display name and contact phone number.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. +234 802 345 6789"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="py-2.5 px-6 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Saving Details...' : 'Save Account Details'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {receiptOrder && (
        <OfficialReceiptModal
          isOpen={Boolean(receiptOrder)}
          onClose={() => setReceiptOrder(null)}
          order={receiptOrder}
        />
      )}
    </div>
  );
};
