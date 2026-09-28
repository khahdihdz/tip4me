export type Language = 'vi' | 'en';

export type PaymentMethod = 'vietqr' | 'tip4serv';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface BankConfig {
  bankId: string;       // e.g. 'MB', 'VCB', 'TCB', 'ACB', 'VPB'
  bankName: string;     // e.g. 'MBBank (Quân Đội)'
  accountNo: string;    // e.g. '038812345678'
  accountName: string;  // e.g. 'NGUYEN VAN A'
}

export interface CreatorProfile {
  name: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  socialLinks: {
    github?: string;
    twitter?: string;
    website?: string;
    youtube?: string;
  };
  goal: {
    targetCoffees: number;
    currentCoffees: number;
    title: string;
  };
  coffeePriceVND: number; // default: 35000 VND
  coffeePriceUSD: number; // default: 2.00 USD
}

export interface AppSettings {
  creator: CreatorProfile;
  bank: BankConfig;
  sepayApiKey: string;
  tip4servApiKey: string;
  tip4servShopUrl: string;
  googleAppsScriptUrl?: string; // Optional remote Google Apps Script Web App URL
  authorizedGithubUsers: string[]; // List of GitHub usernames allowed into admin
}

export interface Transaction {
  id: string; // Unique transaction code, e.g. BMC74921
  donorName: string;
  message: string;
  amount: number;
  currency: 'VND' | 'USD';
  coffeeCount: number;
  paymentMethod: PaymentMethod;
  language: Language;
  status: TransactionStatus;
  bankTransactionId?: string; // Reference returned from bank / SePay
  createdAt: string; // ISO 8601
  paidAt?: string;    // ISO 8601
  isAnonymous: boolean;
  rawWebhookPayload?: any;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: 'INFO' | 'PAYMENT' | 'WEBHOOK' | 'ADMIN' | 'WARNING';
}

export interface AdminUser {
  id: string;
  username: string;
  avatar_url?: string;
  role: 'admin';
  authenticatedVia: 'github' | 'token';
}
