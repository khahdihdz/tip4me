import { AppSettings, Transaction, ActivityLog, AdminUser, TransactionStatus } from '../types';
import { INITIAL_SETTINGS, INITIAL_TRANSACTIONS, INITIAL_ACTIVITY_LOGS } from '../data/initialData';

const SETTINGS_KEY = 'bmc_app_settings_v1';
const TRANSACTIONS_KEY = 'bmc_transactions_v1';
const LOGS_KEY = 'bmc_activity_logs_v1';
const ADMIN_SESSION_KEY = 'bmc_admin_session_v1';
const LANG_KEY = 'bmc_user_lang_v1';
const THEME_KEY = 'bmc_user_theme_v1';

class StorageService {
  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(SETTINGS_KEY)) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
    }
    if (!localStorage.getItem(TRANSACTIONS_KEY)) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
    }
    if (!localStorage.getItem(LOGS_KEY)) {
      localStorage.setItem(LOGS_KEY, JSON.stringify(INITIAL_ACTIVITY_LOGS));
    }
  }

  // --- SETTINGS ---
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      const settings: AppSettings = data ? JSON.parse(data) : { ...INITIAL_SETTINGS };
      // Migrate existing browser settings that were saved before the GAS URL was configured.
      if (!settings.googleAppsScriptUrl) {
        settings.googleAppsScriptUrl = INITIAL_SETTINGS.googleAppsScriptUrl;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      }
      return settings;
    } catch {
      return INITIAL_SETTINGS;
    }
  }

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    this.addLog('SETTINGS_UPDATED', 'Cấu hình hệ thống và ngân hàng đã được cập nhật', 'ADMIN');
    window.dispatchEvent(new CustomEvent('bmc-settings-updated', { detail: settings }));
  }

  // --- TRANSACTIONS ---
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getTransactionById(id: string): Transaction | undefined {
    const list = this.getTransactions();
    return list.find(t => t.id.toUpperCase() === id.toUpperCase());
  }

  createTransaction(params: {
    donorName: string;
    message: string;
    amount: number;
    currency: 'VND' | 'USD';
    coffeeCount: number;
    paymentMethod: 'vietqr' | 'tip4serv';
    language: 'vi' | 'en';
    isAnonymous: boolean;
  }): Transaction {
    const list = this.getTransactions();
    
    // Generate unique random code: BMC + 5 numeric digits
    let uniqueId = '';
    do {
      const num = Math.floor(10000 + Math.random() * 90000);
      uniqueId = `BMC${num}`;
    } while (list.some(t => t.id === uniqueId));

    const newTx: Transaction = {
      id: uniqueId,
      donorName: params.isAnonymous ? 'Ẩn danh' : (params.donorName.trim() || 'Người bạn tốt'),
      message: params.message.trim(),
      amount: params.amount,
      currency: params.currency,
      coffeeCount: params.coffeeCount,
      paymentMethod: params.paymentMethod,
      language: params.language,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      isAnonymous: params.isAnonymous,
    };

    list.unshift(newTx);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));

    this.addLog(
      'ORDER_CREATED',
      `Đơn hàng mới ${uniqueId} - ${params.amount.toLocaleString()} ${params.currency} - ${params.paymentMethod.toUpperCase()}`,
      'INFO'
    );

    // Sync with remote Google Apps Script if URL configured
    this.syncToGoogleAppsScript('create_transaction', newTx);

    window.dispatchEvent(new CustomEvent('bmc-transaction-created', { detail: newTx }));
    return newTx;
  }

  updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    bankTransactionId?: string,
    rawPayload?: any
  ): Transaction | null {
    const list = this.getTransactions();
    const index = list.findIndex(t => t.id.toUpperCase() === id.toUpperCase());
    if (index === -1) return null;

    const tx = list[index];
    const prevStatus = tx.status;
    tx.status = status;
    if (bankTransactionId) tx.bankTransactionId = bankTransactionId;
    if (status === 'SUCCESS' && !tx.paidAt) {
      tx.paidAt = new Date().toISOString();
      
      // Update creator goal progress
      const settings = this.getSettings();
      settings.creator.goal.currentCoffees += tx.coffeeCount;
      this.saveSettings(settings);
    }
    if (rawPayload) tx.rawWebhookPayload = rawPayload;

    list[index] = tx;
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));

    this.addLog(
      'STATUS_CHANGED',
      `Đơn ${id} đổi trạng thái từ ${prevStatus} sang ${status} (Mã NH: ${bankTransactionId || 'N/A'})`,
      status === 'SUCCESS' ? 'PAYMENT' : 'INFO'
    );

    // Sync with remote Google Apps Script if configured
    this.syncToGoogleAppsScript('update_status', { id, status, bankTransactionId });

    window.dispatchEvent(new CustomEvent('bmc-transaction-updated', { detail: tx }));
    return tx;
  }

  // --- SEPAY WEBHOOK PROCESSOR ---
  processSepayWebhook(payload: {
    id?: number | string;
    gateway?: string;
    transactionDate?: string;
    accountNumber?: string;
    code?: string | null;
    content?: string;
    transferType?: string;
    transferAmount?: number;
    accumulated?: number;
    referenceCode?: string;
    description?: string;
  }): { success: boolean; message: string; transaction?: Transaction } {
    const fullText = `${payload.content || ''} ${payload.description || ''} ${payload.code || ''}`;
    
    // Look for BMC followed by 5 to 8 digits
    const match = fullText.match(/BMC(\d{4,8})/i);
    if (!match) {
      this.addLog('WEBHOOK_NO_MATCH', `Không tìm thấy mã BMC trong nội dung: "${fullText}"`, 'WARNING');
      return { success: false, message: 'No valid BMC order code found in transfer content.' };
    }

    const orderId = match[0].toUpperCase();
    const tx = this.getTransactionById(orderId);

    if (!tx) {
      this.addLog('WEBHOOK_ORDER_NOT_FOUND', `Mã ${orderId} không tồn tại trong hệ thống`, 'WARNING');
      return { success: false, message: `Transaction ${orderId} not found.` };
    }

    if (tx.status === 'SUCCESS') {
      return { success: true, message: `Transaction ${orderId} already completed previously.`, transaction: tx };
    }

    const receivedAmount = Number(payload.transferAmount) || 0;
    if (receivedAmount < tx.amount) {
      this.addLog(
        'WEBHOOK_AMOUNT_MISMATCH',
        `Đơn ${orderId}: Số tiền nhận được ${receivedAmount} < số tiền yêu cầu ${tx.amount}`,
        'WARNING'
      );
      return {
        success: false,
        message: `Amount mismatch: expected >= ${tx.amount}, received ${receivedAmount}`,
        transaction: tx,
      };
    }

    // Success! Update transaction
    const bankRef = String(payload.referenceCode || payload.id || `SEPAY-${Date.now()}`);
    const updated = this.updateTransactionStatus(orderId, 'SUCCESS', bankRef, payload);

    this.addLog(
      'SEPAY_WEBHOOK_VERIFIED',
      `Xác nhận tự động thành công đơn ${orderId} - ${receivedAmount.toLocaleString()} VND (Ref: ${bankRef})`,
      'PAYMENT'
    );

    return { success: true, message: 'Payment successfully verified!', transaction: updated || undefined };
  }

  // --- TIP4SERV WEBHOOK PROCESSOR ---
  processTip4servWebhook(orderId: string, amount: number, referenceCode: string): { success: boolean; message: string; transaction?: Transaction } {
    const tx = this.getTransactionById(orderId);
    if (!tx) {
      return { success: false, message: `Order ${orderId} not found.` };
    }

    if (tx.status === 'SUCCESS') {
      return { success: true, message: `Order ${orderId} already verified.`, transaction: tx };
    }

    const updated = this.updateTransactionStatus(orderId, 'SUCCESS', referenceCode, { orderId, amount, referenceCode, provider: 'tip4serv' });
    this.addLog(
      'TIP4SERV_WEBHOOK_VERIFIED',
      `Xác nhận thanh toán quốc tế đơn ${orderId} - $${amount} USD (Ref: ${referenceCode})`,
      'PAYMENT'
    );

    return { success: true, message: 'International payment verified!', transaction: updated || undefined };
  }

  // --- SUPPORTERS LIST ---
  getSupporters(): Transaction[] {
    const list = this.getTransactions();
    return list
      .filter(t => t.status === 'SUCCESS')
      .sort((a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime());
  }

  // --- LOGS ---
  getActivityLogs(): ActivityLog[] {
    try {
      const data = localStorage.getItem(LOGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addLog(action: string, details: string, type: ActivityLog['type'] = 'INFO'): void {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      type,
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop(); // keep last 200
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }

  // --- CSV EXPORT (UTF-8 BOM FOR EXCEL VIETNAMESE SUPPORT) ---
  exportTransactionsToCSV(): string {
    const transactions = this.getTransactions();
    const headers = [
      'Mã giao dịch',
      'Người ủng hộ',
      'Số tiền',
      'Tiền tệ',
      'Số ly cà phê',
      'Cổng thanh toán',
      'Trạng thái',
      'Mã GD Ngân hàng',
      'Lời nhắn',
      'Thời gian tạo',
      'Thời gian thanh toán',
      'Ẩn danh'
    ];

    const escapeCSV = (str: string | number | undefined | boolean) => {
      if (str === undefined || str === null) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const rows = transactions.map(t => [
      escapeCSV(t.id),
      escapeCSV(t.isAnonymous ? 'Ẩn danh' : t.donorName),
      escapeCSV(t.amount),
      escapeCSV(t.currency),
      escapeCSV(t.coffeeCount),
      escapeCSV(t.paymentMethod),
      escapeCSV(t.status),
      escapeCSV(t.bankTransactionId || ''),
      escapeCSV(t.message),
      escapeCSV(t.createdAt),
      escapeCSV(t.paidAt || ''),
      escapeCSV(t.isAnonymous ? 'Có' : 'Không'),
    ].join(','));

    // UTF-8 BOM (\uFEFF) ensures Vietnamese characters display properly in Microsoft Excel
    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  }

  // --- ADMIN AUTH ---
  getAdminSession(): AdminUser | null {
    try {
      const data = localStorage.getItem(ADMIN_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  logoutAdmin(): void {
    const user = this.getAdminSession();
    if (user) {
      this.addLog('ADMIN_LOGOUT', `Quản trị viên @${user.username} đã đăng xuất`, 'ADMIN');
    }
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  // --- LANGUAGE & THEME ---
  getLanguage(): 'vi' | 'en' {
    return (localStorage.getItem(LANG_KEY) as 'vi' | 'en') || 'vi';
  }

  setLanguage(lang: 'vi' | 'en'): void {
    localStorage.setItem(LANG_KEY, lang);
  }

  getTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(THEME_KEY, theme);
  }

  // Optional background sync with Google Apps Script
  private async syncToGoogleAppsScript(action: string, payload: any) {
    const settings = this.getSettings();
    if (!settings.googleAppsScriptUrl) return;

    try {
      await fetch(settings.googleAppsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload }),
      });
    } catch {
      // Non-blocking catch for offline or CORS in sandbox
    }
  }
}

export const storage = new StorageService();
