import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldAlert,
  FileText,
  CreditCard,
  Lock,
  Mail,
  Phone,
  User,
  ArrowLeft,
  RotateCcw,
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react';
import { OrderStatus, Order } from '../types';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';
import { PaymentGatewayModal } from '../components/PaymentGatewayModal';

const ADMIN_ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'placed', label: 'Order Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing & Testing' },
  { value: 'shipped', label: 'Shipped / Dispatched' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SHIPMENT_STAGES: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'pending', label: 'Order Placed', desc: 'Recorded & awaiting confirmation' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Payment/order verified by admin' },
  { key: 'processing', label: 'Testing & Packing', desc: 'Inspected in AjmanTech warehouse' },
  { key: 'shipped', label: 'Dispatched', desc: 'With logistics rider / courier' },
  { key: 'delivered', label: 'Delivered', desc: 'Safely received by customer' },
];

function getShipmentStageIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending':
    case 'placed':
      return 0;
    case 'confirmed':
      return 1;
    case 'processing':
      return 2;
    case 'shipped':
    case 'dispatched':
    case 'out_for_delivery':
      return 3;
    case 'delivered':
      return 4;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
}

export const TrackOrderView: React.FC = () => {
  const {
    orders,
    formatNaira,
    openWhatsApp,
    updateOrderStatus,
    updateOrderPaymentStatus,
    searchAdminOrders,
    navigationState,
    navigateTo,
    currentUser,
    isAdmin,
    isAuthChecking,
    showToast,
  } = useStore();

  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Order[] | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);

  const executeAdminSearch = async (queryText: string) => {
    if (!isAdmin) return;
    const clean = queryText.trim();
    if (!clean) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchAdminOrders(clean);
      setSearchResults(results);
      if (results.length > 0) {
        setSelectedOrder(results[0]);
      } else {
        setSelectedOrder(null);
        showToast(`No customer orders matched "${clean}".`, 'info');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Keep selected order synced whenever context orders update (e.g. status/payment mutations)
  useEffect(() => {
    if (!isAdmin || !selectedOrder) return;
    const fresh = (orders || []).find(
      (o) => o.id === selectedOrder.id || o.orderNumber === selectedOrder.orderNumber
    );
    if (fresh) {
      setSelectedOrder(fresh);
    }
  }, [isAdmin, orders, selectedOrder?.id]);

  // Handle incoming URL params or navigationState only for verified admins
  useEffect(() => {
    if (!isAdmin) return;

    let qRef = '';
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        qRef = params.get('orderId') || params.get('orderNumber') || params.get('ref') || '';
      } catch {}
    }

    const navRef = navigationState?.orderNumber || navigationState?.orderId || '';
    const initialRef = (navRef || qRef).trim();

    if (initialRef) {
      setSearchInput(initialRef);
      const localMatch = (orders || []).find(
        (o) =>
          o.id.toLowerCase() === initialRef.toLowerCase() ||
          o.orderNumber.toLowerCase() === initialRef.toLowerCase() ||
          (o.receiptNumber && o.receiptNumber.toLowerCase() === initialRef.toLowerCase()) ||
          (o.paymentReference && o.paymentReference.toLowerCase() === initialRef.toLowerCase())
      );
      if (localMatch) {
        setSelectedOrder(localMatch);
      } else {
        void executeAdminSearch(initialRef);
      }
    } else if (!selectedOrder && orders.length > 0) {
      setSelectedOrder(orders[0]);
    }
  }, [isAdmin, navigationState?.orderId, navigationState?.orderNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeAdminSearch(searchInput);
  };

  const handleResetSearch = () => {
    setSearchInput('');
    setStatusFilter('all');
    setSearchResults(null);
    setSelectedOrder(orders[0] || null);
  };

  const displayedOrders = useMemo(() => {
    if (!isAdmin) return [];
    const base = searchResults !== null ? searchResults : orders || [];
    const cleanSearch = searchInput.trim().toLowerCase();

    return base.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) {
        return false;
      }
      if (searchResults === null && cleanSearch) {
        const hay = [
          o.orderNumber,
          o.id,
          o.receiptNumber,
          o.paymentReference,
          o.customerName,
          o.customer?.fullName,
          o.customerEmail,
          o.customer?.email,
          o.customerPhone,
          o.customer?.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(cleanSearch);
      }
      return true;
    });
  }, [isAdmin, orders, searchResults, searchInput, statusFilter]);

  // Strict Component-Level Role Guard: Admin ONLY
  if (isAuthChecking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Verifying administrator access...</p>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <div
        id="track-order-access-denied"
        className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center space-y-5 animate-fade-in"
      >
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wider">
            Administrator Access Required
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">Access Denied</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed">
            The order lookup and shipment management portal is restricted to authorized AjmanTech administrators only.
            {currentUser
              ? ' Please view and track your own orders from your personal Customer Account Dashboard.'
              : ' Please sign in with an administrator account or check your orders in the Customer Account portal.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigateTo('account')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white text-xs font-bold cursor-pointer transition-colors"
          >
            {currentUser ? 'Go to My Customer Dashboard' : 'Customer Sign In'}
          </button>
          {!currentUser && (
            <button
              type="button"
              onClick={() => navigateTo('admin-login')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition-colors"
            >
              Administrator Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleAdminStatusChange = (order: Order, nextStatus: OrderStatus) => {
    const noteToUse = statusNote.trim() || `Administrator updated shipment status to ${nextStatus.replace(/_/g, ' ')}`;
    updateOrderStatus(order.id, nextStatus, noteToUse);
    setSelectedOrder((prev) =>
      prev && prev.id === order.id ? { ...prev, status: nextStatus } : prev
    );
    setStatusNote('');
  };

  const handleApproveAndMarkPaid = (order: Order) => {
    updateOrderPaymentStatus(order.id, 'verified');
    if (order.status === 'pending' || order.status === 'placed') {
      updateOrderStatus(order.id, 'confirmed', 'Payment verified & order confirmed by Administrator');
    }
    setSelectedOrder((prev) =>
      prev && prev.id === order.id
        ? {
            ...prev,
            paymentStatus: 'verified',
            status: prev.status === 'pending' || prev.status === 'placed' ? 'confirmed' : prev.status,
          }
        : prev
    );
  };

  const handlePaymentSuccess = (details: { reference: string; channel: string }) => {
    if (selectedOrder) {
      updateOrderPaymentStatus(selectedOrder.id, 'paid', details.reference, details.channel);
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: 'paid',
              paymentReference: details.reference,
              paymentChannel: details.channel,
            }
          : prev
      );
    }
    setIsPaymentGatewayOpen(false);
  };

  const currentStageIdx = selectedOrder ? getShipmentStageIndex(selectedOrder.status) : 0;
  const isPaid =
    selectedOrder?.paymentStatus === 'paid' || selectedOrder?.paymentStatus === 'verified';
  const grandTotal = selectedOrder?.total ?? selectedOrder?.totalAmount ?? 0;

  return (
    <div id="track-order-page-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Administrator Order Management & Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002D72] tracking-tight">
            Admin Order Lookup & Shipment Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-light">
            Search all customer orders by order reference, name, email, or phone. Inspect delivery details, update shipment stages, verify payments, and print official receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo('admin-dashboard')}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#002D72] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Admin Control Center</span>
          </button>
        </div>
      </div>

      {/* Admin Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (!e.target.value.trim()) setSearchResults(null);
              }}
              placeholder="Search any order reference (e.g. AJM-2025-0101), customer name, email, or phone..."
              className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0047AB] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSearching}
              className="py-3 px-6 rounded-xl bg-[#0047AB] hover:bg-[#002D72] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Lookup Order</span>
                </>
              )}
            </button>
            {(searchInput || searchResults !== null || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>

        {/* Status Quick Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['all', 'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-[#002D72] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-[#002D72]'
                }`}
              >
                {st === 'all' ? `All Orders (${(searchResults ?? orders).length})` : st.replace(/_/g, ' ').toUpperCase()}
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Two-Column Admin Split: Order List + Full Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: All Customer Orders Directory */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#002D72] flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#0047AB]" />
              <span>Customer Orders ({displayedOrders.length})</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" /> Admin RLS Scope
            </span>
          </div>

          {displayedOrders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Package className="w-9 h-9 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No orders match the current filter.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {displayedOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const ordPaid = ord.paymentStatus === 'paid' || ord.paymentStatus === 'verified';
                const ordTotal = ord.total ?? ord.totalAmount ?? 0;
                const custName =
                  ord.customer?.fullName || ord.customerName || ord.deliveryAddress?.fullName || 'Customer';
                const custEmail = ord.customer?.email || ord.customerEmail || '';
                const custPhone = ord.customer?.phone || ord.customerPhone || '';

                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => setSelectedOrder(ord)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-[#0047AB] bg-blue-50/50 ring-2 ring-[#0047AB]/20'
                        : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-[#0047AB]">
                        #{ord.orderNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            ordPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.paymentStatus || 'pending'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-200/70 text-slate-700">
                          {String(ord.status || 'pending').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-900 truncate">{custName}</span>
                      <span className="font-extrabold text-[#002D72] shrink-0">
                        {formatNaira(ordTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{custEmail || custPhone || 'No contact'}</span>
                      <span className="shrink-0">
                        {new Date(ord.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Order Details, Status & Shipment Management */}
        <div className="lg:col-span-7">
          {!selectedOrder ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Select an order to manage</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-light">
                Click any order from the list or search by order reference above to inspect customer details, update shipment progress, and print receipts.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-6 shadow-xs">
              {/* Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#0047AB] bg-[#0047AB]/10 px-3 py-1 rounded-full font-mono">
                      Order #{selectedOrder.orderNumber}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full font-mono uppercase ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Payment: {selectedOrder.paymentStatus || 'pending'}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full uppercase bg-blue-50 text-[#002D72]">
                      {String(selectedOrder.status || 'pending').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Placed on {new Date(selectedOrder.createdAt || Date.now()).toLocaleString()}
                    {selectedOrder.receiptNumber ? ` • Invoice #${selectedOrder.receiptNumber}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => handleApproveAndMarkPaid(selectedOrder)}
                      className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify Payment</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsReceiptModalOpen(true)}
                    className="py-2 px-4 rounded-xl bg-[#002D72] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-300" />
                    <span>Official Receipt</span>
                  </button>
                </div>
              </div>

              {/* Customer PII & Delivery Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="font-bold text-[#002D72] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0047AB]" /> Customer Contact Info
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedOrder.customer?.fullName ||
                      selectedOrder.customerName ||
                      selectedOrder.deliveryAddress?.fullName ||
                      'Customer'}
                  </p>
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {selectedOrder.customer?.email || selectedOrder.customerEmail || 'No email'}
                    </span>
                  </p>
                  <p className="text-slate-600 font-mono text-[11px] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {selectedOrder.customer?.phone || selectedOrder.customerPhone || 'No phone'}
                    </span>
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <span className="font-bold text-[#002D72] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0047AB]" /> Delivery Address
                  </span>
                  <p className="text-slate-800 font-medium">
                    {selectedOrder.deliveryAddress?.streetAddress ||
                      selectedOrder.deliveryAddress?.address ||
                      selectedOrder.customer?.address ||
                      'Showroom Collection / Direct Dispatch'}
                  </p>
                  <p className="text-slate-600 font-light">
                    {selectedOrder.deliveryAddress?.city || selectedOrder.customer?.city || 'Lagos'},{' '}
                    {selectedOrder.deliveryAddress?.state || selectedOrder.customer?.state || 'Lagos'}
                  </p>
                  {(selectedOrder.notes || selectedOrder.customer?.notes) && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70">
                      Note: {selectedOrder.notes || selectedOrder.customer?.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Admin Order Status & Shipment Progress Control */}
              <div className="p-4 sm:p-5 rounded-2xl border border-blue-200/80 bg-blue-50/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#002D72] uppercase tracking-wider">
                      Manage Order Status & Shipment Progress
                    </h3>
                    <p className="text-[11px] text-slate-500 font-light">
                      Select a new status or click any shipment milestone below to update live tracking.
                    </p>
                  </div>

                  <select
                    aria-label="Update order status"
                    value={selectedOrder.status}
                    onChange={(e) => handleAdminStatusChange(selectedOrder, e.target.value as OrderStatus)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#002D72] focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                  >
                    {ADMIN_ORDER_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional dispatch / tracking note (e.g. Rider dispatched: +234...) before clicking a stage"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                />

                {/* Clickable Shipment Stages */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {SHIPMENT_STAGES.map((stage, idx) => {
                    const isPassed = currentStageIdx >= 0 && idx <= currentStageIdx;
                    const isCurrent = idx === currentStageIdx;
                    return (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => handleAdminStatusChange(selectedOrder, stage.key)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-[#0047AB] bg-white ring-2 ring-[#0047AB]/20 shadow-2xs'
                            : isPassed
                            ? 'border-emerald-200 bg-emerald-50/70'
                            : 'border-slate-200 bg-white/70 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {isPassed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="text-[11px] font-bold text-slate-900">{stage.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">{stage.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-[#002D72] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" /> Payment Information
                  </span>
                  <p className="text-slate-700 font-light">
                    Method:{' '}
                    <strong className="uppercase">
                      {(selectedOrder.paymentMethod || 'card').replace(/_/g, ' ')}
                    </strong>
                    {selectedOrder.paymentReference && (
                      <>
                        {' • Ref: '}
                        <strong className="font-mono">{selectedOrder.paymentReference}</strong>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Order Total</span>
                    <span className="text-base font-extrabold text-[#0047AB]">
                      {formatNaira(grandTotal)}
                    </span>
                  </div>
                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => setIsPaymentGatewayOpen(true)}
                      className="py-1.5 px-3 rounded-xl bg-[#0047AB] hover:bg-[#002D72] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Record Pay</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Package Contents */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#002D72] uppercase tracking-wider">
                  Order Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 text-xs border border-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.productImage || item.image || ''}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="font-semibold text-slate-900 truncate">
                            {item.productName || item.title || item.name}
                          </h5>
                          <span className="text-[11px] text-slate-500 font-light">
                            Qty: {item.quantity}{' '}
                            {item.selectedVariant || item.variant
                              ? `• ${item.selectedVariant || item.variant}`
                              : ''}
                          </span>
                        </div>
                      </div>
                      <div className="font-bold text-[#002D72] shrink-0 ml-2">
                        {formatNaira((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Dispatch Coordination */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-500 font-light">
                  Notify customer or dispatch rider via WhatsApp about order #{selectedOrder.orderNumber}.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      `Hello ${
                        selectedOrder.customer?.fullName || selectedOrder.customerName || 'Customer'
                      }, update on AjmanTech Order #${selectedOrder.orderNumber}: Status is now ${String(
                        selectedOrder.status
                      )
                        .replace(/_/g, ' ')
                        .toUpperCase()}.`
                    )
                  }
                  className="py-2 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message Customer on WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Receipt Modal */}
      {selectedOrder && (
        <OfficialReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          order={selectedOrder}
        />
      )}

      {/* Payment Gateway Modal */}
      {selectedOrder && (
        <PaymentGatewayModal
          isOpen={isPaymentGatewayOpen}
          onClose={() => setIsPaymentGatewayOpen(false)}
          amount={grandTotal}
          customerEmail={selectedOrder.customerEmail || selectedOrder.customer?.email || 'customer@ajmantech.ng'}
          customerName={selectedOrder.customerName || selectedOrder.customer?.fullName || 'Customer'}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
