import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Building,
  CheckCircle2,
  Copy,
  Tag,
  ArrowLeft,
  Wrench,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { PaymentMethod } from '../types';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    formatNaira,
    createOrder,
    navigateTo,
    currentUser,
    storeSettings,
    showToast,
    openWhatsApp,
  } = useStore();

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [state, setState] = useState(currentUser?.defaultAddress?.state || 'Lagos');
  const [city, setCity] = useState(currentUser?.defaultAddress?.city || '');
  const [streetAddress, setStreetAddress] = useState(currentUser?.defaultAddress?.streetAddress || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [includeInstallation, setIncludeInstallation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  // Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delivery Fee Calculation based on Nigerian State
  const calculateDeliveryFee = () => {
    if (cartSubtotal >= storeSettings.freeDeliveryThreshold) {
      return 0;
    }
    if (state.toLowerCase().includes('lagos')) return 2500;
    if (state.toLowerCase().includes('abuja')) return 4500;
    if (state.toLowerCase().includes('rivers')) return 5000;
    return 6000; // Other states
  };

  const deliveryFee = calculateDeliveryFee();
  const discountAmount = appliedPromo ? (cartSubtotal * appliedPromo.percent) / 100 : 0;
  const installationFee = includeInstallation ? 15000 : 0;
  const grandTotal = cartSubtotal - discountAmount + deliveryFee + installationFee;

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#002D72]">Your cart is currently empty</h2>
        <p className="text-xs text-slate-500 font-light">Please add items to your cart before proceeding to checkout.</p>
        <button
          onClick={() => navigateTo('shop')}
          className="py-2.5 px-6 rounded-full bg-[#0047AB] text-white font-bold text-xs hover:bg-[#002D72] transition-colors cursor-pointer"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoCodeInput.trim().toUpperCase();
    const match = storeSettings.promoCodes.find((p) => p.code.toUpperCase() === clean);
    if (match) {
      setAppliedPromo({ code: match.code, percent: match.discountPercent });
      showToast(`Promo code "${match.code}" applied!`);
    } else {
      showToast('Invalid promo code. Try "AJMANLIGHT10"', 'error');
    }
  };

  const handleCopyBankDetails = () => {
    const text = `Bank: ${storeSettings.bankDetails.bankName}\nAccount Name: ${storeSettings.bankDetails.accountName}\nAccount Number: ${storeSettings.bankDetails.accountNumber}`;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    showToast('Bank details copied to clipboard!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !state || !city || !streetAddress) {
      showToast('Please fill in all required delivery fields.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const newOrder = createOrder({
        customerName: fullName,
        customerEmail: email || 'customer@ajmantech.ng',
        customerPhone: phone,
        deliveryAddress: {
          fullName,
          phone,
          state,
          city,
          streetAddress,
        },
        deliveryFee,
        discountAmount,
        paymentMethod,
        appliedPromoCode: appliedPromo?.code,
        notes: deliveryNotes,
        installationRequested: includeInstallation,
      });

      // Navigate to order success view
      navigateTo('order-success', { orderId: newOrder.id, orderNumber: newOrder.orderNumber });
    } catch (err) {
      showToast('There was an error placing your order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
    <div id="checkout-page-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={() => navigateTo('shop')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0047AB] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </button>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          Secure SSL Encrypted Checkout
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Columns: Delivery & Payment Details (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Customer & Delivery Details */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-[#002D72] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                1
              </div>
              <h2 className="text-base font-extrabold text-[#002D72]">
                Delivery Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Adebayo Ogunlesi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Phone Number (WhatsApp preferred) *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08023456789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  State *
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                >
                  {nigerianStates.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  City / LGA *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lekki Phase 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                  Full Street Address & Landmark *
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. Plot 14 Admiralty Way, opposite Zenith Bank"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#002D72] uppercase tracking-wider mb-1.5">
                Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Gate code, alternative contact person, preferred delivery time..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
              />
            </div>

            {/* Optional Installation Add-on Checkbox */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
              <input
                type="checkbox"
                id="install-addon"
                checked={includeInstallation}
                onChange={(e) => setIncludeInstallation(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#0047AB] focus:ring-[#0047AB] cursor-pointer"
              />
              <label htmlFor="install-addon" className="cursor-pointer text-xs space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-700" />
                  Add Certified Installation Service (+₦15,000)
                </div>
                <div className="text-slate-600 text-[11px] font-light">
                  Have an AjmanTech certified electrical engineer professionally install and mount all ordered lightings / accessories at your premises.
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Payment Method Selection */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-[#002D72] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                2
              </div>
              <h2 className="text-base font-extrabold text-[#002D72]">
                Payment Method
              </h2>
            </div>

            <div className="space-y-3">
              {/* Option 1: Direct Bank Transfer */}
              <label
                className={`flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-[#0047AB] bg-blue-50/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="text-[#0047AB] focus:ring-[#0047AB]"
                    />
                    <div>
                      <span className="font-bold text-[#002D72] text-xs sm:text-sm">
                        Direct Bank Transfer (Zenith Bank)
                      </span>
                      <p className="text-[11px] text-slate-500 font-light">Most preferred & instant verification</p>
                    </div>
                  </div>
                  <Building className="w-5 h-5 text-[#0047AB] shrink-0" />
                </div>

                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-4 pt-3 border-t border-blue-200/60 bg-white p-4 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">Bank Name:</span>
                      <span className="font-bold text-slate-900">{storeSettings.bankDetails.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">Account Name:</span>
                      <span className="font-bold text-slate-900">{storeSettings.bankDetails.accountName}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">Account Number:</span>
                      <span className="font-mono font-extrabold text-[#0047AB] text-sm">
                        {storeSettings.bankDetails.accountNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyBankDetails}
                      className="w-full py-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-[#002D72] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {isCopied ? 'Copied to Clipboard!' : 'Copy Bank Account Details'}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center font-light">
                      * After placing your order, send transfer proof to our official WhatsApp line for instant dispatch.
                    </p>
                  </div>
                )}
              </label>

              {/* Option 2: Card Payment */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-[#0047AB] bg-blue-50/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="text-[#0047AB] focus:ring-[#0047AB]"
                  />
                  <div>
                    <span className="font-bold text-[#002D72] text-xs sm:text-sm">
                      Mastercard / Visa / Verve Debit Card
                    </span>
                    <p className="text-[11px] text-slate-500 font-light">Instant online card payment via secure gateway</p>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
              </label>

              {/* Option 3: Pay on Delivery */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'pay_on_delivery'
                    ? 'border-[#0047AB] bg-blue-50/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pay_on_delivery"
                    checked={paymentMethod === 'pay_on_delivery'}
                    onChange={() => setPaymentMethod('pay_on_delivery')}
                    className="text-[#0047AB] focus:ring-[#0047AB]"
                  />
                  <div>
                    <span className="font-bold text-[#002D72] text-xs sm:text-sm">
                      Pay on Delivery (Lagos & Abuja only)
                    </span>
                    <p className="text-[11px] text-slate-500 font-light">Pay cash or POS transfer upon parcel inspection</p>
                  </div>
                </div>
                <Truck className="w-5 h-5 text-amber-600 shrink-0" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Placement (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs sticky top-28">
            <h3 className="font-extrabold text-[#002D72] text-base border-b border-slate-100 pb-3">
              Order Summary ({cart.length} items)
            </h3>

            {/* Cart items preview */}
            <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {cart.map((item, idx) => {
                const price = item.product.discountPrice ?? item.product.price;
                return (
                  <div key={idx} className="flex items-center gap-3 pt-2 first:pt-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <h4 className="font-semibold text-slate-900 truncate">{item.product.name}</h4>
                      <p className="text-[11px] text-slate-500 font-light">Qty: {item.quantity} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}</p>
                    </div>
                    <div className="text-xs font-bold text-[#002D72]">
                      {formatNaira(price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo Code Application */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="Coupon code (e.g. AJMANLIGHT10)"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full uppercase font-mono placeholder:normal-case placeholder:font-sans focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  />
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-2 rounded-full bg-[#002D72] hover:bg-blue-900 text-white text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {appliedPromo && (
                <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex justify-between">
                  <span>Coupon <strong>{appliedPromo.code}</strong> (-{appliedPromo.percent}%)</span>
                  <span>-{formatNaira(discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">{formatNaira(cartSubtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Promo Discount</span>
                  <span>-{formatNaira(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Delivery to {state}</span>
                <span className="font-semibold text-slate-900">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    formatNaira(deliveryFee)
                  )}
                </span>
              </div>

              {includeInstallation && (
                <div className="flex justify-between text-amber-700">
                  <span>Certified Installation Add-on</span>
                  <span className="font-semibold">{formatNaira(installationFee)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between text-base sm:text-lg font-extrabold text-[#002D72]">
                <span>Total Amount to Pay</span>
                <span className="text-[#0047AB]">{formatNaira(grandTotal)}</span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              id="btn-place-order"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full bg-[#0047AB] hover:bg-[#002D72] active:bg-blue-900 text-white font-extrabold text-sm shadow-xl hover:shadow-blue-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Generating Order...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Place Order ({formatNaira(grandTotal)})</span>
                </>
              )}
            </button>

            {/* Alternative Direct WhatsApp Checkout */}
            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-400 mb-2 font-light">Prefer to finalize directly on WhatsApp?</p>
              <button
                type="button"
                onClick={() => {
                  const itemsSummary = cart.map((c) => `${c.product.name} (x${c.quantity})`).join(', ');
                  const msg = `Hello AjmanTech Services, I want to place an order for:\n${itemsSummary}\nTotal: ${formatNaira(grandTotal)}\nDelivery Location: ${city ? city + ', ' : ''}${state}`;
                  openWhatsApp(msg);
                }}
                className="w-full py-2.5 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                Order via WhatsApp Direct
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
