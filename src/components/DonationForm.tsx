import React, { useState } from 'react';
import { Coffee, QrCode, Globe2, ShieldCheck, Heart, Sparkles, AlertCircle } from 'lucide-react';
import { Language, PaymentMethod, CreatorProfile } from '../types';
import { translations } from '../i18n/translations';

interface DonationFormProps {
  creator: CreatorProfile;
  lang: Language;
  onSubmitDonation: (params: {
    donorName: string;
    message: string;
    amount: number;
    currency: 'VND' | 'USD';
    coffeeCount: number;
    paymentMethod: PaymentMethod;
    isAnonymous: boolean;
  }) => void;
}

const PRESET_OPTIONS = [1, 3, 5, 10];

const formatVNDInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('vi-VN');
};

const parseCustomAmount = (value: string): number => {
  if (!value) return 0;
  return Number(value.replace(/\D/g, '')) || 0;
};

const vietnameseNumberToWords = (value: number): string => {
  const n = Math.floor(Math.abs(value));
  if (!Number.isFinite(n) || n === 0) return 'không đồng';
  if (n > 999_999_999_999_999) return 'Số tiền quá lớn';

  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const readGroup = (num: number, full: boolean): string => {
    const hundred = Math.floor(num / 100);
    const ten = Math.floor((num % 100) / 10);
    const unit = num % 10;
    const parts: string[] = [];
    if (hundred > 0 || full) parts.push(digits[hundred], 'trăm');
    if (ten > 1) {
      parts.push(digits[ten], 'mươi');
      if (unit === 1) parts.push('mốt');
      else if (unit === 5) parts.push('lăm');
      else if (unit > 0) parts.push(digits[unit]);
    } else if (ten === 1) {
      parts.push('mười');
      if (unit === 5) parts.push('lăm');
      else if (unit > 0) parts.push(digits[unit]);
    } else if (unit > 0) {
      if (hundred > 0 || full) parts.push('lẻ');
      parts.push(digits[unit]);
    }
    return parts.join(' ');
  };

  const units = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ'];
  const groups: number[] = [];
  let remaining = n;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }
  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group === 0) continue;
    const full = i < groups.length - 1 && group < 100;
    words.push(readGroup(group, full) + units[i]);
  }
  const result = words.join(' ').replace(/\s+/g, ' ').trim();
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
};

