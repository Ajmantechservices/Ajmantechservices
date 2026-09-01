import React from 'react';
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
} from 'lucide-react';

export const OrderSuccessView: React.FC = () => {
  const { navigationState, orders, formatNaira, navigateTo, openWhatsApp, storeSettings } = useStore();

  const orderId = navigationState.orderId;
  const order = orders.find((o) => o.id === orderId) || orders[0];

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

  const handlePrint = () => {
    window.print();
  };

  const handleNotifyWhatsApp = () => {
    const msg = `Hello AjmanTech Services, I have just placed order #${order.orderNumber}. Total: ${formatNaira(
      order.totalAmount
    )}. Customer: ${order.customerName}. Please confirm dispatch.`;
    openWhatsApp(msg);
  };

  return (
    <div id="order-success-view" className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      {/* Top Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="inline-block px-4 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
          ORDER CONFIRMED #{order.orderNumber}
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#002D72]">
          Thank You For Your Order!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-light">
          We have received your order and our logistics team in Lagos is preparing your items for dispatch.
        </p>
      </div>

      {/* Bank Transfer Payment Notice */}
      {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'unpaid' && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <Building className="w-4 h-4 text-amber-700" />
            Bank Transfer Payment Instructions
          </div>
          <p className="text-amber-800 font-light">
            Please transfer <strong>{formatNaira(order.totalAmount)}</strong> to the account below and send proof of payment on WhatsApp for immediate dispatch:
          </p>
          <div className="p-3.5 bg-white rounded-2xl border border-amber-200 space-y-1.5 font-medium text-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Bank:</span>
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
            <p className="font-bold text-slate-900">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-slate-400 font-light">Payment Method:</span>
            <p className="font-bold text-[#002D72] uppercase">{order.paymentMethod.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-slate-400 font-light">Current Status:</span>
            <p className="font-bold text-amber-600 uppercase">{order.status}</p>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="space-y-3 divide-y divide-slate-100">
          <h3 className="font-bold text-[#002D72] text-xs uppercase tracking-wider">
            Items in Order
          </h3>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 pt-3 first:pt-0">
              <img
                src={item.productImage}
                alt={item.productName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
              />
              <div className="flex-1 min-w-0 text-xs">
                <h4 className="font-semibold text-slate-900 truncate">{item.productName}</h4>
                <p className="text-[11px] text-slate-500 font-light">
                  Qty: {item.quantity} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}
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
            <span className="font-semibold text-slate-900">{formatNaira(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span>-{formatNaira(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee ({order.deliveryAddress.state})</span>
            <span className="font-semibold text-slate-900">
              {order.deliveryFee === 0 ? 'FREE' : formatNaira(order.deliveryFee)}
            </span>
          </div>
          {order.installationRequested && (
            <div className="flex justify-between text-amber-700">
              <span>Certified Installation Service</span>
              <span className="font-semibold">₦15,000</span>
            </div>
          )}
          <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-extrabold text-[#002D72]">
            <span>Total Paid / Payable</span>
            <span className="text-[#0047AB]">{formatNaira(order.totalAmount)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
          <div className="font-bold text-[#002D72] flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#0047AB]" />
            Shipping Destination:
          </div>
          <p className="font-semibold text-slate-800">{order.deliveryAddress.fullName} ({order.deliveryAddress.phone})</p>
          <p className="text-slate-600 font-light">{order.deliveryAddress.streetAddress}, {order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleNotifyWhatsApp}
          className="w-full sm:w-auto py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          Confirm Order on WhatsApp
        </button>

        <button
          onClick={() => navigateTo('track-order')}
          className="w-full sm:w-auto py-3 px-6 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Package className="w-4 h-4" />
          Track Order Status
        </button>

        <button
          onClick={handlePrint}
          className="w-full sm:w-auto py-3 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#002D72] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>
    </div>
  );
};
