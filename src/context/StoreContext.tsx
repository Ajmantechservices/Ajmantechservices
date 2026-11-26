import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Product,
  Category,
  CartItem,
  WishlistItem,
  ServiceItem,
  ServiceRequest,
  Order,
  OrderItem,
  OrderStatus,
  UserAccount,
  UserAddress,
  AdminCustomerOverview,
  ProjectPortfolio,
  Review,
  FAQItem,
  StoreSettings,
  ViewState,
  ActivityLog,
  NewActivityLog,
} from '../types';
import {
  CATEGORY_DEFAULT_IMAGES,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
  INITIAL_PROJECTS,
  INITIAL_REVIEWS,
  INITIAL_FAQS,
  INITIAL_STORE_SETTINGS,
  INITIAL_ACTIVITY_LOGS,
} from '../data/initialData';
import {
  LEGACY_SUBDIVIDED_CATEGORY_NAMES,
  MAIN_CATEGORIES,
  matchesCategoryFilter,
  slugifyCategoryName,
} from '../data/categories';
import {
  supabase,
  isSupabaseConfigured,
  generateUuid,
  getVerifiedCurrentSession,
  signInCustomerWithSupabase,
  signUpCustomerWithSupabase,
  signInCustomerWithGoogleOAuth,
  signOutWithSupabase,
  updateCustomerProfileInSupabase,
  signInAdminWithSupabase,
  signUpAdminWithSupabase,
  signOutAdminWithSupabase,
  addImagesToProductGallery,
  removeProductGalleryImage,
  TARGET_ADMIN_EMAIL,
  insertSupabaseProduct,
  updateSupabaseProduct,
  fetchCustomerOrders,
  fetchAllOrdersForAdmin,
  searchOrdersForAdmin,
  insertOrderInSupabase,
  updateOrderInSupabase,
  trackOrderSecureInSupabase,
  fetchCustomerServiceRequests,
  fetchAllServiceRequestsForAdmin,
  insertServiceRequestInSupabase,
  updateServiceRequestInSupabase,
  fetchCustomerAddresses,
  fetchAllCustomerAddressesForAdmin,
  upsertCustomerAddressInSupabase,
  deleteCustomerAddressInSupabase,
  fetchCustomerWishlist,
  fetchAllCustomerWishlistsForAdmin,
  addCustomerWishlistItem,
  removeCustomerWishlistItem,
  fetchAllProfilesForAdmin,
  fetchStoreSettingsFromSupabase,
  upsertStoreSettingsInSupabase,
} from '../lib/supabase';


interface Toast {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

export interface NavigationState {
  productId?: string | null;
  serviceId?: string | null;
  categorySlug?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  email?: string | null;
  token?: string | null;
}

interface StoreContextType {
  // Navigation & routing state
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedServiceId: string | null;
  setSelectedServiceId: (id: string | null) => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  navigationState: NavigationState;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  navigateTo: (
    view: ViewState,
    params?: {
      productId?: string;
      serviceId?: string;
      slug?: string;
      categorySlug?: string;
      orderId?: string;
      orderNumber?: string;
      email?: string;
      token?: string;
    }
  ) => void;

  // Modals & Drawers
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isServiceModalOpen: boolean;
  setIsServiceModalOpen: (open: boolean) => void;
  serviceModalDefaultType?: string;
  openServiceModal: (defaultServiceType?: string) => void;
  activeOrderForSuccess: Order | null;
  setActiveOrderForSuccess: (order: Order | null) => void;

  // Data Collections
  products: Product[];
  categories: Category[];
  services: ServiceItem[];
  projects: ProjectPortfolio[];

