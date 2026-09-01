import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Tag,
  Check,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    formatNaira,
    navigateTo,
    storeSettings,
    showToast,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number } | null>(null);

  if (!isCartOpen) return null;

  const freeDeliveryTarget = storeSettings.freeDeliveryThreshold;
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeDeliveryTarget) * 100));
  const remainingForFree = Math.max(0, freeDeliveryTarget - cartSubtotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoInput.trim().toUpperCase();
    const found = storeSettings.promoCodes.find((p) => p.code.toUpperCase() === cleanCode);
    if (found) {
      if (found.minOrderAmount && cartSubtotal < found.minOrderAmount) {
        showToast(`This coupon requires a minimum subtotal of ${formatNaira(found.minOrderAmount)}`, 'error');
        return;
      }
      setAppliedPromo({ code: found.code, percent: found.discountPercent });
      showToast(`Coupon "${found.code}" applied! ${found.discountPercent}% discount active.`);
    } else {
      showToast('Invalid coupon code. Try "AJMANLIGHT10" or "WELCOME5"', 'error');
    }
  };

  const discountAmount = appliedPromo ? (cartSubtotal * appliedPromo.percent) / 100 : 0;
  const finalSubtotal = cartSubtotal - discountAmount;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigateTo('checkout');
  };

  return (
    <div
      id="cart-slideover-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-blue-900 flex items-center justify-between bg-[#002D72] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Your Shopping Cart</h3>
              <p className="text-[11px] text-blue-200">{cart.length} unique items</p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div className="bg-amber-50/70 border-b border-amber-100 p-3 text-xs">
          <div className="flex items-center justify-between text-slate-800 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              {remainingForFree > 0 ? (
                <span>Add <strong>{formatNaira(remainingForFree)}</strong> for Free Delivery</span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> You have unlocked FREE Delivery!
                </span>
              )}
            </span>
            <span className="font-bold text-amber-900">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-amber-200/60 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                progressPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8 text-[#002D72]" />
              </div>
              <div>
                <h4 className="font-bold text-[#002D72] text-sm">Your cart is empty</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs font-light">
                  Looks like you haven't added any lighting fixtures or electrical products yet.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigateTo('shop');
                }}
                className="py-2.5 px-6 rounded-full bg-[#0047AB] text-white text-xs font-bold shadow-md hover:bg-[#002D72] transition-colors cursor-pointer"
              >
                Browse Shop Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, idx) => {
                const itemPrice = item.product.discountPrice ?? item.product.price;
                return (
                  <div key={idx} className="flex gap-3 pt-3 first:pt-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => {
                              setIsCartOpen(false);
                              navigateTo('product-detail', { productId: item.product.id });
                            }}
                            className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 hover:text-[#0047AB] cursor-pointer"
                          >
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.productId, item.selectedVariant)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {item.selectedVariant && (
                          <span className="inline-block mt-0.5 text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                            {item.selectedVariant}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-full overflow-hidden bg-slate-50 text-xs">
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.productId,
                                item.quantity - 1,
                                item.selectedVariant
                              )
                            }
                            className="px-2.5 py-0.5 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-3 py-0.5 font-bold text-slate-800 bg-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.productId,
                                item.quantity + 1,
                                item.selectedVariant
                              )
                            }
                            className="px-2.5 py-0.5 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-[#002D72]">
                            {formatNaira(itemPrice * item.quantity)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-[10px] text-slate-400">
                              {formatNaira(itemPrice)} each
                            </div>
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

        {/* Footer Summary & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-[#F8F9FB] space-y-3">
            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Promo Code (e.g. AJMANLIGHT10)"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-full uppercase font-mono placeholder:normal-case placeholder:font-sans focus:outline-hidden focus:ring-2 focus:ring-[#0047AB]"
                />
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-[#002D72] hover:bg-blue-900 text-white text-xs font-semibold cursor-pointer"
              >
                Apply
              </button>
            </form>

            {appliedPromo && (
              <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <span>Code <strong>{appliedPromo.code}</strong> (-{appliedPromo.percent}%)</span>
                <span>-{formatNaira(discountAmount)}</span>
              </div>
            )}

            {/* Subtotal Calculation */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatNaira(cartSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-{formatNaira(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Estimated Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-[#002D72]">
                <span>Estimated Total</span>
                <span>{formatNaira(finalSubtotal)}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-1">
              <button
                id="drawer-proceed-checkout-btn"
                onClick={handleProceedToCheckout}
                className="w-full py-3 px-4 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigateTo('shop');
                }}
                className="w-full py-2 text-center text-xs font-semibold text-slate-600 hover:text-[#002D72] transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>

            <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe & Secure Nigerian Payment Options</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
