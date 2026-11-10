import React, { useState } from 'react';
import PaystackPop from '@paystack/inline-js';
import { createClient } from '../utils/supabase/client';
import { sendOrderConfirmationEmail } from '../services/emailService';

export interface PaystackButtonProps {
  email: string;
  amountInNaira: number;
  serviceName: string;
  customerName?: string;
  customerPhone?: string;
  onSuccess?: (reference: string) => void;
  onCancel?: () => void;
  className?: string;
  label?: string;
}

export function PaystackButton({
  email,
  amountInNaira,
  serviceName,
  customerName = 'Valued Customer',
  customerPhone = '',
  onSuccess,
  onCancel,
  className,
  label,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const resolvePaystackKey = (): string => {
    const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) ? (import.meta as any).env : {};
    if (metaEnv.VITE_PAYSTACK_PUBLIC_KEY) return metaEnv.VITE_PAYSTACK_PUBLIC_KEY.trim();
    if (metaEnv.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) return metaEnv.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.trim();
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_PAYSTACK_PUBLIC_KEY) return process.env.VITE_PAYSTACK_PUBLIC_KEY.trim();
      if (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.trim();
    }
    return 'pk_test_sample_key_for_preview';
  };

  const handlePayment = () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address first.');
      return;
    }

    setLoading(true);
    const publicKey = resolvePaystackKey();

    if (!publicKey) {
      alert('Paystack public key is missing.');
      setLoading(false);
      return;
    }

    const popup = new PaystackPop();
    const transactionRef = `ATS_${Date.now()}_${Math.floor(Math.random() * 1000000 + 1)}`;

    popup.newTransaction({
      key: publicKey,
      email,
      amount: Math.round(amountInNaira * 100), // Paystack expects amount in kobo
      currency: 'NGN',
      ref: transactionRef,
      onSuccess: async (response: { reference: string }) => {
        // Payment successful! Save the transaction to Supabase orders table
        try {
          const verifiedRef = response?.reference || transactionRef;
          const orderNum = `AJM-SRV-${Math.floor(1000 + Math.random() * 9000)}`;
          await supabase.from('orders').insert([
            {
              id: `ord-ps-${Date.now()}`,
              order_number: orderNum,
              reference: verifiedRef,
              customer_name: customerName,
              customer_email: email,
              customer_phone: customerPhone,
              amount: amountInNaira,
              total_amount: amountInNaira,
              service_name: serviceName,
              payment_method: 'paystack',
              payment_status: 'paid',
              status: 'confirmed',
              items: [
                {
                  productName: serviceName,
                  title: serviceName,
                  price: amountInNaira,
                  quantity: 1,
                },
              ],
            },
          ]);
          // Dispatch automated order confirmation email
          sendOrderConfirmationEmail({
            orderNumber: orderNum,
            customerEmail: email,
            customerName,
            customerPhone,
            items: [
              {
                productName: serviceName,
                title: serviceName,
                price: amountInNaira,
                quantity: 1,
              },
            ],
            totalAmount: amountInNaira,
            paymentReference: verifiedRef,
            paidAt: new Date().toISOString(),
          }).catch((e) => console.warn('Email confirmation dispatch notice:', e));

          if (onSuccess) {
            onSuccess(verifiedRef);
          } else {
            alert(`Payment successful! Reference: ${verifiedRef}`);
          }
        } catch (err) {
          console.error('Error saving order to Supabase:', err);
        } finally {
          setLoading(false);
        }
      },
      callback: async (response: { reference: string }) => {
        // Fallback for callback
        try {
          const verifiedRef = response?.reference || transactionRef;
          await supabase.from('orders').insert([
            {
              id: `ord-ps-${Date.now()}`,
              order_number: `AJM-SRV-${Math.floor(1000 + Math.random() * 9000)}`,
              reference: verifiedRef,
              customer_name: customerName,
              customer_email: email,
              customer_phone: customerPhone,
              amount: amountInNaira,
              total_amount: amountInNaira,
              service_name: serviceName,
              payment_method: 'paystack',
              payment_status: 'paid',
              status: 'confirmed',
            },
          ]);
          if (onSuccess) onSuccess(verifiedRef);
        } catch (err) {
          console.error('Error saving order to Supabase:', err);
        } finally {
          setLoading(false);
        }
      },
      onClose: () => {
        // User closed modal without paying -> do NOT create order in Supabase
        setLoading(false);
        if (onCancel) {
          onCancel();
        } else {
          alert('Payment is required to complete your service order.');
        }
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      className={
        className ||
        'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2'
      }
    >
      {loading
        ? 'Processing Payment...'
        : label || `Pay ₦${amountInNaira.toLocaleString()} with Card`}
    </button>
  );
}

export default PaystackButton;
