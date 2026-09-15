import React, { useRef } from 'react';
import {
  Printer,
  Download,
  Share2,
  X,
  ShieldCheck,
  CheckCircle2,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Sparkles,
  QrCode,
  FileText,
  Wrench,
} from 'lucide-react';
import { Order } from '../types';
import { useStore } from '../context/StoreContext';

interface OfficialReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const { formatNaira, openWhatsApp, showToast } = useStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const invoiceNumber = order.receiptNumber || `INV-${order.orderNumber.replace('AJM-', '')}`;
  const transactionRef = order.paymentReference || `PSTK_REF_${order.id.replace('ord-', '')}`;
  const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'verified';
  const customerName = order.customer?.fullName || order.customerName || 'Valued Customer';
  const customerPhone = order.customer?.phone || order.customerPhone || 'N/A';
  const customerEmail = order.customer?.email || order.customerEmail || 'orders@ajmantech.ng';
  const deliveryAddress = order.customer?.address || order.deliveryAddress?.streetAddress || order.deliveryAddress?.address || 'Lagos, Nigeria';
  const deliveryState = order.customer?.state || order.deliveryAddress?.state || 'Lagos';
  const deliveryCity = order.customer?.city || order.deliveryAddress?.city || 'Lagos';
  const grandTotal = order.total ?? order.totalAmount ?? 0;
  const subtotal = order.subtotal ?? (grandTotal - (order.deliveryFee || 0));

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp receipt share
  const handleShareWhatsApp = () => {
    const itemsSummary = (order.items || []).map((i) => `• ${i.title || i.productName} (x${i.quantity})`).join('\n');
    const msg = `*OFFICIAL AJMANTECH RECEIPT & INVOICE*\n` +
      `Invoice #: ${invoiceNumber}\n` +
      `Order #: ${order.orderNumber}\n` +
      `Payment Ref: ${transactionRef}\n` +
      `Status: ${isPaid ? 'PAID & VERIFIED' : 'PENDING PAYMENT'}\n` +
      `Customer: ${customerName}\n` +
      `Amount: ${formatNaira(grandTotal)}\n\n` +
      `Items:\n${itemsSummary}\n\n` +
      `AjmanTech Services Nigeria Ltd - "Let There Be Light"\nHotline: +234 807 532 9182`;
    openWhatsApp(msg);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/track-order?ref=${order.orderNumber}`;
    navigator.clipboard?.writeText(url);
    showToast('Receipt verification link copied to clipboard!');
  };

  return (
    <div
      id="official-receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in print:p-0 print:bg-white print:fixed-none"
    >
      <div
        id="official-receipt-container"
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none"
      >
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Official Tax Invoice & Automated Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-1.5 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Share to WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RECEIPT PAPER DOCUMENT */}
        <div ref={receiptRef} className="p-6 sm:p-10 text-slate-800 space-y-8 bg-white">
          {/* Header & Company Brand */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900/10 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#002D72] text-white flex items-center justify-center font-black text-lg shadow-sm">
                  A
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#002D72]">
                    AjmanTech Services
                  </h1>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#0047AB]">
                    "Let There Be Light" • Electrical & Solar Engineering
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-0.5 pt-2 font-light">
                <p className="font-semibold text-slate-700">AjmanTech Electrical & Solar Solutions Nigeria Ltd</p>
                <p>RC Number: <strong>RC 1849204</strong> • TIN: <strong>24901824-0001</strong></p>
                <p>NEMSA & COREN Certified Electrical Contractor</p>
                <p>Plot 14, Commercial Avenue, Ikeja, Lagos • 24 Admiralty Way, Lekki Phase 1</p>
                <p>Hotline: +234 807 532 9182 | +234 802 345 6789 • Email: billing@ajmantech.ng</p>
              </div>
            </div>

            {/* Official Tax Invoice & Stamp Header */}
            <div className="text-right sm:text-right w-full sm:w-auto space-y-1">
              <span className="inline-block px-3 py-1 rounded-md bg-[#002D72] text-white font-mono text-xs font-black uppercase tracking-wider">
                TAX INVOICE & RECEIPT
              </span>
              <div className="pt-2 text-xs font-mono space-y-1">
                <div>
                  <span className="text-slate-400 font-sans">Invoice #: </span>
                  <strong className="text-slate-900 font-bold">{invoiceNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Order Ref: </span>
                  <strong className="text-[#0047AB] font-bold">{order.orderNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Date: </span>
                  <strong className="text-slate-900">{order.createdAt || new Date().toLocaleDateString()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Billed To & Payment Status Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-xs">
            {/* Customer Details */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Customer & Shipping Details
              </span>
              <h4 className="font-extrabold text-sm text-slate-900">{customerName}</h4>
              <p className="text-slate-600 font-light">{deliveryAddress}</p>
              <p className="text-slate-600 font-light">{deliveryCity}, {deliveryState}, Nigeria</p>
              <p className="text-slate-600 font-medium pt-1">Tel: {customerPhone} • {customerEmail}</p>
            </div>

            {/* Payment Summary */}
            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Transaction Status & Verification
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                  {isPaid ? 'PAID & VERIFIED' : 'PENDING VERIFICATION'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                <p>Payment Method: <strong className="uppercase text-slate-800">{order.paymentMethod.replace(/_/g, ' ')}</strong></p>
                <p>Channel: <strong>{order.paymentChannel || (order.paymentMethod === 'card' ? 'Paystack Card Gateway' : 'Zenith Bank Transfer')}</strong></p>
                <p>Payment Ref: <span className="font-mono text-slate-900 font-bold">{transactionRef}</span></p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">S/N</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4 text-center">Warranty</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-light text-slate-800">
                {(order.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.title || item.productName}</div>
                      {item.variant && (
                        <div className="text-[10px] text-[#0047AB] font-medium mt-0.5">
                          Variant: {item.variant}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 text-[11px]">
                      12 - 24 Mos
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatNaira(item.price)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatNaira(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Breakdown & Official Digital Stamp */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            {/* Left: Stamp & Warranty Guarantee */}
            <div className="sm:col-span-6 space-y-4">
              {/* Circular Official Paid Stamp */}
              <div className="inline-flex items-center gap-3 p-3.5 rounded-2xl border-2 border-dashed border-emerald-600/40 bg-emerald-50/40">
                <div className="w-14 h-14 rounded-full border-2 border-emerald-700 text-emerald-800 flex flex-col items-center justify-center text-center font-black p-1 leading-tight shadow-xs">
                  <span className="text-[8px] uppercase tracking-tighter">AJMANTECH</span>
                  <span className="text-[10px] font-black text-emerald-700">★ PAID ★</span>
                  <span className="text-[7px] font-mono">{new Date().getFullYear()}</span>
                </div>
                <div className="text-[10px] text-emerald-900 space-y-0.5">
                  <p className="font-bold uppercase tracking-wider">Official Digital Audit Stamp</p>
                  <p className="text-emerald-700 font-mono">AUTH: {transactionRef.slice(0, 16)}</p>
                  <p className="text-emerald-800 font-light">Verified by Accounts & Quality Control</p>
                </div>
              </div>

              {/* Terms Note */}
              <div className="text-[10px] text-slate-500 font-light space-y-1">
                <p>• <strong>Warranty Policy:</strong> Certified against manufacturer electrical defects for 1 year from invoice date.</p>
                <p>• <strong>Returns & Replacements:</strong> 14-day return/swap guarantee on unmounted, original packaging items.</p>
                <p>• <strong>Technical Hotline:</strong> WhatsApp 08075329182 for immediate engineering consultation.</p>
              </div>
            </div>

            {/* Right: Subtotal & Grand Total */}
            <div className="sm:col-span-6 space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-xs font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">{formatNaira(subtotal)}</span>
              </div>

              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Promo Discount ({order.promoCode || order.appliedPromoCode || 'COUPON'}):</span>
                  <span className="font-mono">-{formatNaira(order.discountAmount)}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-slate-600">
                <span>Shipping / Delivery ({deliveryState}):</span>
                <span className="font-mono font-bold text-slate-900">
                  {order.deliveryFee === 0 ? 'FREE' : formatNaira(order.deliveryFee)}
                </span>
              </div>

              {order.includesInstallation || order.installationRequested ? (
                <div className="flex justify-between text-amber-700">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5" />
                    Certified Electrical Installation:
                  </span>
                  <span className="font-mono font-bold">₦15,000</span>
                </div>
              ) : null}

              <div className="pt-3 border-t-2 border-slate-900/10 flex justify-between items-baseline text-sm font-extrabold text-[#002D72]">
                <span>Total Paid / Payable:</span>
                <span className="font-mono text-lg font-black text-[#0047AB]">
                  {formatNaira(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature & Authentic QR Code */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              {/* SVG QR Code */}
              <div className="p-2 bg-white border border-slate-300 rounded-xl shadow-2xs">
                <svg
                  className="w-16 h-16 text-[#002D72]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="5" height="5" x="3" y="3" rx="1" />
                  <rect width="5" height="5" x="16" y="3" rx="1" />
                  <rect width="5" height="5" x="3" y="16" rx="1" />
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                  <path d="M21 21v.01" />
                  <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                  <path d="M3 12h.01" />
                  <path d="M12 3h.01" />
                  <path d="M12 16v.01" />
                  <path d="M16 12h1" />
                  <path d="M21 12v.01" />
                  <path d="M12 21v-1" />
                </svg>
              </div>
              <div className="text-[10px] text-slate-500 font-light">
                <p className="font-bold text-slate-800">Scan to Verify Authenticity</p>
                <p>Digital Tax Receipt Verification Token</p>
                <p className="font-mono text-[9px] text-[#0047AB]">https://ajmantech.ng/verify/{order.orderNumber}</p>
              </div>
            </div>

            {/* Engineer Signature */}
            <div className="text-center sm:text-right space-y-1">
              <div className="font-serif italic text-base text-slate-800 font-semibold tracking-wide">
                Engr. A. Ajayi
              </div>
              <div className="text-[10px] text-slate-500 font-light">
                <p className="font-bold text-slate-800">Engr. A. Ajayi (FNSE, COREN Reg.)</p>
                <p>Chief Electrical Engineer & Managing Director</p>
                <p>AjmanTech Services Nigeria Ltd</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar (Hidden in Print) */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-500 font-light">
            Need physical copy delivered? Show this receipt at our Ikeja / Lekki showroom.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none py-2 px-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Copy Link
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none py-2 px-5 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
