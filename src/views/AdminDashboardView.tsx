import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  LayoutDashboard,
  Package,
  Wrench,
  ShoppingBag,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Truck,
  Settings,
  DollarSign,
  Search,
  Building,
  Sparkles,
  Layers,
  Eye,
} from 'lucide-react';
import { Product, OrderStatus, ServiceRequestStatus, ProductCategory } from '../types';

export const AdminDashboardView: React.FC = () => {
  const {
    products,
    orders,
    serviceRequests,
    storeSettings,
    formatNaira,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    updateServiceRequestStatus,
    updateStoreSettings,
    showToast,
    categories,
    navigateTo,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'services' | 'settings'>('overview');

  // Search & Filter in Tables
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Product Add / Edit Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New/Edit Product Form Fields
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('Chandeliers');
  const [prodPrice, setProdPrice] = useState(25000);
  const [prodDiscountPrice, setProdDiscountPrice] = useState<number | undefined>(undefined);
  const [prodStock, setProdStock] = useState(10);
  const [prodWattage, setProdWattage] = useState('60W');
  const [prodVoltage, setProdVoltage] = useState('220V - 240V');
  const [prodColorTemp, setProdColorTemp] = useState('Warm White (3000K)');
  const [prodWarranty, setProdWarranty] = useState('1 Year Official Warranty');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');

  // Store Settings Form Fields
  const [settingsBankName, setSettingsBankName] = useState(storeSettings.bankDetails.bankName);
  const [settingsAccountName, setSettingsAccountName] = useState(storeSettings.bankDetails.accountName);
  const [settingsAccountNumber, setSettingsAccountNumber] = useState(storeSettings.bankDetails.accountNumber);
  const [settingsWhatsapp, setSettingsWhatsapp] = useState(storeSettings.whatsappNumber);
  const [settingsFreeThreshold, setSettingsFreeThreshold] = useState(storeSettings.freeDeliveryThreshold);

  // Compute Overview KPIs
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const pendingServicesCount = serviceRequests.filter((s) => s.status === 'pending').length;

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Chandeliers');
    setProdPrice(45000);
    setProdDiscountPrice(undefined);
    setProdStock(15);
    setProdWattage('48W');
    setProdVoltage('180V - 265V');
    setProdColorTemp('Tri-Color (3000K - 6500K)');
    setProdWarranty('1 Year Full Replacement');
    setProdDesc('Premium certified electrical fixture built for residential and commercial spaces in Nigeria.');
    setProdImage('https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=800&auto=format&fit=crop');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdPrice(prod.price);
    setProdDiscountPrice(prod.discountPrice);
    setProdStock(prod.stock);
    setProdWattage(prod.specifications.wattage || '');
    setProdVoltage(prod.specifications.voltage || '');
    setProdColorTemp(prod.specifications.colorTemperature || '');
    setProdWarranty(prod.specifications.warranty || '');
    setProdDesc(prod.description);
    setProdImage(prod.images[0] || '');
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: prodName,
        category: prodCategory,
        price: Number(prodPrice),
        discountPrice: prodDiscountPrice ? Number(prodDiscountPrice) : undefined,
        stock: Number(prodStock),
        inStock: Number(prodStock) > 0,
        description: prodDesc,
        images: [prodImage, ...editingProduct.images.slice(1)],
        specifications: {
          ...editingProduct.specifications,
          wattage: prodWattage,
          voltage: prodVoltage,
          colorTemperature: prodColorTemp,
          warranty: prodWarranty,
        },
      });
      showToast(`Product "${prodName}" updated successfully.`);
    } else {
      const newSku = `AJM-${prodCategory.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      addProduct({
        sku: newSku,
        name: prodName,
        category: prodCategory,
        price: Number(prodPrice),
        discountPrice: prodDiscountPrice ? Number(prodDiscountPrice) : undefined,
        rating: 5.0,
        reviewCount: 1,
        inStock: Number(prodStock) > 0,
        stock: Number(prodStock),
        images: [prodImage],
        description: prodDesc,
        features: ['Certified standard', 'Surge protected', 'Official warranty'],
        specifications: {
          wattage: prodWattage,
          voltage: prodVoltage,
          colorTemperature: prodColorTemp,
          warranty: prodWarranty,
        },
        tags: ['Featured', 'New Arrival'],
        isFeatured: true,
        isBestSeller: false,
      });
      showToast(`New product "${prodName}" added to catalog.`);
    }

    setShowProductModal(false);
  };

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      whatsappNumber: settingsWhatsapp,
      freeDeliveryThreshold: Number(settingsFreeThreshold),
      bankDetails: {
        bankName: settingsBankName,
        accountName: settingsAccountName,
        accountNumber: settingsAccountNumber,
      },
    });
    showToast('Store settings updated successfully.');
  };

  // Filtered lists
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.includes(orderSearch)
  );

  return (
    <div id="admin-dashboard-container" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Store Operations Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
            AjmanTech Admin Portal
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('home')}
            className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            View Storefront
          </button>

          <button
            onClick={handleOpenAddProduct}
            className="py-2 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'overview' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overview & Metrics
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'products' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Product Catalog ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'orders' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Orders ({orders.length}) {pendingOrdersCount > 0 && <span className="ml-1.5 bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px]">{pendingOrdersCount}</span>}
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'services' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Service Tickets ({serviceRequests.length}) {pendingServicesCount > 0 && <span className="ml-1.5 bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px]">{pendingServicesCount}</span>}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'settings' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Store Settings
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-950">{formatNaira(totalRevenue)}</div>
              <p className="text-[11px] text-emerald-600 font-semibold">+18.4% this month</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-950">{orders.length}</div>
              <p className="text-[11px] text-slate-500">{pendingOrdersCount} pending dispatch</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Active Products</span>
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-950">{products.length}</div>
              <p className="text-[11px] text-slate-500">Across 8 electrical categories</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Service Bookings</span>
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-950">{serviceRequests.length}</div>
              <p className="text-[11px] text-purple-600 font-semibold">{pendingServicesCount} pending inspection</p>
            </div>
          </div>

          {/* Quick Action Tables in Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Recent Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-blue-700 font-bold hover:underline"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {orders.slice(0, 4).map((ord) => (
                  <div key={ord.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">#{ord.orderNumber}</div>
                      <div className="text-slate-500">{ord.customerName} • {ord.deliveryAddress.state}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatNaira(ord.totalAmount)}</div>
                      <span className="text-[10px] font-bold uppercase text-amber-600">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Service Requests */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Recent Service Inquiries</h3>
                <button
                  onClick={() => setActiveTab('services')}
                  className="text-xs text-blue-700 font-bold hover:underline"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {serviceRequests.slice(0, 4).map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{req.serviceName}</div>
                      <div className="text-slate-500">{req.customerName} ({req.city})</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS CRUD */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by SKU, name or category..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="py-2.5 px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price (₦)</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images[0]}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 truncate max-w-xs">{prod.name}</h4>
                            <span className="text-[11px] text-slate-400">
                              {prod.specifications.wattage} • {prod.specifications.voltage}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{prod.sku}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-semibold">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatNaira(prod.price)}
                        {prod.discountPrice && (
                          <span className="block text-[10px] text-emerald-600">
                            Disc: {formatNaira(prod.discountPrice)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.stock > 5
                              ? 'bg-emerald-50 text-emerald-700'
                              : prod.stock > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {prod.stock} in stock
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${prod.name}"?`)) {
                                deleteProduct(prod.id);
                                showToast(`Product deleted.`);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search orders by # reference, customer name or phone..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Shipment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        #{ord.orderNumber}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{ord.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{ord.deliveryAddress.city}</div>
                        <div className="text-[10px] text-slate-400">{ord.deliveryAddress.state}</div>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {formatNaira(ord.totalAmount)}
                        {ord.installationRequested && (
                          <span className="block text-[10px] text-amber-700 font-semibold">+Installation</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 uppercase">{ord.paymentMethod.replace('_', ' ')}</span>
                        <span className={`block text-[10px] font-bold ${ord.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          ({ord.paymentStatus})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => {
                            updateOrderStatus(ord.id, e.target.value as OrderStatus);
                            showToast(`Order #${ord.orderNumber} status set to ${e.target.value}.`);
                          }}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SERVICE REQUESTS */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ticket #</th>
                  <th className="py-3 px-4">Service Requested</th>
                  <th className="py-3 px-4">Client Details</th>
                  <th className="py-3 px-4">Site Location</th>
                  <th className="py-3 px-4">Preferred Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      #{req.ticketNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {req.serviceName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{req.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{req.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{req.address}</div>
                      <div className="text-[10px] text-slate-400">{req.city}, {req.state}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{req.preferredDate}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{req.preferredTimeSlot}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={req.status}
                        onChange={(e) => {
                          updateServiceRequestStatus(req.id, e.target.value as ServiceRequestStatus);
                          showToast(`Service Ticket #${req.ticketNumber} marked ${e.target.value}.`);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved / Assigned</option>
                        <option value="in_progress">Engineer on Site</option>
                        <option value="completed">Job Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STORE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Store & Financial Configurations
          </h2>

          <form onSubmit={handleSaveStoreSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Official WhatsApp Hotline (For Direct Orders & Inquiries)
              </label>
              <input
                type="text"
                value={settingsWhatsapp}
                onChange={(e) => setSettingsWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Free Delivery Order Threshold (₦)
              </label>
              <input
                type="number"
                value={settingsFreeThreshold}
                onChange={(e) => setSettingsFreeThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Direct Bank Transfer Credentials</h3>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={settingsBankName}
                  onChange={(e) => setSettingsBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={settingsAccountName}
                  onChange={(e) => setSettingsAccountName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Number (NUBAN)</label>
                <input
                  type="text"
                  value={settingsAccountNumber}
                  onChange={(e) => setSettingsAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-blue-700"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-colors"
            >
              Save Store Configurations
            </button>
          </form>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {editingProduct ? 'Edit Product Item' : 'Add New Electrical Product'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Product Title *</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Luxury LED Ring Chandelier 80cm"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Stock Units *</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Base Price in Naira (₦) *</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Discount Price (₦ Optional)</label>
                  <input
                    type="number"
                    value={prodDiscountPrice || ''}
                    onChange={(e) => setProdDiscountPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Leave blank if no discount"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Wattage</label>
                  <input
                    type="text"
                    value={prodWattage}
                    onChange={(e) => setProdWattage(e.target.value)}
                    placeholder="e.g. 72W"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Voltage Rating</label>
                  <input
                    type="text"
                    value={prodVoltage}
                    onChange={(e) => setProdVoltage(e.target.value)}
                    placeholder="e.g. 180V - 265V"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Product Image URL *</label>
                <input
                  type="url"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="py-2.5 px-5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
