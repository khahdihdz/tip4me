import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Coffee, Heart, Share2, Sparkles, X } from 'lucide-react';
import { Transaction, Language } from '../types';
import { translations } from '../i18n/translations';

interface PaymentSuccessModalProps {
  transaction: Transaction;
  lang: Language;
  onClose: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  transaction,
  lang,
  onClose,
}) => {
  const t = translations[lang];

  // Fire celebratory confetti when modal mounts
  useEffect(() => {
    try {
      // First burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });

      // Second delayed burst for fanfare
      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 350);

      return () => clearTimeout(timer);
    } catch {
      // Safe fallback if canvas-confetti is not loaded
    }
  }, []);

  const formatAmount = (tx: Transaction) => {
    if (tx.currency === 'VND') {
      return `${tx.amount.toLocaleString('vi-VN')} đ`;
    }
    return `$${tx.amount.toFixed(2)} USD`;
  };

  const handleShareDonation = () => {
    const text = `Tôi vừa mời ${transaction.coffeeCount} ly cà phê tiếp lửa sáng tạo trên Buy Me a Coffee VN! ☕✨`;
    if (navigator.share) {
      navigator.share({
        title: 'Buy Me a Coffee VN',
        text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      alert('Đã sao chép nội dung chia sẻ vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 text-center my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Celebration Icon */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/30">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {t.successModal.celebrateTitle}
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 mb-6">
          {t.successModal.celebrateSubtitle}
        </p>

        {/* Receipt Card */}
        <div className="bg-stone-50 dark:bg-stone-800/80 rounded-2xl p-4 sm:p-5 text-left border border-stone-200/80 dark:border-stone-700/60 space-y-2.5 text-xs sm:text-sm">
          
          <div className="flex justify-between items-center">
            <span className="text-stone-500 dark:text-stone-400">{t.successModal.donorName}</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {transaction.isAnonymous ? 'Ẩn danh' : transaction.donorName}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-500 dark:text-stone-400">{t.successModal.coffees}</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5" />
              <span>{transaction.coffeeCount} ly cà phê</span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-500 dark:text-stone-400">{t.successModal.amountPaid}</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-sm sm:text-base">
              {formatAmount(transaction)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-500 dark:text-stone-400">{t.successModal.orderCode}</span>
            <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
              {transaction.id}
            </span>
          </div>

          {transaction.bankTransactionId && (
            <div className="flex justify-between items-center">
              <span className="text-stone-500 dark:text-stone-400">{t.successModal.bankRef}</span>
              <span className="font-mono text-stone-600 dark:text-stone-400 text-xs">
                {transaction.bankTransactionId}
              </span>
            </div>
          )}

          {transaction.message && (
            <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
                {t.successModal.message}
              </span>
              <p className="text-xs text-stone-800 dark:text-stone-200 italic bg-white dark:bg-stone-900/60 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
                "{transaction.message}"
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleShareDonation}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ niềm vui lên mạng xã hội</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-xs transition-colors"
          >
            {t.successModal.backHome}
          </button>
        </div>

      </div>
    </div>
  );
};
