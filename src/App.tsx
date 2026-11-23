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
import { DashboardMenuView } from './views/DashboardMenuView';
import AdminProductsPage from '../app/admin/products/page';

const MainRouter: React.FC = () => {
  const { currentView, isAdmin, currentUser, isAuthChecking } = useStore();

  // Scroll to top whenever view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const renderView = () => {
    const isAdminRoute =
      currentView === 'admin' ||
      currentView === 'admin-login' ||
      currentView === 'admin-signup' ||
      currentView === 'admin-dashboard' ||
      currentView === 'admin-products';

    if (isAuthChecking && (isAdminRoute || currentView === 'wishlist' || currentView === 'account')) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
          <div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-500">Verifying session access...</p>
        </div>
      );
    }

    // Logged-in non-admin customers must never access any admin page
    if (currentUser && !isAdmin && isAdminRoute) {
      return <CustomerAccountView />;
    }

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
        return currentUser ? <WishlistView /> : <CustomerAccountView />;
      case 'services-portal':
        return <DashboardMenuView />;
      case 'admin-login':
        return isAdmin ? <AdminDashboardView /> : <AdminLoginView />;
      case 'admin-signup':
        return <AdminSignupView />;
      case 'admin-dashboard':
        return isAdmin ? <AdminDashboardView /> : <AdminLoginView />;
      case 'admin-products':
        return isAdmin ? <AdminProductsPage /> : <AdminLoginView />;
      case 'admin':
        return isAdmin ? <AdminDashboardView /> : <AdminLoginView />;
      default:
        return <HomeView />;
    }
  };

  const isDedicatedAdminDashboard =
    (currentView === 'admin' || currentView === 'admin-dashboard' || currentView === 'admin-products') && isAdmin;

  if (currentView === 'services-portal') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-cyan-400 selection:text-slate-950">
        {renderView()}
        <ServiceBookingModal />
        <WhatsAppFloatingButton />
        <ToastNotification />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-400 selection:text-slate-950">
      {/* Header - provides store navigation & admin status */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1">
        {renderView()}
      </main>

      {/* Footer - visible on storefront and login view, hidden only on active admin dashboard */}
      {!isDedicatedAdminDashboard && <Footer />}

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
