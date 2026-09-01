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
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Server,
  RefreshCw,
} from 'lucide-react';
import { Product, OrderStatus, ServiceRequestStatus, ProductCategory } from '../types';
import { isSupabaseConfigured, getSupabaseConfigStatus, testSupabaseConnection } from '../lib/supabase';


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

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'services' | 'settings' | 'supabase'>('overview');

  // Supabase Status & Tester State
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{ testing: boolean; result?: { success: boolean; message: string } }>({
    testing: false,
  });
  const [copiedSql, setCopiedSql] = useState(false);
  const supabaseConfig = getSupabaseConfigStatus();

  const handleTestSupabase = async () => {
    setSupabaseTestStatus({ testing: true });
    const res = await testSupabaseConnection();
    setSupabaseTestStatus({ testing: false, result: res });
    if (res.success) {
      showToast('Supabase connection verified!', 'success');
    } else {
      showToast('Supabase connection check failed: ' + res.message, 'error');
    }
  };

  const fullSqlSchema = `-- Run this in Supabase SQL Editor (supabase.com -> SQL Editor -> New Query)
create extension if not exists "uuid-ossp";

-- Categories
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  item_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products
create table if not exists public.products (
  id text primary key,
  name text not null,
  category_id text references public.categories(id) on delete set null,
  category_name text not null,
  price numeric not null check (price >= 0),
  original_price numeric,
  rating numeric default 5.0,
  review_count integer default 0,
  stock integer default 10,
  brand text default 'Generic',
  is_featured boolean default false,
  is_best_seller boolean default false,
  is_new boolean default false,
  is_energy_saving boolean default false,
  voltage text default '220V-240V',
  warranty text default '1 Year',
  image text not null,
  gallery jsonb default '[]'::jsonb,
  short_description text not null,
  full_description text not null,
  specifications jsonb default '{}'::jsonb,
  features jsonb default '[]'::jsonb,
  variants jsonb default '[]'::jsonb,
  tags jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders
create table if not exists public.orders (
  id text primary key,
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null,
  delivery_fee numeric default 0,
  installation_fee numeric default 0,
  status text not null default 'pending',
  payment_method text not null default 'bank_transfer',
  payment_status text not null default 'pending',
  delivery_address jsonb not null default '{}'::jsonb,
  delivery_notes text,
  tracking_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Service Requests
create table if not exists public.service_requests (
  id text primary key,
  ticket_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  service_type text not null,
  service_name text not null,
  service_tier text,
  description text not null,
  location jsonb not null default '{}'::jsonb,
  preferred_date text,
  preferred_time text,
  is_emergency boolean default false,
  status text not null default 'submitted',
  assigned_technician text,
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews
create table if not exists public.reviews (
  id text primary key,
  product_id text,
  customer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  date text not null,
  comment text not null,
  verified_purchase boolean default true,
  helpful_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Store Settings
create table if not exists public.store_settings (
  id text primary key default 'primary_settings',
  store_name text not null default 'AjmanTech Services',
  phone_number text not null default '+234 802 345 6789',
  whatsapp_number text not null default '2348023456789',
  email text not null default 'support@ajmantech.ng',
  address text not null default 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  delivery_fee_lagos numeric default 2500,
  delivery_fee_other_states numeric default 6000,
  free_delivery_threshold numeric default 50000,
  bank_details jsonb not null default '{"bankName": "Guaranty Trust Bank (GTBank)", "accountNumber": "0123456789", "accountName": "AjmanTech Electrical Services Ltd"}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS & Add Public Policies
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.service_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.store_settings enable row level security;

create policy "Allow all on categories" on public.categories for all using (true) with check (true);
create policy "Allow all on products" on public.products for all using (true) with check (true);
create policy "Allow all on orders" on public.orders for all using (true) with check (true);
create policy "Allow all on service_requests" on public.service_requests for all using (true) with check (true);
create policy "Allow all on reviews" on public.reviews for all using (true) with check (true);
create policy "Allow all on store_settings" on public.store_settings for all using (true) with check (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(fullSqlSchema);
    setCopiedSql(true);
    showToast('SQL Migration Schema copied to clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };


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
  const totalRevenue = (orders || [])
    .filter((o) => o?.status !== 'cancelled')
    .reduce((acc, curr) => acc + (curr?.total || curr?.totalAmount || 0), 0);
  const pendingOrdersCount = (orders || []).filter((o) => o?.status === 'pending').length;
  const pendingServicesCount = (serviceRequests || []).filter((s) => s?.status === 'pending').length;

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

  const filteredOrders = (orders || []).filter(
    (o) =>
      (o?.orderNumber || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o?.customer?.fullName || o?.customerName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o?.customer?.phone || o?.customerPhone || '').includes(orderSearch)
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

        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'supabase' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span>Supabase & Cloud DB</span>
          {supabaseConfig.isConfigured ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          )}
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
                {(orders || []).slice(0, 4).map((ord) => (
                  <div key={ord.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">#{ord.orderNumber}</div>
                      <div className="text-slate-500">
                        {ord.customerName || ord.customer?.fullName || 'Customer'} • {ord.deliveryAddress?.state || ord.customer?.state || 'Lagos'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatNaira(ord.total ?? ord.totalAmount ?? 0)}</div>
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
                {(serviceRequests || []).slice(0, 4).map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{req.serviceName}</div>
                      <div className="text-slate-500">{req.customerName} ({req.city})</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {(req.status || 'pending').replace('_', ' ')}
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
                  {(filteredProducts || []).map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || prod.image || ''}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 truncate max-w-xs">{prod.name}</h4>
                            <span className="text-[11px] text-slate-400">
                              {prod.specifications?.wattage || ''} {prod.specifications?.voltage ? `• ${prod.specifications.voltage}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{prod.sku || prod.specifications?.sku || 'AJM-STD'}</td>
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
                  {(filteredOrders || []).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        #{ord.orderNumber}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ord.customer?.fullName || ord.customerName || 'Customer'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{ord.customer?.phone || ord.customerPhone || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{ord.deliveryAddress?.city || ord.customer?.city || 'Lagos'}</div>
                        <div className="text-[10px] text-slate-400">{ord.deliveryAddress?.state || ord.customer?.state || 'Lagos'}</div>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {formatNaira(ord.total || ord.totalAmount || 0)}
                        {ord.installationRequested && (
                          <span className="block text-[10px] text-amber-700 font-semibold">+Installation</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 uppercase">{(ord.paymentMethod || 'bank_transfer').replace('_', ' ')}</span>
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
                {(serviceRequests || []).map((req) => (
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

      {/* TAB 6: SUPABASE & CLOUD DB */}
      {activeTab === 'supabase' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="bg-linear-to-r from-emerald-900 to-[#002D72] rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  <Database className="w-3.5 h-3.5" />
                  Supabase PostgreSQL Backend Integration
                </div>
                <h2 className="text-xl sm:text-2xl font-black">Vercel & Supabase Cloud Connection</h2>
                <p className="text-xs text-blue-100/80 max-w-2xl font-light">
                  Your AjmanTech store is configured to synchronize live orders, customer service requests, product catalog, and reviews directly with your Supabase PostgreSQL database deployed on Vercel.
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Live Connection:</span>
                  {supabaseConfig.isConfigured ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/40">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Pending Keys
                    </span>
                  )}
                </div>

                <button
                  onClick={handleTestSupabase}
                  disabled={supabaseTestStatus.testing}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-2 border border-white/20 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${supabaseTestStatus.testing ? 'animate-spin' : ''}`} />
                  {supabaseTestStatus.testing ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>

            {/* Test Result Banner */}
            {supabaseTestStatus.result && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-medium border flex items-start gap-2.5 ${
                  supabaseTestStatus.result.success
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                }`}
              >
                {supabaseTestStatus.result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{supabaseTestStatus.result.success ? 'Success' : 'Notice'}</p>
                  <p className="text-[11px] opacity-90">{supabaseTestStatus.result.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Setup 3-Step Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#002D72] flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Run Schema in Supabase</h3>
              <p className="text-xs text-slate-600 font-light leading-relaxed">
                Log into <strong>supabase.com</strong>, select your project, click on <strong>SQL Editor</strong> in the left sidebar, paste the migration SQL schema, and click <strong>Run</strong>.
              </p>
              <button
                onClick={handleCopySql}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                <span>{copiedSql ? 'Schema Copied!' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Get Project API Credentials</h3>
              <p className="text-xs text-slate-600 font-light leading-relaxed">
                In your Supabase project dashboard, go to <strong>Project Settings → API</strong>. Copy your <strong>Project URL</strong> and your <strong>anon / public API key</strong>.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[10px] text-slate-700 space-y-1">
                <div>URL: https://xyz.supabase.co</div>
                <div>Anon Key: eyJhbGciOi...</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Add Variables in Vercel</h3>
              <p className="text-xs text-slate-600 font-light leading-relaxed">
                In <strong>vercel.com</strong>, open your project → <strong>Settings → Environment Variables</strong>. Add the two variables below and trigger a <strong>Redeploy</strong>.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[10px] text-purple-700 font-bold space-y-1">
                <div>VITE_SUPABASE_URL</div>
                <div>VITE_SUPABASE_ANON_KEY</div>
              </div>
            </div>
          </div>

          {/* SQL Editor Code Block */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-700" />
                  Supabase PostgreSQL Migration Script (supabase/schema.sql)
                </h3>
                <p className="text-xs text-slate-500">
                  Creates tables: <code className="text-blue-700 font-semibold">products</code>, <code className="text-blue-700 font-semibold">categories</code>, <code className="text-blue-700 font-semibold">orders</code>, <code className="text-blue-700 font-semibold">service_requests</code>, <code className="text-blue-700 font-semibold">reviews</code>, <code className="text-blue-700 font-semibold">store_settings</code> with Row Level Security (RLS).
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="py-2.5 px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Migration'}</span>
              </button>
            </div>

            <div className="relative rounded-2xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-72">
              <pre>{fullSqlSchema}</pre>
            </div>
          </div>
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
