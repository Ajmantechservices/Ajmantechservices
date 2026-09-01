import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  MessageCircle,
  Building,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { OrderStatus } from '../types';

export const TrackOrderView: React.FC = () => {
  const { orders, formatNaira, openWhatsApp } = useStore();
  const [searchCode, setSearchCode] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<any>(orders[0] || null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const clean = searchCode.trim().toUpperCase();
    const found = orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === clean ||
        o.customerPhone.includes(clean) ||
        o.id.toUpperCase() === clean
    );
    setSearchedOrder(found || null);
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

  const currentStepIdx = searchedOrder ? getStepIndex(searchedOrder.status) : 0;

  return (
    <div id="track-order-page-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {/* Top Title & Search Input */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-[#0047AB]/10 text-[#0047AB] flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#002D72]">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-light">
          Enter your Order Reference Number (e.g. <strong>AJM-2025-0101</strong>) or your phone number to check live parcel and delivery updates.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2 pt-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="e.g. AJM-2025-0101 or 08023456789"
              className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-full shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#0047AB] font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="py-3 px-6 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-md transition-colors shrink-0 cursor-pointer"
          >
            Track
          </button>
        </form>
      </div>

      {/* Result Section */}
      {searchedOrder ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-8 shadow-xs">
          {/* Order Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-[#0047AB] bg-[#0047AB]/10 px-3 py-1 rounded-full">
                Order #{searchedOrder.orderNumber}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1.5">
                Recipient: {searchedOrder.customerName}
              </h2>
            </div>
            <div className="text-xs text-right sm:text-right">
              <span className="text-slate-400 font-light">Order Date:</span>
              <p className="font-semibold text-slate-800">
                {new Date(searchedOrder.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stepper Progress Visual */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#002D72] uppercase tracking-wider">
              Shipment Status
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
                        ? 'border-emerald-200 bg-emerald-50/30'
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
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="font-bold text-[#002D72] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0047AB]" /> Delivery Address
              </span>
              <p className="text-slate-700 font-light">
                {searchedOrder.deliveryAddress.streetAddress}, {searchedOrder.deliveryAddress.city},{' '}
                {searchedOrder.deliveryAddress.state}
              </p>
              <p className="text-slate-500 font-mono text-[11px]">Contact: {searchedOrder.customerPhone}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="font-bold text-[#002D72] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" /> Courier & Payment
              </span>
              <p className="text-slate-700 font-light">
                Method: <strong className="uppercase">{searchedOrder.paymentMethod.replace('_', ' ')}</strong> ({searchedOrder.paymentStatus})
              </p>
              <p className="text-slate-700 font-bold text-[#0047AB]">
                Total Amount: {formatNaira(searchedOrder.totalAmount)}
              </p>
            </div>
          </div>

          {/* Items Preview */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#002D72] uppercase tracking-wider">
              Package Contents
            </h4>
            <div className="space-y-2">
              {searchedOrder.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 text-xs border border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImage}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white"
                    />
                    <div>
                      <h5 className="font-semibold text-slate-900">{item.productName}</h5>
                      <span className="text-[11px] text-slate-500 font-light">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="font-bold text-[#002D72]">{formatNaira(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow up CTA */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-light">Need real-time rider coordinates or express delivery?</p>
            <button
              onClick={() =>
                openWhatsApp(
                  `Hello AjmanTech Logistics, I am inquiring on the delivery ETA for Order #${searchedOrder.orderNumber}.`
                )
              }
              className="py-2.5 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Chat with Logistics Dispatch on WhatsApp
            </button>
          </div>
        </div>
      ) : hasSearched ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
          <p className="text-xs text-slate-600 font-light">
            No order found matching "<strong>{searchCode}</strong>". Please double check your order number or phone number.
          </p>
          <button
            onClick={() => openWhatsApp(`Hello AjmanTech Services, I need help finding my order status for: ${searchCode}`)}
            className="py-2.5 px-5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            Ask Support on WhatsApp
          </button>
        </div>
      ) : null}
    </div>
  );
};
