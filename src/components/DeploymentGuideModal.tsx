import React, { useState } from 'react';
import { X, BookOpen, Copy, Check, FileCode, Database, Key, Globe, Shield, Terminal, ArrowRight, ExternalLink } from 'lucide-react';
import { Language } from '../types';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'sheets' | 'sepay' | 'tip4serv' | 'oauth' | 'cicd'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[90vh] overflow-hidden my-4">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-stone-900 dark:text-stone-100">
                {lang === 'vi' ? 'Hướng dẫn triển khai & Tích hợp thực tế' : 'Deployment & Integration Manual'}
              </h2>
              <p className="text-xs text-stone-500">
                Google Sheets + Google Apps Script Web App + SePay + Tip4Serv + GitHub Actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex overflow-x-auto border-b border-stone-200 dark:border-stone-800 px-4 gap-2 bg-white dark:bg-stone-900 scrollbar-none text-xs font-semibold">
          {[
            { id: 'overview', label: '1. Tổng quan kiến trúc' },
            { id: 'sheets', label: '2. Google Sheets & Apps Script' },
            { id: 'sepay', label: '3. Cấu hình SePay Webhook' },
            { id: 'tip4serv', label: '4. Cấu hình Tip4Serv' },
            { id: 'oauth', label: '5. GitHub OAuth Admin' },
            { id: 'cicd', label: '6. GitHub Pages & CI/CD' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                activeSection === tab.id
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 text-stone-800 dark:text-stone-200 text-xs sm:text-sm leading-relaxed space-y-5">
          
          {/* Section 1: Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Kiến trúc hệ thống Buy Me a Coffee Không cần Server riêng (Serverless)</span>
              </h3>
              <p>
                Dự án được thiết kế theo tiêu chí <strong>tối giản chi phí (0đ tiền máy chủ)</strong>, độ tin cậy tuyệt đối và tự động hóa 100%:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                  <div className="font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    <span>Frontend (GitHub Pages)</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Ứng dụng React + Tailwind CSS được tự động build & deploy qua <code>.github/workflows/deploy.yml</code> mỗi khi bạn push code lên nhánh <code>main</code>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    <span>Backend (Google Apps Script Web App)</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Chạy hoàn toàn miễn phí trên hạ tầng Google. Tiếp nhận webhook từ SePay & Tip4Serv, ghi nhận giao dịch vào Google Sheets với <code>LockService</code> chống trùng lặp.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-xs">
                <strong>Luồng hoạt động tự động:</strong>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Người dùng chọn số ly cà phê → Hệ thống sinh mã đơn độc nhất (ví dụ <code>BMC84920</code>).</li>
                  <li>Hệ thống hiển thị mã VietQR động chứa đúng số tài khoản, số tiền và mã đơn.</li>
                  <li>Người dùng quét mã và chuyển khoản ngân hàng.</li>
                  <li>SePay phát hiện giao dịch ngân hàng biến động số dư và bắn Webhook tới Google Apps Script.</li>
                  <li>Backend so khớp mã đơn và số tiền, cập nhật trạng thái sang <strong>SUCCESS</strong>.</li>
                  <li>Frontend tự động cập nhật và bắn pháo hoa cảm ơn người ủng hộ!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Section 2: Sheets & Apps Script */}
          {activeSection === 'sheets' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                <span>Hướng dẫn thiết lập Google Sheets & Google Apps Script</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                  <div>
                    <strong>Tạo bảng tính Google Sheets mới:</strong>
                    <p className="text-xs text-stone-500">Truy cập <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-amber-600 underline">sheets.new</a> và đặt tên là <code>Buy Me a Coffee Ledger</code>.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                  <div>
                    <strong>Mở trình soạn thảo tập lệnh (Apps Script):</strong>
                    <p className="text-xs text-stone-500">Trên menu Google Sheets, chọn <em>Tiện ích mở rộng (Extensions)</em> → <em>Apps Script</em>.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                  <div>
                    <strong>Sao chép toàn bộ mã nguồn tập tin <code>google-apps-script/Code.gs</code>:</strong>
                    <p className="text-xs text-stone-500">Dự án đã chuẩn bị sẵn file <code>google-apps-script/Code.gs</code> hoàn chỉnh với đầy đủ bảo mật LockService, tự tạo sheet và các hàm xử lý.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold text-xs shrink-0">4</span>
                  <div>
                    <strong>Triển khai dưới dạng Web App (Deploy):</strong>
                    <ul className="list-disc pl-5 mt-1 text-xs text-stone-500 space-y-0.5">
                      <li>Nhấp nút <strong>Triển khai (Deploy)</strong> → <strong>Tùy chọn triển khai mới (New deployment)</strong>.</li>
                      <li>Chọn loại: <strong>Ứng dụng web (Web app)</strong>.</li>
                      <li>Thực thi dưới quyền (Execute as): <strong>Tôi (Me)</strong>.</li>
                      <li>Ai có quyền truy cập (Who has access): <strong>Bất kỳ ai (Anyone)</strong>.</li>
                      <li>Nhấp <strong>Triển khai (Deploy)</strong> và sao chép <em>URL ứng dụng web</em>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: SePay */}
          {activeSection === 'sepay' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <span>Cấu hình Cổng Webhook SePay (Ngân hàng Việt Nam)</span>
              </h3>

              <p className="text-xs text-stone-600 dark:text-stone-400">
                SePay (<a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="text-amber-600 underline">my.sepay.vn</a>) là dịch vụ cổng thanh toán tự động hỗ trợ kết nối MBBank, Vietcombank, Techcombank, v.v. hoàn toàn miễn phí gói Starter.
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <strong className="block text-xs text-stone-900 dark:text-stone-100 mb-1">
                    Bước 1: Kết nối tài khoản ngân hàng trên SePay
                  </strong>
                  <p className="text-xs text-stone-500">
                    Vào menu <em>Tài khoản ngân hàng</em> → Thêm tài khoản ngân hàng của bạn (MB, VCB, ACB, v.v.).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <strong className="block text-xs text-stone-900 dark:text-stone-100 mb-1">
                    Bước 2: Cấu hình Webhook trên SePay
                  </strong>
                  <p className="text-xs text-stone-500">
                    Vào menu <em>Tích hợp Webhook</em> → Nhấp <strong>Tạo Webhook mới</strong>:
                  </p>
                  <ul className="list-disc pl-5 mt-1.5 text-xs text-stone-600 dark:text-stone-400 space-y-1">
                    <li><strong>URL Webhook:</strong> Dán URL Web App Google Apps Script của bạn.</li>
                    <li><strong>Kiểu xác thực (Authentication):</strong> API Key.</li>
                    <li><strong>API Key:</strong> Tạo chuỗi bí mật ngẫu nhiên và lưu vào Script Properties của Google Apps Script.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <strong className="block text-xs text-stone-900 dark:text-stone-100 mb-1">
                    Bước 3: Kiểm tra chuyển tiền thực tế
                  </strong>
                  <p className="text-xs text-stone-500">
                    Thực hiện chuyển khoản 10,000 VND với mã giao dịch (VD: <code>BMC94821</code>) từ app ngân hàng bất kỳ. Trong vòng 2-3 giây, SePay sẽ gửi webhook và hệ thống tự động xác nhận đơn hàng thành công!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Tip4Serv */}
          {activeSection === 'tip4serv' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Cấu hình Thanh toán Quốc tế (Tip4Serv)
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Tip4Serv (<a href="https://tip4serv.com" target="_blank" rel="noreferrer" className="text-amber-600 underline">tip4serv.com</a>) hỗ trợ thanh toán quốc tế bằng thẻ Visa/Mastercard và PayPal mà không yêu cầu pháp nhân doanh nghiệp phức tạp.
              </p>
              <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                <p>1. Đăng ký tài khoản trên Tip4Serv và kết nối PayPal hoặc Stripe của bạn.</p>
                <p>2. Tạo một gói sản phẩm dạng Donate hoặc "Buy a Coffee" với giá $2 hoặc $3 USD.</p>
                <p>3. Trong phần Webhooks của Tip4Serv, điền URL Google Apps Script Web App của bạn với tham số <code>?action=webhook_tip4serv</code>.</p>
                <p>4. Điền API Key và Link Shop Tip4Serv vào phần Cài đặt trong Trang Quản trị.</p>
              </div>
            </div>
          )}

          {/* Section 5: GitHub OAuth */}
          {activeSection === 'oauth' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Cấu hình Đăng nhập Quản trị bằng GitHub OAuth
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Bảo vệ trang quản trị bằng tài khoản GitHub của chính bạn. Chỉ các tài khoản GitHub nằm trong danh sách trắng (whitelist) mới có quyền truy cập.
              </p>
              <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                <p>1. Truy cập <strong>GitHub Settings</strong> → <strong>Developer Settings</strong> → <strong>OAuth Apps</strong> → <strong>New OAuth App</strong>.</p>
                <p>2. <strong>Application Name:</strong> <code>Buy Me a Coffee Admin</code>.</p>
                <p>3. <strong>Homepage URL:</strong> URL GitHub Pages của bạn (hoặc local url).</p>
                <p>4. <strong>Authorization callback URL:</strong> URL Google Apps Script Web App của bạn.</p>
                <p>5. Tạo <em>Client Secret</em> và lưu vào <em>Script Properties</em> trong Google Apps Script.</p>
              </div>
            </div>
          )}

          {/* Section 6: CI/CD GitHub Pages */}
          {activeSection === 'cicd' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Tự động triển khai lên GitHub Pages với GitHub Actions
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Dự án đã có sẵn file cấu hình <code>.github/workflows/deploy.yml</code>.
              </p>
              <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                <p>1. Đẩy mã nguồn lên repository GitHub của bạn.</p>
                <p>2. Trên GitHub repo, vào <strong>Settings</strong> → <strong>Pages</strong>.</p>
                <p>3. Tại mục <strong>Build and deployment</strong> → Chọn <strong>Source: GitHub Actions</strong>.</p>
                <p>4. Mỗi khi bạn đẩy commit mới lên nhánh <code>main</code>, GitHub Actions sẽ tự động biên dịch và cập nhật trang web sau khoảng 60 giây!</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Xem thêm chi tiết tại file <code>README.md</code> trong mã nguồn
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold"
          >
            Đã hiểu
          </button>
        </div>

      </div>
    </div>
  );
};
