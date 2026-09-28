import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Globe2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Transaction, Language } from '../types';
import { translations } from '../i18n/translations';
import { storage } from '../services/storage';

interface Tip4ServPaymentModalProps {
  transaction: Transaction;
  tip4servUrl: string;
  lang: Language;
  onClose: () => void;
  onPaymentSuccess: (tx: Transaction) => void;
  onCancelOrder: (id: string) => void;
}

export const Tip4ServPaymentModal: React.FC<Tip4ServPaymentModalProps> = ({
  transaction,
  tip4servUrl,
  lang,
  onClose,
  onPaymentSuccess,
  onCancelOrder,
}) => {
  const t = translations[lang];
  const [isSimulating, setIsSimulating] = useState(false);

  // Polling listener for transaction status changes
  useEffect(() => {
    const checkStatus = () => {
      const current = storage.getTransactionById(transaction.id);
      if (current && current.status === 'SUCCESS') {
        onPaymentSuccess(current);
      }
    };

    const interval = setInterval(checkStatus, 2500);

    const handleTxUpdate = (e: any) => {
      if (e.detail && e.detail.id === transaction.id && e.detail.status === 'SUCCESS') {
        onPaymentSuccess(e.detail);
      }
    };

    window.addEventListener('bmc-transaction-updated', handleTxUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bmc-transaction-updated', handleTxUpdate);
    };
  }, [transaction.id, onPaymentSuccess]);

  const handleSimulateTip4serv = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const mockRef = `T4S-INV-${Math.floor(10000 + Math.random() * 90000)}`;
      const result = storage.processTip4servWebhook(transaction.id, transaction.amount, mockRef);
      setIsSimulating(false);
      if (result.success && result.transaction) {
        onPaymentSuccess(result.transaction);
      }
    }, 800);
  };

  const handleProceedTip4Serv = () => {
    const targetUrl = `${tip4servUrl || 'https://tip4serv.com'}?order_id=${transaction.id}&amount=${transaction.amount}&currency=USD`;
    window.open(targetUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 overflow-hidden my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Tip4Serv International Gateway</span>
          </div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            {t.tip4servModal.title}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {t.tip4servModal.subtitle}
          </p>
        </div>

        {/* Summary Card */}
        <div className="my-5 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center">
            <span className="text-stone-500">{t.tip4servModal.referenceCode}</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
              {transaction.id}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-stone-500">{t.tip4servModal.donor}</span>
            <span className="font-medium text-stone-900 dark:text-stone-100">
              {transaction.isAnonymous ? 'Ẩn danh' : transaction.donorName}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-stone-200 dark:border-stone-700 pt-2">
            <span className="text-stone-500">{t.tip4servModal.amountDue}</span>
            <span className="font-bold text-base text-indigo-600 dark:text-indigo-400">
              ${transaction.amount.toFixed(2)} USD ({transaction.coffeeCount} ☕)
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleProceedTip4Serv}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>{t.tip4servModal.proceedBtn}</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Status listener banner */}
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 shrink-0" />
            <span>{t.tip4servModal.waitingVerification}</span>
          </div>

          {/* Test simulator button */}
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulateTip4serv}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            {isSimulating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{t.tip4servModal.simulateSuccessBtn}</span>
          </button>

          <div className="text-center pt-2">
            <button
              onClick={() => onCancelOrder(transaction.id)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
            >
              {t.tip4servModal.cancelOrder}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
