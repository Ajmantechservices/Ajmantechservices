import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  MessageCircle,
  ShieldCheck,
  FileText,
  CreditCard,
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { OrderStatus, Order } from '../types';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';
import { PaymentGatewayModal } from '../components/PaymentGatewayModal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const TrackOrderView: React.FC = () => {
  const {
    orders,
    formatNaira,
    openWhatsApp,
    updateOrderPaymentStatus,
    navigationState,
    currentUser,
  } = useStore();

  const [orderIdInput, setOrderIdInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<Order | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);

  // Security Verification Function:
  // Strictly requires BOTH Order ID and Customer Email (or secure UUID token)
  const verifyAndTrack = async (orderIdToTest: string, emailOrTokenToTest: string) => {
    const cleanOrderId = orderIdToTest.trim().toUpperCase();
    const cleanEmail = emailOrTokenToTest.trim().toLowerCase();

    // 1. Enforce requirement: Both fields must be provided
    if (!cleanOrderId || !cleanEmail) {
      setVerifiedOrder(null);
      setErrorMessage('Please verify your order details');
      return false;
    }

    setIsSearching(true);
    try {
      // 2. Check local store orders
      const candidate = (orders || []).find((o) => {
        const numMatch = Boolean(o.orderNumber && o.orderNumber.toUpperCase() === cleanOrderId);
        const idMatch = Boolean(o.id && o.id.toUpperCase() === cleanOrderId);
        const receiptMatch = Boolean(o.receiptNumber && o.receiptNumber.toUpperCase() === cleanOrderId);
        return numMatch || idMatch || receiptMatch;
      });

      if (candidate) {
        const candEmail = (candidate.customer?.email || candidate.customerEmail || '').toLowerCase().trim();
        const candToken = (candidate.id || '').toLowerCase().trim();
        const candUuid = ((candidate as any).uuid || '').toLowerCase().trim();

        const isEmailMatch = Boolean(candEmail && candEmail === cleanEmail);
        const isTokenMatch = Boolean(
          cleanEmail === candToken || (candUuid && cleanEmail === candUuid)
        );

        if (isEmailMatch || isTokenMatch) {
          setVerifiedOrder(candidate);
          setErrorMessage(null);
          return true;
        } else {
          // If only the Order ID is entered without matching the correct corresponding email or token,
          // display a generic "Please verify your order details" error instead of exposing customer names and live statuses.
          setVerifiedOrder(null);
          setErrorMessage('Please verify your order details');
          return false;
        }
      }

      // 3. Fallback: Check Supabase directly if configured and not found in local memory
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .or(`order_number.ilike.${cleanOrderId},id.eq.${cleanOrderId}`);

        if (!error && data && data.length > 0) {
          const matchingRow = data.find((row: any) => {
            const rowEmail = (row.customer_email || row.customer?.email || '').toLowerCase().trim();
            const rowId = (row.id || '').toLowerCase().trim();
            return rowEmail === cleanEmail || rowId === cleanEmail;
          });

          if (matchingRow) {
            const mappedOrder: Order = {
              id: matchingRow.id,
              orderNumber: matchingRow.order_number,
              receiptNumber: matchingRow.receipt_number,
              items: matchingRow.items || [],
              customer: {
                fullName: matchingRow.customer_name || 'Valued Customer',
                email: matchingRow.customer_email || '',
                phone: matchingRow.customer_phone || '',
                address: matchingRow.delivery_address?.address || '',
                state: matchingRow.delivery_address?.state || 'Lagos',
                city: matchingRow.delivery_address?.city || 'Lagos',
                notes: matchingRow.delivery_notes || '',
              },
              customerName: matchingRow.customer_name,
              customerEmail: matchingRow.customer_email,
              customerPhone: matchingRow.customer_phone,
              deliveryAddress: matchingRow.delivery_address,
              subtotal: Number(matchingRow.total_amount || 0) - Number(matchingRow.delivery_fee || 0),
              deliveryFee: Number(matchingRow.delivery_fee || 0),
              discountAmount: 0,
              total: Number(matchingRow.total_amount || 0),
              paymentMethod: matchingRow.payment_method || 'bank_transfer',
              paymentStatus: matchingRow.payment_status || 'pending',
              status: matchingRow.status || 'placed',
              trackingHistory: matchingRow.tracking_history || [],
              createdAt: matchingRow.created_at || new Date().toISOString().split('T')[0],
              estimatedDelivery: '24-48 Hours from Dispatch',
            };
            setVerifiedOrder(mappedOrder);
            setErrorMessage(null);
            return true;
          } else {
            // Found by Order ID, but email did not match!
            setVerifiedOrder(null);
            setErrorMessage('Please verify your order details');
            return false;
          }
        }
      }

      // No matching record found
      setVerifiedOrder(null);
      setErrorMessage('Please verify your order details');
      return false;
    } catch {
      setVerifiedOrder(null);
      setErrorMessage('Please verify your order details');
      return false;
    } finally {
      setIsSearching(false);
    }
  };

  // Inspect URL parameters and navigation state safely on mount
  useEffect(() => {
    let qOrderId = '';
    let qEmail = '';
    let qToken = '';

    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        qOrderId = params.get('orderId') || params.get('orderNumber') || params.get('ref') || '';
        qEmail = params.get('email') || '';
        qToken = params.get('token') || '';
      } catch {}
    }

    const navOrderId = navigationState?.orderNumber || navigationState?.orderId || '';
    const navEmail = navigationState?.email || '';
    const navToken = navigationState?.token || '';

    const initialOrderId = qOrderId || navOrderId;
    const initialEmail = qEmail || navEmail;
    const initialToken = qToken || navToken;

    if (initialOrderId) {
      setOrderIdInput(initialOrderId);
    }
    if (initialEmail) {
      setEmailInput(initialEmail);
    } else if (currentUser?.email && !initialToken) {
      setEmailInput(currentUser.email);
    }

    // Require BOTH Order ID and Email/Token before auto-verification
    if (initialOrderId && (initialEmail || initialToken)) {
      setHasAttempted(true);
      verifyAndTrack(initialOrderId, initialEmail || initialToken);
    }
  }, [navigationState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttempted(true);
    verifyAndTrack(orderIdInput, emailInput);
  };

  const handleResetSearch = () => {
    setVerifiedOrder(null);
    setErrorMessage(null);
    setHasAttempted(false);
    setOrderIdInput('');
    if (!currentUser?.email) {
      setEmailInput('');
    }
  };

  const steps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'pending', label: 'Order Placed', desc: 'Order details recorded in system' },
    { key: 'processing', label: 'Processing & Testing', desc: 'Lights tested & packed in Lagos warehouse' },
    { key: 'shipped', label: 'Dispatched / In Transit', desc: 'Handed to courier for delivery' },
    { key: 'delivered', label: 'Delivered', desc: 'Safely arrived at destination' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStepIdx = verifiedOrder ? getStepIndex(verifiedOrder.status) : 0;
  const isPaid = verifiedOrder?.paymentStatus === 'paid' || verifiedOrder?.paymentStatus === 'verified';
  const grandTotal = verifiedOrder?.total ?? verifiedOrder?.totalAmount ?? 0;

  const handlePaymentSuccess = (details: { reference: string; channel: string }) => {
    if (verifiedOrder) {
      updateOrderPaymentStatus(verifiedOrder.id, 'paid', details.reference, details.channel);
      setVerifiedOrder((prev: any) => ({
        ...prev,
        paymentStatus: 'paid',
        paymentReference: details.reference,
        paymentChannel: details.channel,
      }));
    }
    setIsPaymentGatewayOpen(false);
  };

  return (
    <div id="track-order-page-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 animate-fade-in">
      {/* Privacy-First Top Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#002D72] text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0047AB]" />
          <span>Privacy-Protected Order Lookup</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#002D72] tracking-tight">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed">
          To protect your personal data, shipping details, and order contents, both your{' '}
          <strong>Order Reference</strong> and <strong>Customer Email Address</strong> (or secure access token) are required.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input 1: Order ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Order Reference / ID *</span>
                <span className="text-[10px] text-slate-400 font-normal">e.g. AJM-2025-0101</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={orderIdInput}
                  onChange={(e) => {
                    setOrderIdInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="AJM-2025-0101"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl shadow-2xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0047AB] focus:border-transparent font-mono uppercase"
                />
                <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Input 2: Customer Email Address / Secure Token */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Customer Email / Token *</span>
                <span className="text-[10px] text-slate-400 font-normal">Billing Email</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="name@email.com or UUID token"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl shadow-2xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0047AB] focus:border-transparent font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-light">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Customer data encrypted and protected against unauthorized lookup</span>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto py-3 px-7 rounded-xl bg-[#0047AB] hover:bg-[#002D72] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Verify & Track Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Alert: Displayed when Order ID lacks corresponding email/token or details do not match */}
      {errorMessage && (
        <div
          role="alert"
          className="max-w-2xl mx-auto p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-2xs space-y-2 animate-fade-in"
        >
          <div className="flex items-center gap-2.5 text-rose-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <p className="text-xs text-rose-700/90 font-light leading-relaxed pl-7">
            The Order ID and customer billing email address do not match our verified records.
            For your security and privacy, both a valid Order Reference and matching recipient email or secure UUID token must be entered to view live shipping status and recipient data.
          </p>
          <div className="pl-7 pt-1">
            <button
              type="button"
              onClick={() =>
                openWhatsApp(
                  `Hello AjmanTech Logistics, I am trying to track my order (${orderIdInput || 'Order'}), but need assistance verifying my details.`
                )
              }
              className="text-xs font-bold text-rose-900 underline hover:text-rose-950 cursor-pointer"
            >
              Contact customer support on WhatsApp for help &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Verified Order Results Section - ONLY displayed after successful authentication */}
      {verifiedOrder && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-8 shadow-xs animate-fade-in">
          {/* Order Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#0047AB] bg-[#0047AB]/10 px-3 py-1 rounded-full font-mono">
                  Order #{verifiedOrder.orderNumber}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full font-mono uppercase ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {verifiedOrder.paymentStatus || 'pending'}
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Recipient
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-2">
                Recipient: {verifiedOrder.customer?.fullName || verifiedOrder.customerName || verifiedOrder.deliveryAddress?.fullName}
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-[#002D72] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>Official Tax Receipt</span>
              </button>
              <button
                type="button"
                onClick={handleResetSearch}
                className="py-2.5 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Verify Another Order"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Search</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress Visual */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#002D72] uppercase tracking-wider">
              Live Shipment Progress
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div
                    key={step.key}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'border-[#0047AB] bg-[#0047AB]/5 ring-2 ring-[#0047AB]/20'
                        : isPassed
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-xs font-bold text-slate-900">{step.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug font-light">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Destination Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span className="font-bold text-[#002D72] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0047AB]" /> Shipping Destination
              </span>
              <p className="text-slate-800 font-medium">
                {verifiedOrder.deliveryAddress?.streetAddress || verifiedOrder.customer?.address || 'Showroom Collection / Direct Dispatch'}
              </p>
              <p className="text-slate-600 font-light">
                {verifiedOrder.deliveryAddress?.city || verifiedOrder.customer?.city || 'Lagos'},{' '}
                {verifiedOrder.deliveryAddress?.state || verifiedOrder.customer?.state || 'Lagos'}
              </p>
              <p className="text-slate-500 font-mono text-[11px] pt-1">
                Verified Phone: {verifiedOrder.customerPhone || verifiedOrder.customer?.phone || 'N/A'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="font-bold text-[#002D72] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" /> Courier & Payment
              </span>
              <p className="text-slate-700 font-light">
                Method:{' '}
                <strong className="uppercase">
                  {(verifiedOrder.paymentMethod || 'card').replace(/_/g, ' ')}
                </strong>
                {' • '}
                <strong
                  className={`uppercase ${
                    isPaid ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'
                  }`}
                >
                  {verifiedOrder.paymentStatus || 'pending'}
                </strong>
              </p>
              <div className="flex items-center justify-between pt-1">
                <p className="text-slate-900 font-extrabold text-sm text-[#0047AB]">
                  Total: {formatNaira(grandTotal)}
                </p>
                {!isPaid && (
                  <button
                    type="button"
                    onClick={() => setIsPaymentGatewayOpen(true)}
                    className="py-1 px-3.5 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Pay Online</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Package Contents */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#002D72] uppercase tracking-wider">
              Package Contents ({verifiedOrder.items?.length || 0})
            </h4>
            <div className="space-y-2">
              {(verifiedOrder.items || []).map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 text-xs border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImage || item.image || ''}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white"
                    />
                    <div>
                      <h5 className="font-semibold text-slate-900">{item.productName || item.title || item.name}</h5>
                      <span className="text-[11px] text-slate-500 font-light">
                        Qty: {item.quantity}{' '}
                        {item.selectedVariant || item.variant ? `• ${item.selectedVariant || item.variant}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="font-bold text-[#002D72]">
                    {formatNaira((item.price || 0) * (item.quantity || 1))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logistics Assistance WhatsApp CTA */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-light">
              Need real-time rider contact or express delivery rescheduling?
            </p>
            <button
              type="button"
              onClick={() =>
                openWhatsApp(
                  `Hello AjmanTech Logistics, I am verified for Order #${verifiedOrder.orderNumber}. I would like to inquire about the delivery schedule.`
                )
              }
              className="py-2.5 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Logistics Dispatch</span>
            </button>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {verifiedOrder && (
        <OfficialReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          order={verifiedOrder}
        />
      )}

      {/* Payment Gateway Modal */}
      {verifiedOrder && (
        <PaymentGatewayModal
          isOpen={isPaymentGatewayOpen}
          onClose={() => setIsPaymentGatewayOpen(false)}
          amount={grandTotal}
          customerEmail={verifiedOrder.customerEmail || verifiedOrder.customer?.email || 'customer@ajmantech.ng'}
          customerName={verifiedOrder.customerName || verifiedOrder.customer?.fullName || 'Customer'}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
