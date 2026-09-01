import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Product,
  Category,
  CartItem,
  WishlistItem,
  ServiceItem,
  ServiceRequest,
  Order,
  OrderStatus,
  UserAccount,
  ProjectPortfolio,
  BlogPost,
  Review,
  FAQItem,
  StoreSettings,
  ViewState,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
  INITIAL_PROJECTS,
  INITIAL_BLOG_POSTS,
  INITIAL_REVIEWS,
  INITIAL_FAQS,
  INITIAL_STORE_SETTINGS,
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';


interface Toast {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

interface StoreContextType {
  // Navigation & routing state
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedServiceId: string | null;
  setSelectedServiceId: (id: string | null) => void;
  selectedBlogPostId: string | null;
  setSelectedBlogPostId: (id: string | null) => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  navigateTo: (view: ViewState, params?: { productId?: string; serviceId?: string; blogId?: string; categorySlug?: string }) => void;

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
  blogPosts: BlogPost[];
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
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'trackingHistory' | 'status'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  getOrderByIdOrNumber: (identifier: string) => Order | undefined;

  // Services
  serviceRequests: ServiceRequest[];
  createServiceRequest: (requestData: Omit<ServiceRequest, 'id' | 'ticketNumber' | 'createdAt' | 'status'>) => ServiceRequest;
  updateServiceRequestStatus: (requestId: string, status: ServiceRequest['status'], notes?: string, assignedTech?: string) => void;

  // Auth & Profile
  currentUser: UserAccount | null;
  login: (emailOrPhone: string, pass: string) => { success: boolean; message: string };
  register: (fullName: string, email: string, phone: string, pass: string) => { success: boolean; message: string };
  logout: () => void;
  updateUserProfile: (updatedUser: Partial<UserAccount>) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;

  // Product Admin Operations
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;

  // Category Admin Operations
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;

  // Reviews
  addReview: (reviewData: Omit<Review, 'id' | 'date'>) => void;
  getProductReviews: (productId: string) => Review[];

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
  BLOG: 'ajmantech_blog_v1',
  REVIEWS: 'ajmantech_reviews_v1',
  SETTINGS: 'ajmantech_settings_v1',
  CART: 'ajmantech_cart_v1',
  WISHLIST: 'ajmantech_wishlist_v1',
  ORDERS: 'ajmantech_orders_v1',
  SERVICE_REQUESTS: 'ajmantech_service_requests_v1',
  USER: 'ajmantech_user_v1',
  IS_ADMIN: 'ajmantech_is_admin_v1',
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedBlogPostId, setSelectedBlogPostId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Data States
  const [products, setProducts] = useState<Product[]>(() => loadStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => loadStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));
  const [services] = useState<ServiceItem[]>(() => loadStored(STORAGE_KEYS.SERVICES, INITIAL_SERVICES));
  const [projects] = useState<ProjectPortfolio[]>(() => loadStored(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS));
  const [blogPosts] = useState<BlogPost[]>(() => loadStored(STORAGE_KEYS.BLOG, INITIAL_BLOG_POSTS));
  const [reviews, setReviews] = useState<Review[]>(() => loadStored(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS));
  const [faqs] = useState<FAQItem[]>(INITIAL_FAQS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => loadStored(STORAGE_KEYS.SETTINGS, INITIAL_STORE_SETTINGS));

