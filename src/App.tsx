import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { QuickViewModal } from './components/QuickViewModal';
import { CartDrawer } from './components/CartDrawer';
import { ServiceBookingModal } from './components/ServiceBookingModal';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { ToastNotification } from './components/ToastNotification';

// Views
import { HomeView } from './views/HomeView';
import { ShopView } from './views/ShopView';
import { ProductDetailView } from './views/ProductDetailView';
import { ServicesView } from './views/ServicesView';
import { CategoriesView } from './views/CategoriesView';
import { PortfolioView } from './views/PortfolioView';
import { BlogView } from './views/BlogView';
import { BlogPostView } from './views/BlogPostView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { CheckoutView } from './views/CheckoutView';
import { OrderSuccessView } from './views/OrderSuccessView';
import { TrackOrderView } from './views/TrackOrderView';
import { CustomerAccountView } from './views/CustomerAccountView';
import { WishlistView } from './views/WishlistView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminSignupView } from './views/AdminSignupView';

const MainRouter: React.FC = () => {
  const { currentView, isAdmin } = useStore();

  // Scroll to top whenever view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'shop':
        return <ShopView />;
      case 'product-detail':
        return <ProductDetailView />;
      case 'services':
        return <ServicesView />;
      case 'categories':
        return <CategoriesView />;
      case 'portfolio':
        return <PortfolioView />;
      case 'blog':
        return <BlogView />;
      case 'blog-detail':
        return <BlogPostView />;
      case 'about':
        return <AboutView />;
      case 'contact':
        return <ContactView />;
      case 'checkout':
        return <CheckoutView />;
      case 'order-success':
        return <OrderSuccessView />;
      case 'track-order':
        return <TrackOrderView />;
      case 'account':
        return <CustomerAccountView />;
      case 'wishlist':
        return <WishlistView />;
      case 'admin-login':
        return <AdminLoginView />;
      case 'admin-signup':
        return <AdminSignupView />;
      case 'admin-dashboard':
        return isAdmin ? <AdminDashboardView /> : <AdminLoginView />;
      case 'admin':
        return isAdmin ? <AdminDashboardView /> : <AdminLoginView />;
      default:
        return <HomeView />;
    }
  };

  const isAdminPortalView =
    currentView === 'admin-login' ||
    currentView === 'admin-signup' ||
    ((currentView === 'admin' || currentView === 'admin-dashboard') && isAdmin);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-400 selection:text-slate-950">
      {/* Header - shown across all views; in admin portal it provides store navigation & admin status */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1">
        {renderView()}
      </main>

      {/* Footer - hidden on dedicated admin dashboard for cleaner side-nav workspace if desired */}
      <Footer />

      {/* Overlays & Interactive Drawers/Modals */}
      <QuickViewModal />
      <CartDrawer />
      <ServiceBookingModal />
      <WhatsAppFloatingButton />
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainRouter />
    </StoreProvider>
  );
}
