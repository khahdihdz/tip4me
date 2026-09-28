/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CreatorHero } from './components/CreatorHero';
import { DonationForm } from './components/DonationForm';
import { SupportersList } from './components/SupportersList';
import { VietQRPaymentModal } from './components/VietQRPaymentModal';
import { Tip4ServPaymentModal } from './components/Tip4ServPaymentModal';
import { PaymentSuccessModal } from './components/PaymentSuccessModal';
import { AdminPortal } from './components/AdminPortal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import { storage } from './services/storage';
import {
  AppSettings,
  Transaction,
  ActivityLog,
  AdminUser,
  Language,
  PaymentMethod,
  TransactionStatus,
} from './types';
import { translations } from './i18n/translations';
import { Coffee, ShieldCheck, Heart, Github, BookOpen } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>(() => storage.getLanguage());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getTransactions());
  const [logs, setLogs] = useState<ActivityLog[]>(() => storage.getActivityLogs());
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Modal states
  const [activeVietQR, setActiveVietQR] = useState<Transaction | null>(null);
  const [activeTip4Serv, setActiveTip4Serv] = useState<Transaction | null>(null);
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Consume the server-issued OAuth session token from the URL fragment.
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = params.get('oauth_token');
    const username = params.get('username');
    if (!token || !username) return;
    sessionStorage.setItem('tip4me_admin_session', token);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setAdminUser({ id: 'github_' + username, username, role: 'admin', authenticatedVia: 'github' });
  }, []);

  // Use a consistent dark theme across the entire app.
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  // Sync language with storage
  useEffect(() => {
    storage.setLanguage(lang);
  }, [lang]);

  // Listen to transaction updates across components
  useEffect(() => {
    const refreshData = () => {
      setTransactions(storage.getTransactions());
      setLogs(storage.getActivityLogs());
      setSettings(storage.getSettings());
    };

    window.addEventListener('bmc-transaction-created', refreshData);
    window.addEventListener('bmc-transaction-updated', refreshData);
    window.addEventListener('bmc-settings-updated', refreshData);

    return () => {
      window.removeEventListener('bmc-transaction-created', refreshData);
      window.removeEventListener('bmc-transaction-updated', refreshData);
      window.removeEventListener('bmc-settings-updated', refreshData);
    };
  }, []);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'vi' ? 'en' : 'vi'));
  };

  // Submit donation from form
  const handleDonationSubmit = (params: {
    donorName: string;
    message: string;
    amount: number;
    currency: 'VND' | 'USD';
    coffeeCount: number;
    paymentMethod: PaymentMethod;
    isAnonymous: boolean;
  }) => {
    const newTx = storage.createTransaction({
      ...params,
      language: lang,
    });

    setTransactions(storage.getTransactions());
    setLogs(storage.getActivityLogs());

    if (params.paymentMethod === 'vietqr') {
      setActiveVietQR(newTx);
    } else {
      setActiveTip4Serv(newTx);
    }
  };

  // On payment confirmed
  const handlePaymentSuccess = (confirmedTx: Transaction) => {
    setActiveVietQR(null);
    setActiveTip4Serv(null);
    setSuccessTx(confirmedTx);
    setTransactions(storage.getTransactions());
    setLogs(storage.getActivityLogs());
    setSettings(storage.getSettings());
  };

  // Cancel pending order
  const handleCancelOrder = (id: string) => {
    storage.updateTransactionStatus(id, 'CANCELLED');
    setActiveVietQR(null);
    setActiveTip4Serv(null);
    setTransactions(storage.getTransactions());
    setLogs(storage.getActivityLogs());
  };

  const handleLoginGithub = () => {
    if (!settings.googleAppsScriptUrl) { window.alert('Configure Google Apps Script URL first.'); return; }
    window.location.assign(settings.googleAppsScriptUrl + '?action=oauth_start');
  };

  const handleLogoutAdmin = () => {
    sessionStorage.removeItem('tip4me_admin_session');
    setAdminUser(null);
    setLogs(storage.getActivityLogs());
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
    setLogs(storage.getActivityLogs());
  };

  const handleUpdateTransactionStatus = (id: string, status: TransactionStatus) => {
    storage.updateTransactionStatus(id, status);
    setTransactions(storage.getTransactions());
    setLogs(storage.getActivityLogs());
  };

  // Filter confirmed supporters
  const confirmedSupporters = transactions
    .filter((tx) => tx.status === 'SUCCESS')
    .sort((a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime());

  const totalCoffees = confirmedSupporters.reduce((acc, curr) => acc + curr.coffeeCount, 0);

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200 flex flex-col font-sans">
      
      {/* Top Bar Navigation */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenGuide={() => setShowGuide(true)}
        isAdminLoggedIn={Boolean(adminUser)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* Creator Hero Header & Metrics */}
        <CreatorHero
          creator={settings.creator}
          lang={lang}
          totalCoffees={totalCoffees}
          totalSupporters={confirmedSupporters.length}
        />

        {/* 2-Column or Stacked Donation & Social Proof Sections */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left / Top: Donation Form */}
          <div className="md:col-span-7">
            <DonationForm
              creator={settings.creator}
              lang={lang}
              onSubmitDonation={handleDonationSubmit}
            />
          </div>

          {/* Right: Quick Features / Trust Banner */}
          <div className="md:col-span-5 space-y-4">
            
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'vi' ? 'Cam kết tự động hóa & Bảo mật' : 'Automated & Secure Guarantee'}</span>
              </h3>
              <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>{lang === 'vi' ? 'Quét mã VietQR chuẩn xác, tự động điền tiền và nội dung.' : 'Instant dynamic VietQR with exact amount and order memo.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>{lang === 'vi' ? 'Xác nhận tức thì trong 3 giây qua SePay Webhook.' : 'Instant 3-second bank confirmation via SePay Webhook.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>{lang === 'vi' ? 'Hỗ trợ thẻ quốc tế và PayPal qua Tip4Serv.' : 'International cards and PayPal supported via Tip4Serv.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>{lang === 'vi' ? 'Lưu trữ minh bạch, đồng bộ dữ liệu vào Google Sheets.' : 'Transparent Google Sheets database storage with LockService.'}</span>
                </li>
              </ul>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => setShowGuide(true)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{translations[lang].nav.guide}</span>
                </button>
              </div>
            </div>

            {/* Quick stats mini card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-amber-100 font-semibold">
                    {lang === 'vi' ? 'Tổng số ly cà phê' : 'Total Coffees'}
                  </span>
                  <div className="text-2xl font-bold font-mono mt-0.5 tabular-nums">
                    {totalCoffees.toLocaleString()} ☕
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
              </div>
              <p className="text-[11px] text-amber-100/90 mt-2">
                {lang === 'vi' ? 'Cảm ơn tất cả mọi người đã luôn đồng hành!' : 'Thank you so much to all amazing supporters!'}
              </p>
            </div>

          </div>

        </div>

        {/* Supporters Wall Feed */}
        <SupportersList supporters={confirmedSupporters} lang={lang} />

      </main>

      {/* Quiet Footer adhering to Frontend Design Constitution */}
      <footer className="mt-12 py-6 border-t border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 text-xs text-center transition-colors">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              {translations[lang].nav.brand}
            </span>
            <span>·</span>
            <span>Serverless on GitHub Pages</span>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            <button
              onClick={() => setShowGuide(true)}
              className="hover:text-amber-600 transition-colors"
            >
              {translations[lang].nav.guide}
            </button>
            <span>·</span>
            <button
              onClick={() => setShowAdmin(true)}
              className="hover:text-amber-600 transition-colors"
            >
              {translations[lang].nav.admin}
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. VietQR Payment Modal */}
      {activeVietQR && (
        <VietQRPaymentModal
          transaction={activeVietQR}
          bank={settings.bank}
          lang={lang}
          onClose={() => setActiveVietQR(null)}
          onPaymentSuccess={handlePaymentSuccess}
          onCancelOrder={handleCancelOrder}
        />
      )}

      {/* 2. Tip4Serv International Payment Modal */}
      {activeTip4Serv && (
        <Tip4ServPaymentModal
          transaction={activeTip4Serv}
          tip4servUrl={settings.tip4servShopUrl}
          lang={lang}
          onClose={() => setActiveTip4Serv(null)}
          onPaymentSuccess={handlePaymentSuccess}
          onCancelOrder={handleCancelOrder}
        />
      )}

      {/* 3. Payment Success Celebration Modal */}
      {successTx && (
        <PaymentSuccessModal
          transaction={successTx}
          lang={lang}
          onClose={() => setSuccessTx(null)}
        />
      )}

      {/* 4. Protected Admin Portal */}
      <AdminPortal
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
        lang={lang}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        transactions={transactions}
        onUpdateTransactionStatus={handleUpdateTransactionStatus}
        logs={logs}
        user={adminUser}
        onLoginGithub={handleLoginGithub}
        onLogout={handleLogoutAdmin}
      />

      {/* 5. Deployment Guide Modal */}
      <DeploymentGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        lang={lang}
      />

    </div>
  );
}