  // User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const storedUser = loadStored<UserAccount | null>(STORAGE_KEYS.USER, null);
    if (!storedUser) {
      // Default demo customer profile for easy preview
      const demoUser: UserAccount = {
        id: 'usr-demo-01',
        fullName: 'Engr. Joshua Ajayi',
        email: 'joshuaajayi0148@gmail.com',
        phone: '+234 802 345 6789',
        role: 'customer',
        addresses: [
          {
            id: 'addr-01',
            title: 'Home Address',
            fullAddress: 'No. 24 Admiralty Way, Lekki Phase 1',
            city: 'Lekki',
            state: 'Lagos',
            phone: '+234 802 345 6789',
            isDefault: true,
          },
          {
            id: 'addr-02',
            title: 'Office / Site',
            fullAddress: 'Plot 10, Central Business District, Abuja FCT',
            city: 'Abuja Municipal',
            state: 'Abuja (FCT)',
            phone: '+234 802 345 6789',
            isDefault: false,
          },
        ],
        createdAt: '2025-01-10',
      };
      return demoUser;
    }
    return storedUser;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => loadStored(STORAGE_KEYS.IS_ADMIN, false));

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
          fullName: 'Engr. Joshua Ajayi',
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
      return [demoOrder];
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
        customerName: 'Engr. Joshua Ajayi',
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

  // Sync back to LocalStorage
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
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } catch (e) { console.error(e); }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.IS_ADMIN, JSON.stringify(isAdmin));
    } catch (e) { console.error(e); }
  }, [isAdmin]);

  // Initial Supabase Sync when environment variables are configured
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const fetchSupabaseData = async () => {
      try {
        // 1. Fetch products
        const { data: dbProducts, error: prodErr } = await supabase.from('products').select('*');
        if (!prodErr && dbProducts && dbProducts.length > 0) {
          const mappedProducts: Product[] = dbProducts.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug || p.id,
            brand: p.brand || 'AjmanTech',
            category: p.category_name,
            price: Number(p.price),
            discountPrice: p.original_price ? Number(p.price) : undefined,
            stock: p.stock ?? 10,
            rating: p.rating ? Number(p.rating) : 5.0,
            reviewCount: p.review_count ?? 0,
            images: Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery : [p.image],
            isFeatured: Boolean(p.is_featured),
            isBestSeller: Boolean(p.is_best_seller),
            isNewArrival: Boolean(p.is_new),
            tags: Array.isArray(p.tags) ? p.tags : ['lighting'],
            shortDescription: p.short_description || p.name,
            description: p.full_description || p.short_description || p.name,
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
  }, []);


  // Scroll to top on view change
  const navigateTo = (
    view: ViewState,
    params?: { productId?: string; serviceId?: string; blogId?: string; categorySlug?: string }
  ) => {
    if (params?.productId) setSelectedProductId(params.productId);
    if (params?.serviceId) setSelectedServiceId(params.serviceId);
    if (params?.blogId) setSelectedBlogPostId(params.blogId);
    if (params?.categorySlug) setSelectedCategorySlug(params.categorySlug);

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'trackingHistory' | 'status'>
  ): Order => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `AJM-${new Date().getFullYear()}-${randomNum}`;
    const newOrder: Order = {
      ...orderData,
      id: 'ord-' + Date.now(),
      orderNumber,
      status: 'placed',
      createdAt: new Date().toISOString().split('T')[0],
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
          title: 'Order Confirmed',
          description: 'Payment confirmation and inventory allocation in progress.',
          timestamp: 'Pending',
          completed: false,
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

    // Async Supabase Sync
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('orders')
        .insert({
          id: newOrder.id,
          order_number: newOrder.orderNumber,
          customer_name: newOrder.customer.fullName,
          customer_email: newOrder.customer.email,
          customer_phone: newOrder.customer.phone,
          items: newOrder.items,
          total_amount: newOrder.total,
          delivery_fee: newOrder.deliveryFee,
          payment_method: newOrder.paymentMethod,
          payment_status: newOrder.paymentStatus,
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

  // Auth
  const login = (emailOrPhone: string, pass: string) => {
    // Admin back-door for instant evaluation
    if (emailOrPhone.toLowerCase() === 'admin@ajmantech.ng' || pass === 'admin123' || pass === 'ajmantech') {
      setIsAdmin(true);
      setCurrentUser({
        id: 'usr-admin-01',
        fullName: 'AjmanTech Administrator',
        email: 'admin@ajmantech.ng',
        phone: '+234 802 345 6789',
        role: 'admin',
        addresses: [],
        createdAt: '2024-01-01',
      });
      showToast('Welcome back, AjmanTech Administrator!');
      return { success: true, message: 'Admin login successful' };
    }

    // Customer login
    const user: UserAccount = {
      id: 'usr-' + Date.now(),
      fullName: emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : 'AjmanTech Customer',
      email: emailOrPhone.includes('@') ? emailOrPhone : 'customer@ajmantech.ng',
      phone: emailOrPhone.includes('@') ? '+234 802 345 6789' : emailOrPhone,
      role: 'customer',
      addresses: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCurrentUser(user);
    showToast(`Welcome, ${user.fullName}!`);
    return { success: true, message: 'Login successful' };
  };

  const register = (fullName: string, email: string, phone: string, _pass: string) => {
    const newUser: UserAccount = {
      id: 'usr-' + Date.now(),
      fullName,
      email,
      phone,
      role: 'customer',
      addresses: [
        {
          id: 'addr-' + Date.now(),
          title: 'Primary Delivery Address',
          fullAddress: 'Lagos, Nigeria',
          city: 'Lagos',
          state: 'Lagos',
          phone,
          isDefault: true,
        },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCurrentUser(newUser);
    showToast(`Account created! Welcome to AjmanTech, ${fullName}.`);
    return { success: true, message: 'Registration successful' };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    showToast('Logged out successfully', 'info');
  };

  const updateUserProfile = (updated: Partial<UserAccount>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    showToast('Profile updated successfully!');
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: 'prod-' + Date.now(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Product "${newProduct.name}" added successfully!`);
    return newProduct;
  };

  const updateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Product "${updated.name}" updated!`);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product deleted from inventory.', 'info');
  };

  // Category CRUD
  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: 'cat-' + Date.now(),
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`Category "${newCat.name}" created!`);
    return newCat;
  };

  const updateCategory = (updated: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`Category "${updated.name}" updated!`);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast('Category deleted.', 'info');
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
        selectedBlogPostId,
        setSelectedBlogPostId,
        selectedCategorySlug,
        setSelectedCategorySlug,
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
        blogPosts,
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
        getOrderByIdOrNumber,

        serviceRequests,
        createServiceRequest,
        updateServiceRequestStatus,

        currentUser,
        login,
        register,
        logout,
        updateUserProfile,
        isAdmin,
        setIsAdmin,

        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,

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
