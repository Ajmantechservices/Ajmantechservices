import React, { useState, useEffect, useMemo } from 'react';
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
  CheckSquare,
  Square,
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
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  FileText,
  AlertCircle,
  UserCheck,
  ArrowUpRight,
  Filter,
  Download,
  History,
  BookOpen,
  PenTool,
  ShieldCheck,
} from 'lucide-react';
import { Product, ProductCategory, Category, Order, OrderStatus, ActivityLog, BlogPost, ActivityActionType } from '../types';
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
  | 'products'
  | 'orders'
  | 'overview'
  | 'categories'
  | 'gallery'
  | 'services'
  | 'settings'
  | 'supabase'
  | 'logs'
  | 'blog';

export const AdminDashboardView: React.FC = () => {
  const {
    products,
    categories,
    orders,
    serviceRequests,
    storeSettings,
    formatNaira,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteMultipleProducts,
    addCategory,
    updateCategory,
    deleteCategory,
    addGalleryImagesToProduct,
    deleteProductGalleryItem,
    deleteMultipleProductGalleryItems,
    refreshCatalog,
    updateOrderStatus,
    updateOrderPaymentStatus,
    updateServiceRequestStatus,
    updateStoreSettings,
    activityLogs,
    addActivityLog,
    clearActivityLogs,
    blogPosts,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost,
    adminLogout,
    navigateTo,
    showToast,
    currentUser,
    isAdmin,
  } = useStore();

  // Landing directly on products & inventory per request
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

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

  // Search & Filter Queries
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');

  // Modal for Viewing Order Details / Printable Receipt
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Bulk Selection & Deletion Confirmation State
  interface DeleteConfirmState {
    type: 'product' | 'bulk-products' | 'gallery' | 'bulk-gallery';
    title: string;
    description: string;
    product?: Product;
    productIds?: string[];
    galleryItem?: {
      galleryId?: string;
      productId: string;
      imageUrl: string;
    };
    galleryItems?: {
      galleryId?: string;
      productId: string;
      imageUrl: string;
    }[];
  }

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState<string[]>([]);

  // -------------------------------------------------------------
  // Activity Logs States & Handlers
  // -------------------------------------------------------------
  const [logFilterType, setLogFilterType] = useState<string>('all');
  const [logFilterSeverity, setLogFilterSeverity] = useState<string>('all');
  const [logSearch, setLogSearch] = useState<string>('');
  const [showClearLogsConfirm, setShowClearLogsConfirm] = useState<boolean>(false);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      if (logFilterType !== 'all' && log.actionType !== logFilterType) return false;
      if (logFilterSeverity !== 'all' && log.severity !== logFilterSeverity) return false;
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase();
        return (
          log.title.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          (log.ipAddress && log.ipAddress.toLowerCase().includes(q)) ||
          log.adminName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activityLogs, logFilterType, logFilterSeverity, logSearch]);

  const handleExportLogs = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activityLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `ajmantech_audit_logs_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ['Timestamp', 'Action Type', 'Title', 'Details', 'Admin Name', 'Admin Email', 'IP Address', 'Severity'];
      const rows = activityLogs.map((l) => [
        `"${l.timestamp}"`,
        `"${l.actionType}"`,
        `"${l.title.replace(/"/g, '""')}"`,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${l.adminName}"`,
        `"${l.adminEmail}"`,
        `"${l.ipAddress || ''}"`,
        `"${l.severity}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', encodeURI(csvContent));
      downloadAnchor.setAttribute('download', `ajmantech_audit_logs_${Date.now()}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
    showToast(`Exported ${activityLogs.length} audit logs as ${format.toUpperCase()}`, 'success');
  };

  // -------------------------------------------------------------
  // Blog & Post Writing States & Handlers
  // -------------------------------------------------------------
  const [blogSearch, setBlogSearch] = useState<string>('');
  const [blogFilterCategory, setBlogFilterCategory] = useState<string>('all');
  const [blogFilterStatus, setBlogFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [showBlogModal, setShowBlogModal] = useState<boolean>(false);
  const [blogModalTab, setBlogModalTab] = useState<'edit' | 'preview'>('edit');
  const [blogDeleteConfirm, setBlogDeleteConfirm] = useState<BlogPost | null>(null);

  // Blog Form States
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogCategory, setBlogCategory] = useState('Solar & Renewable Energy');
  const [blogAuthor, setBlogAuthor] = useState('Engr. Abiodun Ajayi');
  const [blogAuthorRole, setBlogAuthorRole] = useState('Lead Electrical Engineer, NEMSA Certified');
  const [blogCoverImage, setBlogCoverImage] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogStatus, setBlogStatus] = useState<'published' | 'draft'>('draft');
  const [blogReadTime, setBlogReadTime] = useState(5);
  const [blogTags, setBlogTags] = useState('Solar, Inverter, Electrical');

  const filteredBlogPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      if (blogFilterStatus !== 'all' && post.status !== blogFilterStatus) return false;
      if (blogFilterCategory !== 'all' && post.category !== blogFilterCategory) return false;
      if (blogSearch.trim()) {
        const q = blogSearch.toLowerCase();
        return (
          post.title.toLowerCase().includes(q) ||
          post.excerpt.toLowerCase().includes(q) ||
          post.category.toLowerCase().includes(q) ||
          post.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [blogPosts, blogFilterStatus, blogFilterCategory, blogSearch]);

  const handleOpenCreateBlog = () => {
    setEditingBlogPost(null);
    setBlogTitle('');
    setBlogSlug('');
    setBlogCategory('Solar & Renewable Energy');
    setBlogAuthor('Engr. Abiodun Ajayi');
    setBlogAuthorRole('Lead Electrical Engineer, NEMSA Certified');
    setBlogCoverImage('https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop');
    setBlogExcerpt('');
    setBlogContent('');
    setBlogStatus('draft'); // Saved for user to work on later
    setBlogReadTime(5);
    setBlogTags('Solar, Electrical, Inverters');
    setBlogModalTab('edit');
    setShowBlogModal(true);
  };

  const handleOpenEditBlog = (post: BlogPost) => {
    setEditingBlogPost(post);
    setBlogTitle(post.title);
    setBlogSlug(post.slug);
    setBlogCategory(post.category);
    setBlogAuthor(post.author || 'Engr. Abiodun Ajayi');
    setBlogAuthorRole(post.authorRole || 'Lead Electrical Engineer, NEMSA Certified');
    setBlogCoverImage(post.coverImage);
    setBlogExcerpt(post.excerpt);
    setBlogContent(post.content);
    setBlogStatus(post.status);
    setBlogReadTime(post.readTimeMinutes);
    setBlogTags(post.tags.join(', '));
    setBlogModalTab('edit');
    setShowBlogModal(true);
  };

  const handleSaveBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim()) {
      showToast('Please enter an article title', 'error');
      return;
    }
    const slug = blogSlug.trim() || blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const parsedTags = blogTags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingBlogPost) {
      updateBlogPost({
        ...editingBlogPost,
        title: blogTitle.trim(),
        slug,
        category: blogCategory,
        author: blogAuthor.trim() || 'Engr. Abiodun Ajayi',
        authorRole: blogAuthorRole.trim(),
        coverImage: blogCoverImage.trim() || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop',
        excerpt: blogExcerpt.trim(),
        content: blogContent.trim(),
        status: blogStatus,
        readTimeMinutes: Number(blogReadTime) || 5,
        tags: parsedTags.length > 0 ? parsedTags : ['Electrical Engineering'],
      });
    } else {
      addBlogPost({
        title: blogTitle.trim(),
        slug,
        category: blogCategory,
        author: blogAuthor.trim() || 'Engr. Abiodun Ajayi',
        authorRole: blogAuthorRole.trim(),
        coverImage: blogCoverImage.trim() || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop',
        excerpt: blogExcerpt.trim(),
        content: blogContent.trim(),
        status: blogStatus,
        readTimeMinutes: Number(blogReadTime) || 5,
        tags: parsedTags.length > 0 ? parsedTags : ['Electrical Engineering'],
      });
    }
    setShowBlogModal(false);
  };

  const handleTogglePostStatus = (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    updateBlogPost({
      ...post,
      status: newStatus,
    });
    showToast(`Article moved to ${newStatus === 'published' ? 'Published' : 'Drafts (to work on later)'}`, 'info');
  };

  // -------------------------------------------------------------
  // Verify Admin Session
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const verifyAdminAuth = async () => {
      const normalizedTarget = TARGET_ADMIN_EMAIL.toLowerCase();
      const userEmail = currentUser?.email?.toLowerCase().trim();

      const isAllowedAdminEmail =
        userEmail === normalizedTarget ||
        userEmail === 'support@ajmantechservices.com' ||
        userEmail === 'support@digitalsuccessplace.com' ||
        userEmail?.includes('joshua') ||
        userEmail?.includes('ajayi');

      if (!isAdmin || !isAllowedAdminEmail) {
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.auth.signOut();
          } catch {}
        }
        await adminLogout();
        showToast('Please sign in with administrator credentials.', 'info');
        navigateTo('admin-login');
        return;
      }
    };

    verifyAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, navigateTo, showToast, currentUser, adminLogout]);

  // Load counts
  const loadSupabaseTableCounts = async () => {
    if (isSupabaseConfigured()) {
      setIsLoadingCounts(true);
      const counts = await fetchSupabaseTableCounts();
      if (counts) setSupabaseCounts(counts);
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
  // Categories State
  // -------------------------------------------------------------
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // -------------------------------------------------------------
  // Gallery State
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
  // Settings Form State
  // -------------------------------------------------------------
  const [settingsBankName, setSettingsBankName] = useState(storeSettings.bankDetails.bankName);
  const [settingsAccountName, setSettingsAccountName] = useState(storeSettings.bankDetails.accountName);
  const [settingsAccountNumber, setSettingsAccountNumber] = useState(storeSettings.bankDetails.accountNumber);
  const [settingsWhatsapp, setSettingsWhatsapp] = useState(storeSettings.whatsappNumber);
  const [settingsFacebook, setSettingsFacebook] = useState(storeSettings.socialLinks.facebook);
  const [settingsInstagram, setSettingsInstagram] = useState(storeSettings.socialLinks.instagram);
  const [settingsFreeThreshold, setSettingsFreeThreshold] = useState(storeSettings.freeDeliveryThreshold);

  useEffect(() => {
    if (!selectedGalleryProductId && products.length > 0) {
      setSelectedGalleryProductId(products[0].id);
    }
  }, [products, selectedGalleryProductId]);

  useEffect(() => {
    if (selectedGalleryProductId && isSupabaseConfigured()) {
      fetchProductGallery(selectedGalleryProductId).then(({ data }) => {
        if (data) setActiveGalleryList(data);
      });
    }
  }, [selectedGalleryProductId]);

  // Calculations & Metrics
  const totalRevenue = useMemo(
    () => orders.reduce((acc, curr) => acc + (curr.total || curr.totalAmount || 0), 0),
    [orders]
  );
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'placed' || o.status === 'pending').length,
    [orders]
  );
  const processingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'processing' || o.status === 'confirmed').length,
    [orders]
  );
  const pendingServicesCount = useMemo(
    () => serviceRequests.filter((s) => s.status === 'new' || s.status === 'pending' || s.status === 'scheduled').length,
    [serviceRequests]
  );
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= 5),
    [products]
  );

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (orderStatusFilter === 'pending') {
        if (order.status !== 'placed' && order.status !== 'pending') return false;
      } else if (orderStatusFilter === 'processing') {
        if (order.status !== 'processing' && order.status !== 'confirmed') return false;
      } else if (orderStatusFilter === 'shipped') {
        if (order.status !== 'shipped' && order.status !== 'dispatched') return false;
      } else if (orderStatusFilter === 'delivered') {
        if (order.status !== 'delivered') return false;
      }

      // Search filter
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const num = (order.orderNumber || '').toLowerCase();
        const custName = (order.customer?.fullName || order.customerName || '').toLowerCase();
        const custPhone = (order.customer?.phone || order.customerPhone || '').toLowerCase();
        const itemNames = order.items.map((i) => (i.title || i.productName || '').toLowerCase()).join(' ');
        if (!num.includes(q) && !custName.includes(q) && !custPhone.includes(q) && !itemNames.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        const name = p.name.toLowerCase();
        const sku = p.sku.toLowerCase();
        const cat = p.category.toLowerCase();
        if (!name.includes(q) && !sku.includes(q) && !cat.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [products, categoryFilter, productSearch]);

  // Order Approval Handlers
  const handleApproveOrder = (orderId: string, orderNumber: string) => {
    updateOrderStatus(orderId, 'processing', 'Order approved by Site Owner & payment verified for fulfillment');
    updateOrderPaymentStatus(orderId, 'verified');
    showToast(`Order #${orderNumber} approved successfully! Notification ready.`, 'success');
  };

  const handleBatchApproveOrders = () => {
    const pending = orders.filter((o) => o.status === 'placed' || o.status === 'pending');
    if (pending.length === 0) {
      showToast('No pending orders to approve.', 'info');
      return;
    }
    pending.forEach((o) => {
      updateOrderStatus(o.id, 'processing', 'Approved in batch by administrator');
      updateOrderPaymentStatus(o.id, 'verified');
    });
    showToast(`Approved ${pending.length} customer order${pending.length === 1 ? '' : 's'}!`, 'success');
  };

  const handleNotifyWhatsApp = (order: Order) => {
    const rawPhone = order.customer?.phone || order.customerPhone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone || '2348075329182';
    const itemsSummary = order.items
      .map((i) => `${i.quantity}x ${i.title || i.productName || 'Electrical item'}`)
      .join(', ');
    const msg = `Hello ${order.customer?.fullName || order.customerName || 'Valued Customer'},\n\nYour order #${order.orderNumber} for ${itemsSummary} totaling ${formatNaira(
      order.total || order.totalAmount || 0
    )} has been APPROVED by AjmanTech Services! We are currently preparing your shipment for prompt dispatch.\n\nThank you for choosing AjmanTech Services Nigeria Ltd! “Let There Be Light”`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Quick Stock Adjuster
  const handleAdjustStock = async (prod: Product, delta: number) => {
    const newStock = Math.max(0, prod.stock + delta);
    const updated: Product = {
      ...prod,
      stock: newStock,
    };
    await updateProduct(updated);
    showToast(`Updated "${prod.name}" stock to ${newStock} units`, 'info');
  };

  // Product Modal Openers
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
    setProdWarranty('1 Year Full Replacement');
    setProdDesc('Premium certified electrical fixture built with surge suppression for residential and commercial spaces.');
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
      showToast(`Product "${updated.name}" updated successfully!`, 'success');
    } else {
      const newSku = `AJM-${prodCategory.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      await addProduct({
        slug: calculatedSlug,
        name: prodName.trim(),
        brand: 'AjmanTech',
        category: prodCategory as ProductCategory,
        price: Number(prodPrice),
        discountPrice: prodDiscountPrice ? Number(prodDiscountPrice) : undefined,
        rating: 5.0,
        reviewCount: 1,
        stock: Number(prodStock),
        images: [
          prodThumbnailUrl.trim() ||
            'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=800&auto=format&fit=crop',
        ],
        description: prodDesc,
        shortDescription: prodDesc.slice(0, 120),
        specifications: {
          sku: newSku,
          wattage: prodWattage,
          voltage: prodVoltage,
          colorTemperature: prodColorTemp,
          warranty: prodWarranty,
        },
        tags: ['Featured', 'AjmanTech Quality'],
      });
      showToast(`New product "${prodName}" added to catalog!`, 'success');
    }
    setShowProductModal(false);
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeletingItem(true);
    try {
      if (deleteConfirm.type === 'product' && deleteConfirm.product) {
        await deleteProduct(deleteConfirm.product.id);
        setSelectedProductIds((prev) => prev.filter((id) => id !== deleteConfirm.product!.id));
        showToast(`Product "${deleteConfirm.product.name}" deleted from database.`, 'info');
      } else if (deleteConfirm.type === 'bulk-products' && deleteConfirm.productIds) {
        await deleteMultipleProducts(deleteConfirm.productIds);
        setSelectedProductIds([]);
        showToast(`Deleted ${deleteConfirm.productIds.length} products.`, 'info');
      }
    } finally {
      setIsDeletingItem(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div id="admin-dashboard-page" className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* ============================================================== */}
      {/* 1. TOP NAV BAR: CRISP ROYAL BLUE & WHITE BRANDING               */}
      {/* ============================================================== */}
      <header className="h-16 bg-[#002D72] text-white px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#002D72] flex items-center justify-center font-black shadow-md">
            <Sparkles className="w-5 h-5 fill-[#002D72]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                AjmanTech Control Center
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-blue-200 hidden sm:flex items-center gap-1.5 font-light">
              <span>Authorized Administrator:</span>
              <strong className="text-white font-mono">{currentUser?.email || TARGET_ADMIN_EMAIL}</strong>
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick sync button */}
          <button
            onClick={async () => {
              setIsRefreshingCatalog(true);
              await refreshCatalog();
              await loadSupabaseTableCounts();
              setIsRefreshingCatalog(false);
              showToast('Catalog synchronized with live database!', 'success');
            }}
            disabled={isRefreshingCatalog}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
            title="Synchronize Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCatalog ? 'animate-spin text-amber-300' : ''}`} />
            <span className="hidden md:inline">Sync DB</span>
          </button>

          {/* Storefront preview */}
          <button
            onClick={() => navigateTo('home')}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15 shadow-sm"
            title="Preview live customer storefront"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Storefront</span>
          </button>

          {/* Logout */}
          <button
            onClick={async () => {
              await adminLogout();
              navigateTo('admin-login');
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Sign out from Admin Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HIGH-PRIORITY QUICK-SWITCH TABS BAR                          */}
      {/* ============================================================== */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 shadow-xs sticky top-16 z-30">
        <div className="flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            {/* Tab 1: Products */}
            <button
              id="top-nav-products-btn"
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#002D72] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002D72]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Edit Products ({products.length})</span>
            </button>

            {/* Tab 2: Orders & Approval */}
            <button
              id="top-nav-orders-btn"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
                activeTab === 'orders'
                  ? 'bg-[#002D72] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002D72]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Approve Orders</span>
              {pendingOrdersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white animate-pulse">
                  {pendingOrdersCount} Pending
                </span>
              )}
            </button>

            {/* Tab 3: Store Overview */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#002D72] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002D72]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            {/* Tab 4: Service Requests */}
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-[#002D72] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002D72]'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Services ({serviceRequests.length})</span>
            </button>

            {/* Tab 5: Categories */}
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-[#002D72] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002D72]'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>Categories</span>
            </button>

            {/* Tab 6: Photo Gallery */}
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-[#002D72] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002D72]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Gallery</span>
            </button>

            {/* Tab 7: Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#002D72] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002D72]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            {/* Tab 8: Supabase */}
            <button
              onClick={() => setActiveTab('supabase')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'supabase'
                  ? 'bg-[#002D72] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002D72]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Supabase DB</span>
            </button>

            {/* Tab 9: Activity Logs */}
            <button
              id="top-nav-logs-btn"
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-[#002D72] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002D72]'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>Activity Logs</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#002D72]">
                {activityLogs.length}
              </span>
            </button>

            {/* Tab 10: Blog & Articles */}
            <button
              id="top-nav-blog-btn"
              onClick={() => setActiveTab('blog')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'blog'
                  ? 'bg-[#002D72] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#002D72]'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Blog & Articles</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                {blogPosts.length}
              </span>
            </button>
          </div>

          {/* Quick Add Product Button */}
          <div className="shrink-0">
            <button
              onClick={handleOpenAddProduct}
              className="px-3.5 py-2 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN WORKSPACE CONTAINER                                    */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ============================================================ */}
        {/* TAB 1: EDIT ALL PRODUCTS                                      */}
        {/* ============================================================ */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Title & Actions */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[#002D72] text-xs font-bold mb-2">
                  <Package className="w-3.5 h-3.5" />
                  Live Product Inventory
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Edit & Manage Products
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Update active prices in Naira (₦), stock levels, images, descriptions, and technical specifications.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="add-product-btn-main"
                  onClick={handleOpenAddProduct}
                  className="py-2.5 px-4 rounded-xl bg-[#002D72] hover:bg-[#001D4D] text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by title, SKU, or category..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      categoryFilter === 'all'
                        ? 'bg-[#002D72] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-[#002D72]'
                    }`}
                  >
                    All Categories ({products.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        categoryFilter === cat.name
                          ? 'bg-[#002D72] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-[#002D72]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk Actions Banner if items are selected */}
              {selectedProductIds.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                    <CheckSquare className="w-4 h-4 text-rose-600" />
                    <span>{selectedProductIds.length} products selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProductIds([])}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirm({
                          type: 'bulk-products',
                          title: 'Delete Selected Products',
                          description: `Are you sure you want to delete ${selectedProductIds.length} products permanently from your catalog?`,
                          productIds: [...selectedProductIds],
                        });
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Products Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-blue-50/60 text-[#002D72] font-extrabold uppercase tracking-wider text-[11px] border-b border-blue-100">
                      <th className="py-3 px-3 w-10 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedProductIds.length === filteredProducts.length) {
                              setSelectedProductIds([]);
                            } else {
                              setSelectedProductIds(filteredProducts.map((p) => p.id));
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-[#002D72]"
                        >
                          {selectedProductIds.length > 0 && selectedProductIds.length === filteredProducts.length ? (
                            <CheckSquare className="w-4 h-4 text-[#002D72]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3.5 px-4">Product Name & SKU</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price (₦)</th>
                      <th className="py-3.5 px-4">Live Stock</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredProducts.map((prod) => {
                      const isSelected = selectedProductIds.includes(prod.id);
                      return (
                        <tr
                          key={prod.id}
                          className={`hover:bg-blue-50/30 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductIds((prev) =>
                                  prev.includes(prod.id)
                                    ? prev.filter((id) => id !== prod.id)
                                    : [...prev, prod.id]
                                );
                              }}
                              className="p-1 text-slate-400 hover:text-[#002D72]"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#002D72]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Image & Title */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.images[0] || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=600'}
                                alt={prod.name}
                                className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0 shadow-xs"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs sm:text-sm hover:text-[#002D72] transition-colors">
                                  {prod.name}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  SKU: {prod.sku}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-[#002D72] text-[11px] font-bold border border-blue-100">
                              {prod.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <div>{formatNaira(prod.price)}</div>
                            {prod.discountPrice && (
                              <div className="text-[10px] text-slate-400 line-through font-normal">
                                {formatNaira(prod.discountPrice)}
                              </div>
                            )}
                          </td>

                          {/* Stock & Quick Adjuster */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  prod.stock === 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : prod.stock <= 3
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {prod.stock === 0 ? 'Out of Stock' : `${prod.stock} in stock`}
                              </span>
                              <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(prod, -1)}
                                  className="px-2 py-0.5 hover:bg-slate-100 text-slate-600 font-bold"
                                  title="Decrease stock"
                                >
                                  -
                                </button>
                                <span className="px-1.5 font-mono text-[10px] text-slate-700">{prod.stock}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(prod, 1)}
                                  className="px-2 py-0.5 hover:bg-slate-100 text-slate-600 font-bold"
                                  title="Increase stock"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-[#002D72] text-[#002D72] hover:text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-blue-100"
                                title="Edit Product Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {/* Gallery Button */}
                              <button
                                onClick={() => {
                                  setSelectedGalleryProductId(prod.id);
                                  setActiveTab('gallery');
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
                                title="Manage Product Photos"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => {
                                  setDeleteConfirm({
                                    type: 'product',
                                    title: 'Delete Product',
                                    description: `Are you sure you want to delete "${prod.name}"? This action will remove it from the live catalog.`,
                                    product: prod,
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

        {/* ============================================================ */}
        {/* TAB 2: APPROVE CUSTOMER ORDERS                                */}
        {/* ============================================================ */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Title & Batch Approval Banner */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Order Fulfillment & Verification
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Customer Orders & Approvals
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Review submitted customer orders, verify bank transfers / pay-on-delivery, and approve orders for immediate dispatch.
                </p>
              </div>

              {pendingOrdersCount > 0 && (
                <button
                  onClick={handleBatchApproveOrders}
                  className="py-2.5 px-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve All Pending ({pendingOrdersCount})</span>
                </button>
              )}
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by order #, customer name, phone, item..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
                <button
                  onClick={() => setOrderStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    orderStatusFilter === 'all'
                      ? 'bg-[#002D72] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-[#002D72]'
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  onClick={() => setOrderStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    orderStatusFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <span>Needs Approval</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-600 text-white">
                    {pendingOrdersCount}
                  </span>
                </button>
                <button
                  onClick={() => setOrderStatusFilter('processing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    orderStatusFilter === 'processing'
                      ? 'bg-[#002D72] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  Approved & Processing ({processingOrdersCount})
                </button>
                <button
                  onClick={() => setOrderStatusFilter('shipped')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    orderStatusFilter === 'shipped'
                      ? 'bg-[#002D72] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  Shipped
                </button>
                <button
                  onClick={() => setOrderStatusFilter('delivered')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    orderStatusFilter === 'delivered'
                      ? 'bg-[#002D72] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  Delivered
                </button>
              </div>
            </div>

            {/* Orders List Cards */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No orders match the selected filter.</p>
                  <p className="text-xs text-slate-400 mt-1">All customer orders have been reviewed and processed.</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isPending = order.status === 'placed' || order.status === 'pending';
                  const isApproved = order.status === 'processing' || order.status === 'confirmed';
                  const isShipped = order.status === 'shipped' || order.status === 'dispatched';
                  const isDelivered = order.status === 'delivered';

                  return (
                    <div
                      key={order.id}
                      className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-sm transition-all hover:shadow-md ${
                        isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                      }`}
                    >
                      {/* Top Order Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-sm text-[#002D72] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            #{order.orderNumber}
                          </span>
                          <span className="text-xs text-slate-400">
                            Placed on {order.createdAt}
                          </span>
                          {isPending && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              ⏳ Awaiting Approval
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Approved & Processing
                            </span>
                          )}
                          {isShipped && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
                              🚚 Shipped / In Transit
                            </span>
                          )}
                          {isDelivered && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                              ✓ Delivered
                            </span>
                          )}
                        </div>

                        {/* Total Amount Badge */}
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block font-normal">Order Total</span>
                          <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                            {formatNaira(order.total || order.totalAmount || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Middle Grid: Customer Details & Ordered Items */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
                        {/* Customer Information */}
                        <div className="space-y-1.5 text-xs text-slate-600 bg-[#F8FAFC] p-4 rounded-xl border border-slate-200/80">
                          <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                            <span>{order.customer?.fullName || order.customerName || 'Customer'}</span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              {order.paymentMethod.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-[#002D72]" />
                            <a
                              href={`tel:${order.customer?.phone || order.customerPhone}`}
                              className="font-medium hover:underline text-[#002D72]"
                            >
                              {order.customer?.phone || order.customerPhone || 'N/A'}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.customer?.email || order.customerEmail || 'No email provided'}</span>
                          </div>
                          <div className="flex items-start gap-1.5 text-slate-500 pt-1 border-t border-slate-200/60">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>
                              {order.customer?.address || 'Showroom pick up'}, {order.customer?.city || ''}{' '}
                              {order.customer?.state ? `(${order.customer.state})` : ''}
                            </span>
                          </div>
                          {order.paymentReference && (
                            <div className="pt-1 text-[11px] font-mono text-emerald-700 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200">
                              Ref: {order.paymentReference}
                            </div>
                          )}
                        </div>

                        {/* Ordered Items List */}
                        <div className="lg:col-span-2 space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Ordered Products ({order.items.length})
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/90 hover:border-blue-200 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={item.image || item.productImage || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=600'}
                                    alt={item.title || item.productName || 'Item'}
                                    className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                                  />
                                  <div className="truncate">
                                    <div className="font-bold text-slate-900 text-xs truncate">
                                      {item.title || item.productName}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      Qty: <strong className="text-slate-800">{item.quantity}</strong>{' '}
                                      {item.variant ? `• ${item.variant}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right font-mono font-bold text-xs text-slate-900 shrink-0">
                                  {formatNaira(item.price * item.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Strip: APPROVAL & NOTIFICATION */}
                      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Invoice / Receipt</span>
                          </button>

                          <button
                            onClick={() => handleNotifyWhatsApp(order)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
                            title="Chat with Customer on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp Customer</span>
                          </button>
                        </div>

                        {/* Status Change & Approval Button */}
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <button
                              id={`approve-order-btn-${order.id}`}
                              onClick={() => handleApproveOrder(order.id, order.orderNumber)}
                              className="px-4 py-2 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve Order</span>
                            </button>
                          )}

                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#002D72]"
                          >
                            <option value="pending">Pending</option>
                            <option value="placed">Placed (Awaiting Review)</option>
                            <option value="processing">Processing (Approved)</option>
                            <option value="shipped">Shipped</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: STORE OVERVIEW & METRICS                               */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Store Performance & Analytics
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time metrics, active orders, live catalog items, and restock alerts.
              </p>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Total Revenue */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Sales Volume</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {formatNaira(totalRevenue)}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  Across {orders.length} customer orders
                </div>
              </div>

              {/* Stat 2: Active Products */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Products</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#002D72] flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {supabaseCounts?.productsCount ?? products.length}
                </div>
                <div className="text-[11px] text-blue-600 font-medium mt-1">
                  {categories.length} product categories
                </div>
              </div>

              {/* Stat 3: Orders to Approve */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {pendingOrdersCount}
                </div>
                <div className="text-[11px] text-amber-600 font-medium mt-1">
                  {pendingOrdersCount > 0 ? 'Requires attention in Orders tab' : 'All caught up!'}
                </div>
              </div>

              {/* Stat 4: Service Inquiries */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Service Inquiries</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {serviceRequests.length}
                </div>
                <div className="text-[11px] text-purple-600 font-medium mt-1">
                  {pendingServicesCount} awaiting engineer scheduling
                </div>
              </div>
            </div>

            {/* Low Stock Watchlist */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Low Inventory Restock Watchlist</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">{lowStockProducts.length} items flagged</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 justify-between"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover bg-white shrink-0 border border-slate-200"
                      />
                      <div className="truncate">
                        <div className="font-bold text-xs text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.category}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        p.stock === 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.stock === 0 ? '0 Units' : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: CATEGORIES MANAGER                                     */}
        {/* ============================================================ */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Categories Manager</h2>
                <p className="text-xs text-slate-500 mt-1">Organize your product hierarchy and navigation links.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.name).length;
                return (
                  <div
                    key={cat.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all"
                  >
                    <img
                      src={cat.image || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=600'}
                      alt={cat.name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">/{cat.slug}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded bg-blue-50 text-[#002D72] text-[10px] font-bold">
                        {count} products
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: PHOTO GALLERY                                          */}
        {/* ============================================================ */}
        {activeTab === 'gallery' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Product Photo Gallery</h2>
              <p className="text-xs text-slate-500 mt-1">
                Attach high-resolution product photos and angles for rich customer viewing.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Target Product
                </label>
                <select
                  value={selectedGalleryProductId}
                  onChange={(e) => setSelectedGalleryProductId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category}) — {p.images.length} photos
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Photos */}
              {selectedGalleryProductId && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Attached Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {products
                      .find((p) => p.id === selectedGalleryProductId)
                      ?.images.map((img, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={img} alt="Product angle" className="w-full h-24 object-cover" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] text-white font-mono">Angle #{i + 1}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: SERVICE INQUIRIES & TICKETS                            */}
        {/* ============================================================ */}
        {activeTab === 'services' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Engineering & Installation Requests
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage solar audits, home automation consultations, and certified wiring inquiries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceRequests.map((req) => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#002D72] font-bold text-xs bg-blue-50 px-2 py-0.5 rounded">
                      {req.ticketNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      {req.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{req.serviceName}</h4>
                    <div className="text-xs text-slate-600 mt-1 font-medium">
                      {req.customerName} • {req.phone}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {req.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>{req.address}, {req.city}</span>
                    <select
                      value={req.status}
                      onChange={(e) => updateServiceRequestStatus(req.id, e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                    >
                      <option value="new">New</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In-Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 7: SETTINGS & BANK DETAILS                                */}
        {/* ============================================================ */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in max-w-2xl">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Store Settings & Bank Details</h2>
              <p className="text-xs text-slate-500 mt-1">Configure checkout payment instructions and WhatsApp numbers.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settingsBankName}
                  onChange={(e) => setSettingsBankName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={settingsAccountName}
                  onChange={(e) => setSettingsAccountName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settingsAccountNumber}
                  onChange={(e) => setSettingsAccountNumber(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Official WhatsApp Contact
                </label>
                <input
                  type="text"
                  value={settingsWhatsapp}
                  onChange={(e) => setSettingsWhatsapp(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  updateStoreSettings({
                    ...storeSettings,
                    bankDetails: {
                      ...storeSettings.bankDetails,
                      bankName: settingsBankName,
                      accountName: settingsAccountName,
                      accountNumber: settingsAccountNumber,
                    },
                    whatsappNumber: settingsWhatsapp,
                  });
                  showToast('Store settings saved successfully!', 'success');
                }}
                className="py-2.5 px-5 rounded-xl bg-[#002D72] hover:bg-[#001D4D] text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 8: SUPABASE DATABASE CONNECTION                           */}
        {/* ============================================================ */}
        {activeTab === 'supabase' && (
          <div className="space-y-6 animate-fade-in max-w-3xl">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Supabase Database Connection</h2>
              <p className="text-xs text-slate-500 mt-1">Live status of PostgreSQL tables and authentication.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    supabaseConfig.isConfigured
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {supabaseConfig.isConfigured ? 'Supabase Credentials Active' : 'Supabase Not Configured'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {supabaseConfig.isConfigured
                      ? 'All products, orders, and authentication communicate directly with Supabase.'
                      : 'Configure your environment variables in settings or continue with local state storage.'}
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  setSupabaseTestStatus({ testing: true });
                  const res = await testSupabaseConnection();
                  setSupabaseTestStatus({ testing: false, result: res });
                  if (res.success) {
                    showToast('Supabase connection verified!', 'success');
                  } else {
                    showToast(res.message, 'error');
                  }
                }}
                disabled={supabaseTestStatus.testing}
                className="py-2.5 px-4 rounded-xl bg-[#002D72] hover:bg-[#001D4D] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${supabaseTestStatus.testing ? 'animate-spin' : ''}`} />
                <span>Test Database Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 9: ACTIVITY & SECURITY AUDIT LOGS                         */}
        {/* ============================================================ */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Title & Audit Controls */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Live Audit & Security Logging Active
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  System Activity & Audit Logs
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Immutable record tracking admin logins, catalog updates, customer order approvals, and system state transitions.
                </p>
              </div>

              {/* Actions: Export & Clear */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportLogs('json')}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export audit logs in JSON format"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportLogs('csv')}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export audit logs in CSV format"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearLogsConfirm(true)}
                  className="px-3 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Clear current log history"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Clear Logs</span>
                </button>
              </div>
            </div>

            {/* Security & Audit Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Audit Events</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#002D72] flex items-center justify-center font-bold">
                    <History className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">{activityLogs.length}</div>
                <p className="text-[11px] text-slate-400 mt-1">Recorded audit entries</p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Logins</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {activityLogs.filter((l) => l.actionType === 'auth').length}
                </div>
                <p className="text-[11px] text-emerald-600 mt-1 font-medium">Engr. Abiodun Ajayi verified</p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalogue & Order Actions</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Sliders className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {activityLogs.filter((l) => l.actionType === 'product' || l.actionType === 'order').length}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Product & fulfillment edits</p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security Posture</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Enforced & Active
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Admin email verification mandatory</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search logs by title, details, IP address, or admin..."
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                  {logSearch && (
                    <button
                      onClick={() => setLogSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Event Type Filter */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-slate-500 shrink-0">Type:</span>
                  <select
                    value={logFilterType}
                    onChange={(e) => setLogFilterType(e.target.value)}
                    className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="all">All Action Types</option>
                    <option value="auth">Authentication (Logins/Logouts)</option>
                    <option value="product">Products & Inventory</option>
                    <option value="order">Customer Orders & Approvals</option>
                    <option value="security">Security Checks</option>
                    <option value="blog">Blog & CMS</option>
                    <option value="settings">System Settings</option>
                  </select>

                  {/* Severity Filter */}
                  <span className="text-xs font-bold text-slate-500 shrink-0 ml-2">Severity:</span>
                  <select
                    value={logFilterSeverity}
                    onChange={(e) => setLogFilterSeverity(e.target.value)}
                    className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="all">All Severities</option>
                    <option value="success">Success</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audit Log Table / Feed */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Security Audit Trail</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    Showing {filteredLogs.length} of {activityLogs.length}
                  </span>
                </div>
                {(logFilterType !== 'all' || logFilterSeverity !== 'all' || logSearch) && (
                  <button
                    onClick={() => {
                      setLogFilterType('all');
                      setLogFilterSeverity('all');
                      setLogSearch('');
                    }}
                    className="text-xs text-[#002D72] hover:underline font-bold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No activity logs match your criteria</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your search terms or filter selections. All new admin actions will be recorded here automatically.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    // Badge color and icon based on severity
                    let severityBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        INFO
                      </span>
                    );
                    let iconBg = 'bg-blue-50 text-[#002D72]';
                    let IconComponent = Info;

                    if (log.severity === 'success') {
                      severityBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          SUCCESS
                        </span>
                      );
                      iconBg = 'bg-emerald-50 text-emerald-700';
                      IconComponent = CheckCircle2;
                    } else if (log.severity === 'warning') {
                      severityBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                          WARNING
                        </span>
                      );
                      iconBg = 'bg-amber-50 text-amber-700';
                      IconComponent = AlertTriangle;
                    } else if (log.severity === 'alert') {
                      severityBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                          SECURITY ALERT
                        </span>
                      );
                      iconBg = 'bg-rose-50 text-rose-700';
                      IconComponent = ShieldAlert;
                    }

                    // Format timestamp
                    const dateObj = new Date(log.timestamp);
                    const formattedDate = !isNaN(dateObj.getTime())
                      ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
                        ' • ' +
                        dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : log.timestamp;

                    return (
                      <div
                        key={log.id}
                        className="p-4 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        {/* Left: Icon & Description */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-bold text-slate-900 text-sm">{log.title}</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                                {log.actionType}
                              </span>
                              {severityBadge}
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed break-words">{log.details}</p>
                            
                            {/* Metadata row */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 font-mono text-slate-500">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formattedDate}
                              </span>
                              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                                <UserCheck className="w-3 h-3 text-blue-600" />
                                {log.adminName}
                              </span>
                              {log.ipAddress && (
                                <span className="flex items-center gap-1 text-slate-500 font-mono">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {log.ipAddress}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 10: BLOG WRITING & POST EDITING                           */}
        {/* ============================================================ */}
        {activeTab === 'blog' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Title & Actions */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-bold mb-2">
                  <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                  Engineering Articles & Knowledge Hub
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Blog Writing & Post Editor
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Compose, refine, and publish technical guides by Engr. Abiodun Ajayi. Save drafts to work on later or publish directly to customer storefront.
                </p>
              </div>

              {/* Write New Article Button */}
              <div className="shrink-0">
                <button
                  type="button"
                  id="write-new-article-btn"
                  onClick={handleOpenCreateBlog}
                  className="px-4 py-2.5 rounded-xl bg-[#002D72] hover:bg-[#001D4D] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write New Article</span>
                </button>
              </div>
            </div>

            {/* Blog Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Articles</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">{blogPosts.length}</div>
                <p className="text-[11px] text-slate-400 mt-1">Articles in repository</p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Published Articles</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {blogPosts.filter((p) => p.status === 'published').length}
                </div>
                <p className="text-[11px] text-emerald-600 mt-1 font-medium">Live on storefront</p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Drafts (Work On Later)</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {blogPosts.filter((p) => p.status === 'draft').length}
                </div>
                <p className="text-[11px] text-amber-600 mt-1 font-medium">Ready for your upcoming edits</p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Author</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#002D72] flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-sm font-bold text-slate-900">Engr. Abiodun Ajayi</div>
                <p className="text-[11px] text-slate-400 mt-1">NEMSA Certified Electrical Lead</p>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setBlogFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    blogFilterStatus === 'all'
                      ? 'bg-[#002D72] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({blogPosts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBlogFilterStatus('published')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    blogFilterStatus === 'published'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Published ({blogPosts.filter((p) => p.status === 'published').length})
                </button>
                <button
                  type="button"
                  onClick={() => setBlogFilterStatus('draft')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    blogFilterStatus === 'draft'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Drafts to Work On Later ({blogPosts.filter((p) => p.status === 'draft').length})
                </button>
              </div>

              {/* Search & Category Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={blogSearch}
                    onChange={(e) => setBlogSearch(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-4">
              {filteredBlogPosts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">No articles found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No articles match your current search or filter. Click &quot;Write New Article&quot; to begin your first guide or draft.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCreateBlog}
                    className="px-4 py-2 rounded-xl bg-[#002D72] text-white text-xs font-bold shadow-sm"
                  >
                    + Write First Article
                  </button>
                </div>
              ) : (
                filteredBlogPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5 items-start"
                  >
                    {/* Cover Image Thumbnail */}
                    <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=600&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-950/80 text-white backdrop-blur-xs">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.status === 'published' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Published Live
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Draft — Work in Progress (To Work On Later)
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500 font-medium">{post.readTimeMinutes} min read</span>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500 font-mono">Updated: {post.updatedAt || post.createdAt}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                        {post.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500 font-medium">By:</span>
                        <span className="text-[11px] text-[#002D72] font-bold">{post.author}</span>
                        {post.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex md:flex-col items-center gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBlog(post)}
                        className="flex-1 md:flex-none px-3.5 py-1.5 rounded-xl bg-[#002D72] hover:bg-[#001D4D] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        title="Edit article title, content, or publication status"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Post</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePostStatus(post)}
                        className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                          post.status === 'published'
                            ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                        title={post.status === 'published' ? 'Switch back to draft to edit later' : 'Publish live to storefront'}
                      >
                        {post.status === 'published' ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Set to Draft</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Publish Live</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setBlogDeleteConfirm(post)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* 4. PRODUCT EDIT / ADD MODAL (WHITE & BLUE)                     */}
      {/* ============================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 animate-fade-in">
            {/* Modal Header */}
            <div className="bg-[#002D72] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingProduct ? 'Edit Product Details' : 'Add New Product to Store'}
                </h3>
                <p className="text-xs text-blue-200">
                  {editingProduct ? `Editing SKU: ${editingProduct.sku}` : 'Fill in the product information below'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Royale 3-Ring Crystal LED Chandelier"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={prodSlug}
                    onChange={(e) => setProdSlug(e.target.value)}
                    placeholder="e.g. royale-3-ring-crystal-chandelier"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price in Naira (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Discount Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={prodDiscountPrice || ''}
                    onChange={(e) => setProdDiscountPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Optional"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stock Units *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Image URL *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    required
                    value={prodThumbnailUrl}
                    onChange={(e) => setProdThumbnailUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                  />
                  {prodThumbnailUrl && (
                    <img
                      src={prodThumbnailUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Comprehensive description of product features..."
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-3 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Wattage</label>
                  <input
                    type="text"
                    value={prodWattage}
                    onChange={(e) => setProdWattage(e.target.value)}
                    placeholder="e.g. 48W"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Voltage</label>
                  <input
                    type="text"
                    value={prodVoltage}
                    onChange={(e) => setProdVoltage(e.target.value)}
                    placeholder="e.g. 220V - 240V"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Color Temp</label>
                  <input
                    type="text"
                    value={prodColorTemp}
                    onChange={(e) => setProdColorTemp(e.target.value)}
                    placeholder="e.g. 3000K - 6500K"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Warranty</label>
                  <input
                    type="text"
                    value={prodWarranty}
                    onChange={(e) => setProdWarranty(e.target.value)}
                    placeholder="e.g. 1 Year"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#002D72] hover:bg-[#001D4D] text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. ORDER INVOICE / RECEIPT MODAL                                */}
      {/* ============================================================== */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-[#002D72] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Official Order Receipt
                </span>
                <h3 className="font-bold text-base">Order #{viewingOrder.orderNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Customer Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  {viewingOrder.customer?.fullName || viewingOrder.customerName}
                </div>
                <div>{viewingOrder.customer?.phone || viewingOrder.customerPhone}</div>
                <div>{viewingOrder.customer?.email || viewingOrder.customerEmail}</div>
                <div className="pt-1 text-slate-500">
                  {viewingOrder.customer?.address}, {viewingOrder.customer?.city} ({viewingOrder.customer?.state})
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="font-bold text-slate-700 uppercase text-[11px]">Items in Order</div>
                {viewingOrder.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{it.title || it.productName}</div>
                      <div className="text-[11px] text-slate-400">
                        {it.quantity} x {formatNaira(it.price)}
                      </div>
                    </div>
                    <div className="font-mono font-bold">{formatNaira(it.price * it.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
                <span>Grand Total</span>
                <span className="text-base text-[#002D72] font-mono">
                  {formatNaira(viewingOrder.total || viewingOrder.totalAmount || 0)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleNotifyWhatsApp(viewingOrder)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send Customer WhatsApp Update</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. DELETE CONFIRMATION MODAL                                    */}
      {/* ============================================================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{deleteConfirm.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{deleteConfirm.description}</p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeletingItem ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. BLOG POST WRITING & EDIT MODAL (WHITE & ROYAL BLUE)          */}
      {/* ============================================================== */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 animate-fade-in flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#002D72] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingBlogPost ? 'Edit Technical Article' : 'Write New Technical Article'}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Author: <strong className="text-white">Engr. Abiodun Ajayi</strong> • Save as draft to work on later or publish live.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBlogModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch Tabs: Edit vs Preview */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBlogModalTab('edit')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    blogModalTab === 'edit'
                      ? 'bg-white text-[#002D72] shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✍️ Compose & Details
                </button>
                <button
                  type="button"
                  onClick={() => setBlogModalTab('preview')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    blogModalTab === 'preview'
                      ? 'bg-white text-[#002D72] shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👁️ Live Article Preview
                </button>
              </div>

              {/* Status pill indicator */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    blogStatus === 'published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {blogStatus === 'published' ? '● Published' : '⏱️ Draft (Work on later)'}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            {blogModalTab === 'edit' ? (
              <form onSubmit={handleSaveBlog} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="e.g. Sizing Hybrid Inverter Batteries for Zero Downtime in Nigerian Homes"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      value={blogCategory}
                      onChange={(e) => setBlogCategory(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
                    >
                      <option value="Solar & Renewable Energy">Solar & Renewable Energy</option>
                      <option value="Lighting & Aesthetics">Lighting & Aesthetics</option>
                      <option value="Smart Automation">Smart Automation</option>
                      <option value="Electrical Infrastructure">Electrical Infrastructure</option>
                      <option value="Inverter Maintenance">Inverter Maintenance</option>
                      <option value="Industrial Power">Industrial Power</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Publication Status *
                    </label>
                    <select
                      value={blogStatus}
                      onChange={(e) => setBlogStatus(e.target.value as 'published' | 'draft')}
                      className={`w-full border rounded-xl px-4 py-2.5 text-xs font-bold ${
                        blogStatus === 'published'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                      }`}
                    >
                      <option value="draft">Draft (Saved for me to work on later)</option>
                      <option value="published">Published (Make live on website)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Read Time (Minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={blogReadTime}
                      onChange={(e) => setBlogReadTime(Number(e.target.value))}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Author & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Author Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={blogAuthor}
                      onChange={(e) => setBlogAuthor(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Author Professional Title
                    </label>
                    <input
                      type="text"
                      value={blogAuthorRole}
                      onChange={(e) => setBlogAuthorRole(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
                    />
                  </div>
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cover Image URL *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      required
                      value={blogCoverImage}
                      onChange={(e) => setBlogCoverImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                    />
                    {blogCoverImage && (
                      <img
                        src={blogCoverImage}
                        alt="Preview"
                        className="w-14 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                    )}
                  </div>
                  {/* Preset cover image buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-slate-400">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => setBlogCoverImage('https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop')}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Solar Panels
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogCoverImage('https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=1200&auto=format&fit=crop')}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Crystal Chandelier
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogCoverImage('https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1200&auto=format&fit=crop')}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Smart Home
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogCoverImage('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop')}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Industrial Wiring
                    </button>
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Excerpt / Short Summary *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={blogExcerpt}
                    onChange={(e) => setBlogExcerpt(e.target.value)}
                    placeholder="Brief 2-line summary for preview cards and search engines..."
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-3 text-xs text-slate-900"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={blogTags}
                    onChange={(e) => setBlogTags(e.target.value)}
                    placeholder="e.g. Solar, Inverter, Lithium Battery, Lagos"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900"
                  />
                </div>

                {/* Full Article Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Article Content (Markdown Supported) *
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Use ## for section titles, ### for sub-headers, - for bullet points
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    required
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="Write your in-depth guide or draft here. You can leave notes and bullet points to expand later..."
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-xs text-slate-900 font-mono leading-relaxed"
                  />
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    {blogStatus === 'draft' ? (
                      <span className="text-amber-700 font-semibold">
                        ⏱️ Will be saved as Draft so you can work on it later
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">
                        ● Will be published live for visitors to read
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBlogModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#002D72] hover:bg-[#001D4D] text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      {editingBlogPost ? 'Save Changes' : blogStatus === 'draft' ? 'Save Draft (Work on Later)' : 'Publish Article Now'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Live Preview Mode */
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Category & Status */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-[#002D72]">
                      {blogCategory}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{blogReadTime} min read</span>
                    {blogStatus === 'draft' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        Draft Preview
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {blogTitle || 'Untitled Article'}
                  </h1>

                  {/* Author Line */}
                  <div className="flex items-center gap-3 py-3 border-y border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-[#002D72] text-white flex items-center justify-center font-bold text-sm">
                      AA
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{blogAuthor || 'Engr. Abiodun Ajayi'}</div>
                      <div className="text-xs text-slate-500">{blogAuthorRole || 'Lead Electrical Engineer'}</div>
                    </div>
                  </div>

                  {/* Cover Image */}
                  {blogCoverImage && (
                    <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={blogCoverImage} alt={blogTitle} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Excerpt */}
                  {blogExcerpt && (
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 italic leading-relaxed">
                      {blogExcerpt}
                    </div>
                  )}

                  {/* Content body */}
                  <div className="prose prose-sm text-slate-800 space-y-3 leading-relaxed whitespace-pre-line text-xs font-sans">
                    {blogContent || 'No article content provided yet. Click "Compose & Details" to write your article.'}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBlogModalTab('edit')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    ← Back to Editor
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBlog}
                    className="px-5 py-2 rounded-xl bg-[#002D72] hover:bg-[#001D4D] text-white font-bold text-xs shadow-sm"
                  >
                    {editingBlogPost ? 'Save Changes' : blogStatus === 'draft' ? 'Save Draft (Work on Later)' : 'Publish Article Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. BLOG DELETE CONFIRMATION MODAL                              */}
      {/* ============================================================== */}
      {blogDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Delete Blog Article</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete &quot;{blogDeleteConfirm.title}&quot;? This action cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlogDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBlogPost(blogDeleteConfirm.id);
                  setBlogDeleteConfirm(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Delete Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. CLEAR ACTIVITY LOGS CONFIRMATION MODAL                       */}
      {/* ============================================================== */}
      {showClearLogsConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Clear Activity Audit Logs?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This will wipe the current local audit trail of {activityLogs.length} events. New actions will continue to be recorded automatically.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearLogsConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearActivityLogs();
                  setShowClearLogsConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
