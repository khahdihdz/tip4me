import React from 'react';
import { X, CheckCircle2, Clock, XCircle, AlertCircle, Shield, FileText, ArrowRight } from 'lucide-react';
import { Transaction, TransactionStatus, Language } from '../types';
import { translations } from '../i18n/translations';

interface TransactionDetailModalProps {
  transaction: Transaction;
  lang: Language;
  onClose: () => void;
  onUpdateStatus: (id: string, status: TransactionStatus) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  lang,
  onClose,
  onUpdateStatus,
}) => {
  const t = translations[lang];

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SUCCESS</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>PENDING</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>EXPIRED</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
              Chi tiết giao dịch {transaction.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata List */}
        <div className="my-4 space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-500">Trạng thái:</span>
            {getStatusBadge(transaction.status)}
          </div>
          <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-500">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{transaction.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-500">Người ủng hộ:</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {transaction.isAnonymous ? 'Ẩn danh' : transaction.donorName}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-500">Số tiền:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {transaction.currency === 'VND'
                ? `${transaction.amount.toLocaleString('vi-VN')} VND`
                : `$${transaction.amount.toFixed(2)} USD`}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-500">Số ly cà phê:</span>
            <span className="font-bold">{transaction.coffeeCount} ☕</span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-500">Cổng thanh toán:</span>
            <span className="uppercase font-semibold text-stone-700 dark:text-stone-300">
              {transaction.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-500">Mã tham chiếu ngân hàng:</span>
            <span className="font-mono text-stone-700 dark:text-stone-300">
              {transaction.bankTransactionId || 'Chưa có'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-500">Thời gian tạo:</span>
            <span className="text-stone-700 dark:text-stone-300 tabular-nums">
              {new Date(transaction.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>
          {transaction.paidAt && (
            <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
              <span className="text-stone-500">Thời gian thanh toán:</span>
              <span className="text-stone-700 dark:text-stone-300 tabular-nums">
                {new Date(transaction.paidAt).toLocaleString('vi-VN')}
              </span>
            </div>
          )}

          {transaction.message && (
            <div className="pt-2">
              <span className="text-stone-500 block mb-1">Lời nhắn:</span>
              <p className="bg-stone-50 dark:bg-stone-800 p-2.5 rounded-lg text-xs italic border border-stone-200 dark:border-stone-700">
                "{transaction.message}"
              </p>
            </div>
          )}

          {transaction.rawWebhookPayload && (
            <div className="pt-2">
              <span className="text-stone-500 block mb-1">Dữ liệu Webhook nhận được (Raw JSON):</span>
              <pre className="p-2 bg-stone-900 text-emerald-400 rounded-lg text-[10px] overflow-x-auto max-h-32 font-mono">
                {JSON.stringify(transaction.rawWebhookPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Manual Status Override buttons */}
        <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block mb-2">
            Thao tác quản trị (Manual Override):
          </span>
          <div className="flex flex-wrap gap-2">
            {transaction.status !== 'SUCCESS' && (
              <button
                onClick={() => {
                  onUpdateStatus(transaction.id, 'SUCCESS');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Xác nhận Thành công (SUCCESS)
              </button>
            )}
            {transaction.status !== 'CANCELLED' && (
              <button
                onClick={() => {
                  onUpdateStatus(transaction.id, 'CANCELLED');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-semibold"
              >
                Hủy đơn (CANCELLED)
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
