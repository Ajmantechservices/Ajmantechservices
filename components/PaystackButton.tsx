// components/PaystackButton.tsx
'use client';

import { useState } from 'react';
import paystackPopup from '@paystack/inline-js';
import { createClient } from '@/utils/supabase/client';

interface PaystackButtonProps {
  email: string;
  amountInNaira: number;
  serviceName: string;
}

export default function PaystackButton({ email, amountInNaira, serviceName }: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handlePayment = () => {
    if (!email) {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        alert('Please enter a valid email address first.');
      } else {
        console.warn('Please enter a valid email address first.');
      }
      return;
    }

    setLoading(true);
    const publicKey =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_PAYSTACK_PUBLIC_KEY);

    if (!publicKey) {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        alert('Paystack public key is missing. Please configure NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in your environment.');
      } else {
        console.warn('Paystack public key is missing.');
      }
      setLoading(false);
      return;
    }

    try {
      const PaystackClass = (paystackPopup as any)?.default || paystackPopup;
      const popup = new PaystackClass();
      popup.newTransaction({
        key: publicKey,
        email: email,
        amount: Math.round(amountInNaira * 100), // Paystack expects amount in kobo (e.g., ₦1,000 = 100000)
        currency: 'NGN',
        ref: `ATS_${Math.floor(Math.random() * 1000000 + 1)}`,
        callback: async (response: { reference: string }) => {
          // Payment successful! Save the transaction to Supabase
          try {
            await supabase.from('orders').insert([
              {
                reference: response.reference,
                customer_email: email,
                amount: amountInNaira,
                service_name: serviceName,
                status: 'success',
              },
            ]);
            if (typeof window !== 'undefined' && typeof window.alert === 'function') {
              alert(`Payment successful! Reference: ${response.reference}`);
              window.location.reload();
            }
          } catch (err) {
            console.error('Error saving order:', err);
          } finally {
            setLoading(false);
          }
        },
        onClose: () => {
          setLoading(false);
        },
      });
    } catch (popupErr) {
      console.error('Error initializing Paystack popup:', popupErr);
      setLoading(false);
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        alert('Could not open payment window. Please check your browser popup settings.');
      }
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50 cursor-pointer"
    >
      {loading ? 'Processing Payment...' : `Pay ₦${amountInNaira.toLocaleString()} with Card`}
    </button>
  );
}
