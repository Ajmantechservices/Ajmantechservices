import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Building,
  Smartphone,
  CheckCircle2,
  X,
  Copy,
  Lock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  onPaymentSuccess: (details: {
    reference: string;
    channel: string;
    paidAt: string;
    amount: number;
  }) => void;
}

type PaymentChannel = 'card' | 'transfer' | 'ussd';

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  amount,
  customerEmail,
  customerName,
  customerPhone,
  onPaymentSuccess,
}) => {
  const { formatNaira, showToast } = useStore();

  const [activeChannel, setActiveChannel] = useState<PaymentChannel>('card');
  const [step, setStep] = useState<'details' | 'pin' | 'otp' | 'processing' | 'success'>('details');

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cardType, setCardType] = useState<'mastercard' | 'visa' | 'verve' | 'unknown'>('unknown');

  // Bank Transfer Virtual Account State
  const [transferTimer, setTransferTimer] = useState<number>(1799); // 30 mins
  const [virtualAccount, setVirtualAccount] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    expiresIn: string;
  }>({
    bankName: 'Zenith Bank PLC',
    accountNumber: '9928' + Math.floor(100000 + Math.random() * 900000),
    accountName: 'AjmanTech Services / Paystack',
    expiresIn: '30:00 mins',
  });

  // USSD State
  const [selectedBank, setSelectedBank] = useState('gtbank');
  const [isCopied, setIsCopied] = useState(false);
  const [generatedRef, setGeneratedRef] = useState('');

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardPin('');
      setOtpCode('');
      setGeneratedRef('PSTK_TXN_' + Date.now().toString().slice(-8) + '_' + Math.floor(1000 + Math.random() * 9000));
      setVirtualAccount({
        bankName: 'Zenith Bank PLC',
        accountNumber: '99' + Math.floor(10000000 + Math.random() * 90000000),
        accountName: 'AjmanTech Services / Paystack',
        expiresIn: '30:00 mins',
      });
      setTransferTimer(1800);
    }
  }, [isOpen]);

  // Countdown timer for virtual account transfer
  useEffect(() => {
    if (!isOpen || activeChannel !== 'transfer' || transferTimer <= 0) return;
    const interval = setInterval(() => {
      setTransferTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeChannel, transferTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Auto-detect card brand
  const handleCardNumberChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 19);
    let formatted = '';
    for (let i = 0; i < digitsOnly.length; i += 4) {
      if (i > 0) formatted += ' ';
      formatted += digitsOnly.slice(i, i + 4);
    }
    setCardNumber(formatted);

    // Detect brand
    if (digitsOnly.startsWith('4')) {
      setCardType('visa');
    } else if (/^5[1-5]/.test(digitsOnly) || /^2[2-7]/.test(digitsOnly)) {
      setCardType('mastercard');
    } else if (/^506|^507|^650/.test(digitsOnly)) {
      setCardType('verve');
    } else {
      setCardType('unknown');
    }
  };

  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length > 2) {
      setCardExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  // Quick Test Card Presets
  const fillTestCard = (type: 'verve' | 'mastercard' | 'visa') => {
    if (type === 'verve') {
      setCardNumber('5061 0212 3456 7890');
      setCardExpiry('12/28');
      setCardCvv('789');
      setCardType('verve');
    } else if (type === 'mastercard') {
      setCardNumber('5399 4100 2841 9021');
      setCardExpiry('08/29');
      setCardCvv('321');
      setCardType('mastercard');
    } else {
      setCardNumber('4084 0812 3456 7890');
      setCardExpiry('06/27');
      setCardCvv('456');
      setCardType('visa');
    }
    showToast(`Test ${type.toUpperCase()} card auto-filled for instant sandbox approval!`);
  };

  // Submit Card Details
  const handleCardPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16 || !cardExpiry || cardCvv.length < 3) {
      showToast('Please enter a valid card number, expiry date, and CVV.', 'error');
      return;
    }
    // Move to 4-digit PIN authorization step
    setStep('pin');
  };

  // Submit PIN
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardPin.length < 4) {
      showToast('Please enter your 4-digit card PIN', 'error');
      return;
    }
    setStep('processing');
    setTimeout(() => {
      // Prompt for 3D Secure OTP
      setStep('otp');
      setOtpCode('749201'); // Pre-suggested demo OTP
    }, 1200);
  };

  // Submit OTP
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      showToast('Please enter the OTP verification code sent by your bank', 'error');
      return;
    }
    setStep('processing');
    setTimeout(() => {
      completeSuccess('Debit Card');
    }, 1500);
  };

  // Transfer Verification
  const handleVerifyTransfer = () => {
    setStep('processing');
    setTimeout(() => {
      completeSuccess('Dedicated Virtual Account (Zenith Bank)');
    }, 2000);
  };

  // USSD Bank mapping
  const bankUssdMap: Record<string, { name: string; code: string }> = {
    gtbank: { name: 'GTBank', code: `*737*2*${Math.round(amount)}*4910#` },
    zenith: { name: 'Zenith Bank', code: `*966*00*${Math.round(amount)}#` },
    uba: { name: 'UBA', code: `*919*4*${Math.round(amount)}#` },
    access: { name: 'Access Bank', code: `*901*00*${Math.round(amount)}#` },
    firstbank: { name: 'First Bank', code: `*894*00*${Math.round(amount)}#` },
    stanbic: { name: 'Stanbic IBTC', code: `*909*22*${Math.round(amount)}#` },
  };

  const handleVerifyUssd = () => {
    setStep('processing');
    setTimeout(() => {
      completeSuccess(`USSD (${bankUssdMap[selectedBank]?.name || 'Bank'})`);
    }, 1800);
  };

  const completeSuccess = (channel: string) => {
    setStep('success');
    setTimeout(() => {
      onPaymentSuccess({
        reference: generatedRef,
        channel,
        paidAt: new Date().toISOString(),
        amount,
      });
      onClose();
    }, 1600);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div
      id="paystack-payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
    >
      <div
        id="paystack-payment-modal-card"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Gateway Header */}
        <div className="bg-[#002D72] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Cancel Payment"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-extrabold text-lg shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                  AjmanTech Services
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  PCI-DSS Verified
                </span>
              </div>
              <p className="text-slate-300 text-xs font-light">
                {customerEmail} • Ref: <span className="font-mono text-[11px] text-amber-300">{generatedRef}</span>
              </p>
            </div>
          </div>

          {/* Amount Badge */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-baseline justify-between">
            <span className="text-xs text-slate-300 font-light">Payment Amount:</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
              {formatNaira(amount)}
            </span>
          </div>
        </div>

        {/* Channel Navigation Tabs */}
        {step !== 'processing' && step !== 'success' && (
          <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveChannel('card');
                setStep('details');
              }}
              className={`flex-1 py-2.5 px-2 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeChannel === 'card'
                  ? 'bg-white text-[#002D72] shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Card</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveChannel('transfer');
                setStep('details');
              }}
              className={`flex-1 py-2.5 px-2 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeChannel === 'transfer'
                  ? 'bg-white text-[#002D72] shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Bank Transfer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveChannel('ussd');
                setStep('details');
              }}
              className={`flex-1 py-2.5 px-2 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeChannel === 'ussd'
                  ? 'bg-white text-[#002D72] shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>USSD</span>
            </button>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: PROCESSING OVERLAY */}
          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-[#0047AB] animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-[#002D72]">
                  Authorizing Payment with Bank...
                </h4>
                <p className="text-xs text-slate-500 font-light">
                  Connecting to Central Bank NIBSS interbank network. Please do not refresh.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: SUCCESS OVERLAY */}
          {step === 'success' && (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  APPROVED • {generatedRef}
                </span>
                <h4 className="font-extrabold text-xl text-[#002D72] pt-1">
                  Payment Successful!
                </h4>
                <p className="text-xs text-slate-600 font-light">
                  Generating your official stamped tax invoice and dispatch receipt...
                </p>
              </div>
            </div>
          )}

          {/* TAB A: DEBIT / CREDIT CARD */}
          {activeChannel === 'card' && (
            <>
              {step === 'details' && (
                <form onSubmit={handleCardPaySubmit} className="space-y-4">
                  {/* Card brand visual tags */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Enter Card Details
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      <span className={`px-2 py-0.5 rounded border ${cardType === 'mastercard' ? 'bg-orange-50 border-orange-400 text-orange-700 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        Mastercard
                      </span>
                      <span className={`px-2 py-0.5 rounded border ${cardType === 'visa' ? 'bg-blue-50 border-blue-400 text-blue-700 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        Visa
                      </span>
                      <span className={`px-2 py-0.5 rounded border ${cardType === 'verve' ? 'bg-teal-50 border-teal-400 text-teal-700 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        Verve
                      </span>
                    </div>
                  </div>

                  {/* Card Number Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0047AB] focus:outline-hidden"
                        required
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Expiry & CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0047AB] focus:outline-hidden text-center"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        CVV / CVC
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0047AB] focus:outline-hidden text-center"
                          required
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* One-click Test Card Fillers for instant testing */}
                  <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#002D72]">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Quick Test Cards (1-Click Auto-Fill):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => fillTestCard('verve')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-800 text-[11px] font-bold hover:bg-teal-50 cursor-pointer transition-colors shadow-2xs"
                      >
                        Verve Test Card
                      </button>
                      <button
                        type="button"
                        onClick={() => fillTestCard('mastercard')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-orange-200 text-orange-800 text-[11px] font-bold hover:bg-orange-50 cursor-pointer transition-colors shadow-2xs"
                      >
                        Mastercard Test
                      </button>
                      <button
                        type="button"
                        onClick={() => fillTestCard('visa')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-800 text-[11px] font-bold hover:bg-blue-50 cursor-pointer transition-colors shadow-2xs"
                      >
                        Visa Test
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Authorize {formatNaira(amount)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Step PIN */}
              {step === 'pin' && (
                <form onSubmit={handlePinSubmit} className="py-4 space-y-5 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0047AB] flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#002D72]">
                      Enter Your 4-Digit Card PIN
                    </h4>
                    <p className="text-xs text-slate-500 font-light mt-1">
                      Required by Nigerian Inter-Bank Settlement System (NIBSS)
                    </p>
                  </div>

                  <div className="max-w-[200px] mx-auto">
                    <input
                      type="password"
                      autoFocus
                      value={cardPin}
                      onChange={(e) => setCardPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      maxLength={4}
                      className="w-full py-3 bg-slate-50 border border-slate-300 rounded-2xl text-center text-xl font-mono tracking-widest font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0047AB] focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setCardPin('1234')}
                      className="text-[11px] text-[#0047AB] font-bold hover:underline"
                    >
                      Fill Demo PIN (1234)
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Continue to OTP Verification
                  </button>
                </form>
              )}

              {/* Step OTP */}
              {step === 'otp' && (
                <form onSubmit={handleOtpSubmit} className="py-4 space-y-5 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#002D72]">
                      Bank 3D-Secure SMS Code
                    </h4>
                    <p className="text-xs text-slate-500 font-light mt-1">
                      Enter the 6-digit OTP sent to your registered phone number
                    </p>
                  </div>

                  <div className="max-w-[220px] mx-auto">
                    <input
                      type="text"
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full py-3 bg-slate-50 border border-emerald-300 rounded-2xl text-center text-lg font-mono tracking-widest font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Confirm & Complete Payment
                  </button>
                </form>
              )}
            </>
          )}

          {/* TAB B: BANK TRANSFER (DYNAMIC VIRTUAL ACCOUNT) */}
          {activeChannel === 'transfer' && step === 'details' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-amber-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    Temporary Virtual Account
                  </span>
                  <span className="font-mono bg-amber-200/60 px-2 py-0.5 rounded text-amber-950 font-extrabold">
                    Expires in {formatTimer(transferTimer)}
                  </span>
                </div>
                <p className="text-amber-800 text-[11px] font-light">
                  Transfer exact amount to the dedicated Zenith Bank account below. Payment automatically verifies within 30 seconds of transfer!
                </p>
              </div>

              {/* Virtual Account Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Bank Name:</span>
                  <span className="font-extrabold text-slate-900">{virtualAccount.bankName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Account Name:</span>
                  <span className="font-bold text-slate-900">{virtualAccount.accountName}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Account Number
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-black text-[#0047AB] tracking-wider">
                      {virtualAccount.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(virtualAccount.accountNumber, 'Virtual Account Number')}
                    className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-[#002D72] text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleVerifyTransfer}
                  className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Have Sent {formatNaira(amount)}</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center font-light">
                  Powered by NIBSS Instant Payments (NIP) Gateway
                </p>
              </div>
            </div>
          )}

          {/* TAB C: USSD PAYMENTS */}
          {activeChannel === 'ussd' && step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Your Nigerian Bank
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0047AB]"
                >
                  <option value="gtbank">Guaranty Trust Bank (GTBank)</option>
                  <option value="zenith">Zenith Bank PLC</option>
                  <option value="uba">United Bank for Africa (UBA)</option>
                  <option value="access">Access Bank PLC</option>
                  <option value="firstbank">First Bank of Nigeria</option>
                  <option value="stanbic">Stanbic IBTC Bank</option>
                </select>
              </div>

              {/* Dial Box */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 text-center space-y-2 shadow-inner">
                <span className="text-[11px] text-slate-400 font-light">
                  Dial this code on your mobile phone:
                </span>
                <div className="font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-wider">
                  {bankUssdMap[selectedBank]?.code}
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankUssdMap[selectedBank]?.code, 'USSD Code')}
                    className="py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerifyUssd}
                className="w-full py-3.5 rounded-full bg-[#0047AB] hover:bg-[#002D72] text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>I Have Completed the USSD Prompt</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Safeguards */}
        <div className="bg-slate-50 border-t border-slate-100 p-3.5 text-center flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>Secured by Paystack Payments Limited • Licensed by Central Bank of Nigeria</span>
        </div>
      </div>
    </div>
  );
};
