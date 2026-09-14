import React, { useEffect, useState } from 'react';
import DashboardMenu from '../components/DashboardMenu';
import { useStore } from '../context/StoreContext';
import { supabase } from '../supabaseClient';

export const DashboardMenuView: React.FC = () => {
  const { currentUser, openServiceModal, navigateTo, logout } = useStore();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSession = async () => {
      try {
        if (supabase?.auth?.getSession) {
          const { data } = await supabase.auth.getSession();
          if (data?.session && isMounted) {
            setSession(data.session);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not fetch supabase session', e);
      }

      if (isMounted) {
        // Fallback to logged-in user in StoreContext
        if (currentUser) {
          setSession({
            user: {
              email: currentUser.email,
              id: currentUser.id,
              user_metadata: {
                full_name: currentUser.fullName,
              },
            },
          });
        } else {
          setSession({
            user: {
              email: 'guest@ajmantech.ng',
            },
          });
        }
      }
    };

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleBookService = (serviceTitle: string) => {
    openServiceModal(serviceTitle);
  };

  const handleSignOut = () => {
    logout();
    navigateTo('home');
  };

  const handleBackToStore = () => {
    navigateTo('home');
  };

  return (
    <DashboardMenu
      session={session}
      onBookService={handleBookService}
      onSignOut={handleSignOut}
      onBackToStore={handleBackToStore}
    />
  );
};

export default DashboardMenuView;