export const DonationForm: React.FC<DonationFormProps> = ({
  creator,
  lang,
  onSubmitDonation,
}) => {
  const t = translations[lang];

  const [selectedCount, setSelectedCount] = useState<number>(3);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  
  // Method defaults to vietqr for vi, tip4serv for en (user can switch anytime)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    lang === 'vi' ? 'vietqr' : 'tip4serv'
  );

  const [currency, setCurrency] = useState<'VND' | 'USD'>(
    lang === 'vi' ? 'VND' : 'USD'
  );

  const [donorName, setDonorName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Handle switching payment method updates currency
  const handleSelectMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'vietqr') {
      setCurrency('VND');
    } else {
      setCurrency('USD');
    }
    setErrorMsg('');
  };

  // Calculate final amount & coffee count
  const unitPrice = currency === 'VND' ? creator.coffeePriceVND : creator.coffeePriceUSD;

  let totalAmount = 0;
  let finalCoffeeCount = selectedCount;

  if (isCustom) {
    const val = currency === 'VND' ? parseCustomAmount(customAmount) : (parseFloat(customAmount) || 0);
    totalAmount = val;
    finalCoffeeCount = Math.max(1, Math.round(val / unitPrice));
  } else {
    totalAmount = selectedCount * unitPrice;
    finalCoffeeCount = selectedCount;
  }

  const formatAmount = (val: number, cur: 'VND' | 'USD') => {
    if (cur === 'VND') {
      return `${Math.round(val).toLocaleString('vi-VN')} ₫`;
    }
    return `$${val.toFixed(val % 1 === 0 ? 0 : 2)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (currency === 'VND' && totalAmount < 10000) {
      setErrorMsg(t.donation.minAmountWarning);
      return;
    }
    if (currency === 'USD' && totalAmount < 1) {
      setErrorMsg(t.donation.minAmountWarning);
      return;
    }

    onSubmitDonation({
      donorName: isAnonymous ? 'Ẩn danh' : donorName,
      message,
      amount: totalAmount,
      currency,
      coffeeCount: finalCoffeeCount,
      paymentMethod,
      isAnonymous,
    });
  };

  return (
    <div id="donate" className="w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Coffee className="w-4 h-4" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {t.donation.title}
        </h2>
      </div>
      <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
        {t.donation.subtitle}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Preset Coffees Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
            {t.donation.selectCoffees}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESET_OPTIONS.map((count) => {
              const active = !isCustom && selectedCount === count;
              const priceVal = count * unitPrice;
              return (
                <button
                  type="button"
                  key={count}
                  onClick={() => {
                    setSelectedCount(count);
                    setIsCustom(false);
                    setErrorMsg('');
                  }}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    active
                      ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                      : 'border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-stone-600 bg-white dark:bg-stone-800/60 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-base">
                    <span>☕ × {count}</span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums font-medium">
                    {formatAmount(priceVal, currency)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Toggle & Input */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setIsCustom(!isCustom);
                if (!isCustom && !customAmount) {
                  setCustomAmount(currency === 'VND' ? '50000' : '5');
                }
              }}
              className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline inline-flex items-center gap-1"
            >
              <span>{isCustom ? (lang === 'vi' ? '← Quay lại chọn gói cà phê có sẵn' : '← Back to presets') : (lang === 'vi' ? '+ Nhập số tiền tùy chỉnh' : '+ Enter custom amount')}</span>
            </button>

            {isCustom && (
              <div className="mt-2 relative">
                <input
                  type={currency === 'VND' ? 'text' : 'number'}
                  inputMode={currency === 'VND' ? 'numeric' : 'decimal'}
                  min={currency === 'VND' ? 10000 : 1}
                  step={currency === 'VND' ? 5000 : 1}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(currency === 'VND' ? formatVNDInput(e.target.value) : e.target.value)}
                  placeholder={currency === 'VND' ? 'Ví dụ: 100.000' : 'e.g. 15'}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-stone-500">
                  {currency === 'VND' ? '₫' : 'USD'}
                </span>
                {currency === 'VND' && parseCustomAmount(customAmount) > 0 && (
                  <p aria-live="polite" className="mt-2 text-sm leading-relaxed text-emerald-600 dark:text-emerald-400">
                    Bằng chữ: {vietnameseNumberToWords(parseCustomAmount(customAmount))}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Payment Gateway Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
            {t.donation.paymentMethodLabel}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* VietQR Option */}
            <button
              type="button"
              onClick={() => handleSelectMethod('vietqr')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                paymentMethod === 'vietqr'
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-stone-900 dark:text-stone-100 ring-2 ring-emerald-500/20'
                  : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-800/60 text-stone-700 dark:text-stone-300'
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm">VietQR (Ngân hàng VN)</span>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">Tự động 24/7</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  {t.donation.methodVietQRDesc}
                </p>
              </div>
            </button>

            {/* Tip4Serv Option */}
            <button
              type="button"
              onClick={() => handleSelectMethod('tip4serv')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                paymentMethod === 'tip4serv'
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 text-stone-900 dark:text-stone-100 ring-2 ring-indigo-500/20'
                  : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-800/60 text-stone-700 dark:text-stone-300'
              }`}
            >
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Globe2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm">Tip4Serv (International)</span>
                  <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">Cards & PayPal</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  {t.donation.methodTip4ServDesc}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 3: Donor Name & Anonymous */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              {t.donation.donorNameLabel}
            </label>
            <input
              type="text"
              disabled={isAnonymous}
              value={isAnonymous ? (lang === 'vi' ? 'Ẩn danh' : 'Anonymous') : donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder={t.donation.donorNamePlaceholder}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500"
            />
            <span className="text-xs text-stone-600 dark:text-stone-300">
              {t.donation.anonymousLabel}
            </span>
          </label>
        </div>

        {/* Step 4: Message */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
            {t.donation.messageLabel}
          </label>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.donation.messagePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            maxLength={250}
          />
          {/* Quick emoji cheer suggestions */}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-500">
            <span>Gợi ý:</span>
            {['☕', '🚀', '❤️', '🔥', '✨', '👏'].map((em) => (
              <button
                type="button"
                key={em}
                onClick={() => setMessage((prev) => prev + em)}
                className="hover:scale-125 transition-transform"
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-900/60">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <div>
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>
              {t.donation.submitButton} · {formatAmount(totalAmount, currency)} ({finalCoffeeCount} ☕)
            </span>
          </button>
          
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-stone-500 dark:text-stone-400 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{t.donation.secureNotice}</span>
          </div>
        </div>

      </form>
    </div>
  );
};
