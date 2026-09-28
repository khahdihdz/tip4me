import { AppSettings, Transaction, ActivityLog } from '../types';

export interface SupportedBank {
  id: string;
  name: string;
  shortName: string;
  bin: string;
}

export const SUPPORTED_BANKS: SupportedBank[] = [
  { id: 'MB', name: 'MBBank - Ngân hàng Quân Đội', shortName: 'MBBank', bin: '970422' },
  { id: 'VCB', name: 'Vietcombank - Ngoại Thương VN', shortName: 'Vietcombank', bin: '970436' },
  { id: 'TCB', name: 'Techcombank - Kỹ Thương VN', shortName: 'Techcombank', bin: '970407' },
  { id: 'VPB', name: 'VPBank - Việt Nam Thịnh Vượng', shortName: 'VPBank', bin: '970432' },
  { id: 'ACB', name: 'ACB - Á Châu', shortName: 'ACB', bin: '970416' },
  { id: 'TPB', name: 'TPBank - Tiên Phong', shortName: 'TPBank', bin: '970423' },
  { id: 'BIDV', name: 'BIDV - Đầu tư và Phát triển VN', shortName: 'BIDV', bin: '970418' },
  { id: 'VIB', name: 'VIB - Quốc Tế', shortName: 'VIB', bin: '970441' },
  { id: 'STB', name: 'Sacombank - Sài Gòn Thương Tín', shortName: 'Sacombank', bin: '970403' },
];

export const INITIAL_SETTINGS: AppSettings = {
  creator: {
    name: 'Hoàng Minh',
    tagline: 'Lập trình viên & Người sáng tạo nội dung mã nguồn mở',
    bio: 'Chào bạn! Mình xây dựng các dự án công nghệ nguồn mở, chia sẻ kiến thức lập trình thực chiến và các công cụ hữu ích cho cộng đồng developer Việt Nam. Nếu các sản phẩm của mình giúp ích cho bạn, hãy mời mình một ly cà phê nhé! ☕✨',
    avatarUrl: '/src/assets/images/creator_avatar_1790608654446.jpg',
    bannerUrl: '/src/assets/images/creator_banner_1790608667404.jpg',
    socialLinks: {
      github: 'https://github.com/hoangminh-dev',
      twitter: 'https://twitter.com/hoangminh_tech',
      website: 'https://hoangminh.dev',
      youtube: 'https://youtube.com/@hoangminhdev',
    },
    goal: {
      targetCoffees: 100,
      currentCoffees: 42,
      title: 'Duy trì máy chủ demo & nâng cấp microphone ghi podcast kỹ thuật',
    },
    coffeePriceVND: 35000,
    coffeePriceUSD: 2,
  },
  bank: {
    bankId: 'MB',
    bankName: 'MBBank (Quân Đội)',
    accountNo: '038812345678',
    accountName: 'NGUYEN HOANG MINH',
  },
  sepayApiKey: 'sepay_live_sample_token_bmc_vn_2026',
  tip4servApiKey: 'tip4serv_sample_api_key_2026',
  tip4servShopUrl: 'https://tip4serv.com/cart/buymeacoffee',
  googleAppsScriptUrl: '',
  authorizedGithubUsers: ['admin', 'hoangminh-dev', 'pre-hubxxx', 'developer'],
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'BMC92814',
    donorName: 'Đức Anh Nguyễn',
    message: 'Cảm ơn anh Minh đã chia sẻ bộ thư viện rất hữu ích! Mời anh 3 ly cà phê sáng tạo nhé 🚀',
    amount: 105000,
    currency: 'VND',
    coffeeCount: 3,
    paymentMethod: 'vietqr',
    language: 'vi',
    status: 'SUCCESS',
    bankTransactionId: 'FT240928918231',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
    isAnonymous: false,
  },
  {
    id: 'BMC81923',
    donorName: 'Michael Chen',
    message: 'Love your open-source tools! Keep inspiring the developer community from Singapore ☕',
    amount: 10,
    currency: 'USD',
    coffeeCount: 5,
    paymentMethod: 'tip4serv',
    language: 'en',
    status: 'SUCCESS',
    bankTransactionId: 'T4S-INV-89123',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
    isAnonymous: false,
  },
  {
    id: 'BMC74619',
    donorName: 'Ẩn danh',
    message: 'Ủng hộ anh Minh làm video hướng dẫn React & Vite tiếp nhé!',
    amount: 35000,
    currency: 'VND',
    coffeeCount: 1,
    paymentMethod: 'vietqr',
    language: 'vi',
    status: 'SUCCESS',
    bankTransactionId: 'FT240928716298',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 239).toISOString(),
    isAnonymous: true,
  },
  {
    id: 'BMC63521',
    donorName: 'Hà Trang',
    message: 'Bài viết về tối ưu Google Apps Script quá hay và dễ hiểu, em apply được ngay vào công việc.',
    amount: 70000,
    currency: 'VND',
    coffeeCount: 2,
    paymentMethod: 'vietqr',
    language: 'vi',
    status: 'SUCCESS',
    bankTransactionId: 'FT240928528172',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 358).toISOString(),
    isAnonymous: false,
  },
  {
    id: 'BMC52109',
    donorName: 'Alex Thorne',
    message: 'Great work on the automated payment workflow script. Cheers!',
    amount: 6,
    currency: 'USD',
    coffeeCount: 3,
    paymentMethod: 'tip4serv',
    language: 'en',
    status: 'SUCCESS',
    bankTransactionId: 'T4S-INV-71940',
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 597).toISOString(),
    isAnonymous: false,
  },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'LOG-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
    action: 'SEPAY_WEBHOOK_VERIFIED',
    details: 'Mã BMC92814 - Số tiền 105,000 VND - Khớp nội dung chuyển khoản FT240928918231',
    type: 'WEBHOOK',
  },
  {
    id: 'LOG-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
    action: 'TIP4SERV_PAYMENT_PROCESSED',
    details: 'Order BMC81923 confirmed via Tip4Serv API. Amount: $10.00 USD',
    type: 'PAYMENT',
  },
  {
    id: 'LOG-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 239).toISOString(),
    action: 'SEPAY_WEBHOOK_VERIFIED',
    details: 'Mã BMC74619 - Số tiền 35,000 VND - Xác nhận thành công (Ẩn danh)',
    type: 'WEBHOOK',
  },
  {
    id: 'LOG-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    action: 'SETTINGS_INITIALIZED',
    details: 'Khởi tạo cấu hình ngân hàng MBBank & webhook SePay',
    type: 'ADMIN',
  },
];
