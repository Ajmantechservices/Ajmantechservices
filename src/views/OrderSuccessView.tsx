import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  CheckCircle2,
  Package,
  Printer,
  ShoppingBag,
  MessageCircle,
  Truck,
  Building,
  CreditCard,
  MapPin,
  Calendar,
  Sparkles,
  FileText,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';
import { PaymentGatewayModal } from '../components/PaymentGatewayModal';

export const OrderSuccessView: React.FC = () => {
  const {
    navigationState,
    orders,
    formatNaira,
    navigateTo,
    openWhatsApp,
    storeSettings,
    updateOrderPaymentStatus,
  } = useStore();

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);

  const orderId = navigationState?.orderId;
  const order = orders.find((o) => o.id === orderId || o.orderNumber === navigationState?.orderNumber) || orders[0];

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#002D72]">No recent order found</h2>
        <button
          onClick={() => navigateTo('home')}
          className="px-6 py-2.5 bg-[#0047AB] text-white rounded-full text-xs font-bold hover:bg-[#002D72] transition-colors cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'verified';
  const customerName = order.customer?.fullName || order.customerName || order.deliveryAddress?.fullName || 'Valued Customer';
  const deliveryAddress = order.customer?.address || order.deliveryAddress?.streetAddress || order.deliveryAddress?.address || 'Lagos, Nigeria';
  const deliveryCity = order.customer?.city || order.deliveryAddress?.city || 'Lagos';
  const deliveryState = order.customer?.state || order.deliveryAddress?.state || 'Lagos';
  const grandTotal = order.total ?? order.totalAmount ?? 0;
  const invoiceNumber = order.receiptNumber || `INV-${order.orderNumber.replace('AJM-', '')}`;

  const handleNotifyWhatsApp = () => {
    const msg = `Hello AjmanTech Services, I have just placed order #${order.orderNumber}.\n` +
      `Invoice #: ${invoiceNumber}\n` +
      `Status: ${isPaid ? 'PAID ONLINE' : 'Awaiting Transfer'}\n` +
      `Total: ${formatNaira(grandTotal)}\n` +
      `Customer: ${customerName}\n` +
      `Delivery Destination: ${deliveryAddress}, ${deliveryState}`;
    openWhatsApp(msg);
  };

  const handleLatePaymentSuccess = (details: {
    reference: string;
    channel: string;
  }) => {
    updateOrderPaymentStatus(order.id, 'paid', details.reference, details.channel);
    setIsPaymentGatewayOpen(false);
  };

  return (
    <div id="order-success-view" className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8 animate-fade-in">
      {/* Top Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-block px-4 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
            ORDER CONFIRMED #{order.orderNumber}
          </span>
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#0047AB] border border-blue-200 text-xs font-mono font-bold">
            INVOICE #{invoiceNumber}
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#002D72]">
          Thank You For Your Order!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-light">
          We have received your order and our certified engineering logistics team in Lagos is preparing your items for quality testing & delivery.
        </p>
      </div>

      {/* Payment Gateway Status Card */}
      {isPaid ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-xs space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 font-bold text-emerald-900 text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Payment Successful & Verified</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 text-[10px] font-extrabold font-mono uppercase">
                PAID
              </span>
            </div>
            <button
              onClick={() => setIsReceiptModalOpen(true)}
              className="py-2 px-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Official Tax Receipt</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200 text-emerald-800 font-mono text-[11px]">
            <div>
              <span className="text-emerald-600 font-sans block text-[10px]">Payment Reference:</span>
              <strong className="text-emerald-950">{order.paymentReference || 'PSTK_REF_VERIFIED'}</strong>
            </div>
            <div>
              <span className="text-emerald-600 font-sans block text-[10px]">Channel:</span>
              <strong className="text-emerald-950">{order.paymentChannel || 'Paystack Instant Gateway'}</strong>
            </div>
            <div>
              <span className="text-emerald-600 font-sans block text-[10px]">Amount Paid:</span>
              <strong className="text-emerald-950">{formatNaira(grandTotal)}</strong>
            </div>
          </div>
        </div>
      ) : (
        /* Pending Bank Transfer Card with Pay Now Option */
        <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 border border-amber-200 text-xs space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 font-bold text-amber-900 text-sm">
              <Building className="w-5 h-5 text-amber-700" />
              <span>Direct Bank Transfer Pending</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-950 text-[10px] font-extrabold font-mono uppercase">
                AWAITING PAYMENT
              </span>
            </div>
            <button
              onClick={() => setIsPaymentGatewayOpen(true)}
              className="py-2 px-4 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay Online via Card / USSD Now</span>
            </button>
          </div>

          <p className="text-amber-800 font-light">
            Please transfer <strong>{formatNaira(grandTotal)}</strong> to our official corporate account below or click the button above to pay instantly:
          </p>

          <div className="p-4 bg-white rounded-2xl border border-amber-200/80 space-y-2 font-medium text-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Name:</span>
              <span className="font-bold">{storeSettings.bankDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Name:</span>
              <span className="font-bold">{storeSettings.bankDetails.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Number:</span>
              <span className="font-mono font-extrabold text-[#0047AB] text-sm">
                {storeSettings.bankDetails.accountNumber}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 text-xs">
          <div>
            <span className="text-slate-400 font-light">Order Placed:</span>
            <p className="font-bold text-slate-900">{order.createdAt || new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-slate-400 font-light">Payment Method:</span>
            <p className="font-bold text-[#002D72] uppercase">{order.paymentMethod.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <span className="text-slate-400 font-light">Payment Status:</span>
            <p className={`font-bold uppercase ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
              {order.paymentStatus}
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-light">Order Progress:</span>
            <p className="font-bold text-[#0047AB] uppercase">{order.status}</p>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="space-y-3 divide-y divide-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#002D72] text-xs uppercase tracking-wider">
              Items in Order ({order.items.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-light">1-Year Warranty Included</span>
          </div>

          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 pt-3 first:pt-0">
              <img
                src={item.image || item.productImage}
                alt={item.title || item.productName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
              />
              <div className="flex-1 min-w-0 text-xs">
                <h4 className="font-semibold text-slate-900 truncate">{item.title || item.productName}</h4>
                <p className="text-[11px] text-slate-500 font-light">
                  Qty: {item.quantity} {item.selectedVariant || item.variant ? `• ${item.selectedVariant || item.variant}` : ''}
                </p>
              </div>
              <div className="text-xs font-bold text-[#002D72]">
                {formatNaira(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">{formatNaira(order.subtotal ?? grandTotal)}</span>
          </div>
          {order.discountAmount && order.discountAmount > 0 ? (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span>-{formatNaira(order.discountAmount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee ({deliveryState})</span>
            <span className="font-semibold text-slate-900">
              {order.deliveryFee === 0 ? 'FREE' : formatNaira(order.deliveryFee)}
            </span>
          </div>
          {order.includesInstallation || order.installationRequested ? (
            <div className="flex justify-between text-amber-700">
              <span>Certified Installation Service</span>
              <span className="font-semibold">₦15,000</span>
            </div>
          ) : null}
          <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-extrabold text-[#002D72]">
            <span>Total Paid / Payable</span>
            <span className="text-[#0047AB]">{formatNaira(grandTotal)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
          <div className="font-bold text-[#002D72] flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#0047AB]" />
            Shipping Destination:
          </div>
          <p className="font-semibold text-slate-800">{customerName}</p>
          <p className="text-slate-600 font-light">{deliveryAddress}, {deliveryCity}, {deliveryState}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => setIsReceiptModalOpen(true)}
          className="w-full sm:w-auto py-3 px-6 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-amber-300" />
          <span>View Official Tax Receipt</span>
        </button>

        <button
          onClick={handleNotifyWhatsApp}
          className="w-full sm:w-auto py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Confirm on WhatsApp</span>
        </button>

        <button
          onClick={() => navigateTo('track-order', { orderNumber: order.orderNumber })}
          className="w-full sm:w-auto py-3 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#002D72] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Package className="w-4 h-4" />
          <span>Track Order</span>
        </button>
      </div>

      {/* Official Stamped Receipt Modal */}
      <OfficialReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={order}
      />

      {/* Payment Gateway Modal (for pending bank transfers wanting to pay online) */}
      <PaymentGatewayModal
        isOpen={isPaymentGatewayOpen}
        onClose={() => setIsPaymentGatewayOpen(false)}
        amount={grandTotal}
        customerEmail={order.customer?.email || order.customerEmail || 'customer@ajmantech.ng'}
        customerName={customerName}
        onPaymentSuccess={handleLatePaymentSuccess}
      />
    </div>
  );
};

