import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, AlertTriangle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { Transaction, BankConfig, Language } from '../types';
import { translations } from '../i18n/translations';
import { storage } from '../services/storage';

interface VietQRPaymentModalProps {
  transaction: Transaction;
  bank: BankConfig;
  lang: Language;
  onClose: () => void;
  onPaymentSuccess: (tx: Transaction) => void;
  onCancelOrder: (id: string) => void;
}

export const VietQRPaymentModal: React.FC<VietQRPaymentModalProps> = ({
  transaction,
  bank,
  lang,
  onClose,
  onPaymentSuccess,
  onCancelOrder,
}) => {
  const t = translations[lang];

  // 15-minute countdown (900 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // VietQR Dynamic Image URL (Official VietQR standard template: compact2)
  const qrImageUrl = `https://img.vietqr.io/image/${bank.bankId}-${bank.accountNo}-compact2.jpg?amount=${transaction.amount}&addInfo=${transaction.id}&accountName=${encodeURIComponent(bank.accountName)}`;

  // Polling listener for transaction status changes
  useEffect(() => {
    const checkStatus = () => {
      const current = storage.getTransactionById(transaction.id);
      if (current && current.status === 'SUCCESS') {
        onPaymentSuccess(current);
      } else if (current && (current.status === 'EXPIRED' || current.status === 'CANCELLED')) {
        onClose();
      }
    };

    const interval = setInterval(checkStatus, 2500);

    // Also listen to custom storage events
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
  }, [transaction.id, onPaymentSuccess, onClose]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      storage.updateTransactionStatus(transaction.id, 'EXPIRED');
      onClose();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, transaction.id, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VietQR-${transaction.id}-${transaction.amount}VND.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(qrImageUrl, '_blank');
    }
  };

  // Instant simulator for testing the SePay Webhook flow
  const handleSimulatePayment = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const mockBankRef = `MB${Math.floor(100000000 + Math.random() * 900000000)}`;
      const result = storage.processSepayWebhook({
        id: Date.now(),
        gateway: bank.bankId,
        transactionDate: new Date().toISOString(),
        accountNumber: bank.accountNo,
        transferAmount: transaction.amount,
        content: `Mã giao dịch ${transaction.id} ung ho ca phe`,
        referenceCode: mockBankRef,
      });

      setIsSimulating(false);
      if (result.success && result.transaction) {
        onPaymentSuccess(result.transaction);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 overflow-hidden my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label={t.vietqrModal.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>VietQR Chuyển khoản tự động 24/7</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
            {t.vietqrModal.title}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {t.vietqrModal.subtitle}
          </p>

          {/* Countdown badge */}
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200/60 dark:border-amber-900/60">
            <span>{t.vietqrModal.timeRemaining}</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative p-2.5 bg-white rounded-2xl shadow-md border border-stone-200 dark:border-stone-700 max-w-[240px] sm:max-w-[260px] w-full">
            <img
              src={qrImageUrl}
              alt={`VietQR ${transaction.id}`}
              className="w-full h-auto rounded-lg object-contain"
            />
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleDownloadQR}
              className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 font-medium px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.vietqrModal.downloadQR}</span>
            </button>
          </div>
        </div>

        {/* Bank & Transfer Details */}
        <div className="bg-stone-50 dark:bg-stone-800/70 rounded-xl p-3.5 sm:p-4 space-y-2.5 text-xs sm:text-sm border border-stone-200/80 dark:border-stone-700/60">
          
          {/* Bank */}
          <div className="flex items-center justify-between">
            <span className="text-stone-500 dark:text-stone-400">{t.vietqrModal.bankName}</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{bank.bankName}</span>
          </div>

          {/* Account Number */}
          <div className="flex items-center justify-between">
            <span className="text-stone-500 dark:text-stone-400">{t.vietqrModal.accountNo}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
                {bank.accountNo}
              </span>
              <button
                onClick={() => copyToClipboard(bank.accountNo, 'accountNo')}
                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
                title={t.vietqrModal.copy}
              >
                {copiedField === 'accountNo' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Account Holder Name */}
          <div className="flex items-center justify-between">
            <span className="text-stone-500 dark:text-stone-400">{t.vietqrModal.accountName}</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 uppercase">
              {bank.accountName}
            </span>
          </div>

          {/* Exact Amount */}
          <div className="flex items-center justify-between border-t border-stone-200 dark:border-stone-700 pt-2">
            <span className="text-stone-500 dark:text-stone-400">{t.vietqrModal.amount}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                {transaction.amount.toLocaleString('vi-VN')} đ
              </span>
              <button
                onClick={() => copyToClipboard(String(transaction.amount), 'amount')}
                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
                title={t.vietqrModal.copy}
              >
                {copiedField === 'amount' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Transfer Memo / Code */}
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-300 dark:border-amber-800">
            <div>
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-400 block">
                {t.vietqrModal.memo}
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-sm">
                {transaction.id}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(transaction.id, 'memo')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
            >
              {copiedField === 'memo' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>{t.vietqrModal.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>{t.vietqrModal.copy}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning memo note */}
        <div className="flex items-start gap-2 mt-3 text-xs text-amber-800 dark:text-amber-400/90 leading-tight">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
          <span>{t.vietqrModal.memoWarning}</span>
        </div>

        {/* Live Listening Status */}
        <div className="flex items-center justify-center gap-2 mt-4 py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500 shrink-0" />
          <span>{t.vietqrModal.waitingStatus}</span>
        </div>

        {/* Testing Webhook Simulator Button */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-2">
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulatePayment}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isSimulating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{t.vietqrModal.simulatePaymentBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => onCancelOrder(transaction.id)}
            className="text-xs text-stone-500 hover:text-red-500 dark:hover:text-red-400 py-1 transition-colors"
          >
            {t.vietqrModal.cancelOrder}
          </button>
        </div>

      </div>
    </div>
  );
};
