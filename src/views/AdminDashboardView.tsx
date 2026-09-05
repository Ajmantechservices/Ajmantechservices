import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Image as ImageIcon,
  ShoppingBag,
  Wrench,
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
  LogOut,
  AlertTriangle,
  ChevronRight,
  Upload,
  Link,
  Info,
  Sliders,
  X,
  BookOpen,
} from 'lucide-react';
import { Product, ProductCategory, Category } from '../types';
import { AdminBlogManagement } from '../components/AdminBlogManagement';
import {
  isSupabaseConfigured,
  getSupabaseConfigStatus,
  testSupabaseConnection,
  fetchProductGallery,
  fetchSupabaseTableCounts,
  checkAdminAuthSession,
  SupabaseDashboardCounts,
  supabase,
  TARGET_ADMIN_EMAIL,
} from '../lib/supabase';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'gallery'
  | 'blog'
  | 'orders'
  | 'services'
  | 'settings'
  | 'supabase';

export const AdminDashboardView: React.FC = () => {
  const {
    products,
    categories,
    orders,
    serviceRequests,
    blogPosts,
    storeSettings,
    formatNaira,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addGalleryImagesToProduct,
    deleteProductGalleryItem,
    refreshCatalog,
    updateOrderStatus,
    updateServiceRequestStatus,
    updateStoreSettings,
    adminLogout,
    navigateTo,
    showToast,
    currentUser,
    isAdmin,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Supabase Table Counts for Stat Cards
  const [supabaseCounts, setSupabaseCounts] = useState<SupabaseDashboardCounts | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // Supabase Status & Tester State
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{
    testing: boolean;
    result?: { success: boolean; message: string };
  }>({ testing: false });
  const [copiedSql, setCopiedSql] = useState(false);
  const [isRefreshingCatalog, setIsRefreshingCatalog] = useState(false);
  const supabaseConfig = getSupabaseConfigStatus();

  // Search Queries
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // -------------------------------------------------------------
  // Route Protection & Middleware
  // Check Supabase authentication state on page load / execution
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const verifyAdminAuth = async () => {
      const normalizedTarget = TARGET_ADMIN_EMAIL.toLowerCase();

      // 1. Check local store state and currentUser email
      const userEmail = currentUser?.email?.toLowerCase().trim();
      if (!isAdmin || userEmail !== normalizedTarget) {
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.auth.signOut();
          } catch {}
        }
        await adminLogout();
        showToast('Unauthorized access: Only the site owner can log into this dashboard.', 'error');
        navigateTo('admin-login');
        if (typeof window !== 'undefined') {
          window.history.replaceState(
            null,
            '',
            `/admin/login?error=${encodeURIComponent(
              'Unauthorized access: Only the site owner can log into this dashboard.'
            )}`
          );
        }
        return;
      }

      // 2. Check live Supabase authentication session
      if (isSupabaseConfigured()) {
        const { isAdmin: isCloudAdmin, email: cloudEmail } = await checkAdminAuthSession();
        const normalizedCloudEmail = cloudEmail?.toLowerCase().trim();

        // If not admin in cloud profiles, or email does NOT match TARGET_ADMIN_EMAIL
        if ((!isCloudAdmin || normalizedCloudEmail !== normalizedTarget) && isMounted) {
          if (supabase) {
            try {
              await supabase.auth.signOut();
            } catch {}
          }
          await adminLogout();
          showToast('Unauthorized access: Only the site owner can log into this dashboard.', 'error');
          navigateTo('admin-login');
          if (typeof window !== 'undefined') {
            window.history.replaceState(
              null,
              '',
              `/admin/login?error=${encodeURIComponent(
                'Unauthorized access: Only the site owner can log into this dashboard.'
              )}`
            );
          }
        }
      }
    };

    verifyAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, navigateTo, showToast, currentUser, adminLogout]);

  // -------------------------------------------------------------
  // Load Table Counts Directly from Supabase
  // -------------------------------------------------------------
  const loadSupabaseTableCounts = async () => {
    if (isSupabaseConfigured()) {
      setIsLoadingCounts(true);
      const counts = await fetchSupabaseTableCounts();
      if (counts) {
        setSupabaseCounts(counts);
      }
      setIsLoadingCounts(false);
    }
  };

  useEffect(() => {
    loadSupabaseTableCounts();
  }, []);

  // -------------------------------------------------------------
  // Product Add / Edit Modal State
  // -------------------------------------------------------------
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [prodName, setProdName] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [prodCategory, setProdCategory] = useState<string>('Chandeliers');
  const [prodPrice, setProdPrice] = useState<number>(45000);
  const [prodDiscountPrice, setProdDiscountPrice] = useState<number | undefined>(undefined);
  const [prodStock, setProdStock] = useState<number>(15);
  const [prodWattage, setProdWattage] = useState('48W');
  const [prodVoltage, setProdVoltage] = useState('180V - 265V');
  const [prodColorTemp, setProdColorTemp] = useState('Tri-Color (3000K - 6500K)');
  const [prodWarranty, setProdWarranty] = useState('1 Year Full Replacement');
  const [prodDesc, setProdDesc] = useState('');
  const [prodThumbnailUrl, setProdThumbnailUrl] = useState('');

  // -------------------------------------------------------------
  // Categories Manager State
  // -------------------------------------------------------------
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // -------------------------------------------------------------
  // Product Gallery Manager State
  // -------------------------------------------------------------
  const [selectedGalleryProductId, setSelectedGalleryProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [galleryInputUrls, setGalleryInputUrls] = useState<string>('');
  const [galleryDisplayOrder, setGalleryDisplayOrder] = useState<number>(0);
  const [galleryCaption, setGalleryCaption] = useState<string>('');
  const [isAddingGalleryImages, setIsAddingGalleryImages] = useState<boolean>(false);
  const [activeGalleryList, setActiveGalleryList] = useState<any[]>([]);

  // -------------------------------------------------------------
  // Store Settings Form Fields
  // -------------------------------------------------------------
  const [settingsBankName, setSettingsBankName] = useState(storeSettings.bankDetails.bankName);
  const [settingsAccountName, setSettingsAccountName] = useState(storeSettings.bankDetails.accountName);
  const [settingsAccountNumber, setSettingsAccountNumber] = useState(storeSettings.bankDetails.accountNumber);
  const [settingsWhatsapp, setSettingsWhatsapp] = useState(storeSettings.whatsappNumber);
  const [settingsFreeThreshold, setSettingsFreeThreshold] = useState(storeSettings.freeDeliveryThreshold);

  // Sync selectedGalleryProductId when products list loads
  useEffect(() => {
    if (!selectedGalleryProductId && products.length > 0) {
      setSelectedGalleryProductId(products[0].id);
    }
  }, [products, selectedGalleryProductId]);

  // Load gallery items from Supabase when selected product changes
  useEffect(() => {
    if (selectedGalleryProductId && isSupabaseConfigured()) {
      fetchProductGallery(selectedGalleryProductId).then(({ data }) => {
        if (data) {
          setActiveGalleryList(data);
        }
      });
    }
  }, [selectedGalleryProductId]);

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

  const handleManualRefreshCatalog = async () => {
    setIsRefreshingCatalog(true);
    await refreshCatalog();
    setIsRefreshingCatalog(false);
  };

  const handleLogout = async () => {
    await adminLogout();
    showToast('Signed out successfully from admin portal.', 'info');
    navigateTo('admin-login');
  };

  // -------------------------------------------------------------
  // Product Modal Handlers
  // -------------------------------------------------------------
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdSlug('');
    setProdCategory(categories[0]?.name || 'Chandeliers');
    setProdPrice(45000);
    setProdDiscountPrice(undefined);
    setProdStock(15);
    setProdWattage('48W');
    setProdVoltage('180V - 265V');
    setProdColorTemp('Tri-Color (3000K - 6500K)');
    setProdWarranty('1 Year Official Warranty');
    setProdDesc('Premium electrical fixture built with surge suppression for residential and commercial installations.');
    setProdThumbnailUrl('https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=800&auto=format&fit=crop');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdSlug(prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    setProdCategory(prod.category);
    setProdPrice(prod.price);
    setProdDiscountPrice(prod.discountPrice);
    setProdStock(prod.stock);
    setProdWattage(prod.specifications?.wattage || '');
    setProdVoltage(prod.specifications?.voltage || '');
    setProdColorTemp(prod.specifications?.colorTemperature || '');
    setProdWarranty(prod.specifications?.warranty || '');
    setProdDesc(prod.description);
    setProdThumbnailUrl(prod.images[0] || '');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice) {
      showToast('Please enter a product title and price', 'error');
      return;
    }

    const calculatedSlug =
      prodSlug.trim() || prodName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: prodName.trim(),
        slug: calculatedSlug,
        category: prodCategory as ProductCategory,
        price: Number(prodPrice),
        discountPrice: prodDiscountPrice ? Number(prodDiscountPrice) : undefined,
        stock: Number(prodStock),
        inStock: Number(prodStock) > 0,
        description: prodDesc,
        images: [prodThumbnailUrl.trim() || editingProduct.images[0], ...editingProduct.images.slice(1)],
        specifications: {
          ...editingProduct.specifications,
          wattage: prodWattage,
          voltage: prodVoltage,
          colorTemperature: prodColorTemp,
          warranty: prodWarranty,
        },
      };
      await updateProduct(updated);
    } else {
      const newSku = `AJM-${prodCategory.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      await addProduct({
        sku: newSku,
        slug: calculatedSlug,
        name: prodName.trim(),
        brand: 'AjmanTech',
        category: prodCategory as ProductCategory,
        price: Number(prodPrice),
        discountPrice: prodDiscountPrice ? Number(prodDiscountPrice) : undefined,
        rating: 5.0,
        reviewCount: 1,
        inStock: Number(prodStock) > 0,
        stock: Number(prodStock),
        images: [prodThumbnailUrl.trim() || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=800&auto=format&fit=crop'],
        description: prodDesc,
        shortDescription: prodDesc.slice(0, 100) + '...',
        features: ['Certified standard', 'Surge protected', 'Official warranty'],
        specifications: {
          wattage: prodWattage,
          voltage: prodVoltage,
          colorTemperature: prodColorTemp,
          warranty: prodWarranty,
        },
        tags: ['Featured', 'New Arrival', prodCategory.toLowerCase()],
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: true,
      });
    }

    setShowProductModal(false);
  };

  // -------------------------------------------------------------
  // Category Creation Handler
  // -------------------------------------------------------------
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Please enter a category name', 'error');
      return;
    }

    const calculatedSlug =
      newCatSlug.trim() || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    setIsCreatingCategory(true);
    try {
      await addCategory({
        name: newCatName.trim(),
        slug: calculatedSlug,
        description: newCatDesc.trim() || `${newCatName.trim()} products and professional equipment.`,
        image: newCatImageUrl.trim() || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=600&auto=format&fit=crop',
        iconName: 'Sparkles',
        productCount: 0,
        isPopular: true,
      });
      setNewCatName('');
      setNewCatSlug('');
      setNewCatImageUrl('');
      setNewCatDesc('');
    } catch (err: any) {
      showToast('Failed to create category: ' + err.message, 'error');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // -------------------------------------------------------------
  // Product Gallery Manager Handler
  // -------------------------------------------------------------
  const handleAddGalleryUrls = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGalleryProductId) {
      showToast('Please select a target product', 'error');
      return;
    }

    // Split multiple URLs by newline or comma
    const rawUrls = galleryInputUrls
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (rawUrls.length === 0) {
      showToast('Please enter at least one image URL', 'error');
      return;
    }

    setIsAddingGalleryImages(true);
    try {
      await addGalleryImagesToProduct(selectedGalleryProductId, rawUrls, galleryCaption, Number(galleryDisplayOrder) || 0);
      setGalleryInputUrls('');
      setGalleryCaption('');
      setGalleryDisplayOrder((prev) => prev + rawUrls.length);
      // Reload gallery list
      if (isSupabaseConfigured()) {
        const { data } = await fetchProductGallery(selectedGalleryProductId);
        if (data) setActiveGalleryList(data);
      }
    } catch (err: any) {
      showToast('Error attaching images: ' + err.message, 'error');
    } finally {
      setIsAddingGalleryImages(false);
    }
  };

  const handleDeleteGalleryImage = async (imgUrl: string, galleryId?: string) => {
    if (!selectedGalleryProductId) return;
    await deleteProductGalleryItem(galleryId || '', selectedGalleryProductId, imgUrl);
    setActiveGalleryList((prev) => prev.filter((item) => item.image_url !== imgUrl && item.id !== galleryId));
  };

  // -------------------------------------------------------------
  // Store Settings Save Handler
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Metrics Computation
  // -------------------------------------------------------------
  const totalRevenue = (orders || [])
    .filter((o) => o?.status !== 'cancelled')
    .reduce((acc, curr) => acc + (curr?.total || curr?.totalAmount || 0), 0);
  const pendingOrdersCount = (orders || []).filter((o) => o?.status === 'pending').length;
  const pendingServicesCount = (serviceRequests || []).filter((s) => s?.status === 'pending').length;
  const lowStockCount = products.filter((p) => p.stock <= 3).length;

  const currentGalleryProduct = products.find((p) => p.id === selectedGalleryProductId);

  const fullSqlSchema = `-- AjmanTech Supabase Schema
-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CATEGORIES TABLE
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  item_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text,
  category_id text references public.categories(id) on delete set null,
  category_name text not null,
  price numeric not null check (price >= 0),
  original_price numeric,
  rating numeric default 5.0,
  review_count integer default 0,
  stock integer default 10,
  brand text default 'AjmanTech',
  is_featured boolean default false,
  is_best_seller boolean default false,
  is_new boolean default false,
  voltage text default '220V-240V',
  warranty text default '1 Year',
  image text not null,
  gallery jsonb default '[]'::jsonb,
  short_description text not null,
  full_description text not null,
  specifications jsonb default '{}'::jsonb,
  tags jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. PRODUCT GALLERY TABLE
create table if not exists public.product_gallery (
  id uuid default uuid_generate_v4() primary key,
  product_id text references public.products(id) on delete cascade,
  image_url text not null,
  caption text,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. RLS Policies
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_gallery enable row level security;

create policy "Allow public read on profiles" on public.profiles for select using (true);
create policy "Allow all modifications on categories" on public.categories for all using (true) with check (true);
create policy "Allow all modifications on products" on public.products for all using (true) with check (true);
create policy "Allow all modifications on product_gallery" on public.product_gallery for all using (true) with check (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(fullSqlSchema);
    setCopiedSql(true);
    showToast('SQL Migration Schema copied to clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div id="admin-dashboard-page" className="min-h-[88vh] bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                AjmanTech Control Center
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Admin Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-light hidden sm:flex items-center gap-1.5">
              <span>Admin Email:</span>
              <strong className="text-slate-200 font-mono">{currentUser?.email || 'admin@ajmantech.ng'}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls & Topbar Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="refresh-catalog-btn"
            onClick={async () => {
              await handleManualRefreshCatalog();
              await loadSupabaseTableCounts();
            }}
            disabled={isRefreshingCatalog || isLoadingCounts}
            title="Synchronize Live Catalog with Supabase"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCatalog || isLoadingCounts ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden md:inline">Sync Supabase</span>
          </button>

          {/* Website Preview Link */}
          <button
            id="admin-view-storefront-btn"
            onClick={() => navigateTo('home')}
            title="Preview live customer storefront"
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Website Preview</span>
          </button>

          {/* Logout Button (supabase.auth.signOut()) */}
          <button
            id="admin-logout-btn"
            onClick={handleLogout}
            title="Sign out from Supabase & Admin Dashboard"
            className="px-3.5 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900 text-rose-200 hover:text-rose-100 border border-rose-800/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side Navigation */}
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0 flex md:flex-col justify-between overflow-x-auto md:overflow-y-auto">
          <div className="space-y-6 w-full">
            {/* Primary Navigation Sections (Core Management Links) */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 hidden md:block">
                Navigation
              </div>

              {/* 1. Overview (Metrics) */}
              <button
                id="tab-overview-btn"
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Overview (Metrics)</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 hidden md:block ${activeTab === 'overview' ? 'text-slate-950' : 'text-slate-600'}`} />
              </button>

              {/* 2. Products */}
              <button
                id="tab-products-btn"
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'products'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 shrink-0" />
                  <span>Products</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeTab === 'products' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                  {supabaseCounts?.productsCount ?? products.length}
                </span>
              </button>

              {/* 3. Categories */}
              <button
                id="tab-categories-btn"
                onClick={() => setActiveTab('categories')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'categories'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FolderTree className="w-4 h-4 shrink-0" />
                  <span>Categories</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeTab === 'categories' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                  {supabaseCounts?.categoriesCount ?? categories.length}
                </span>
              </button>

              {/* 4. Gallery URLs */}
              <button
                id="tab-gallery-btn"
                onClick={() => setActiveTab('gallery')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'gallery'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-4 h-4 shrink-0" />
                  <span>Gallery URLs</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 hidden md:block" />
              </button>

              {/* 5. Blog Posts */}
              <button
                id="tab-blog-btn"
                onClick={() => setActiveTab('blog')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'blog'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Blog Posts</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeTab === 'blog' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                  {supabaseCounts?.postsCount ?? blogPosts.length}
                </span>
              </button>

              {/* 5. Service Requests */}
              <button
                id="tab-services-btn"
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'services'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>Service Requests</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeTab === 'services' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                  {supabaseCounts?.serviceRequestsCount ?? serviceRequests.length}
                </span>
              </button>
            </div>

            {/* Secondary Operations */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 hidden md:block">
                Store Operations
              </div>

              {/* Orders */}
              <button
                id="tab-orders-btn"
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === 'orders'
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Total Orders</span>
                </div>
                <span className="bg-slate-800 text-slate-300 font-mono px-1.5 py-0.2 rounded text-[10px]">
                  {supabaseCounts?.ordersCount ?? orders.length}
                </span>
              </button>

              {/* Supabase Cloud */}
              <button
                id="tab-supabase-btn"
                onClick={() => setActiveTab('supabase')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === 'supabase'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                    : 'text-emerald-400/80 hover:bg-emerald-950/20 hover:text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 shrink-0" />
                  <span>Supabase Sync</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${supabaseConfig.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </button>

              {/* Settings */}
              <button
                id="tab-settings-btn"
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === 'settings'
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Store Settings</span>
                </div>
              </button>
            </div>
          </div>

          {/* Database indicator */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hidden md:block">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-1">
              <span className={`w-2 h-2 rounded-full ${supabaseConfig.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{supabaseConfig.isConfigured ? 'Supabase Connected' : 'Local Storage Mode'}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight font-light">
              {supabaseConfig.isConfigured
                ? 'Counts & inventory fetched directly from PostgreSQL database.'
                : 'Configure Supabase keys in Settings to persist cloud auth & data.'}
            </p>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 bg-slate-950 p-4 sm:p-8 overflow-y-auto max-w-7xl">
          {/* ========================================================================= */}
          {/* 1. OVERVIEW & METRICS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Overview & Metrics</h2>
                    {supabaseConfig.isConfigured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Supabase Tables
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live stat cards fetching counts directly from Supabase tables (<code className="text-amber-400 text-[11px]">products</code>, <code className="text-amber-400 text-[11px]">categories</code>, <code className="text-amber-400 text-[11px]">service_requests</code>, <code className="text-amber-400 text-[11px]">orders</code>)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadSupabaseTableCounts}
                    disabled={isLoadingCounts}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCounts ? 'animate-spin text-amber-400' : ''}`} />
                    <span>Refresh Counts</span>
                  </button>
                  <button
                    onClick={handleOpenAddProduct}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer w-fit"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                </div>
              </div>

              {/* 4 Key Metric Cards Grid (Fetching Counts Directly from Supabase Tables) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Products (`products` table count) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Products</span>
                    <Package className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {supabaseCounts?.productsCount ?? products.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                    <span className="text-emerald-400 font-semibold font-mono">
                      `products` table
                    </span>
                    <span className="text-slate-400">{lowStockCount} low stock</span>
                  </div>
                </div>

                {/* 2. Categories (`categories` table count) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Categories</span>
                    <FolderTree className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {supabaseCounts?.categoriesCount ?? categories.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                    <span className="text-blue-400 font-semibold font-mono">
                      `categories` table
                    </span>
                    <span className="text-slate-400">active catalog</span>
                  </div>
                </div>

                {/* 3. Service Requests (`service_requests` table count) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Service Requests</span>
                    <Wrench className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {supabaseCounts?.serviceRequestsCount ?? serviceRequests.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                    <span className="text-amber-400 font-semibold font-mono">
                      `service_requests` table
                    </span>
                    <span className="text-slate-400">{pendingServicesCount} pending</span>
                  </div>
                </div>

                {/* 4. Total Orders (`orders` table count) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {supabaseCounts?.ordersCount ?? orders.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                    <span className="text-emerald-400 font-semibold font-mono">
                      `orders` table
                    </span>
                    <span className="text-slate-400">{formatNaira(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Items Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fast Navigation Shortcut Cards */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Quick Operational Shortcuts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab('products')}
                      className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Manage Catalog</div>
                        <div className="text-[11px] text-slate-400">Edit titles, prices, stock</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('categories')}
                      className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors">
                        <FolderTree className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Categories</div>
                        <div className="text-[11px] text-slate-400">Add & organize categories</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('gallery')}
                      className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Product Gallery</div>
                        <div className="text-[11px] text-slate-400">Attach multi-image URLs</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('blog')}
                      className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Blog & Articles</div>
                        <div className="text-[11px] text-slate-400">SEO guides & public.posts</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('supabase')}
                      className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Supabase SQL</div>
                        <div className="text-[11px] text-slate-400">Database sync & schema</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Low Stock Watchlist */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Inventory Restock Watchlist</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">{lowStockCount} items</span>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {products
                      .filter((p) => p.stock <= 5)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover bg-slate-700 shrink-0"
                            />
                            <div className="truncate">
                              <div className="font-semibold text-white truncate">{p.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{p.category}</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                p.stock === 0
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {p.stock === 0 ? 'Out of Stock' : `${p.stock} units left`}
                            </span>
                          </div>
                        </div>
                      ))}
                    {lowStockCount === 0 && (
                      <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <span>All products currently have healthy inventory levels.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. PRODUCTS MANAGER TAB */}
          {/* ========================================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Products Manager</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live product catalog synchronized with Supabase database
                  </p>
                </div>
                <button
                  id="add-new-product-btn"
                  onClick={handleOpenAddProduct}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer w-fit"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by title, slug, category, or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
                />
              </div>

              {/* Products Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Product Details</th>
                        <th className="py-3 px-4">Slug</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Stock Quantity</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-light">
                      {products
                        .filter(
                          (p) =>
                            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            (p.slug || '').toLowerCase().includes(productSearch.toLowerCase()) ||
                            p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
                            p.sku.toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* Product Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.images[0]}
                                  alt={prod.name}
                                  className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0 border border-slate-700/60"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-white text-xs">{prod.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">{prod.sku}</div>
                                </div>
                              </div>
                            </td>

                            {/* Slug */}
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                              {prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 text-[11px] font-semibold border border-slate-700">
                                {prod.category}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-4 font-mono font-bold text-white">
                              {formatNaira(prod.price)}
                              {prod.discountPrice && (
                                <div className="text-[10px] text-slate-400 line-through font-normal">
                                  {formatNaira(prod.discountPrice)}
                                </div>
                              )}
                            </td>

                            {/* Stock */}
                            <td className="py-3.5 px-4 font-mono">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  prod.stock === 0
                                    ? 'bg-rose-950 text-rose-300'
                                    : prod.stock <= 3
                                    ? 'bg-amber-950 text-amber-300'
                                    : 'bg-emerald-950 text-emerald-300'
                                }`}
                              >
                                {prod.stock} units
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditProduct(prod)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedGalleryProductId(prod.id);
                                    setActiveTab('gallery');
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300 transition-colors"
                                  title="Manage Multi-Image Gallery"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete product "${prod.name}"?`)) {
                                      deleteProduct(prod.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 transition-colors"
                                  title="Delete Product"
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

          {/* ========================================================================= */}
          {/* 3. CATEGORIES MANAGER TAB */}
          {/* ========================================================================= */}
          {activeTab === 'categories' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header Title */}
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Categories Manager</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create, configure, and manage store categories stored in the <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">categories</code> Supabase table
                </p>
              </div>

              {/* Add Category Form Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <FolderTree className="w-4 h-4" />
                  <span>Create New Category</span>
                </div>

                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Category Name *
                      </label>
                      <input
                        id="cat-name-input"
                        type="text"
                        required
                        placeholder="e.g. Solar Inverters"
                        value={newCatName}
                        onChange={(e) => {
                          setNewCatName(e.target.value);
                          if (!newCatSlug) {
                            setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                          }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        URL Slug *
                      </label>
                      <input
                        id="cat-slug-input"
                        type="text"
                        required
                        placeholder="e.g. solar-inverters"
                        value={newCatSlug}
                        onChange={(e) => setNewCatSlug(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Image URL as text string */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Image URL (Thumbnail)
                      </label>
                      <input
                        id="cat-image-url-input"
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={newCatImageUrl}
                        onChange={(e) => setNewCatImageUrl(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Category Description
                    </label>
                    <input
                      id="cat-desc-input"
                      type="text"
                      placeholder="Brief overview of fixtures and equipment in this category..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      id="create-category-btn"
                      type="submit"
                      disabled={isCreatingCategory}
                      className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isCreatingCategory ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating Category in Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Create Category</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Categories Data Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Categories Catalog ({categories.length})
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Live categories synced with database
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Image</th>
                        <th className="py-3 px-4">Category Name</th>
                        <th className="py-3 px-4">URL Slug</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Products</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {categories.map((cat) => {
                        const itemCount = products.filter((p) => p.category === cat.name).length;
                        return (
                          <tr key={cat.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <img
                                src={cat.image || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=600&auto=format&fit=crop'}
                                alt={cat.name}
                                className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{cat.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {cat.id}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[11px]">
                                /{cat.slug}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                              {cat.description || <span className="text-slate-500 italic">No description provided</span>}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                {itemCount} product{itemCount === 1 ? '' : 's'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
                                    deleteCategory(cat.id);
                                  }
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                                title="Delete Category"
                              >
                                <Trash2 className="w-4 h-4 text-rose-400" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. PRODUCT GALLERY MANAGER TAB */}
          {/* ========================================================================= */}
          {activeTab === 'gallery' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header Title */}
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Product Gallery Manager</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Attach external gallery image URLs to specific products in the <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">product_gallery</code> database table
                </p>
              </div>

              {/* Gallery Product Selector & Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                {/* Product Dropdown Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Select Target Product *
                  </label>
                  <select
                    id="gallery-target-product-select"
                    value={selectedGalleryProductId}
                    onChange={(e) => setSelectedGalleryProductId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ({p.category}) [{p.images?.length || 1} image{p.images?.length === 1 ? '' : 's'}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Product Banner */}
                {currentGalleryProduct && (
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center gap-4">
                    <img
                      src={currentGalleryProduct.images[0]}
                      alt={currentGalleryProduct.name}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-700 shrink-0 border border-slate-600"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{currentGalleryProduct.name}</div>
                      <div className="text-xs text-amber-400 font-mono">{formatNaira(currentGalleryProduct.price)} • {currentGalleryProduct.category}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Product ID: <code className="font-mono text-slate-300">{currentGalleryProduct.id}</code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Multi-Image Attach Form */}
                <form onSubmit={handleAddGalleryUrls} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Image URL (Text string or newline/comma-separated for batch) *</span>
                      <span className="text-[11px] text-slate-400 font-normal">Direct URL string input</span>
                    </label>
                    <textarea
                      id="gallery-image-urls-input"
                      rows={3}
                      required
                      placeholder={`https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=800
https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800`}
                      value={galleryInputUrls}
                      onChange={(e) => setGalleryInputUrls(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-white font-mono placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Display Order (Integer)
                      </label>
                      <input
                        id="gallery-display-order-input"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={galleryDisplayOrder}
                        onChange={(e) => setGalleryDisplayOrder(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Optional Caption / Angle
                      </label>
                      <input
                        id="gallery-caption-input"
                        type="text"
                        placeholder="e.g. Side angle, illuminated, or installation"
                        value={galleryCaption}
                        onChange={(e) => setGalleryCaption(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <button
                    id="attach-gallery-images-btn"
                    type="submit"
                    disabled={isAddingGalleryImages}
                    className="py-3 px-5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAddingGalleryImages ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Inserting into product_gallery in Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Attach Image to Product Gallery</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Current Attached Images Preview */}
              {currentGalleryProduct && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Attached Images ({currentGalleryProduct.images?.length || 0})
                    </h3>
                    <span className="text-xs text-slate-400">Click delete to remove any photo from catalog</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentGalleryProduct.images?.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group relative"
                      >
                        <div className="aspect-square bg-slate-800 relative">
                          <img
                            src={imgUrl}
                            alt={`${currentGalleryProduct.name} view ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            {idx === 0 ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider">
                                Primary
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-slate-200 font-mono text-[10px] border border-slate-700">
                                #{idx}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteGalleryImage(imgUrl)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2.5">
                          <div className="text-[10px] font-mono text-slate-400 truncate">{imgUrl}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. ORDERS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Customer Orders</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track and manage customer shipments, WhatsApp orders, and bank payments
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-light">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">{ord.orderNumber}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{ord.customer?.fullName || ord.customerName}</div>
                            <div className="text-[11px] text-slate-400">{ord.customer?.phone || ord.customerPhone}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            {formatNaira(ord.total || ord.totalAmount)}
                          </td>
                          <td className="py-3 px-4 font-mono uppercase text-[11px]">{ord.paymentMethod}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                ord.status === 'delivered'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : ord.status === 'shipped'
                                  ? 'bg-blue-950 text-blue-300'
                                  : ord.status === 'processing'
                                  ? 'bg-purple-950 text-purple-300'
                                  : 'bg-amber-950 text-amber-300'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <select
                              value={ord.status}
                              onChange={(e) => updateOrderStatus(ord.id, e.target.value as any)}
                              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
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

          {/* ========================================================================= */}
          {/* 6. SERVICE TICKETS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Service Bookings & Quotes</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage engineering and installation requests submitted by customers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceRequests.map((req) => (
                  <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-amber-400 font-bold text-xs">{req.ticketNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300'
                            : req.status === 'in-progress'
                            ? 'bg-blue-950 text-blue-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-sm">{req.serviceName || req.serviceType}</h4>
                      <div className="text-xs text-slate-300 mt-1">{req.customerName} • {req.customerPhone}</div>
                      <div className="text-[11px] text-slate-400 mt-2 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                        {req.description}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-400">{req.location?.address || 'Lagos, Nigeria'}</span>
                      <select
                        value={req.status}
                        onChange={(e) => updateServiceRequestStatus(req.id, e.target.value as any)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In-Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BLOG & ARTICLE MANAGEMENT TAB */}
          {/* ========================================================================= */}
          {activeTab === 'blog' && <AdminBlogManagement />}

          {/* ========================================================================= */}
          {/* 7. SUPABASE DB & SYNC TAB */}
          {/* ========================================================================= */}
          {activeTab === 'supabase' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Supabase Database & Cloud Auth</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify connection status, run migration SQL schema, and inspect live PostgreSQL tables
                </p>
              </div>

              {/* Status Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        supabaseConfig.isConfigured
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">
                        {supabaseConfig.isConfigured ? 'Supabase Credentials Configured' : 'Supabase Not Configured'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {supabaseConfig.isConfigured
                          ? 'Auth and database operations communicate with live PostgreSQL tables'
                          : 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in settings'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleTestSupabase}
                    disabled={supabaseTestStatus.testing}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${supabaseTestStatus.testing ? 'animate-spin' : ''}`} />
                    <span>Test Database Connection</span>
                  </button>
                </div>

                {supabaseTestStatus.result && (
                  <div
                    className={`p-4 rounded-xl text-xs font-mono border ${
                      supabaseTestStatus.result.success
                        ? 'bg-emerald-950/40 text-emerald-200 border-emerald-800'
                        : 'bg-rose-950/40 text-rose-200 border-rose-800'
                    }`}
                  >
                    {supabaseTestStatus.result.message}
                  </div>
                )}
              </div>

              {/* SQL Schema Copy Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <Server className="w-4 h-4 text-amber-400" />
                    <span>Supabase SQL Migration Script (Profiles, Products, Categories, Gallery)</span>
                  </div>
                  <button
                    onClick={handleCopySql}
                    className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Copied SQL' : 'Copy All SQL'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-80">
                  {fullSqlSchema}
                </pre>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. STORE SETTINGS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in max-w-2xl">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Store Settings</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure corporate bank details, WhatsApp checkout number, and shipping thresholds
                </p>
              </div>

              <form onSubmit={handleSaveStoreSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp Order Number (International format without +)
                  </label>
                  <input
                    type="text"
                    value={settingsWhatsapp}
                    onChange={(e) => setSettingsWhatsapp(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={settingsBankName}
                    onChange={(e) => setSettingsBankName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={settingsAccountName}
                    onChange={(e) => setSettingsAccountName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={settingsAccountNumber}
                    onChange={(e) => setSettingsAccountNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Save Store Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* PRODUCT ADD / EDIT MODAL */}
      {/* ========================================================================= */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product to Catalog'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fill in title, slug, price, stock, category, and thumbnail URL
                </p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modern Crystal Chandelier 60W"
                    value={prodName}
                    onChange={(e) => {
                      setProdName(e.target.value);
                      if (!prodSlug) {
                        setProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. modern-crystal-chandelier-60w"
                    value={prodSlug}
                    onChange={(e) => setProdSlug(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Category, Price, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Price (₦ Naira) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Thumbnail URL (Text String) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Thumbnail Image URL (Primary Photo) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={prodThumbnailUrl}
                  onChange={(e) => setProdThumbnailUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Specs: Wattage, Voltage, Warranty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Wattage</label>
                  <input
                    type="text"
                    placeholder="e.g. 48W"
                    value={prodWattage}
                    onChange={(e) => setProdWattage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Voltage</label>
                  <input
                    type="text"
                    placeholder="e.g. 180V - 265V"
                    value={prodVoltage}
                    onChange={(e) => setProdVoltage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Warranty</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Year Official"
                    value={prodWarranty}
                    onChange={(e) => setProdWarranty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed product features, materials, and applications..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  {editingProduct ? 'Update Product' : 'Save New Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