  reviews: Review[];
  faqs: FAQItem[];
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: StoreSettings) => Promise<void> | void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedVariant?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variant?: string) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;

  // Wishlist
  wishlist: WishlistItem[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  wishlistCount: number;

  // Customer Delivery Addresses
  customerAddresses: UserAddress[];
  addCustomerAddress: (address: Omit<UserAddress, 'id'>) => Promise<boolean>;
  updateCustomerAddress: (address: UserAddress) => Promise<boolean>;
  deleteCustomerAddress: (addressId: string) => Promise<boolean>;
  setDefaultCustomerAddress: (addressId: string) => Promise<boolean>;

  // Admin Customer Fulfillment & Wishlist Overview
  adminCustomers: AdminCustomerOverview[];
  refreshAdminCustomerData: () => Promise<void>;

  // Orders
  orders: Order[];
  createOrder: (orderData: Partial<Order> & Record<string, any>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  rejectOrder: (orderId: string, reason?: string) => void;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: 'pending' | 'paid' | 'verified', paymentReference?: string, paymentChannel?: string) => void;
  getOrderByIdOrNumber: (identifier: string) => Order | undefined;
  trackOrderSecure: (orderNumber: string, emailOrRef: string) => Promise<Order | null>;
  searchAdminOrders: (query: string) => Promise<Order[]>;

  // Services
  serviceRequests: ServiceRequest[];
  createServiceRequest: (requestData: Omit<ServiceRequest, 'id' | 'ticketNumber' | 'createdAt' | 'status'>) => ServiceRequest;
  updateServiceRequestStatus: (
    requestId: string,
    status: ServiceRequest['status'],
    notes?: string,
    assignedTech?: string,
    preferredDate?: string,
    preferredTimeSlot?: string
  ) => void;

  // Auth & Profile
  currentUser: UserAccount | null;
  login: (emailOrPhone: string, pass: string) => Promise<{ success: boolean; message: string; role?: 'admin' | 'customer' }>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>;
  register: (
    fullNameOrData: string | { fullName: string; email: string; phone: string; password?: string; role?: string },
    email?: string,
    phone?: string,
    pass?: string
  ) => Promise<{ success: boolean; message: string; requiresEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  adminLogin: (email: string, pass: string) => Promise<{ success: boolean; message: string; isPrivilegeDenied?: boolean }>;
  adminSignUp: (fullName: string, email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  adminLogout: () => Promise<void>;
  updateUserProfile: (updatedUser: Partial<UserAccount>) => Promise<void> | void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  isAuthChecking: boolean;

  // Product Admin Operations
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product> | Product;
  updateProduct: (product: Product) => Promise<void> | void;
  deleteProduct: (id: string) => Promise<void> | void;
  deleteMultipleProducts: (ids: string[]) => Promise<void>;

  // Category Admin Operations
  addCategory: (category: Omit<Category, 'id'> & { id?: string }) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  syncMainCategoriesToSupabase: () => Promise<boolean>;

  // Gallery Operations
  addGalleryImagesToProduct: (productId: string, imageUrls: string[], caption?: string, displayOrder?: number) => Promise<boolean>;
  deleteProductGalleryItem: (galleryId: string, productId: string, imageUrl?: string) => Promise<boolean>;
  deleteMultipleProductGalleryItems: (items: { galleryId?: string; productId: string; imageUrl: string }[]) => Promise<boolean>;
  refreshCatalog: () => Promise<void>;

  // Reviews
  addReview: (reviewData: Omit<Review, 'id' | 'date'>) => void;
  getProductReviews: (productId: string) => Review[];

  // Activity Audit Logs
  activityLogs: ActivityLog[];
  addActivityLog: (log: NewActivityLog) => void;
  clearActivityLogs: () => void;


  // Helpers & Notifications
  formatNaira: (amount: number) => string;
  toast: Toast | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  accessDeniedMessage: string | null;
  clearAccessDeniedMessage: () => void;
  openWhatsApp: (messageText?: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'ajmantech_products_v1',
  CATEGORIES: 'ajmantech_main_categories_v2',
  SERVICES: 'ajmantech_services_v1',
  PROJECTS: 'ajmantech_projects_v1',
  REVIEWS: 'ajmantech_reviews_v1',
  SETTINGS: 'ajmantech_settings_v1',
  CART: 'ajmantech_cart_v1',
  ACTIVITY_LOGS: 'ajmantech_activity_logs_v1',
};

const LEGACY_SHARED_KEYS_TO_CLEAR = [
  'ajmantech_wishlist_v1',
  'ajmantech_orders_v1',
  'ajmantech_service_requests_v1',
  'ajmantech_user_v1',
  'ajmantech_is_admin_v1',
  'ajmantech_registered_customers_v1',
];

const mapDbOrderRow = (o: any): Order => {
  const addr = o.delivery_address || {};
  return {
    id: String(o.id),
    userId: o.user_id || null,
    orderNumber: o.order_number,
    items: Array.isArray(o.items) ? o.items : [],
    customer: {
      fullName: o.customer_name || addr.fullName || 'Valued Customer',
      email: o.customer_email || '',
      phone: o.customer_phone || addr.phone || '',
      address: addr.streetAddress || addr.address || '',
      state: addr.state || 'Lagos',
      city: addr.city || 'Lagos',
      notes: o.delivery_notes || '',
    },
    customerName: o.customer_name || 'Valued Customer',
    customerEmail: o.customer_email || '',
    customerPhone: o.customer_phone || '',
    deliveryAddress: {
      fullName: o.customer_name || addr.fullName,
      phone: o.customer_phone || addr.phone,
      streetAddress: addr.streetAddress || addr.address || '',
      address: addr.address || addr.streetAddress || '',
      state: addr.state || 'Lagos',
      city: addr.city || 'Lagos',
    },
    subtotal: Math.max(0, Number(o.total_amount || 0) - Number(o.delivery_fee || 0) - Number(o.installation_fee || 0)),
    deliveryFee: Number(o.delivery_fee || 0),
    discountAmount: 0,
    total: Number(o.total_amount || 0),
    totalAmount: Number(o.total_amount || 0),
    paymentMethod: o.payment_method || 'bank_transfer',
    paymentStatus: o.payment_status || 'pending',
    paymentReference: o.reference || undefined,
    status: o.status || 'placed',
    trackingHistory: Array.isArray(o.tracking_history) ? o.tracking_history : [],
    createdAt: o.created_at ? String(o.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
    estimatedDelivery: '24-48 Hours from Dispatch',
    includesInstallation: Boolean(o.installation_fee && Number(o.installation_fee) > 0),
    installationFee: o.installation_fee ? Number(o.installation_fee) : 0,
    notes: o.delivery_notes || '',
  };
};

const mapDbServiceRequestRow = (s: any): ServiceRequest => ({
  id: String(s.id),
  userId: s.user_id || null,
  ticketNumber: s.ticket_number,
  serviceId: s.service_type || 'srv-electrical',
  serviceName: s.service_name || 'Electrical Installation',
  customerName: s.customer_name || 'Customer',
  email: s.customer_email || '',
  phone: s.customer_phone || '',
  state: s.location?.state || 'Lagos',
  city: s.location?.city || 'Lagos',
  address: s.location?.address || '',
  preferredDate: s.preferred_date || '',
  preferredTimeSlot: s.preferred_time || 'Morning',
  description: s.description || '',
  status: s.status || 'new',
  assignedTechnician: s.assigned_technician || undefined,
  internalNotes: s.admin_notes || undefined,
  createdAt: s.created_at ? String(s.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
});

const mapDbAddressRow = (a: any): UserAddress => ({
  id: String(a.id),
  userId: a.user_id,
  title: a.title || 'Home',
  fullName: a.full_name || '',
  fullAddress: a.street_address || '',
  streetAddress: a.street_address || '',
  city: a.city || '',
  state: a.state || 'Lagos',
  phone: a.phone || '',
  isDefault: Boolean(a.is_default),
});

const resolveCategoryImage = (name: string, slug: string, rawIcon?: string | null, rawImage?: string | null): string => {
  const candidates = [rawImage, rawIcon];
  for (const val of candidates) {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('/') ||
        trimmed.startsWith('data:image/')
      ) {
        return trimmed;
      }
    }
  }
  const byName = CATEGORY_DEFAULT_IMAGES[name];
  if (byName) return byName;
  const matchedInit = INITIAL_CATEGORIES.find(
    (ic) => ic.slug === slug || ic.name.toLowerCase() === name.toLowerCase()
  );
  return matchedInit?.image || CATEGORY_DEFAULT_IMAGES['Chandeliers'];
};

const mergeWithMainCategories = (dbCats: any[], currentProducts: Product[]): Category[] => {
  const mainIds = new Set(MAIN_CATEGORIES.map((m) => m.id));
  const filteredDb = (dbCats || []).filter((c: any) => {
    const cleanName = String(c?.name || '').trim().toLowerCase();
    // Keep if it is a main category ID (even if renamed by admin) or not a legacy subdivided category
    if (c?.id && mainIds.has(String(c.id))) return true;
    return !LEGACY_SUBDIVIDED_CATEGORY_NAMES.has(cleanName);
  });

  const mappedFromDb: Category[] = filteredDb.map((c: any) => {
    const name = String(c.name || '').trim();
    const slug = String(c.slug || slugifyCategoryName(name));
    const iconName =
      c.icon && !String(c.icon).startsWith('http') && !String(c.icon).startsWith('/') && !String(c.icon).startsWith('data:')
        ? String(c.icon)
        : MAIN_CATEGORIES.find((m) => m.id === c.id || m.slug === slug)?.iconName || 'Sparkles';

    return {
      id: String(c.id || `cat-${slug}`),
      name,
      slug,
      description: '',
      image: resolveCategoryImage(name, slug, c.icon, c.image_url || c.image),
      iconName,
      productCount: currentProducts.filter((p) => matchesCategoryFilter(p.category, name)).length,
      isPopular: true,
    };
  });

  // Ensure all 7 core main categories are present unless already represented by id or slug
  const merged: Category[] = [...mappedFromDb];
  for (const initCat of INITIAL_CATEGORIES) {
    const exists = merged.some(
      (c) =>
        c.id === initCat.id ||
        c.slug.toLowerCase() === initCat.slug.toLowerCase() ||
        c.name.toLowerCase() === initCat.name.toLowerCase()
    );
    if (!exists) {
      merged.push({
        ...initCat,
        productCount: currentProducts.filter((p) => matchesCategoryFilter(p.category, initCat.name)).length,
      });
    }
  }

  // Sort canonical 7 categories first in the requested order, followed by any custom admin categories
  const orderMap = new Map(INITIAL_CATEGORIES.map((c, idx) => [c.id, idx]));
  return merged.sort((a, b) => {
    const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 100;
    const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 100;
    if (idxA !== idxB) return idxA - idxB;
    return a.name.localeCompare(b.name);
  });
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Product Slug or ID URL detection on reload
  const getInitialProductSlugOrId = (): string | null => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/^\/(?:product|products)\/([^/?#]+)/i);
      if (match) return decodeURIComponent(match[1]);
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('openProduct')) return urlParams.get('openProduct');
    }
    return null;
  };

  // Navigation State with URL path detection
  const getInitialView = (): ViewState => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin/products' || path.startsWith('/admin/products')) return 'admin-products';
      if (path === '/admin' || path === '/admin/' || path === '/admin/login' || path.startsWith('/admin/login')) return 'admin';
      if (path === '/admin/dashboard' || path.startsWith('/admin/dashboard')) return 'admin-dashboard';
      if (path === '/admin/signup') return 'admin-signup';
      if (path.startsWith('/product/') || path.startsWith('/products/')) return 'product-detail';
      if (path === '/shop' || path === '/products' || path === '/product') return 'shop';
      if (path === '/services') return 'services';
      if (path === '/account') return 'account';
      if (path === '/wishlist') return 'wishlist';
      if (path === '/track' || path === '/track/' || path === '/track-order' || path.startsWith('/track')) return 'track-order';
    }
    return 'home';
  };

  const [currentView, setCurrentView] = useState<ViewState>(getInitialView);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(getInitialProductSlugOrId);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackingNavigationParams, setTrackingNavigationParams] = useState<{
    orderNumber?: string | null;
    email?: string | null;
    token?: string | null;
  }>({});

  // Modals
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [serviceModalDefaultType, setServiceModalDefaultType] = useState<string | undefined>(undefined);
  const [activeOrderForSuccess, setActiveOrderForSuccess] = useState<Order | null>(null);

  // Toast & Access Denied Alert Banner
  const [toast, setToast] = useState<Toast | null>(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const clearAccessDeniedMessage = () => setAccessDeniedMessage(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4000);
  };

  // Helper for LocalStorage
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`Failed to parse localStorage key ${key}`, e);
    }
    return fallback;
  };

  const saveStored = <T,>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to set localStorage key ${key}`, e);
    }
  };

  // Data States
  const [products, setProducts] = useState<Product[]>(() => loadStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => loadStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));
  const [services] = useState<ServiceItem[]>(() => loadStored(STORAGE_KEYS.SERVICES, INITIAL_SERVICES));
  const [projects] = useState<ProjectPortfolio[]>(() => loadStored(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS));
  const [reviews, setReviews] = useState<Review[]>(() => loadStored(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS));
  const [faqs] = useState<FAQItem[]>(INITIAL_FAQS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const loaded = loadStored<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_STORE_SETTINGS);
    // Automatically update to official contacts and new address if using old placeholder number or old address
    if (
      loaded.whatsappNumber === '+2348023456789' ||
      !loaded.socialLinks?.facebook?.includes('61552688677268') ||
      !loaded.address ||
      loaded.address.includes('Commercial Avenue') ||
      loaded.address.includes('Ikeja Electrical Market') ||
      !loaded.address.toLowerCase().includes('ikota')
    ) {
      const merged: StoreSettings = {
        ...loaded,
        address: INITIAL_STORE_SETTINGS.address,
        whatsappNumber: INITIAL_STORE_SETTINGS.whatsappNumber,
        phone: INITIAL_STORE_SETTINGS.phone,
        altPhone: INITIAL_STORE_SETTINGS.altPhone,
        deliveryRates: {
          ...loaded.deliveryRates,
          'Store Pickup (Ikota Villa Estate Showroom)': 0,
        },
        bankDetails: {
          ...loaded.bankDetails,
          branch: INITIAL_STORE_SETTINGS.bankDetails.branch,
        },
        socialLinks: {
          ...loaded.socialLinks,
          facebook: INITIAL_STORE_SETTINGS.socialLinks.facebook,
          instagram: INITIAL_STORE_SETTINGS.socialLinks.instagram,
          googleBusiness: INITIAL_STORE_SETTINGS.socialLinks.googleBusiness,
        },
      };
      saveStored(STORAGE_KEYS.SETTINGS, merged);
      return merged;
    }
    return loaded;
  });

  // Clear legacy shared client storage keys on mount so demo/cross-customer data never leaks
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      LEGACY_SHARED_KEYS_TO_CLEAR.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }, []);

  // User State: verified strictly against Supabase Auth session (never restored from localStorage)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Cart & User-Owned Private Data (never pre-seeded with demo orders/wishlists/requests)
  const [cart, setCart] = useState<CartItem[]>(() => loadStored(STORAGE_KEYS.CART, []));
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<UserAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<AdminCustomerOverview[]>([]);

  // Activity Audit Logs State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    loadStored(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS)
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) { console.error(e); }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) { console.error(e); }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    } catch (e) { console.error(e); }
  }, [reviews]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(storeSettings));
    } catch (e) { console.error(e); }
  }, [storeSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) { console.error(e); }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
    } catch (e) { console.error(e); }
  }, [activityLogs]);

  // Helper: Load strictly customer-scoped data for an authenticated customer
  const loadCustomerScopedData = async (userId: string) => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const [ordRes, srvRes, addrRes, wishRes] = await Promise.all([
        fetchCustomerOrders(userId),
        fetchCustomerServiceRequests(userId),
        fetchCustomerAddresses(userId),
        fetchCustomerWishlist(userId),
      ]);

      setOrders((ordRes.data || []).map(mapDbOrderRow));
      setServiceRequests((srvRes.data || []).map(mapDbServiceRequestRow));
      const mappedAddrs = (addrRes.data || []).map(mapDbAddressRow);
      setCustomerAddresses(mappedAddrs);
      setCurrentUser((prev) => (prev && prev.id === userId ? { ...prev, addresses: mappedAddrs } : prev));
      setWishlist(
        (wishRes.data || []).map((w: any) => ({
          productId: String(w.product_id),
          addedAt: w.created_at || new Date().toISOString(),
        }))
      );
      setAdminCustomers([]);
    } catch (err) {
      console.warn('Error loading customer-scoped data:', err);
    }
  };

  // Helper: Load all customer orders, service requests, addresses & wishlists for verified Admins ONLY
  const loadAdminScopedData = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const [ordRes, srvRes, profRes, addrRes, wishRes] = await Promise.all([
        fetchAllOrdersForAdmin(),
        fetchAllServiceRequestsForAdmin(),
        fetchAllProfilesForAdmin(),
        fetchAllCustomerAddressesForAdmin(),
        fetchAllCustomerWishlistsForAdmin(),
      ]);

      const mappedOrders = (ordRes.data || []).map(mapDbOrderRow);
      setOrders(mappedOrders);
      setServiceRequests((srvRes.data || []).map(mapDbServiceRequestRow));

      const addressesByUser = new Map<string, UserAddress[]>();
      (addrRes.data || []).forEach((row: any) => {
        const mapped = mapDbAddressRow(row);
        const list = addressesByUser.get(row.user_id) || [];
        list.push(mapped);
        addressesByUser.set(row.user_id, list);
      });

      const wishlistByUser = new Map<string, string[]>();
      (wishRes.data || []).forEach((row: any) => {
        const list = wishlistByUser.get(row.user_id) || [];
        list.push(String(row.product_id));
        wishlistByUser.set(row.user_id, list);
      });

      const ordersCountByUser = new Map<string, number>();
      mappedOrders.forEach((o) => {
        if (o.userId) {
          ordersCountByUser.set(o.userId, (ordersCountByUser.get(o.userId) || 0) + 1);
        }
      });

      const overviews: AdminCustomerOverview[] = (profRes.data || []).map((p: any) => ({
        id: String(p.id),
        email: p.email || '',
        fullName: p.full_name || 'Customer',
        phone: p.phone || '',
        role: p.role === 'admin' ? 'admin' : 'customer',
        createdAt: p.created_at ? String(p.created_at).split('T')[0] : undefined,
        addresses: addressesByUser.get(p.id) || [],
        wishlistProductIds: wishlistByUser.get(p.id) || [],
        ordersCount: ordersCountByUser.get(p.id) || 0,
      }));
      setAdminCustomers(overviews);
    } catch (err) {
      console.warn('Error loading admin-scoped data:', err);
    }
  };

  const refreshAdminCustomerData = async () => {
    if (!isAdmin) return;
    await loadAdminScopedData();
  };

  const clearUserOwnedState = () => {
    setOrders([]);
    setServiceRequests([]);
    setWishlist([]);
    setCustomerAddresses([]);
    setAdminCustomers([]);
  };

  // Verify live Supabase Auth session (customer or admin) on mount & auth state change
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const sessionInfo = await getVerifiedCurrentSession();
        if (!isMounted) return;

        if (sessionInfo.user && sessionInfo.profile) {
          const account: UserAccount = {
            id: sessionInfo.profile.id,
            fullName: sessionInfo.profile.fullName,
            email: sessionInfo.profile.email,
            phone: sessionInfo.profile.phone,
            role: sessionInfo.role,
            addresses: [],
            defaultAddress: sessionInfo.profile.defaultAddress,
            createdAt: sessionInfo.profile.createdAt
              ? String(sessionInfo.profile.createdAt).split('T')[0]
              : new Date().toISOString().split('T')[0],
          };

          setCurrentUser(account);
          setIsAdmin(sessionInfo.isAdmin);

          if (sessionInfo.isAdmin) {
            await loadAdminScopedData();
          } else {
            await loadCustomerScopedData(account.id);
          }
        } else {
          setIsAdmin(false);
          setCurrentUser(null);
          clearUserOwnedState();
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
          setCurrentUser(null);
          clearUserOwnedState();
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    };

    verifySession();

    const authSub =
      isSupabaseConfigured() && supabase
        ? supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
              if (!isMounted) return;
              setIsAdmin(false);
              setCurrentUser(null);
              clearUserOwnedState();
              setIsAuthChecking(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              verifySession();
            }
          })
        : null;

    return () => {
      isMounted = false;
      authSub?.data?.subscription?.unsubscribe();
    };
  }, []);

  // Public Storefront Catalog & Store Settings Sync (never reads private customer orders/requests)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const fetchPublicStoreData = async () => {
      try {
        const { data: dbProducts, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        let latestProducts = products;
        if (!prodErr && Array.isArray(dbProducts)) {
          const mappedProducts: Product[] = dbProducts.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug || p.id,
            brand: p.brand || 'AjmanTech',
            category: p.category || p.category_name || 'Chandeliers',
            price: Number(p.price),
            discountPrice: p.original_price ? Number(p.price) : undefined,
            stock: p.stock ?? 10,
            rating: p.rating ? Number(p.rating) : 5.0,
            reviewCount: p.review_count ?? 0,
            images: Array.isArray(p.gallery) && p.gallery.length > 0
              ? p.gallery
              : [p.image_url || p.image || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=800&auto=format&fit=crop'],
            isFeatured: Boolean(p.is_featured),
            isBestSeller: Boolean(p.is_best_seller),
            isNewArrival: Boolean(p.is_new),
            tags: Array.isArray(p.tags) ? p.tags : ['lighting'],
            shortDescription: p.short_description || (p.description ? p.description.slice(0, 120) : p.name),
            description: p.description || p.full_description || p.short_description || p.name,
            specifications: {
              wattage: p.specifications?.wattage || p.voltage || '48W',
              voltage: p.voltage || '220V - 240V',
              colorTemperature: p.specifications?.colorTemperature || '3000K - 6500K',
              warranty: p.warranty || '1 Year',
              dimensions: p.specifications?.dimensions,
              material: p.specifications?.material,
            },
          }));
          latestProducts = mappedProducts;
          setProducts(mappedProducts);
        }

        const { data: dbCats, error: catErr } = await supabase.from('categories').select('*');
        if (!catErr && Array.isArray(dbCats)) {
          setCategories(mergeWithMainCategories(dbCats, latestProducts));
        }

        const { data: dbSettings } = await fetchStoreSettingsFromSupabase();
        if (dbSettings) {
          setStoreSettings((prev) => ({
            ...prev,
            storeName: dbSettings.store_name || prev.storeName,
            tagline: dbSettings.tagline || prev.tagline,
            phone: dbSettings.phone_number || prev.phone,
            altPhone: dbSettings.alt_phone || prev.altPhone,
            whatsappNumber: dbSettings.whatsapp_number || prev.whatsappNumber,
            email: dbSettings.email || prev.email,
            address: dbSettings.address || prev.address,
            openingHours: dbSettings.opening_hours || prev.openingHours,
            defaultDeliveryFee: dbSettings.default_delivery_fee ?? dbSettings.delivery_fee_other_states ?? prev.defaultDeliveryFee,
            freeDeliveryThreshold: dbSettings.free_delivery_threshold ?? prev.freeDeliveryThreshold,
            deliveryRates: (dbSettings.delivery_rates && Object.keys(dbSettings.delivery_rates).length > 0)
              ? dbSettings.delivery_rates
              : prev.deliveryRates,
            bankDetails: (dbSettings.bank_details && dbSettings.bank_details.bankName)
              ? dbSettings.bank_details
              : prev.bankDetails,
            promoCodes: Array.isArray(dbSettings.promo_codes) && dbSettings.promo_codes.length > 0
              ? dbSettings.promo_codes
              : prev.promoCodes,
            socialLinks: (dbSettings.social_links && Object.keys(dbSettings.social_links).length > 0)
              ? dbSettings.social_links
              : prev.socialLinks,
          }));
        }
      } catch (err) {
        console.warn('Supabase public catalog fetch notice:', err);
      }
    };

    fetchPublicStoreData();

    const realtimeChannel = supabase
      .channel('public_products_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchPublicStoreData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchPublicStoreData();
      })
      .subscribe();

    const handleFocus = () => {
      fetchPublicStoreData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('online', handleFocus);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('online', handleFocus);
      }
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  // Popstate listener to keep currentView in sync with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const prodMatch = window.location.pathname.match(/^\/(?:product|products)\/([^/?#]+)/i);
      if (prodMatch) {
        setSelectedProductId(decodeURIComponent(prodMatch[1]));
        setCurrentView('product-detail');
        return;
      }
      if (path === '/admin/products' || path.startsWith('/admin/products')) setCurrentView('admin-products');
      else if (path === '/admin' || path === '/admin/' || path === '/admin/login') setCurrentView('admin');
      else if (path === '/admin/dashboard') setCurrentView('admin-dashboard');
      else if (path === '/admin/signup') setCurrentView('admin-signup');
      else if (path === '/shop' || path === '/products') setCurrentView('shop');
      else if (path === '/services') setCurrentView('services');
      else if (path === '/account') setCurrentView('account');
      else if (path === '/wishlist') setCurrentView('wishlist');
      else if (path === '/track' || path === '/track/' || path === '/track-order' || path.startsWith('/track')) setCurrentView('track-order');
      else if (path === '/') setCurrentView('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strict Route Access Control Enforcement
  const ADMIN_PROTECTED_VIEWS: ViewState[] = [
    'admin',
    'admin-login',
    'admin-signup',
    'admin-dashboard',
    'admin-products',
    'track-order',
  ];

  useEffect(() => {
    if (isAuthChecking) return;

    // 1. Logged-in Customer attempting to visit ANY admin route (including /track) -> redirect immediately to Customer Dashboard
    if (currentUser && !isAdmin && ADMIN_PROTECTED_VIEWS.includes(currentView)) {
      const deniedMsg =
        currentView === 'track-order'
          ? 'Access Denied: The administrator order lookup & tracking portal is restricted to administrators. You can track your own orders below.'
          : 'Access Denied: Customers cannot access administrator portals.';
      setAccessDeniedMessage(deniedMsg);
      setCurrentView('account');
      if (typeof window !== 'undefined' && window.history) {
        try {
          window.history.replaceState({ view: 'account' }, '', '/account');
        } catch {}
      }
      showToast(deniedMsg, 'error');
      return;
    }

    // 2. Unauthenticated visitor attempting to access Admin Dashboard, Products, or Admin Order Tracker -> redirect to Admin Login
    if (!currentUser && (currentView === 'admin-dashboard' || currentView === 'admin-products' || currentView === 'track-order')) {
      setCurrentView('admin-login');
      if (typeof window !== 'undefined' && window.history) {
        try {
          window.history.replaceState({ view: 'admin-login' }, '', '/admin');
        } catch {}
      }
      showToast('Administrator sign-in is required to access that portal.', 'info');
      return;
    }

    // 3. Unauthenticated visitor attempting to access Wishlist -> redirect to Customer Login (/account)
    if (!currentUser && currentView === 'wishlist') {
      setCurrentView('account');
      if (typeof window !== 'undefined' && window.history) {
        try {
          window.history.replaceState({ view: 'account' }, '', '/account');
        } catch {}
      }
      showToast('Please sign in to access your saved wishlist.', 'info');
      return;
    }
  }, [currentView, currentUser, isAdmin, isAuthChecking]);

  // Scroll to top on view change & sync URL with access guards
  const navigateTo = (
    view: ViewState,
    params?: {
      productId?: string;
      serviceId?: string;
      slug?: string;
      categorySlug?: string;
      orderId?: string;
      orderNumber?: string;
      email?: string;
      token?: string;
    }
  ) => {
    // Route guard check prior to navigation
    if (!isAuthChecking) {
      if (currentUser && !isAdmin && ADMIN_PROTECTED_VIEWS.includes(view)) {
        const deniedMsg =
          view === 'track-order'
            ? 'Access Denied: The administrator order lookup & tracking portal is restricted to administrators. You can view your own orders below.'
            : 'Access Denied: Administrator portal is restricted.';
        setAccessDeniedMessage(deniedMsg);
        showToast(deniedMsg, 'error');
        view = 'account';
      } else if (!currentUser && (view === 'admin-dashboard' || view === 'admin-products' || view === 'track-order')) {
        showToast('Administrator sign-in is required to access that page.', 'info');
        view = 'admin-login';
      } else if (!currentUser && view === 'wishlist') {
        showToast('Please sign in to access your wishlist.', 'info');
        view = 'account';
      }
    }

    if (params?.productId !== undefined) setSelectedProductId(params.productId || null);
    if (params?.serviceId !== undefined) setSelectedServiceId(params.serviceId || null);
    if (params?.categorySlug !== undefined) setSelectedCategorySlug(params.categorySlug || null);
    if (params?.orderNumber !== undefined || params?.email !== undefined || params?.token !== undefined) {
      setTrackingNavigationParams({
        orderNumber: params?.orderNumber || null,
        email: params?.email || null,
        token: params?.token || null,
      });
    }
    if (params?.orderId) {
      const found = orders.find((o) => o.id === params.orderId || o.orderNumber === params.orderId);
      if (found) setActiveOrderForSuccess(found);
    }

    setCurrentView(view);

    if (typeof window !== 'undefined' && window.history) {
      let targetPath = '/';
      if (view === 'admin' || view === 'admin-login') targetPath = '/admin';
      else if (view === 'admin-products') targetPath = '/admin/products';
      else if (view === 'admin-dashboard') targetPath = '/admin/dashboard';
      else if (view === 'admin-signup') targetPath = '/admin/signup';
      else if (view === 'account') targetPath = '/account';
      else if (view === 'wishlist') targetPath = '/wishlist';
      else if (view === 'shop') targetPath = '/shop';
      else if (view === 'services') targetPath = '/services';
      else if (view === 'portfolio') targetPath = '/portfolio';
      else if (view === 'about') targetPath = '/about';
      else if (view === 'contact') targetPath = '/contact';
      else if (view === 'track-order') targetPath = '/track';
      else if (view === 'product-detail' && (params?.productId || selectedProductId)) {
        const pId = params?.productId || selectedProductId;
        targetPath = `/product/${encodeURIComponent(pId!)}`;
      }

      try {
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ view, slug: params?.slug }, '', targetPath);
        }
      } catch (e) {
        // Safe within sandbox iframe
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigationState: NavigationState = useMemo(
    () => ({
      productId: selectedProductId,
      serviceId: selectedServiceId,
      categorySlug: selectedCategorySlug,
      orderId: activeOrderForSuccess?.id || null,
      orderNumber: trackingNavigationParams.orderNumber || null,
      email: trackingNavigationParams.email || null,
      token: trackingNavigationParams.token || null,
    }),
    [selectedProductId, selectedServiceId, selectedCategorySlug, activeOrderForSuccess, trackingNavigationParams]
  );

  const openServiceModal = (defaultServiceType?: string) => {
    setServiceModalDefaultType(defaultServiceType);
    setIsServiceModalOpen(true);
  };

  // Currency Formatter
  const formatNaira = (amount: number) => {
    return '₦' + Math.round(amount).toLocaleString('en-NG');
  };

  // WhatsApp Helper
  const openWhatsApp = (messageText?: string) => {
    const rawNumber = storeSettings.whatsappNumber.replace(/[^0-9]/g, '');
    const defaultMsg = 'Hello AjmanTech Services, I would like to make an inquiry about your lighting and electrical services.';
    const text = encodeURIComponent(messageText || defaultMsg);
    const url = `https://wa.me/${rawNumber}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Activity Audit Logs Handlers
  const addActivityLog = (logData: NewActivityLog) => {
    const newLog: ActivityLog = {
      ...logData,
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      adminName: logData.adminName || (currentUser?.fullName || 'Engr. Abiodun Ajayi'),
      adminEmail: logData.adminEmail || (currentUser?.email || TARGET_ADMIN_EMAIL),
      ipAddress: logData.ipAddress || '102.89.47.12 (Lagos, NG)',
      userAgent: logData.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : 'Mozilla/5.0 (Admin Browser)'),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
    showToast('Activity audit logs cleared.', 'info');
  };


  // Cart operations
  const addToCart = (product: Product, quantity = 1, selectedVariant?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.selectedVariant === selectedVariant
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQty, product.stock),
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            quantity: Math.min(quantity, product.stock),
            selectedVariant,
            product,
          },
        ];
      }
    });
    showToast(`Added "${product.name}" to cart!`);
  };

  const updateCartQuantity = (productId: string, quantity: number, variant?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.selectedVariant === variant) {
          return { ...item, quantity: Math.min(quantity, item.product.stock) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, variant?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.selectedVariant === variant))
    );
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = cart.reduce((acc, item) => {
    const itemPrice = item.product.discountPrice ?? item.product.price;
    return acc + itemPrice * item.quantity;
  }, 0);

  // Wishlist operations (Strictly scoped to authenticated user)
  const toggleWishlist = (productId: string) => {
    if (!currentUser) {
      showToast('Please sign in to save items to your wishlist.', 'info');
      navigateTo('account');
      return;
    }
    const exists = wishlist.some((item) => item.productId === productId);
    if (exists) {
      setWishlist((prev) => prev.filter((item) => item.productId !== productId));
      removeCustomerWishlistItem(currentUser.id, productId).catch((e) =>
        console.warn('Wishlist delete notice:', e)
      );
      showToast('Removed from wishlist', 'info');
    } else {
      setWishlist((prev) => [...prev, { productId, addedAt: new Date().toISOString() }]);
      addCustomerWishlistItem(currentUser.id, productId).catch((e) =>
        console.warn('Wishlist insert notice:', e)
      );
      showToast('Saved to your wishlist!');
    }
  };

  const isInWishlist = (productId: string) => {
    if (!currentUser) return false;
    return wishlist.some((item) => item.productId === productId);
  };

  const removeFromWishlist = (productId: string) => {
    if (!currentUser) return;
    setWishlist((prev) => prev.filter((item) => item.productId !== productId));
    removeCustomerWishlistItem(currentUser.id, productId).catch((e) =>
      console.warn('Wishlist remove notice:', e)
    );
  };

  const wishlistCount = currentUser ? wishlist.length : 0;

  // Customer Delivery Address CRUD (Strictly scoped to currentUser.id)
  const addCustomerAddress = async (addr: Omit<UserAddress, 'id'>): Promise<boolean> => {
    if (!currentUser) {
      showToast('Please sign in to manage delivery addresses.', 'error');
      return false;
    }
    const newId = generateUuid();
    const shouldBeDefault = addr.isDefault || customerAddresses.length === 0;
    const newAddr: UserAddress = {
      ...addr,
      id: newId,
      userId: currentUser.id,
      fullAddress: addr.streetAddress || addr.fullAddress,
      streetAddress: addr.streetAddress || addr.fullAddress,
      isDefault: shouldBeDefault,
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await upsertCustomerAddressInSupabase(currentUser.id, {
        id: newId,
        title: newAddr.title,
        fullName: newAddr.fullName || currentUser.fullName,
        streetAddress: newAddr.streetAddress || newAddr.fullAddress,
        city: newAddr.city,
        state: newAddr.state,
        phone: newAddr.phone,
        isDefault: shouldBeDefault,
      });
      if (error) {
        showToast(`Could not save address: ${error.message}`, 'error');
        return false;
      }
      if (data) {
        newAddr.id = String(data.id);
      }
    }

    setCustomerAddresses((prev) => {
      const reset = shouldBeDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
      return [newAddr, ...reset];
    });
    if (shouldBeDefault) {
      await updateCustomerProfileInSupabase(currentUser.id, {
        defaultAddress: {
          streetAddress: newAddr.streetAddress || newAddr.fullAddress,
          city: newAddr.city,
          state: newAddr.state,
        },
      });
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              defaultAddress: {
                streetAddress: newAddr.streetAddress || newAddr.fullAddress,
                city: newAddr.city,
                state: newAddr.state,
              },
            }
          : prev
      );
    }
    showToast('Delivery address saved!');
    return true;
  };

  const updateCustomerAddress = async (addr: UserAddress): Promise<boolean> => {
    if (!currentUser) return false;
    const cleanStreet = addr.streetAddress || addr.fullAddress;

    if (isSupabaseConfigured() && supabase) {
      const { error } = await upsertCustomerAddressInSupabase(currentUser.id, {
        id: addr.id,
        title: addr.title,
        fullName: addr.fullName || currentUser.fullName,
        streetAddress: cleanStreet,
        city: addr.city,
        state: addr.state,
        phone: addr.phone,
        isDefault: addr.isDefault,
      });
      if (error) {
        showToast(`Could not update address: ${error.message}`, 'error');
        return false;
      }
    }

    setCustomerAddresses((prev) =>
      prev.map((a) => {
        if (a.id === addr.id) {
          return { ...addr, streetAddress: cleanStreet, fullAddress: cleanStreet };
        }
        return addr.isDefault ? { ...a, isDefault: false } : a;
      })
    );
    if (addr.isDefault) {
      setCurrentUser((prev) =>
        prev ? { ...prev, defaultAddress: { streetAddress: cleanStreet, city: addr.city, state: addr.state } } : prev
      );
    }
    showToast('Delivery address updated!');
    return true;
  };

  const deleteCustomerAddress = async (addressId: string): Promise<boolean> => {
    if (!currentUser) return false;
    if (isSupabaseConfigured() && supabase) {
      const { error } = await deleteCustomerAddressInSupabase(currentUser.id, addressId);
      if (error) {
        showToast(`Could not delete address: ${error.message}`, 'error');
        return false;
      }
    }
    setCustomerAddresses((prev) => prev.filter((a) => a.id !== addressId));
    showToast('Delivery address removed.', 'info');
    return true;
  };

  const setDefaultCustomerAddress = async (addressId: string): Promise<boolean> => {
    const target = customerAddresses.find((a) => a.id === addressId);
    if (!target) return false;
    return await updateCustomerAddress({ ...target, isDefault: true });
  };

  // Orders
  const createOrder = (
    orderData: Partial<Order> & Record<string, any>
  ): Order => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = orderData.orderNumber || `AJM-${new Date().getFullYear()}-${randomNum}`;
    const receiptNumber = orderData.receiptNumber || `INV-${new Date().getFullYear()}-${randomNum}`;

    // Ensure items are populated from cart if not passed
    const items: OrderItem[] = (orderData.items && orderData.items.length > 0)
      ? orderData.items
      : cart.map((c) => ({
          productId: c.product.id,
          title: c.product.name,
          productName: c.product.name,
          price: c.product.discountPrice ?? c.product.price,
          quantity: c.quantity,
          image: c.product.images?.[0] || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=600&auto=format&fit=crop',
          productImage: c.product.images?.[0] || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=600&auto=format&fit=crop',
          variant: c.selectedVariant,
        }));

    const calculatedSubtotal = orderData.subtotal ?? cartSubtotal;
    const discountAmt = orderData.discountAmount ?? 0;
    const delFee = orderData.deliveryFee ?? 0;
    const installFee = (orderData.installationRequested || orderData.includesInstallation) ? 15000 : (orderData.installationFee ?? 0);
    const finalTotal = orderData.total ?? orderData.totalAmount ?? (calculatedSubtotal - discountAmt + delFee + installFee);

    const customerDetails = orderData.customer || {
      fullName: orderData.customerName || orderData.deliveryAddress?.fullName || currentUser?.fullName || 'Valued Customer',
      email: orderData.customerEmail || (orderData.deliveryAddress as any)?.email || currentUser?.email || 'customer@ajmantech.ng',
      phone: orderData.customerPhone || orderData.deliveryAddress?.phone || currentUser?.phone || '',
      address: orderData.deliveryAddress?.streetAddress || orderData.deliveryAddress?.address || '',
      state: orderData.deliveryAddress?.state || 'Lagos',
      city: orderData.deliveryAddress?.city || 'Lagos',
      notes: orderData.notes || orderData.deliveryNotes,
    };

    const isPaidOnline = orderData.paymentMethod === 'card' || orderData.paymentMethod === 'ussd' || orderData.paymentStatus === 'paid';
    const paymentStatus = orderData.paymentStatus || (isPaidOnline ? 'paid' : 'pending');
    const paymentReference = orderData.paymentReference || (isPaidOnline ? `PSTK_TXN_${Date.now()}_${randomNum}` : undefined);
    const paymentChannel = orderData.paymentChannel || (orderData.paymentMethod === 'card' ? 'Debit Card (Paystack)' : orderData.paymentMethod === 'ussd' ? 'USSD Banking' : 'Bank Transfer');
    const paidAt = isPaidOnline ? (orderData.paidAt || new Date().toISOString()) : undefined;
    const ownerUserId = orderData.userId ?? currentUser?.id ?? null;

    const newOrder: Order = {
      id: orderData.id || generateUuid(),
      userId: ownerUserId,
      orderNumber,
      receiptNumber,
      items,
      customer: customerDetails,
      customerName: customerDetails.fullName,
      customerEmail: customerDetails.email,
      customerPhone: customerDetails.phone,
      deliveryAddress: orderData.deliveryAddress || {
        fullName: customerDetails.fullName,
        phone: customerDetails.phone,
        streetAddress: customerDetails.address,
        address: customerDetails.address,
        state: customerDetails.state,
        city: customerDetails.city,
      },
      subtotal: calculatedSubtotal,
      deliveryFee: delFee,
      discountAmount: discountAmt,
      promoCode: orderData.promoCode || orderData.appliedPromoCode,
      appliedPromoCode: orderData.promoCode || orderData.appliedPromoCode,
      total: finalTotal,
      totalAmount: finalTotal,
      paymentMethod: orderData.paymentMethod || 'bank_transfer',
      paymentStatus,
      paymentReference,
      paymentChannel,
      paidAt,
      includesInstallation: Boolean(orderData.includesInstallation || orderData.installationRequested),
      installationRequested: Boolean(orderData.includesInstallation || orderData.installationRequested),
      installationFee: installFee,
      notes: orderData.notes || customerDetails.notes,
      status: isPaidOnline ? 'confirmed' : 'placed',
      createdAt: orderData.createdAt || new Date().toISOString().split('T')[0],
      estimatedDelivery: orderData.estimatedDelivery || (customerDetails.state.toLowerCase().includes('lagos') ? '24 - 48 Hours' : '2 - 4 Business Days'),
      trackingHistory: [
        {
          status: 'placed',
          title: 'Order Placed',
          description: 'Your order has been placed successfully and logged with AjmanTech Services.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true,
        },
        {
          status: 'confirmed',
          title: isPaidOnline ? 'Payment Confirmed & Verified' : 'Payment Confirmation Pending',
          description: isPaidOnline ? `Online payment (${paymentReference}) verified successfully.` : 'Awaiting transfer confirmation or POD inspection.',
          timestamp: isPaidOnline ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending',
          completed: isPaidOnline,
        },
        {
          status: 'processing',
          title: 'Quality Testing & Packaging',
          description: 'Bench testing lights and secure packaging.',
          timestamp: 'Pending',
          completed: false,
        },
        {
          status: 'dispatched',
          title: 'Dispatched',
          description: 'Item assigned to courier transit route.',
          timestamp: 'Pending',
          completed: false,
        },
        {
          status: 'out_for_delivery',
          title: 'Out for Delivery',
          description: 'Courier delivery agent on the way to your address.',
          timestamp: 'Pending',
          completed: false,
        },
        {
          status: 'delivered',
          title: 'Delivered',
          description: 'Order handed over successfully.',
          timestamp: 'Pending',
          completed: false,
        },
      ],
    };

    // Only keep order in current user's state if they are signed in
    if (currentUser) {
      setOrders((prev) => [newOrder, ...prev]);
    }
    clearCart();
    setActiveOrderForSuccess(newOrder);
    showToast(`Order ${orderNumber} placed successfully!`, 'success');

    // Persist placed order to Supabase unless explicitly skipped
    // Paystack orders always carry paymentStatus='paid' & paymentReference (called only from handlePaystackSuccess)
    if (isSupabaseConfigured() && supabase && !orderData.skipDatabaseSync) {
      insertOrderInSupabase({
        id: newOrder.id,
        user_id: ownerUserId,
        order_number: newOrder.orderNumber,
        reference: newOrder.paymentReference || null,
        customer_name: newOrder.customer.fullName,
        customer_email: newOrder.customer.email,
        customer_phone: newOrder.customer.phone,
        items: newOrder.items,
        total_amount: newOrder.total,
        amount: newOrder.total,
        delivery_fee: newOrder.deliveryFee,
        installation_fee: newOrder.installationFee || 0,
        payment_method: isPaidOnline ? 'paystack' : newOrder.paymentMethod,
        payment_status: newOrder.paymentStatus,
        delivery_address: {
          fullName: newOrder.customer.fullName,
          phone: newOrder.customer.phone,
          streetAddress: newOrder.customer.address,
          address: newOrder.customer.address,
          state: newOrder.customer.state,
          city: newOrder.customer.city,
        },
        delivery_notes: newOrder.customer.notes || null,
        status: newOrder.status,
        tracking_history: newOrder.trackingHistory,
      }).then(({ error }) => {
        if (error) console.error('Supabase order insert error:', error.message);
      });
    }

    return newOrder;
  };

  const updateOrderPaymentStatus = (
    orderId: string,
    paymentStatus: 'pending' | 'paid' | 'verified',
    paymentReference?: string,
    paymentChannel?: string
  ) => {
    if (!isAdmin) {
      showToast('Unauthorized: Only administrators can update payment status.', 'error');
      return;
    }

    let matchedOrder: Order | undefined;
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId || order.orderNumber === orderId) {
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const updatedHistory = order.trackingHistory.map((step) => {
            if (step.status === 'confirmed' && (paymentStatus === 'paid' || paymentStatus === 'verified')) {
              return {
                ...step,
                completed: true,
                timestamp,
                description: `Payment verified (${paymentReference || order.paymentReference || 'Bank Transfer'}). Ready for packaging.`,
              };
            }
            return step;
          });

          matchedOrder = {
            ...order,
            paymentStatus,
            paymentReference: paymentReference || order.paymentReference || `AJM_MANUAL_${Date.now()}`,
            paymentChannel: paymentChannel || order.paymentChannel || 'Zenith Bank Transfer',
            paidAt: paymentStatus !== 'pending' ? (order.paidAt || new Date().toISOString()) : order.paidAt,
            status: paymentStatus !== 'pending' && order.status === 'placed' ? 'confirmed' : order.status,
            trackingHistory: updatedHistory,
          };
          return matchedOrder;
        }
        return order;
      })
    );

    if (matchedOrder && isSupabaseConfigured() && supabase) {
      updateOrderInSupabase(matchedOrder.id, matchedOrder.orderNumber, {
        payment_status: paymentStatus,
        reference: matchedOrder.paymentReference,
        status: matchedOrder.status,
        tracking_history: matchedOrder.trackingHistory,
      }).catch((err) => console.error('Supabase payment update error:', err));
    }

    addActivityLog({
      actionType: 'order',
      title: `Payment ${paymentStatus.toUpperCase()}: Order #${orderId}`,
      details: `Payment status verified for order. Channel: ${paymentChannel || 'Bank Transfer'}. Ref: ${paymentReference || 'N/A'}`,
      severity: paymentStatus === 'verified' || paymentStatus === 'paid' ? 'success' : 'info',
    });
    showToast(`Order payment status updated to "${paymentStatus.toUpperCase()}"!`, 'success');
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    if (!isAdmin) {
      showToast('Unauthorized: Only administrators can update order statuses.', 'error');
      return;
    }

    let updatedOrder: Order | undefined;
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId || order.orderNumber === orderId) {
          const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          let updatedHistory = order.trackingHistory.map((step) => {
            if (step.status === status) {
              return {
                ...step,
                completed: true,
                timestamp,
                description: note || step.description,
              };
            }
            return step;
          });

          if (!updatedHistory.some((s) => s.status === status)) {
            updatedHistory = [
              ...updatedHistory,
              {
                status,
                title: status === 'cancelled' ? 'Order Cancelled / Rejected' : status.replace(/_/g, ' ').toUpperCase(),
                description: note || 'Status updated by administrator.',
                timestamp,
                completed: true,
              },
            ];
          }

          updatedOrder = {
            ...order,
            status,
            trackingHistory: updatedHistory,
          };
          return updatedOrder;
        }
        return order;
      })
    );

    addActivityLog({
      actionType: 'order',
      title: `Order Status Changed: ${status.replace(/_/g, ' ').toUpperCase()}`,
      details: `Order #${orderId} updated to ${status}. Note: ${note || 'Status updated by administrator'}`,
      severity: status === 'delivered' ? 'success' : status === 'cancelled' ? 'warning' : 'info',
    });
    showToast(`Order status updated to "${status.replace(/_/g, ' ').toUpperCase()}"`);

    if (updatedOrder && isSupabaseConfigured() && supabase) {
      updateOrderInSupabase(updatedOrder.id, updatedOrder.orderNumber, {
        status,
        tracking_history: updatedOrder.trackingHistory,
      }).then(({ error }) => {
        if (error) console.error('Supabase order update error:', error.message);
      });
    }
  };

  const rejectOrder = (orderId: string, reason = 'Rejected by administrator.') => {
    updateOrderStatus(orderId, 'cancelled', reason);
  };

  const getOrderByIdOrNumber = (identifier: string) => {
    const clean = identifier.trim().toLowerCase();
    return orders.find(
      (o) => o.id.toLowerCase() === clean || o.orderNumber.toLowerCase() === clean
    );
  };

  const trackOrderSecure = async (orderNumber: string, emailOrRef: string): Promise<Order | null> => {
    // Admin-only order lookup across all orders
    if (!isAdmin) return null;

    const cleanOrd = orderNumber.trim().toLowerCase();
    const cleanEmailOrRef = emailOrRef.trim().toLowerCase();
    if (!cleanOrd && !cleanEmailOrRef) return null;

    const localMatch = orders.find(
      (o) =>
        (cleanOrd && o.orderNumber.toLowerCase() === cleanOrd) ||
        (cleanEmailOrRef &&
          (o.customer.email.toLowerCase() === cleanEmailOrRef ||
            (o.paymentReference && o.paymentReference.toLowerCase() === cleanEmailOrRef)))
    );
    if (localMatch) return localMatch;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await trackOrderSecureInSupabase(orderNumber, emailOrRef);
      if (!error && data) {
        return mapDbOrderRow(data);
      }
    }

    return null;
  };

  const searchAdminOrders = async (query: string): Promise<Order[]> => {
    if (!isAdmin) return [];
    const clean = query.trim().toLowerCase();

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await searchOrdersForAdmin(query);
      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapDbOrderRow);
        if (!clean) {
          setOrders(mapped);
        }
        return mapped;
      }
    }

    if (!clean) return orders;
    return orders.filter((o) => {
      const num = (o.orderNumber || '').toLowerCase();
      const id = (o.id || '').toLowerCase();
      const ref = (o.paymentReference || '').toLowerCase();
      const custName = (o.customer?.fullName || o.customerName || '').toLowerCase();
      const custEmail = (o.customer?.email || o.customerEmail || '').toLowerCase();
      const custPhone = (o.customer?.phone || o.customerPhone || '').toLowerCase();
      return (
        num.includes(clean) ||
        id.includes(clean) ||
        ref.includes(clean) ||
        custName.includes(clean) ||
        custEmail.includes(clean) ||
        custPhone.includes(clean)
      );
    });
  };

  // Service Requests
  const createServiceRequest = (
    requestData: Omit<ServiceRequest, 'id' | 'ticketNumber' | 'createdAt' | 'status'>
  ): ServiceRequest => {
    const randomTicket = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `SRV-${randomTicket}`;
    const ownerUserId = requestData.userId ?? currentUser?.id ?? null;

    const newRequest: ServiceRequest = {
      ...requestData,
      userId: ownerUserId,
      id: generateUuid(),
      ticketNumber,
      status: 'new',
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (currentUser) {
      setServiceRequests((prev) => [newRequest, ...prev]);
    }
    showToast(`Service Request ${ticketNumber} logged! AjmanTech team will call you.`);

    if (isSupabaseConfigured() && supabase) {
      insertServiceRequestInSupabase({
        id: newRequest.id,
        user_id: ownerUserId,
        ticket_number: newRequest.ticketNumber,
        customer_name: newRequest.customerName,
        customer_phone: newRequest.phone,
        customer_email: newRequest.email,
        service_type: newRequest.serviceId,
        service_name: newRequest.serviceName,
        description: newRequest.description,
        location: {
          state: newRequest.state,
          city: newRequest.city,
          address: newRequest.address,
        },
        preferred_date: newRequest.preferredDate,
        preferred_time: newRequest.preferredTimeSlot,
        status: newRequest.status,
      }).then(({ error }) => {
        if (error) console.error('Supabase service request insert error:', error.message);
      });
    }

    return newRequest;
  };

  const updateServiceRequestStatus = (
    requestId: string,
    status: ServiceRequest['status'],
    notes?: string,
    assignedTech?: string,
    preferredDate?: string,
    preferredTimeSlot?: string
  ) => {
    if (!isAdmin) {
      showToast('Unauthorized: Only administrators can update service requests.', 'error');
      return;
    }

    let matchedTicket = '';
    setServiceRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId || req.ticketNumber === requestId) {
          matchedTicket = req.ticketNumber;
          return {
            ...req,
            status,
            internalNotes: notes !== undefined ? notes : req.internalNotes,
            assignedTechnician: assignedTech !== undefined ? assignedTech : req.assignedTechnician,
            preferredDate: preferredDate !== undefined ? preferredDate : req.preferredDate,
            preferredTimeSlot: preferredTimeSlot !== undefined ? preferredTimeSlot : req.preferredTimeSlot,
          };
        }
        return req;
      })
    );

    if (isSupabaseConfigured() && supabase) {
      updateServiceRequestInSupabase(requestId, matchedTicket, {
        status,
        admin_notes: notes,
        assigned_technician: assignedTech,
        preferred_date: preferredDate,
        preferred_time: preferredTimeSlot,
      }).then(({ error }) => {
        if (error) console.error('Supabase service request update error:', error.message);
      });
    }

    addActivityLog({
      actionType: 'service',
      title: `Service Ticket Updated: ${matchedTicket || requestId}`,
      details: `Status -> ${status}${assignedTech ? ` • Technician: ${assignedTech}` : ''}${preferredDate ? ` • Scheduled: ${preferredDate}` : ''}`,
      severity: status === 'completed' || status === 'scheduled' ? 'success' : 'info',
    });
    showToast('Service request updated successfully!');
  };

  // Customer Authentication via Supabase Auth (never trusts client-side role elevation)
  const login = async (
    emailOrPhone: string,
    pass: string
  ): Promise<{ success: boolean; message: string; role?: 'admin' | 'customer' }> => {
    const cleanEmail = emailOrPhone.trim();
    if (!cleanEmail || !pass) {
      return { success: false, message: 'Please enter your email address and password.' };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        message: 'Supabase authentication is required to sign in securely. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    const res = await signInCustomerWithSupabase(cleanEmail, pass);
    if (!res.success || !res.user || !res.profile) {
      return { success: false, message: res.message || 'Invalid email or password.' };
    }

    const account: UserAccount = {
      id: res.profile.id,
      fullName: res.profile.fullName,
      email: res.profile.email,
      phone: res.profile.phone,
      role: res.role || 'customer',
      addresses: [],
      defaultAddress: res.profile.defaultAddress,
      createdAt: res.profile.createdAt
        ? String(res.profile.createdAt).split('T')[0]
        : new Date().toISOString().split('T')[0],
    };

    setCurrentUser(account);
    const verifiedAdmin = res.role === 'admin';
    setIsAdmin(verifiedAdmin);

    if (verifiedAdmin) {
      await loadAdminScopedData();
      showToast(`Welcome back, ${account.fullName}! Redirecting to Admin Control Center.`);
      return { success: true, message: 'Admin sign in successful', role: 'admin' };
    } else {
      await loadCustomerScopedData(account.id);
      showToast(`Welcome back, ${account.fullName}!`);
      return { success: true, message: 'Login successful', role: 'customer' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    const res = await signInCustomerWithGoogleOAuth();
    if (!res.success) {
      return {
        success: false,
        message: res.message || 'Unable to sign in with Google.',
      };
    }
    return { success: true, message: 'Redirecting to Google authentication...' };
  };

  const adminLogin = async (email: string, pass: string) => {
    const res = await signInAdminWithSupabase(email, pass);

    if (!res.success || !res.user) {
      setIsAdmin(false);
      setCurrentUser(null);
      clearUserOwnedState();
      addActivityLog({
        actionType: 'security',
        title: 'Admin Login Verification Failed',
        details: `Supabase Auth rejected admin login for ${email}: ${res.message}`,
        adminName: 'Unverified Visitor',
        adminEmail: email,
        severity: 'alert',
      });
      return {
        success: false,
        message: res.message || 'Invalid credentials or missing administrator privileges in profiles.',
        isPrivilegeDenied: res.isPrivilegeDenied,
      };
    }

    const sessionInfo = await getVerifiedCurrentSession();
    const adminUser: UserAccount = {
      id: res.user.id,
      fullName: sessionInfo.profile?.fullName || res.user.user_metadata?.full_name || 'Administrator',
      email: sessionInfo.profile?.email || res.user.email || email.trim(),
      phone: sessionInfo.profile?.phone || '',
      role: 'admin',
      addresses: [],
      createdAt: res.user.created_at
        ? res.user.created_at.split('T')[0]
        : new Date().toISOString().split('T')[0],
    };

    setIsAdmin(true);
    setCurrentUser(adminUser);
    setAccessDeniedMessage(null);
    await loadAdminScopedData();

    addActivityLog({
      actionType: 'auth',
      title: 'Admin Login Successful',
      details: 'Verified administrator signed into Control Center via Supabase Auth & profiles.role.',
      adminName: adminUser.fullName,
      adminEmail: adminUser.email,
      severity: 'success',
    });
    showToast('Welcome back! Admin Control Center loaded.', 'success');
    return { success: true, message: 'Admin login successful' };
  };

  const adminSignUp = async (fullName: string, email: string, pass: string) => {
    const res = await signUpAdminWithSupabase(fullName, email, pass);
    return {
      success: res.success,
      message: res.message,
    };
  };

  const adminLogout = async () => {
    addActivityLog({
      actionType: 'auth',
      title: 'Admin Session Closed',
      details: 'Administrator safely signed out from Control Center.',
      adminName: currentUser?.fullName || 'Administrator',
      adminEmail: currentUser?.email || TARGET_ADMIN_EMAIL,
      severity: 'info',
    });
    await signOutAdminWithSupabase();
    setIsAdmin(false);
    setCurrentUser(null);
    clearUserOwnedState();
    showToast('Logged out of Admin Portal.', 'info');
  };

  const register = async (
    fullNameOrData: string | { fullName: string; email: string; phone: string; password?: string; role?: string },
    email?: string,
    phone?: string,
    pass?: string
  ): Promise<{ success: boolean; message: string; requiresEmailConfirmation?: boolean }> => {
    let nameVal = '';
    let emailVal = '';
    let phoneVal = '';
    let passVal = '';

    if (typeof fullNameOrData === 'string') {
      nameVal = fullNameOrData;
      emailVal = email || '';
      phoneVal = phone || '';
      passVal = pass || '';
    } else if (fullNameOrData && typeof fullNameOrData === 'object') {
      nameVal = fullNameOrData.fullName || '';
      emailVal = fullNameOrData.email || '';
      phoneVal = fullNameOrData.phone || '';
      passVal = fullNameOrData.password || '';
    }

    nameVal = nameVal.trim();
    emailVal = emailVal.trim().toLowerCase();
    phoneVal = phoneVal.trim();

    if (!nameVal || !emailVal || !passVal || passVal.length < 6) {
      return {
        success: false,
        message: 'Please provide your full name, valid email address, and a password of at least 6 characters.',
      };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        message: 'Supabase authentication is required to register an account securely.',
      };
    }

    const res = await signUpCustomerWithSupabase({
      fullName: nameVal,
      email: emailVal,
      phone: phoneVal,
      password: passVal,
    });

    if (!res.success) {
      return { success: false, message: res.message };
    }

    if (res.requiresEmailConfirmation) {
      showToast(res.message, 'info');
      return {
        success: true,
        requiresEmailConfirmation: true,
        message: res.message,
      };
    }

    if (res.user && res.profile) {
      const account: UserAccount = {
        id: res.profile.id,
        fullName: res.profile.fullName,
        email: res.profile.email,
        phone: res.profile.phone,
        role: 'customer',
        addresses: [],
        createdAt: res.profile.createdAt
          ? String(res.profile.createdAt).split('T')[0]
          : new Date().toISOString().split('T')[0],
      };
      setIsAdmin(false);
      setCurrentUser(account);
      await loadCustomerScopedData(account.id);
      showToast(`Account successfully created! Welcome, ${account.fullName}.`);
    }

    return { success: true, message: res.message };
  };

  const logout = async () => {
    await signOutWithSupabase();
    setCurrentUser(null);
    setIsAdmin(false);
    clearUserOwnedState();
    showToast('Signed out successfully', 'info');
  };

  const updateUserProfile = async (updated: Partial<UserAccount>) => {
    if (!currentUser) return;
    // Never allow client profile edits to alter user role
    const { role: _ignoredRole, id: _ignoredId, ...safeUpdates } = updated;
    const updatedUser = { ...currentUser, ...safeUpdates };
    setCurrentUser(updatedUser);

    if (isSupabaseConfigured() && supabase) {
      const res = await updateCustomerProfileInSupabase(currentUser.id, {
        fullName: safeUpdates.fullName,
        phone: safeUpdates.phone,
        defaultAddress: safeUpdates.defaultAddress,
      });
      if (!res.success) {
        showToast(`Could not save profile changes: ${res.error}`, 'error');
        return;
      }
    }
    showToast('Profile details updated successfully!');
  };

  // Product CRUD
  const addProduct = async (productData: Omit<Product, 'id'>) => {
    let resolvedId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'prod-' + Date.now();

    // Direct Supabase sync using audited clean column names (Postgres generates UUID)
    if (isSupabaseConfigured() && supabase) {
      try {
        const res = await insertSupabaseProduct({
          name: productData.name,
          category: productData.category,
          price: productData.price,
          stock: productData.stock,
          image_url: productData.images[0] || '',
          description: productData.description || productData.shortDescription,
          is_active: true,
        });
        if (res.success && Array.isArray(res.data) && res.data[0]?.id) {
          resolvedId = String(res.data[0].id);
        }
      } catch (err: any) {
        console.error('[StoreContext addProduct Error]:', err);
      }
    }

    const newProduct: Product = {
      ...productData,
      id: resolvedId,
    };

    setProducts((prev) => [newProduct, ...prev]);

    addActivityLog({
      actionType: 'product',
      title: `Product Added: ${newProduct.name}`,
      details: `New catalog item added. SKU: ${newProduct.specifications?.sku || 'N/A'}. Price: ₦${newProduct.price.toLocaleString()} (Stock: ${newProduct.stock})`,
      severity: 'info',
    });
    showToast(`Product "${newProduct.name}" added successfully!`);
    return newProduct;
  };

  const updateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

    if (isSupabaseConfigured() && supabase) {
      try {
        await updateSupabaseProduct(updated.id, {
          name: updated.name,
          category: updated.category,
          price: updated.price,
          stock: updated.stock,
          image_url: updated.images[0] || '',
          description: updated.description || updated.shortDescription,
          is_active: true,
        });
      } catch (err: any) {
        console.error('[StoreContext updateProduct Error]:', err);
      }
    }

    addActivityLog({
      actionType: 'product',
      title: `Product Modified: ${updated.name}`,
      details: `Updated catalog item. Price: ₦${updated.price.toLocaleString()} • Stock: ${updated.stock} units • Category: ${updated.category}`,
      severity: 'info',
    });
    showToast(`Product "${updated.name}" updated!`);
  };

  const deleteProduct = async (id: string) => {
    const item = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('product_gallery').delete().eq('product_id', id);
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase product delete notice:', err);
      }
    }

    addActivityLog({
      actionType: 'product',
      title: `Product Deleted: ${item?.name || id}`,
      details: `Product removed from inventory catalog and live storefront.`,
      severity: 'warning',
    });
    showToast('Product deleted from inventory.', 'info');
  };

  const deleteMultipleProducts = async (ids: string[]) => {
    if (ids.length === 0) return;
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('product_gallery').delete().in('product_id', ids);
        await supabase.from('products').delete().in('id', ids);
      } catch (err) {
        console.warn('Supabase bulk product delete notice:', err);
      }
    }

    addActivityLog({
      actionType: 'product',
      title: `Bulk Deletion: ${ids.length} Products Removed`,
      details: `Administrator bulk deleted ${ids.length} items from database catalog.`,
      severity: 'warning',
    });
    showToast(`Deleted ${ids.length} product(s) from inventory.`, 'info');
  };

  // Category CRUD
  const addCategory = async (catData: Omit<Category, 'id'> & { id?: string }) => {
    const cleanName = catData.name.trim();
    const cleanSlug = slugifyCategoryName(catData.slug || cleanName) || `category-${Date.now()}`;
    const newCat: Category = {
      ...catData,
      id: catData.id || `cat-${cleanSlug}`,
      name: cleanName,
      slug: cleanSlug,
      description: '',
      image: catData.image?.trim() || resolveCategoryImage(cleanName, cleanSlug),
      iconName: catData.iconName || 'Sparkles',
      productCount: products.filter((p) => matchesCategoryFilter(p.category, cleanName)).length,
      isPopular: true,
    };

    setCategories((prev) => {
      const updated = [...prev.filter((c) => c.id !== newCat.id), newCat];
      saveStored(STORAGE_KEYS.CATEGORIES, updated);
      return updated;
    });

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('categories').upsert(
          {
            id: newCat.id,
            name: newCat.name,
            slug: newCat.slug,
            description: '',
            icon: newCat.image || newCat.iconName,
            item_count: newCat.productCount || 0,
          },
          { onConflict: 'id' }
        );
        if (error) {
          console.error('Supabase category insert error:', error.message);
          showToast(`Saved locally. Supabase notice: ${error.message}`, 'info');
          return newCat;
        }
      } catch (err) {
        console.warn('Supabase category insert notice:', err);
      }
    }

    addActivityLog({
      actionType: 'settings',
      title: `Category Created: ${newCat.name}`,
      details: `Added main storefront category "${newCat.name}" (/${newCat.slug}).`,
      severity: 'info',
    });
    showToast(`Category "${newCat.name}" created!`);
    return newCat;
  };

  const updateCategory = async (updated: Category) => {
    const previous = categories.find((c) => c.id === updated.id);
    const cleanName = updated.name.trim();
    const cleanSlug = slugifyCategoryName(updated.slug || cleanName) || updated.slug;
    const normalizedCategory: Category = {
      ...updated,
      name: cleanName,
      slug: cleanSlug,
      description: '',
      image: updated.image?.trim() || resolveCategoryImage(cleanName, cleanSlug),
    };

    setCategories((prev) => {
      const next = prev.map((c) => (c.id === normalizedCategory.id ? normalizedCategory : c));
      saveStored(STORAGE_KEYS.CATEGORIES, next);
      return next;
    });

    // Preserve product assignments if a main category was renamed
    if (previous && previous.name !== cleanName) {
      setProducts((prev) =>
        prev.map((p) =>
          p.category.toLowerCase() === previous.name.toLowerCase()
            ? { ...p, category: cleanName }
            : p
        )
      );
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('categories').upsert(
          {
            id: normalizedCategory.id,
            name: normalizedCategory.name,
            slug: normalizedCategory.slug,
            description: '',
            icon: normalizedCategory.image || normalizedCategory.iconName,
            item_count: normalizedCategory.productCount || 0,
          },
          { onConflict: 'id' }
        );
        if (error) {
          console.error('Supabase category update error:', error.message);
          showToast(`Updated locally. Supabase notice: ${error.message}`, 'info');
          return;
        }

        if (previous && previous.name !== cleanName) {
          await supabase
            .from('products')
            .update({ category: cleanName })
            .eq('category', previous.name);
        }
      } catch (err) {
        console.warn('Supabase category update notice:', err);
      }
    }

    addActivityLog({
      actionType: 'settings',
      title: `Category Updated: ${normalizedCategory.name}`,
      details: `Updated category "${normalizedCategory.name}" name/image.`,
      severity: 'info',
    });
    showToast(`Category "${normalizedCategory.name}" updated!`);
  };

  const deleteCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveStored(STORAGE_KEYS.CATEGORIES, next);
      return next;
    });

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
          console.warn('Supabase category delete notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase category delete notice:', err);
      }
    }

    if (target) {
      addActivityLog({
        actionType: 'settings',
        title: `Category Removed: ${target.name}`,
        details: `Removed category "${target.name}" while preserving all existing products.`,
        severity: 'warning',
      });
    }
    showToast('Category deleted. Existing products remain preserved.', 'info');
  };

  const syncMainCategoriesToSupabase = async (): Promise<boolean> => {
    const updatedList: Category[] = INITIAL_CATEGORIES.map((initCat) => {
      const existing = categories.find((c) => c.id === initCat.id || c.slug === initCat.slug);
      return {
        ...initCat,
        name: existing?.name || initCat.name,
        image: existing?.image || initCat.image,
        description: '',
        productCount: products.filter((p) => matchesCategoryFilter(p.category, existing?.name || initCat.name)).length,
      };
    });

    setCategories(updatedList);
    saveStored(STORAGE_KEYS.CATEGORIES, updatedList);

    if (!isSupabaseConfigured() || !supabase) {
      showToast('7 main categories synchronized locally!', 'success');
      return true;
    }

    try {
      const rows = updatedList.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: '',
        icon: c.image || c.iconName,
        item_count: c.productCount,
      }));
      const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'id' });
      if (error) {
        console.error('Supabase sync main categories error:', error.message);
        showToast(`Synced locally. Supabase notice: ${error.message}`, 'info');
        return false;
      }
      showToast('7 main categories synchronized with Supabase!', 'success');
      return true;
    } catch (err: any) {
      console.warn('Supabase sync main categories notice:', err);
      return false;
    }
  };

  // Product Gallery Operations
  const addGalleryImagesToProduct = async (productId: string, imageUrls: string[], caption?: string, displayOrder: number = 0) => {
    const validUrls = imageUrls.map((u) => u.trim()).filter((u) => u.length > 0);
    if (validUrls.length === 0) return false;

    // 1. Update product images in state
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const currentImages = p.images || [];
          const updatedImages = Array.from(new Set([...currentImages, ...validUrls]));
          return {
            ...p,
            images: updatedImages,
          };
        }
        return p;
      })
    );

    // 2. Insert to Supabase product_gallery table & update products.gallery
    if (isSupabaseConfigured() && supabase) {
      try {
        await addImagesToProductGallery(productId, validUrls, caption, displayOrder);
        const prod = products.find((p) => p.id === productId);
        const allImages = Array.from(new Set([...(prod?.images || []), ...validUrls]));
        await supabase.from('products').update({ gallery: allImages }).eq('id', productId);
      } catch (err) {
        console.warn('Supabase gallery insert notice:', err);
      }
    }

    showToast(`Added ${validUrls.length} image(s) to product gallery!`, 'success');
    return true;
  };

  const deleteProductGalleryItem = async (galleryId: string, productId: string, imageUrl?: string) => {
    if (imageUrl) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              images: p.images.filter((img) => img !== imageUrl),
            };
          }
          return p;
        })
      );
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        if (galleryId) {
          await removeProductGalleryImage(galleryId);
        }
        if (imageUrl) {
          const prod = products.find((p) => p.id === productId);
          if (prod) {
            const remaining = prod.images.filter((img) => img !== imageUrl);
            await supabase.from('products').update({ gallery: remaining }).eq('id', productId);
          }
        }
      } catch (err) {
        console.warn('Supabase gallery delete notice:', err);
      }
    }

    showToast('Gallery image removed.', 'info');
    return true;
  };

  const deleteMultipleProductGalleryItems = async (
    items: { galleryId?: string; productId: string; imageUrl: string }[]
  ) => {
    if (items.length === 0) return true;

    // 1. Group by product to update state
    const productMap = new Map<string, string[]>();
    items.forEach((item) => {
      const existing = productMap.get(item.productId) || [];
      existing.push(item.imageUrl);
      productMap.set(item.productId, existing);
    });

    setProducts((prev) =>
      prev.map((p) => {
        const toRemove = productMap.get(p.id);
        if (toRemove && toRemove.length > 0) {
          return {
            ...p,
            images: p.images.filter((img) => !toRemove.includes(img)),
          };
        }
        return p;
      })
    );

    if (isSupabaseConfigured() && supabase) {
      try {
        const galleryIds = items.map((i) => i.galleryId).filter(Boolean) as string[];
        if (galleryIds.length > 0) {
          await supabase.from('product_gallery').delete().in('id', galleryIds);
        }
        // Also delete by image_url and product_id
        for (const [prodId, urls] of productMap.entries()) {
          await supabase
            .from('product_gallery')
            .delete()
            .eq('product_id', prodId)
            .in('image_url', urls);
          const currentProd = products.find((p) => p.id === prodId);
          if (currentProd) {
            const remaining = currentProd.images.filter((img) => !urls.includes(img));
            await supabase.from('products').update({ gallery: remaining }).eq('id', prodId);
          }
        }
      } catch (err) {
        console.warn('Supabase bulk gallery delete notice:', err);
      }
    }

    showToast(`Removed ${items.length} gallery image(s).`, 'info');
    return true;
  };

  const refreshCatalog = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { data: dbProducts, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      let latestProducts = products;
      if (!prodErr && Array.isArray(dbProducts)) {
        const mappedProducts: Product[] = dbProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug || p.id,
          brand: p.brand || 'AjmanTech',
          category: p.category || p.category_name || 'Chandeliers',
          price: Number(p.price),
          discountPrice: p.original_price ? Number(p.price) : undefined,
          stock: p.stock ?? 10,
          rating: p.rating ? Number(p.rating) : 5.0,
          reviewCount: p.review_count ?? 0,
          images: Array.isArray(p.gallery) && p.gallery.length > 0
            ? p.gallery
            : [p.image_url || p.image || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=800&auto=format&fit=crop'],
          isFeatured: Boolean(p.is_featured),
          isBestSeller: Boolean(p.is_best_seller),
          isNewArrival: Boolean(p.is_new),
          tags: Array.isArray(p.tags) ? p.tags : ['lighting'],
          shortDescription: p.short_description || (p.description ? p.description.slice(0, 120) : p.name),
          description: p.description || p.full_description || p.short_description || p.name,
          specifications: {
            wattage: p.specifications?.wattage || p.voltage || '48W',
            voltage: p.voltage || '220V - 240V',
            colorTemperature: p.specifications?.colorTemperature || '3000K - 6500K',
            warranty: p.warranty || '1 Year',
            dimensions: p.specifications?.dimensions,
            material: p.specifications?.material,
          },
        }));
        latestProducts = mappedProducts;
        setProducts(mappedProducts);
      }

      const { data: dbCats, error: catErr } = await supabase.from('categories').select('*');
      if (!catErr && Array.isArray(dbCats)) {
        setCategories(mergeWithMainCategories(dbCats, latestProducts));
      }
      showToast('Catalog synchronized with Supabase!', 'success');
    } catch (e) {
      console.warn('Catalog refresh error:', e);
    }
  };

  // Reviews
  const addReview = (reviewData: Omit<Review, 'id' | 'date'>) => {
    const newRev: Review = {
      ...reviewData,
      id: 'rev-' + Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
    setReviews((prev) => [newRev, ...prev]);

    // Recalculate product rating
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === reviewData.productId) {
          const prodReviews = [...reviews.filter((r) => r.productId === p.id), newRev];
          const avgRating = Number(
            (prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length).toFixed(1)
          );
          return {
            ...p,
            rating: avgRating,
            reviewCount: prodReviews.length,
          };
        }
        return p;
      })
    );

    showToast('Thank you! Your product review has been published.');
  };

  const getProductReviews = (productId: string) => {
    return reviews.filter((r) => r.productId === productId);
  };

  const updateStoreSettings = async (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    if (isAdmin && isSupabaseConfigured() && supabase) {
      const { error } = await upsertStoreSettingsInSupabase(newSettings);
      if (error) {
        console.warn('Supabase store settings upsert notice:', error.message);
      }
    }
    addActivityLog({
      actionType: 'settings',
      title: 'Store Settings Saved',
      details: `Updated system settings, WhatsApp helpline (${newSettings.whatsappNumber}), delivery fees, and bank details.`,
      severity: 'info',
    });
    showToast('Store settings updated successfully!');
  };

  return (
    <StoreContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedProductId,
        setSelectedProductId,
        selectedServiceId,
        setSelectedServiceId,
        selectedCategorySlug,
        setSelectedCategorySlug,
        navigationState,
        searchQuery,
        setSearchQuery,
        navigateTo,

        quickViewProduct,
        setQuickViewProduct,
        isCartOpen,
        setIsCartOpen,
        isServiceModalOpen,
        setIsServiceModalOpen,
        serviceModalDefaultType,
        openServiceModal,
        activeOrderForSuccess,
        setActiveOrderForSuccess,

        products,
        categories,
        services,
        projects,
        reviews,
        faqs,
        storeSettings,
        updateStoreSettings,

        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,

        wishlist,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        wishlistCount,

        customerAddresses,
        addCustomerAddress,
        updateCustomerAddress,
        deleteCustomerAddress,
        setDefaultCustomerAddress,

        adminCustomers,
        refreshAdminCustomerData,

        orders,
        createOrder,
        updateOrderStatus,
        rejectOrder,
        updateOrderPaymentStatus,
        getOrderByIdOrNumber,
        trackOrderSecure,
        searchAdminOrders,

        serviceRequests,
        createServiceRequest,
        updateServiceRequestStatus,

        currentUser,
        login,
        loginWithGoogle,
        register,
        logout,
        adminLogin,
        adminSignUp,
        adminLogout,
        updateUserProfile,
        isAdmin,
        setIsAdmin,
        isAuthChecking,

        addProduct,
        updateProduct,
        deleteProduct,
        deleteMultipleProducts,
        addCategory,
        updateCategory,
        deleteCategory,
        syncMainCategoriesToSupabase,

        addGalleryImagesToProduct,
        deleteProductGalleryItem,
        deleteMultipleProductGalleryItems,
        refreshCatalog,

        // Activity Audit Logs
        activityLogs,
        addActivityLog,
        clearActivityLogs,


        addReview,
        getProductReviews,

        formatNaira,
        toast,
        showToast,
        accessDeniedMessage,
        clearAccessDeniedMessage,
        openWhatsApp,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
