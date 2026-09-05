export interface ProductVariant {
  name: string;
  options: string[];
}

export interface ProductSpecifications {
  wattage?: string;
  voltage?: string;
  colorTemperature?: string;
  lightColor?: string;
  material?: string;
  dimensions?: string;
  installationType?: string;
  indoorOutdoor?: 'Indoor' | 'Outdoor' | 'Indoor/Outdoor';
  ipRating?: string;
  warranty?: string;
  sku?: string;
  lumens?: string;
  lifespan?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  images: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isSpecialOffer?: boolean;
  tags: string[];
  shortDescription: string;
  description: string;
  specifications: ProductSpecifications;
  variants?: ProductVariant[];
  includedItems?: string[];
  installationAvailable?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  iconName: string;
  productCount: number;
  isPopular?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedVariant?: string;
  product: Product;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDesc: string;
  fullDesc: string;
  image: string;
  benefits: string[];
  process: string[];
  pricingNote: string;
  popular?: boolean;
  estimatedDuration?: string;
}

export type ServiceRequestStatus = 'new' | 'contacted' | 'scheduled' | 'in_progress' | 'completed' | 'pending' | 'approved' | 'cancelled';

export type PaymentMethod = 'bank_transfer' | 'card' | 'pay_on_delivery' | 'whatsapp';

export type ProductCategory = string;

export interface ServiceRequest {
  id: string;
  ticketNumber: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  preferredDate: string;
  preferredTimeSlot: string;
  description: string;
  imageAttachments?: string[];
  status: ServiceRequestStatus;
  createdAt: string;
  internalNotes?: string;
  assignedTechnician?: string;
}

export type OrderStatus = 'placed' | 'confirmed' | 'processing' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'pending' | 'shipped';

export interface TrackingStep {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    state: string;
    city: string;
    notes?: string;
  };
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  promoCode?: string;
  total: number;
  paymentMethod: 'bank_transfer' | 'card' | 'pay_on_delivery' | 'whatsapp';
  paymentStatus: 'pending' | 'paid' | 'verified';
  status: OrderStatus;
  trackingHistory: TrackingStep[];
  createdAt: string;
  estimatedDelivery: string;
  includesInstallation?: boolean;
  installationFee?: number;
}

export interface UserAddress {
  id: string;
  title: string;
  fullAddress: string;
  state: string;
  city: string;
  phone: string;
  isDefault: boolean;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  addresses: UserAddress[];
  createdAt: string;
}

export interface ProjectPortfolio {
  id: string;
  title: string;
  category: 'Home Wiring' | 'Lighting Installation' | 'Chandelier Installation' | 'Solar Installation' | 'CCTV Installation' | 'Commercial Projects';
  location: string;
  serviceProvided: string;
  description: string;
  image: string;
  completedYear: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string | string[];
  category?: string;
  date?: string;
  author?: string;
  author_id?: string;
  readTime?: string;
  image?: string;
  featured_image?: string;
  published?: boolean;
  relatedProductIds?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  location?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'Orders & Delivery' | 'Services & Installation' | 'Payment & Returns' | 'Products & Warranty';
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  phone: string;
  altPhone: string;
  email: string;
  address: string;
  openingHours: string;
  deliveryRates: Record<string, number>;
  defaultDeliveryFee: number;
  freeDeliveryThreshold: number;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string;
  };
  promoCodes: {
    code: string;
    discountPercent: number;
    minOrderAmount?: number;
  }[];
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
}

export interface ProductGalleryItem {
  id: string;
  productId: string;
  imageUrl: string;
  caption?: string;
  displayOrder?: number;
  createdAt?: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'customer';
  createdAt?: string;
}

export type ViewState =
  | 'home'
  | 'shop'
  | 'product-detail'
  | 'categories'
  | 'services'
  | 'service-detail'
  | 'service-booking'
  | 'about'
  | 'portfolio'
  | 'blog'
  | 'blog-detail'
  | 'contact'
  | 'cart'
  | 'checkout'
  | 'order-success'
  | 'account'
  | 'track-order'
  | 'wishlist'
  | 'admin'
  | 'admin-login'
  | 'admin-signup'
  | 'admin-dashboard';
