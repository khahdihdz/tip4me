import React, { useState } from 'react';
import {
  X,
  Shield,
  LayoutDashboard,
  Receipt,
  Settings,
  Terminal,
  Activity,
  LogOut,
  Github,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Filter,
  ExternalLink,
  Save,
  Check,
} from 'lucide-react';
import {
  AppSettings,
  Transaction,
  ActivityLog,
  AdminUser,
  TransactionStatus,
  Language,
} from '../types';
import { SUPPORTED_BANKS } from '../data/initialData';
import { storage } from '../services/storage';
import { translations } from '../i18n/translations';
import { TransactionDetailModal } from './TransactionDetailModal';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  transactions: Transaction[];
  onUpdateTransactionStatus: (id: string, status: TransactionStatus) => void;
  logs: ActivityLog[];
  user: AdminUser | null;
  onLoginGithub: () => void;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  lang,
  settings,
  onUpdateSettings,
  transactions,
  onUpdateTransactionStatus,
  logs,
  user,
  onLoginGithub,
  onLogout,
}) => {
  const t = translations[lang].admin;
  const common = translations[lang].common;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'settings' | 'simulator' | 'logs'>('dashboard');

  // Login form state

  // Transactions Filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<AppSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Webhook Simulator State
  const [simOrderId, setSimOrderId] = useState<string>('');
  const [simAmount, setSimAmount] = useState<number>(105000);
  const [simContent, setSimContent] = useState<string>('');
  const [simResult, setSimResult] = useState<any>(null);

  if (!isOpen) return null;

  // If not logged in, render Admin Authentication Gate
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {t.title}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {t.loginSubtitle}
            </p>
          </div>

          {/* GitHub OAuth Button */}
          <div className="space-y-4">
            <button
              onClick={onLoginGithub}
              className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer"
            >
              <Github className="w-5 h-5" />
              <span>{t.loginWithGithub}</span>
            </button>

            <p className="text-xs text-center text-stone-500">Only authorized GitHub accounts can access this portal.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- STATS CALCULATION ---
  const totalVND = transactions
    .filter((tx) => tx.status === 'SUCCESS' && tx.currency === 'VND')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalUSD = transactions
    .filter((tx) => tx.status === 'SUCCESS' && tx.currency === 'USD')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalCoffees = transactions
    .filter((tx) => tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + tx.coffeeCount, 0);

  const successCount = transactions.filter((tx) => tx.status === 'SUCCESS').length;
  const pendingCount = transactions.filter((tx) => tx.status === 'PENDING').length;
  const totalCount = transactions.length;
  const conversionRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || tx.paymentMethod === methodFilter;
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      tx.id.toLowerCase().includes(term) ||
      tx.donorName.toLowerCase().includes(term) ||
      (tx.message && tx.message.toLowerCase().includes(term)) ||
      (tx.bankTransactionId && tx.bankTransactionId.toLowerCase().includes(term));
    return matchesStatus && matchesMethod && matchesSearch;
  });

  // Handle Export CSV
  const handleExportCSV = () => {
    const csvContent = storage.exportTransactionsToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BuyMeACoffee-Transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handle Dispatch Simulated Webhook
  const handleDispatchSimulator = () => {
    let orderToTest = simOrderId;
    if (!orderToTest) {
      const firstPending = transactions.find((t) => t.status === 'PENDING');
      if (firstPending) {
        orderToTest = firstPending.id;
      } else if (transactions.length > 0) {
        orderToTest = transactions[0].id;
      } else {
        orderToTest = 'BMC99999';
      }
    }

    const contentStr = simContent || `Thanh toan don hang ${orderToTest} chuyen tien`;
    const bankRef = `FT${Date.now().toString().slice(-8)}`;

    const res = storage.processSepayWebhook({
      id: Date.now(),
      gateway: settings.bank.bankId,
      transactionDate: new Date().toISOString(),
      accountNumber: settings.bank.accountNo,
      transferAmount: simAmount,
      content: contentStr,
      referenceCode: bankRef,
    });

    setSimResult({
      dispatchedAt: new Date().toLocaleTimeString(),
      matchedOrder: orderToTest,
      transferAmount: simAmount,
      content: contentStr,
      result: res,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-hidden my-4">
        
        {/* Top bar inside portal */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-stone-50 dark:bg-stone-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  {t.title}
                </h2>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Admin Active
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Đăng nhập: <strong className="text-stone-700 dark:text-stone-300">@{user.username}</strong> ({user.authenticatedVia})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 dark:bg-stone-700 hover:bg-red-100 dark:hover:bg-red-950/40 text-stone-700 dark:text-stone-300 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{translations[lang].nav.logout}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-stone-200 dark:border-stone-800 px-4 gap-2 bg-white dark:bg-stone-900 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t.dashboardTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'transactions'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{t.transactionsTab}</span>
            <span className="text-[10px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded-full tabular-nums">
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.settingsTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'simulator'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span>{t.webhookTestTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'logs'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t.logsTab}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
                  <span className="text-xs text-amber-900 dark:text-amber-400 font-medium block">
                    {t.stats.totalVND}
                  </span>
                  <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                    {totalVND.toLocaleString('vi-VN')} đ
                  </div>
                  <span className="text-[11px] text-stone-500 mt-1 block">Cổng VietQR SePay</span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40">
                  <span className="text-xs text-indigo-900 dark:text-indigo-400 font-medium block">
                    {t.stats.totalUSD}
                  </span>
                  <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                    ${totalUSD.toFixed(2)} USD
                  </div>
                  <span className="text-[11px] text-stone-500 mt-1 block">Cổng Tip4Serv Quốc tế</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40">
                  <span className="text-xs text-emerald-900 dark:text-emerald-400 font-medium block">
                    {t.stats.totalCoffees}
                  </span>
                  <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                    {totalCoffees} ☕
                  </div>
                  <span className="text-[11px] text-stone-500 mt-1 block">{successCount} đơn hoàn tất</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
                  <span className="text-xs text-stone-600 dark:text-stone-400 font-medium block">
                    {t.stats.conversionRate}
                  </span>
                  <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                    {conversionRate}%
                  </div>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
                    {pendingCount} đơn đang PENDING
                  </span>
                </div>
              </div>

              {/* Quick Action: Pending Queue */}
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 bg-stone-50/60 dark:bg-stone-800/40">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Giao dịch đang chờ xác nhận ({pendingCount})
                  </h4>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    Xem tất cả giao dịch →
                  </button>
                </div>

                {pendingCount === 0 ? (
                  <p className="text-xs text-stone-500 py-3 text-center">
                    Không có đơn nào đang chờ xử lý. Mọi thanh toán đã được xác nhận tự động! ✨
                  </p>
                ) : (
                  <div className="space-y-2">
                    {transactions
                      .filter((tx) => tx.status === 'PENDING')
                      .slice(0, 3)
                      .map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {tx.id}
                            </span>
                            <span className="font-medium text-stone-900 dark:text-stone-100">
                              {tx.donorName}
                            </span>
                            <span className="text-stone-500">
                              {tx.currency === 'VND' ? `${tx.amount.toLocaleString()} VND` : `$${tx.amount}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSimOrderId(tx.id);
                                setSimAmount(tx.amount);
                                setSimContent(`Chuyen tien don ${tx.id}`);
                                setActiveTab('simulator');
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 text-[11px] font-semibold"
                            >
                              ⚡ Test Webhook SePay
                            </button>
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 text-[11px]"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TRANSACTIONS LEDGER */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  {/* Search */}
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.filters.searchPlaceholder}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="py-1.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:outline-none"
                  >
                    <option value="ALL">{t.filters.statusAll}</option>
                    <option value="SUCCESS">{t.filters.statusSuccess}</option>
                    <option value="PENDING">{t.filters.statusPending}</option>
                    <option value="EXPIRED">{t.filters.statusExpired}</option>
                    <option value="CANCELLED">{t.filters.statusCancelled}</option>
                  </select>

                  {/* Gateway filter */}
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="py-1.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:outline-none"
                  >
                    <option value="ALL">{t.filters.gatewayAll}</option>
                    <option value="vietqr">VietQR (SePay)</option>
                    <option value="tip4serv">Tip4Serv</option>
                  </select>
                </div>

                {/* Export CSV button */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.filters.exportCSV}</span>
                </button>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">{t.table.orderId}</th>
                      <th className="p-3">{t.table.donor}</th>
                      <th className="p-3">{t.table.amount}</th>
                      <th className="p-3">{t.table.gateway}</th>
                      <th className="p-3">{t.table.status}</th>
                      <th className="p-3">{t.table.bankRef}</th>
                      <th className="p-3">{t.table.createdAt}</th>
                      <th className="p-3 text-right">{t.table.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-stone-400">
                          Không tìm thấy giao dịch nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                        >
                          <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {tx.id}
                          </td>
                          <td className="p-3 font-medium text-stone-900 dark:text-stone-100">
                            {tx.isAnonymous ? 'Ẩn danh' : tx.donorName}
                          </td>
                          <td className="p-3 font-mono font-bold tabular-nums">
                            {tx.currency === 'VND'
                              ? `${tx.amount.toLocaleString('vi-VN')} đ`
                              : `$${tx.amount.toFixed(2)}`}
                          </td>
                          <td className="p-3 uppercase text-[11px] font-semibold text-stone-500">
                            {tx.paymentMethod}
                          </td>
                          <td className="p-3">
                            {tx.status === 'SUCCESS' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                SUCCESS
                              </span>
                            )}
                            {tx.status === 'PENDING' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                PENDING
                              </span>
                            )}
                            {tx.status === 'EXPIRED' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600">
                                EXPIRED
                              </span>
                            )}
                            {tx.status === 'CANCELLED' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                                CANCELLED
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-stone-500">
                            {tx.bankTransactionId || '—'}
                          </td>
                          <td className="p-3 text-[11px] text-stone-500 tabular-nums">
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium transition-colors"
                            >
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              {/* Bank Settings */}
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 space-y-3">
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {t.settings.bankTitle}
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.bankSelect}
                  </label>
                  <select
                    value={settingsForm.bank.bankId}
                    onChange={(e) => {
                      const bankId = e.target.value;
                      const found = SUPPORTED_BANKS.find((b) => b.id === bankId);
                      setSettingsForm({
                        ...settingsForm,
                        bank: {
                          ...settingsForm.bank,
                          bankId,
                          bankName: found ? found.name : bankId,
                        },
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  >
                    {SUPPORTED_BANKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.accountNo}
                  </label>
                  <input
                    type="text"
                    value={settingsForm.bank.accountNo}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        bank: { ...settingsForm.bank, accountNo: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.accountName}
                  </label>
                  <input
                    type="text"
                    value={settingsForm.bank.accountName}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        bank: { ...settingsForm.bank, accountName: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs uppercase"
                    required
                  />
                </div>
              </div>

              {/* SePay Config */}
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 space-y-3">
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {t.settings.sepayTitle}
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.sepayApiKey}
                  </label>
                  <input
                    type="password"
                    value={settingsForm.sepayApiKey}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, sepayApiKey: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  {t.settings.sepayWebhookUrlNote}
                </p>
              </div>

              {/* Tip4Serv Config */}
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 space-y-3">
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {t.settings.tip4servTitle}
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.tip4servKey}
                  </label>
                  <input
                    type="password"
                    value={settingsForm.tip4servApiKey}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, tip4servApiKey: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.tip4servUrl}
                  </label>
                  <input
                    type="text"
                    value={settingsForm.tip4servShopUrl}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, tip4servShopUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
              </div>

              {/* Remote Google Apps Script Web App URL */}
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 space-y-3">
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {t.settings.gasTitle}
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.gasUrl}
                  </label>
                  <input
                    type="url"
                    value={settingsForm.googleAppsScriptUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, googleAppsScriptUrl: e.target.value })
                    }
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    {t.settings.gasHelp}
                  </p>
                </div>
              </div>

              {/* Creator Profile */}
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 space-y-3">
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {t.settings.creatorTitle}
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.creatorName}
                  </label>
                  <input
                    type="text"
                    value={settingsForm.creator.name}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        creator: { ...settingsForm.creator, name: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.creatorTagline}
                  </label>
                  <input
                    type="text"
                    value={settingsForm.creator.tagline}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        creator: { ...settingsForm.creator, tagline: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.creatorBio}
                  </label>
                  <textarea
                    rows={3}
                    value={settingsForm.creator.bio}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        creator: { ...settingsForm.creator, bio: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {lang === 'vi' ? 'Tên mục tiêu cộng đồng' : 'Community goal title'}
                  </label>
                  <input
                    type="text"
                    value={settingsForm.creator.goal.title}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        creator: {
                          ...settingsForm.creator,
                          goal: {
                            ...settingsForm.creator.goal,
                            title: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder={lang === 'vi' ? 'Ví dụ: Nâng cấp máy chủ' : 'e.g. Upgrade the server'}
                    maxLength={120}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.settings.targetCoffees}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={settingsForm.creator.goal.targetCoffees}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        creator: {
                          ...settingsForm.creator,
                          goal: {
                            ...settingsForm.creator.goal,
                            targetCoffees: parseInt(e.target.value, 10) || 100,
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.settings.saveBtn}</span>
                </button>
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-4 h-4" />
                    <span>{t.settings.savedSuccess}</span>
                  </span>
                )}
              </div>
            </form>
          )}

          {/* TAB 4: WEBHOOK SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <span>{t.simulator.title}</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  {t.simulator.desc}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.simulator.orderToTest}
                  </label>
                  <select
                    value={simOrderId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSimOrderId(id);
                      const tx = transactions.find((t) => t.id === id);
                      if (tx) {
                        setSimAmount(tx.amount);
                        setSimContent(`Thanh toan ma ${tx.id}`);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                  >
                    <option value="">-- Chọn đơn hàng từ danh sách --</option>
                    {transactions.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {tx.id} - {tx.donorName} ({tx.amount.toLocaleString()} {tx.currency}) [{tx.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.simulator.amountTransfer}
                  </label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {t.simulator.contentTransfer}
                  </label>
                  <input
                    type="text"
                    value={simContent}
                    onChange={(e) => setSimContent(e.target.value)}
                    placeholder="VD: MBBank chuyen tien don BMC94821"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDispatchSimulator}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t.simulator.sendWebhookBtn}</span>
                </button>
              </div>

              {/* Result Preview */}
              {simResult && (
                <div className="p-4 rounded-xl bg-stone-900 text-emerald-400 font-mono text-xs space-y-2 border border-stone-800">
                  <div className="flex justify-between text-stone-400 text-[11px] pb-1 border-b border-stone-800">
                    <span>{t.simulator.webhookResult}</span>
                    <span>{simResult.dispatchedAt}</span>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed">
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Nhật ký kiểm toán & sự kiện ({logs.length})
              </h4>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.type === 'PAYMENT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : log.type === 'WARNING'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : log.type === 'ADMIN'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="text-stone-800 dark:text-stone-200">
                        {log.details}
                      </span>
                    </div>
                    <span className="text-stone-600 dark:text-stone-400 font-mono text-[11px] tabular-nums shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Selected Transaction Inspector Modal */}
      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          lang={lang}
          onClose={() => setSelectedTx(null)}
          onUpdateStatus={onUpdateTransactionStatus}
        />
      )}
    </div>
  );
};
