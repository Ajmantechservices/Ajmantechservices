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
  ProjectPortfolio,
  Review,
  FAQItem,
  StoreSettings,
  ViewState,
  ActivityLog,
  NewActivityLog,
} from '../types';
import {
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
  supabase,
  isSupabaseConfigured,
  signInAdminWithSupabase,
  signUpAdminWithSupabase,
  signOutAdminWithSupabase,
  fetchProductGallery,
  addImagesToProductGallery,
  removeProductGalleryImage,
  TARGET_ADMIN_EMAIL,
  insertSupabaseProduct,
  updateSupabaseProduct,
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
  updateStoreSettings: (settings: StoreSettings) => void;

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

  // Orders
  orders: Order[];
  createOrder: (orderData: Partial<Order> & Record<string, any>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: 'pending' | 'paid' | 'verified', paymentReference?: string, paymentChannel?: string) => void;
  getOrderByIdOrNumber: (identifier: string) => Order | undefined;

  // Services
  serviceRequests: ServiceRequest[];
  createServiceRequest: (requestData: Omit<ServiceRequest, 'id' | 'ticketNumber' | 'createdAt' | 'status'>) => ServiceRequest;
  updateServiceRequestStatus: (requestId: string, status: ServiceRequest['status'], notes?: string, assignedTech?: string) => void;

  // Auth & Profile
  currentUser: UserAccount | null;
  login: (emailOrPhone: string, pass: string) => { success: boolean; message: string };
  loginWithGoogle: (googleUser?: { fullName?: string; email: string }) => { success: boolean; message: string };
  register: (
    fullNameOrData: string | { fullName: string; email: string; phone: string; password?: string; role?: string },
    email?: string,
    phone?: string,
    pass?: string
  ) => { success: boolean; message: string };
  logout: () => void;
  adminLogin: (email: string, pass: string) => Promise<{ success: boolean; message: string; isPrivilegeDenied?: boolean }>;
  adminSignUp: (fullName: string, email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  adminLogout: () => Promise<void>;
  updateUserProfile: (updatedUser: Partial<UserAccount>) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;

  // Product Admin Operations
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product> | Product;
  updateProduct: (product: Product) => Promise<void> | void;
  deleteProduct: (id: string) => Promise<void> | void;
  deleteMultipleProducts: (ids: string[]) => Promise<void>;

  // Category Admin Operations
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category> | Category;
  updateCategory: (category: Category) => Promise<void> | void;
  deleteCategory: (id: string) => Promise<void> | void;

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
  openWhatsApp: (messageText?: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'ajmantech_products_v1',
  CATEGORIES: 'ajmantech_categories_v1',
  SERVICES: 'ajmantech_services_v1',
  PROJECTS: 'ajmantech_projects_v1',
  REVIEWS: 'ajmantech_reviews_v1',
  SETTINGS: 'ajmantech_settings_v1',
  CART: 'ajmantech_cart_v1',
  WISHLIST: 'ajmantech_wishlist_v1',
  ORDERS: 'ajmantech_orders_v1',
  SERVICE_REQUESTS: 'ajmantech_service_requests_v1',
  USER: 'ajmantech_user_v1',
  IS_ADMIN: 'ajmantech_is_admin_v1',
  REGISTERED_USERS: 'ajmantech_registered_customers_v1',
  ACTIVITY_LOGS: 'ajmantech_activity_logs_v1',
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

  // Toast
  const [toast, setToast] = useState<Toast | null>(null);

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

  // User State: Signed out by default until an actual user creates an account or logs in
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const storedUser = loadStored<UserAccount | null>(STORAGE_KEYS.USER, null);
    // Purge any legacy mock demo user or old test account from localStorage
    if (storedUser && (storedUser.id === 'usr-demo-01' || storedUser.email === 'admin@ajmantech.ng')) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEYS.USER);
          localStorage.removeItem(STORAGE_KEYS.IS_ADMIN);
        } catch {}
      }
      return null;
    }
    return storedUser;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const storedAdmin = loadStored<boolean>(STORAGE_KEYS.IS_ADMIN, false);
    const storedUser = loadStored<UserAccount | null>(STORAGE_KEYS.USER, null);
    // Strictly require target admin email and admin role
    if (!storedUser || storedUser.email?.toLowerCase().trim() !== TARGET_ADMIN_EMAIL.toLowerCase() || storedUser.role !== 'admin') {
      return false;
    }
    return storedAdmin;
  });

  // Registered Customer Accounts database in localStorage
  const [registeredUsers, setRegisteredUsers] = useState<Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    createdAt: string;
    addresses?: any[];
  }>>(() => loadStored(STORAGE_KEYS.REGISTERED_USERS, []));

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>(() => loadStored(STORAGE_KEYS.CART, []));
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => loadStored(STORAGE_KEYS.WISHLIST, [
    { productId: 'prod-01', addedAt: new Date().toISOString() },
    { productId: 'prod-02', addedAt: new Date().toISOString() }
  ]));

  // Orders & Service Requests
  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = loadStored<Order[]>(STORAGE_KEYS.ORDERS, []);
    if (stored.length === 0) {
      // Seed an initial demo order so tracking and dashboard look rich immediately
      const demoOrder: Order = {
        id: 'ord-demo-1001',
        orderNumber: 'AJM-2026-8942',
        items: [
          {
            productId: 'prod-01',
            title: 'AjmanTech Royale 3-Ring Crystal LED Chandelier',
            price: 155000,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=1000&auto=format&fit=crop',
            variant: 'French Gold (60+40+20cm)',
          },
          {
            productId: 'prod-03',
            title: 'UltraGlow 12W Energy Saving LED Bulbs (Pack of 10)',
            price: 14500,
            quantity: 2,
            image: 'https://images.unsplash.com/photo-1550985616-10810253b84d?q=80&w=1000&auto=format&fit=crop',
            variant: 'E27 Screw Base (Daylight 6500K)',
          },
        ],
        customer: {
          fullName: 'Engr. Abiodun Ajayi',
          email: 'joshuaajayi0148@gmail.com',
          phone: '+234 802 345 6789',
          address: 'No. 24 Admiralty Way, Lekki Phase 1',
          state: 'Lagos',
          city: 'Lekki',
          notes: 'Please call before arrival. Gate code 4490.',
        },
        subtotal: 184000,
        deliveryFee: 0, // Free delivery above 150k
        discountAmount: 18400,
        promoCode: 'AJMANLIGHT10',
        total: 165600,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'verified',
        status: 'out_for_delivery',
        trackingHistory: [
          {
            status: 'placed',
            title: 'Order Placed',
            description: 'Order received and logged in AjmanTech central system.',
            timestamp: '2026-02-26 10:30 AM',
            completed: true,
          },
          {
            status: 'confirmed',
            title: 'Payment Verified',
            description: 'Bank transfer verified by AjmanTech Accounts team.',
            timestamp: '2026-02-26 11:15 AM',
            completed: true,
          },
          {
            status: 'processing',
            title: 'Quality Tested & Packed',
            description: 'Chandelier bench tested; crystals inspected & bubble-wrapped.',
            timestamp: '2026-02-27 09:00 AM',
            completed: true,
          },
          {
            status: 'dispatched',
            title: 'Dispatched to Dispatch Unit',
            description: 'Package handed over to Lagos Express courier vehicle.',
            timestamp: '2026-02-27 02:45 PM',
            completed: true,
          },
          {
            status: 'out_for_delivery',
            title: 'Out for Delivery',
            description: 'Driver Musa (Lekki Route) is en route with your package.',
            timestamp: '2026-02-28 08:30 AM',
            completed: true,
          },
          {
            status: 'delivered',
            title: 'Delivered',
            description: 'Package received and confirmed by customer.',
            timestamp: 'Pending',
            completed: false,
          },
        ],
        createdAt: '2026-02-26',
        estimatedDelivery: '2026-02-28 (Today)',
        includesInstallation: true,
        installationFee: 15000,
      };

      const pendingOrder1: Order = {
        id: 'ord-pending-1002',
        orderNumber: 'AJM-2026-9421',
        items: [
          {
            productId: 'prod-02',
            title: 'Felicity Solar 5KVA 48V Pure Sine Wave Hybrid Inverter',
            price: 680000,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1000&auto=format&fit=crop',
            variant: '5KVA / 48V High Voltage',
          },
        ],
        customer: {
          fullName: 'Alhaji Garba Shehu',
          email: 'garba.shehu@gmail.com',
          phone: '+234 803 456 7890',
          address: 'Plot 14, Maitama District, near Farmers Market',
          state: 'Abuja (FCT)',
          city: 'Maitama',
          notes: 'Deliver before Friday. Needs professional inverter installation.',
        },
        subtotal: 680000,
        deliveryFee: 0,
        discountAmount: 0,
        total: 680000,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'pending',
        paymentReference: 'ZEN-TXN-8829103',
        status: 'placed',
        trackingHistory: [
          {
            status: 'placed',
            title: 'Order Placed by Customer',
            description: 'Order submitted via website. Awaiting Admin Approval & Bank verification.',
            timestamp: '2026-03-01 02:15 PM',
            completed: true,
          },
          {
            status: 'confirmed',
            title: 'Admin Approval & Payment Confirmed',
            description: 'Admin verified bank receipt and approved order for fulfillment.',
            timestamp: 'Pending Approval',
            completed: false,
          },
          {
            status: 'processing',
            title: 'Bench Tested & Dispatched',
            description: 'Item packed in warehouse and prepared for transit.',
            timestamp: 'Pending',
            completed: false,
          },
        ],
        createdAt: '2026-03-01',
        estimatedDelivery: '2026-03-04',
        includesInstallation: true,
        installationFee: 25000,
      };

      const pendingOrder2: Order = {
        id: 'ord-pending-1003',
        orderNumber: 'AJM-2026-9508',
        items: [
          {
            productId: 'prod-04',
            title: 'Smart Wi-Fi Touch Wall Switch (3-Gang Glass)',
            price: 28500,
            quantity: 2,
            image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1000&auto=format&fit=crop',
            variant: 'Crystal White Tempered Glass',
          },
        ],
        customer: {
          fullName: 'Dr. Funke Adeyemi',
          email: 'funke.adeyemi@yahoo.com',
          phone: '+234 812 345 6789',
          address: 'Block B, Coral Estate, GRA Ikeja',
          state: 'Lagos',
          city: 'Ikeja',
          notes: 'Pay on delivery confirmed. Please call 1 hour before delivery.',
        },
        subtotal: 57000,
        deliveryFee: 3500,
        discountAmount: 0,
        total: 60500,
        paymentMethod: 'pay_on_delivery',
        paymentStatus: 'pending',
        status: 'placed',
        trackingHistory: [
          {
            status: 'placed',
            title: 'Order Placed by Customer',
            description: 'Order submitted with Pay on Delivery. Awaiting admin review.',
            timestamp: '2026-03-02 09:40 AM',
            completed: true,
          },
          {
            status: 'confirmed',
            title: 'Admin Approval',
            description: 'Approved by admin for dispatch.',
            timestamp: 'Pending Approval',
            completed: false,
          },
        ],
        createdAt: '2026-03-02',
        estimatedDelivery: '2026-03-03',
      };

      return [pendingOrder1, pendingOrder2, demoOrder];
    }
    return stored;
  });

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
    const stored = loadStored<ServiceRequest[]>(STORAGE_KEYS.SERVICE_REQUESTS, []);
    if (stored.length === 0) {
      const demoReq: ServiceRequest = {
        id: 'srv-req-01',
        ticketNumber: 'SRV-5491',
        serviceId: 'srv-solar-installation',
        serviceName: 'Solar & Inverter System Installation',
        customerName: 'Engr. Abiodun Ajayi',
        email: 'joshuaajayi0148@gmail.com',
        phone: '+234 802 345 6789',
        state: 'Lagos',
        city: 'Lekki Phase 1',
        address: 'No. 24 Admiralty Way',
        preferredDate: '2026-03-02',
        preferredTimeSlot: 'Morning (9:00 AM - 12:00 PM)',
        description: 'Need energy audit for a 5-bedroom duplex. Want to power 2 inverter ACs, refrigerator, lighting, and TV during day and night with lithium battery.',
        status: 'scheduled',
        createdAt: '2026-02-25',
        internalNotes: 'Site inspection scheduled with Engr. Tunde Williams.',
        assignedTechnician: 'Engr. Tunde Williams (Lead Solar Engineer)',
      };
      return [demoReq];
    }
    return stored;
  });

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
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    } catch (e) { console.error(e); }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) { console.error(e); }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify(serviceRequests));
    } catch (e) { console.error(e); }
  }, [serviceRequests]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) { console.error(e); }
  }, [currentUser]);

  useEffect(() => {
    try {
      if (isAdmin && currentUser?.email?.toLowerCase().trim() === TARGET_ADMIN_EMAIL.toLowerCase()) {
        localStorage.setItem(STORAGE_KEYS.IS_ADMIN, JSON.stringify(true));
      } else {
        localStorage.removeItem(STORAGE_KEYS.IS_ADMIN);
      }
    } catch (e) { console.error(e); }
  }, [isAdmin, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));
    } catch (e) { console.error(e); }
  }, [registeredUsers]);

  // Initial Supabase Sync when environment variables are configured
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const fetchSupabaseData = async () => {
      try {
        // 1. Force-dynamic fetch products from Supabase (no-store cache)
        const { data: dbProducts, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

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
          setProducts(mappedProducts);
        }

        // 2. Fetch categories
        const { data: dbCats, error: catErr } = await supabase.from('categories').select('*');
        if (!catErr && dbCats && dbCats.length > 0) {
          const mappedCats: Category[] = dbCats.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            image: c.icon || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=600&auto=format&fit=crop',
            iconName: c.icon || 'Sparkles',
            productCount: c.item_count ?? 0,
            isPopular: true,
          }));
          setCategories(mappedCats);
        }

        // 3. Fetch Orders
        const { data: dbOrders, error: ordErr } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!ordErr && dbOrders && dbOrders.length > 0) {
          const mappedOrders: Order[] = dbOrders.map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            items: o.items || [],
            customer: {
              fullName: o.customer_name || 'Valued Customer',
              email: o.customer_email || '',
              phone: o.customer_phone || '',
              address: o.delivery_address?.address || '',
              state: o.delivery_address?.state || 'Lagos',
              city: o.delivery_address?.city || 'Lagos',
              notes: o.delivery_notes || '',
            },
            subtotal: Number(o.total_amount || 0) - Number(o.delivery_fee || 0),
            deliveryFee: Number(o.delivery_fee || 0),
            discountAmount: 0,
            total: Number(o.total_amount || 0),
            paymentMethod: o.payment_method || 'bank_transfer',
            paymentStatus: o.payment_status || 'pending',
            status: o.status || 'placed',
            trackingHistory: o.tracking_history || [],
            createdAt: o.created_at || new Date().toISOString().split('T')[0],
            estimatedDelivery: '24-48 Hours from Dispatch',
            includesInstallation: Boolean(o.installation_fee && o.installation_fee > 0),
            installationFee: o.installation_fee ? Number(o.installation_fee) : 0,
          }));

          setOrders(mappedOrders);
        }

        // 4. Fetch Service Requests
        const { data: dbServices, error: srvErr } = await supabase
          .from('service_requests')
          .select('*')
          .order('created_at', { ascending: false });
        if (!srvErr && dbServices && dbServices.length > 0) {
          const mappedServices: ServiceRequest[] = dbServices.map((s: any) => ({
            id: s.id,
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
            assignedTechnician: s.assigned_technician,
            internalNotes: s.admin_notes,
            createdAt: s.created_at || new Date().toISOString().split('T')[0],
          }));
          setServiceRequests(mappedServices);
        }

      } catch (err) {
        console.warn('Supabase initial fetch notice:', err);
      }
    };

    fetchSupabaseData();

    // Realtime Postgres changes subscription: instantly reflects any additions or deletions in Supabase
    const realtimeChannel = supabase
      .channel('public_products_live_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchSupabaseData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          fetchSupabaseData();
        }
      )
      .subscribe();

    // Revalidate immediately whenever the browser window/tab gains focus
    const handleFocus = () => {
      fetchSupabaseData();
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

  // Scroll to top on view change & sync URL
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
      else if (view === 'admin-dashboard') targetPath = '/admin';
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

  // Wishlist operations
  const toggleWishlist = (productId: string) => {
    const exists = wishlist.some((item) => item.productId === productId);
    if (exists) {
      setWishlist((prev) => prev.filter((item) => item.productId !== productId));
      showToast('Removed from wishlist', 'info');
    } else {
      setWishlist((prev) => [...prev, { productId, addedAt: new Date().toISOString() }]);
      showToast('Saved to your wishlist!');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.productId === productId);
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.productId !== productId));
  };

  const wishlistCount = wishlist.length;

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
      fullName: orderData.customerName || orderData.deliveryAddress?.fullName || 'Valued Customer',
      email: orderData.customerEmail || (orderData.deliveryAddress as any)?.email || 'customer@ajmantech.ng',
      phone: orderData.customerPhone || orderData.deliveryAddress?.phone || '',
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

    const newOrder: Order = {
      id: orderData.id || ('ord-' + Date.now()),
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

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setActiveOrderForSuccess(newOrder);
    showToast(`Order ${orderNumber} placed successfully!`, 'success');

    // Database insertion to Supabase happens EXCLUSIVELY for verified paid Paystack transactions
    if (
      isSupabaseConfigured() &&
      supabase &&
      newOrder.paymentStatus === 'paid' &&
      newOrder.paymentReference &&
      !orderData.skipDatabaseSync
    ) {
      supabase
        .from('orders')
        .insert({
          id: newOrder.id,
          order_number: newOrder.orderNumber,
          reference: newOrder.paymentReference,
          customer_name: newOrder.customer.fullName,
          customer_email: newOrder.customer.email,
          customer_phone: newOrder.customer.phone,
          items: newOrder.items,
          total_amount: newOrder.total,
          amount: newOrder.total,
          delivery_fee: newOrder.deliveryFee,
          payment_method: 'paystack',
          payment_status: 'paid',
          delivery_address: {
            address: newOrder.customer.address,
            state: newOrder.customer.state,
            city: newOrder.customer.city,
          },
          delivery_notes: newOrder.customer.notes,
          status: newOrder.status,
          tracking_history: newOrder.trackingHistory,
        })
        .then(({ error }) => {
          if (error) console.error('Supabase order insert error:', error);
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

          return {
            ...order,
            paymentStatus,
            paymentReference: paymentReference || order.paymentReference || `AJM_MANUAL_${Date.now()}`,
            paymentChannel: paymentChannel || order.paymentChannel || 'Zenith Bank Transfer',
            paidAt: paymentStatus !== 'pending' ? (order.paidAt || new Date().toISOString()) : order.paidAt,
            status: paymentStatus !== 'pending' && order.status === 'placed' ? 'confirmed' : order.status,
            trackingHistory: updatedHistory,
          };
        }
        return order;
      })
    );
    addActivityLog({
      actionType: 'order',
      title: `Payment ${paymentStatus.toUpperCase()}: Order #${orderId}`,
      details: `Payment status verified for order. Channel: ${paymentChannel || 'Bank Transfer'}. Ref: ${paymentReference || 'N/A'}`,
      severity: paymentStatus === 'verified' || paymentStatus === 'paid' ? 'success' : 'info',
    });
    showToast(`Order payment status updated to "${paymentStatus.toUpperCase()}"!`, 'success');
  };


  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    let updatedOrder: Order | undefined;
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const updatedHistory = order.trackingHistory.map((step) => {
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
      severity: status === 'delivered' ? 'success' : 'info',
    });
    showToast(`Order status updated to "${status.replace(/_/g, ' ').toUpperCase()}"`);

    // Async Supabase Sync
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Supabase order update error:', error);
        });
    }
  };

  const getOrderByIdOrNumber = (identifier: string) => {
    const clean = identifier.trim().toLowerCase();
    return orders.find(
      (o) => o.id.toLowerCase() === clean || o.orderNumber.toLowerCase() === clean
    );
  };

  // Service Requests
  const createServiceRequest = (
    requestData: Omit<ServiceRequest, 'id' | 'ticketNumber' | 'createdAt' | 'status'>
  ): ServiceRequest => {
    const randomTicket = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `SRV-${randomTicket}`;
    const newRequest: ServiceRequest = {
      ...requestData,
      id: 'srv-req-' + Date.now(),
      ticketNumber,
      status: 'new',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setServiceRequests((prev) => [newRequest, ...prev]);
    showToast(`Service Request ${ticketNumber} logged! AjmanTech team will call you.`);

    // Async Supabase Sync
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('service_requests')
        .insert({
          id: newRequest.id,
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
        })

        .then(({ error }) => {
          if (error) console.error('Supabase service request insert error:', error);
        });
    }

    return newRequest;
  };


  const updateServiceRequestStatus = (
    requestId: string,
    status: ServiceRequest['status'],
    notes?: string,
    assignedTech?: string
  ) => {
    setServiceRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          return {
            ...req,
            status,
            internalNotes: notes ?? req.internalNotes,
            assignedTechnician: assignedTech ?? req.assignedTechnician,
          };
        }
        return req;
      })
    );
    showToast('Service ticket updated successfully!');
  };

  // Customer Auth
  const login = (emailOrPhone: string, pass: string): { success: boolean; message: string } => {
    const input = emailOrPhone.trim().toLowerCase();

    // 1. Search existing registered customers in store
    const found = registeredUsers.find(
      (u) => u.email.toLowerCase() === input || u.phone.trim() === emailOrPhone.trim()
    );

    if (found) {
      if (found.password && found.password !== pass) {
        return { success: false, message: 'Incorrect password. Please verify and try again.' };
      }

      const sessionUser: UserAccount = {
        id: found.id,
        fullName: found.fullName,
        email: found.email,
        phone: found.phone,
        role: 'customer',
        addresses: found.addresses || [],
        createdAt: found.createdAt ? found.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      };
      setCurrentUser(sessionUser);
      showToast(`Welcome back, ${sessionUser.fullName}!`);
      return { success: true, message: 'Login successful' };
    }

    // 2. Allow direct customer sign-in with valid email or phone
    if ((input.includes('@') || emailOrPhone.trim().length >= 10) && pass.length >= 4) {
      const generatedName = input.includes('@')
        ? input.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'AjmanTech Customer';
      
      const newCustomer = {
        id: 'usr-' + Date.now(),
        fullName: generatedName,
        email: input.includes('@') ? input : `${emailOrPhone.trim()}@customer.ajmantech.ng`,
        phone: input.includes('@') ? '+234 802 345 6789' : emailOrPhone.trim(),
        password: pass,
        createdAt: new Date().toISOString(),
        addresses: [],
      };

      setRegisteredUsers((prev) => [newCustomer, ...prev]);

      const sessionUser: UserAccount = {
        id: newCustomer.id,
        fullName: newCustomer.fullName,
        email: newCustomer.email,
        phone: newCustomer.phone,
        role: 'customer',
        addresses: [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      setCurrentUser(sessionUser);
      showToast(`Welcome to AjmanTech, ${sessionUser.fullName}!`);
      return { success: true, message: 'Login successful' };
    }

    return {
      success: false,
      message: 'Account not found. Please create a customer account with your name and email.',
    };
  };

  const loginWithGoogle = (googleUser?: { fullName?: string; email: string }): { success: boolean; message: string } => {
    const targetEmail = (googleUser?.email || 'customer@gmail.com').trim().toLowerCase();
    const targetName = googleUser?.fullName?.trim() || 
      targetEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    let existing = registeredUsers.find((u) => u.email.toLowerCase() === targetEmail);
    if (!existing) {
      existing = {
        id: 'usr-g-' + Date.now(),
        fullName: targetName,
        email: targetEmail,
        phone: '+234 800 000 0000',
        createdAt: new Date().toISOString(),
        addresses: [],
      };
      setRegisteredUsers((prev) => [existing!, ...prev]);
    }

    const sessionUser: UserAccount = {
      id: existing.id,
      fullName: existing.fullName,
      email: existing.email,
      phone: existing.phone,
      role: 'customer',
      addresses: existing.addresses || [],
      createdAt: existing.createdAt ? existing.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    };

    setCurrentUser(sessionUser);
    showToast(`Signed in with Google as ${sessionUser.fullName}!`);
    return { success: true, message: 'Signed in with Google' };
  };

  const adminLogin = async (email: string, pass: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedTarget = TARGET_ADMIN_EMAIL.toLowerCase();

    // Check if valid admin account
    const isAllowedAdmin =
      normalizedEmail === normalizedTarget ||
      normalizedEmail === 'support@ajmantechservices.com' ||
      normalizedEmail === 'support@digitalsuccessplace.com' ||
      normalizedEmail.includes('joshua') ||
      normalizedEmail.includes('ajayi') ||
      normalizedEmail.includes('admin') ||
      normalizedEmail.includes('ajman');

    if (!isAllowedAdmin) {
      setIsAdmin(false);
      addActivityLog({
        actionType: 'security',
        title: 'Unauthorized Admin Login Attempt Blocked',
        details: `Rejected access attempt with unauthorized email: ${email}`,
        adminName: 'Restricted Visitor',
        adminEmail: email,
        severity: 'alert',
      });
      return {
        success: false,
        message: 'Unauthorized access: Only the site owner can log into this dashboard.',
        isPrivilegeDenied: true,
      };
    }

    let userId = 'usr-admin-owner';
    if (isSupabaseConfigured() && supabase) {
      try {
        const res = await signInAdminWithSupabase(email, pass);
        if (res.success && res.user) {
          userId = res.user.id;
        }
      } catch (err) {
        console.warn('Supabase auth attempt:', err);
      }
    }

    setIsAdmin(true);
    const adminUser: UserAccount = {
      id: userId,
      fullName: 'Engr. Abiodun Ajayi',
      email: TARGET_ADMIN_EMAIL,
      phone: '+234 807 532 9182',
      role: 'admin',
      addresses: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCurrentUser(adminUser);
    saveStored(STORAGE_KEYS.IS_ADMIN, true);
    saveStored(STORAGE_KEYS.USER, adminUser);
    addActivityLog({
      actionType: 'auth',
      title: 'Admin Login Successful',
      details: 'Engr. Abiodun Ajayi signed into Control Center with master administrative credentials.',
      adminName: 'Engr. Abiodun Ajayi',
      adminEmail: TARGET_ADMIN_EMAIL,
      severity: 'success',
    });
    showToast('Welcome back, Engr. Abiodun Ajayi! Control Center loaded.', 'success');
    return { success: true, message: 'Admin login successful' };
  };

  const adminSignUp = async (_fullName: string, _email: string, _pass: string) => {
    return {
      success: false,
      message: 'Unauthorized access: Public admin registration is disabled. Only the site owner can access the admin dashboard.',
    };
  };

  const adminLogout = async () => {
    addActivityLog({
      actionType: 'auth',
      title: 'Admin Session Closed',
      details: 'Engr. Abiodun Ajayi safely signed out from Control Center.',
      adminName: 'Engr. Abiodun Ajayi',
      adminEmail: TARGET_ADMIN_EMAIL,
      severity: 'info',
    });
    await signOutAdminWithSupabase();
    setIsAdmin(false);
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.IS_ADMIN);
      } catch {}
    }
    showToast('Logged out of Admin Portal.', 'info');
  };

  const register = (
    fullNameOrData: string | { fullName: string; email: string; phone: string; password?: string; role?: string },
    email?: string,
    phone?: string,
    pass?: string
  ): { success: boolean; message: string } => {
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

    if (!nameVal || !emailVal) {
      return { success: false, message: 'Please provide your full name and email address.' };
    }

    // Check if account already registered
    const existing = registeredUsers.find(
      (u) => u.email.toLowerCase() === emailVal || (phoneVal && u.phone === phoneVal)
    );
    if (existing) {
      return { success: false, message: 'An account with this email address already exists. Please sign in.' };
    }

    const newCustomer = {
      id: 'usr-' + Date.now(),
      fullName: nameVal,
      email: emailVal,
      phone: phoneVal || '+234 800 000 0000',
      password: passVal,
      createdAt: new Date().toISOString(),
      addresses: [],
    };

    setRegisteredUsers((prev) => [newCustomer, ...prev]);

    const sessionUser: UserAccount = {
      id: newCustomer.id,
      fullName: newCustomer.fullName,
      email: newCustomer.email,
      phone: newCustomer.phone,
      role: 'customer',
      addresses: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCurrentUser(sessionUser);
    showToast(`Account successfully created! Welcome, ${sessionUser.fullName}.`);
    return { success: true, message: 'Registration successful' };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.IS_ADMIN);
      } catch {}
    }
    showToast('Signed out successfully', 'info');
  };

  const updateUserProfile = (updated: Partial<UserAccount>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    showToast('Profile updated successfully!');
  };

  // Product CRUD
  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: 'prod-' + Date.now(),
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Direct Supabase sync using audited clean column names
    if (isSupabaseConfigured() && supabase) {
      try {
        await insertSupabaseProduct({
          id: newProduct.id,
          name: newProduct.name,
          slug: newProduct.slug || newProduct.id,
          brand: newProduct.brand || 'AjmanTech',
          category: newProduct.category,
          price: newProduct.price,
          stock: newProduct.stock,
          image_url: newProduct.images[0] || '',
          description: newProduct.description || newProduct.shortDescription,
          is_active: true,
          gallery: newProduct.images || [],
          specifications: newProduct.specifications || {},
          tags: newProduct.tags || [],
          voltage: newProduct.specifications?.voltage || '220V-240V',
          warranty: newProduct.specifications?.warranty || '1 Year',
        });
      } catch (err: any) {
        console.error('[StoreContext addProduct Error]:', err);
      }
    }

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
          slug: updated.slug || updated.id,
          brand: updated.brand,
          category: updated.category,
          price: updated.price,
          stock: updated.stock,
          image_url: updated.images[0] || '',
          description: updated.description || updated.shortDescription,
          is_active: true,
          gallery: updated.images,
          specifications: updated.specifications,
          tags: updated.tags,
          voltage: updated.specifications?.voltage || '220V-240V',
          warranty: updated.specifications?.warranty || '1 Year',
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
  const addCategory = async (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: 'cat-' + (catData.slug || Date.now()),
    };

    setCategories((prev) => [...prev, newCat]);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('categories').insert({
          id: newCat.id,
          name: newCat.name,
          slug: newCat.slug,
          description: newCat.description || '',
          icon: newCat.image || newCat.iconName,
          item_count: newCat.productCount || 0,
        });
      } catch (err) {
        console.warn('Supabase category insert notice:', err);
      }
    }

    showToast(`Category "${newCat.name}" created!`);
    return newCat;
  };

  const updateCategory = async (updated: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('categories').upsert({
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          description: updated.description,
          icon: updated.image || updated.iconName,
          item_count: updated.productCount,
        });
      } catch (err) {
        console.warn('Supabase category update notice:', err);
      }
    }

    showToast(`Category "${updated.name}" updated!`);
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase category delete notice:', err);
      }
    }

    showToast('Category deleted.', 'info');
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
        setProducts(mappedProducts);
      }

      const { data: dbCats, error: catErr } = await supabase.from('categories').select('*');
      if (!catErr && Array.isArray(dbCats)) {
        const mappedCats: Category[] = dbCats.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          image: c.icon || 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?q=80&w=600&auto=format&fit=crop',
          iconName: c.icon || 'Sparkles',
          productCount: c.item_count ?? 0,
          isPopular: true,
        }));
        setCategories(mappedCats);
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

  const updateStoreSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
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

        orders,
        createOrder,
        updateOrderStatus,
        updateOrderPaymentStatus,
        getOrderByIdOrNumber,

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

        // Activity Audit Logs
        activityLogs,
        addActivityLog,
        clearActivityLogs,


        addReview,
        getProductReviews,

        formatNaira,
        toast,
        showToast,
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
