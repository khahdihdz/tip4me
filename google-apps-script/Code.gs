/**
 * @license
 * Buy Me a Coffee VN - Google Apps Script Web App Backend
 * Tự động xác nhận giao dịch qua SePay (VietQR) và Tip4Serv (Quốc tế)
 * Lưu trữ trực tiếp trên Google Sheets - Miễn phí 100% không cần máy chủ riêng
 */

// Tên các bảng tính trong Google Sheets
const SHEET_TRANSACTIONS = 'Transactions';
const SHEET_SETTINGS = 'Settings';
const SHEET_LOGS = 'Logs';

/**
 * Hàm khởi tạo tự động tạo cấu trúc các sheet và tiêu đề cột
 * Hãy chạy hàm này một lần đầu tiên sau khi dán code vào Google Apps Script!
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tạo sheet Transactions
  let txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!txSheet) {
    txSheet = ss.insertSheet(SHEET_TRANSACTIONS);
  }
  const txHeaders = [
    'Mã giao dịch',
    'Tên người ủng hộ',
    'Lời nhắn',
    'Số tiền',
    'Đơn vị tiền tệ',
    'Số ly cà phê',
    'Phương thức thanh toán',
    'Ngôn ngữ',
    'Trạng thái',
    'Mã giao dịch ngân hàng',
    'Thời gian tạo',
    'Thời gian thanh toán',
    'Trạng thái ẩn danh',
    'Raw Webhook Payload'
  ];
  txSheet.getRange(1, 1, 1, txHeaders.length).setValues([txHeaders]);
  txSheet.getRange(1, 1, 1, txHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');
  txSheet.setFrozenRows(1);

  // 2. Tạo sheet Logs
  let logSheet = ss.getSheetByName(SHEET_LOGS);
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_LOGS);
  }
  const logHeaders = ['ID', 'Thời gian', 'Hành động', 'Chi tiết', 'Loại'];
  logSheet.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);
  logSheet.getRange(1, 1, 1, logHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');
  logSheet.setFrozenRows(1);

  // 3. Tạo sheet Settings
  let setSheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!setSheet) {
    setSheet = ss.insertSheet(SHEET_SETTINGS);
  }
  const setHeaders = ['Cấu hình', 'Giá trị'];
  setSheet.getRange(1, 1, 1, setHeaders.length).setValues([setHeaders]);
  setSheet.getRange(1, 1, 1, setHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');

  // Khởi tạo một số giá trị mặc định nếu chưa có
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SEPAY_API_KEY')) {
    props.setProperty('SEPAY_API_KEY', 'sepay_sample_secret_key');
  }
  // OAuth settings are configured manually in Script Properties.

  Logger.log('Khởi tạo Google Sheets thành công!');
}

/**
 * Xử lý yêu cầu GET
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'get_supporters';

    if (action === 'oauth_start') return startGithubOAuth(e);
    if (action === 'oauth_callback' || (e.parameter.code && e.parameter.state)) return finishGithubOAuth(e);
    if (action === 'auth_validate') return jsonResponse({ success: Boolean(getAdminSession(e.parameter.token)) });

    // Chỉ quản trị viên đã xác thực mới được đọc cấu hình đầy đủ.
    if (action === 'admin_get_settings') {
      if (!getAdminSession(e.parameter.token)) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }
      return getAdminSettings();
    }

    // 1. Kiểm tra trạng thái đơn hàng (Polling từ frontend)
    if (action === 'check_status') {
      const orderCode = (e.parameter.order_code || '').trim().toUpperCase();
      const status = checkOrderStatus(orderCode);
      return jsonResponse({ success: true, order_code: orderCode, status: status });
    }

    // 2. Lấy danh sách người ủng hộ công khai
    if (action === 'get_supporters') {
      const supporters = getPublicSupporters();
      return jsonResponse({ success: true, supporters: supporters });
    }

    // 3. Admin lấy toàn bộ dữ liệu (Yêu cầu xác thực token)
    if (action === 'admin_get_data') {
      const token = e.parameter.token;
      if (!getAdminSession(token)) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }
      const data = getAdminFullData();
      return jsonResponse({ success: true, data: data });
    }

    return jsonResponse({ success: false, message: 'Invalid action' });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Xử lý yêu cầu POST (Webhook SePay, Tip4Serv, Tạo đơn hàng, Cập nhật Admin)
 */
function doPost(e) {
  // Concurrency Lock: Khóa đồng thời để chống ghi đè dữ liệu và chống webhook trùng lặp
  const lock = LockService.getScriptLock();
  try {
    // Chờ tối đa 10 giây để lấy lock
    lock.waitLock(10000);

    let payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter;
      }
    } else {
      payload = e.parameter;
    }

    const action = payload.action || e.parameter.action || (payload.content ? 'webhook_sepay' : 'unknown');

    // 1. Webhook SePay (Tự động xác nhận giao dịch ngân hàng VietQR)
    if (action === 'webhook_sepay' || payload.transferType || payload.transferAmount) {
      return handleSepayWebhook(payload, e);
    }

    // 2. Webhook Tip4Serv (Thanh toán quốc tế)
    if (action === 'webhook_tip4serv') {
      return handleTip4servWebhook(payload);
    }

    // 3. Tạo đơn hàng mới từ Frontend (Lưu trạng thái PENDING)
    if (action === 'create_transaction') {
      return handleCreateTransaction(payload);
    }

    // Admin lưu cấu hình hệ thống vào Google Sheets.
    if (action === 'admin_save_settings') {
      if (!getAdminSession(payload.token)) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }
      return saveAdminSettings(payload.settings);
    }

    // 4. Admin cập nhật trạng thái đơn (Override thủ công)
    if (action === 'admin_update_status') {
      const token = payload.token;
      if (!getAdminSession(token)) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
      }
      return handleAdminUpdateStatus(payload);
    }

    return jsonResponse({ success: false, message: 'Unknown action' });
  } catch (err) {
    writeLog('POST_ERROR', err.toString(), 'WARNING');
    return jsonResponse({ success: false, error: err.toString() });
  } finally {
    // Luôn giải phóng lock
    lock.releaseLock();
  }
}


/**
 * Lưu cấu hình ứng dụng trong sheet Settings (chỉ admin đã xác thực).
 * Mỗi lần lưu cập nhật dòng app_settings, không tạo bản ghi trùng.
 */
function saveAdminSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return jsonResponse({ success: false, error: 'Invalid settings' }, 400);
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SETTINGS);
  if (!sheet) return jsonResponse({ success: false, error: 'Settings sheet not found. Run setupSheets() first.' }, 500);

  const key = 'app_settings';
  const lastRow = sheet.getLastRow();
  let targetRow = -1;
  if (lastRow >= 2) {
    const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === key) { targetRow = i + 2; break; }
    }
  }
  if (targetRow < 0) targetRow = lastRow + 1;
  sheet.getRange(targetRow, 1, 1, 2).setValues([[key, JSON.stringify(settings)]]);
  writeLog('SETTINGS_SAVED', 'Quản trị viên đã lưu cấu hình ứng dụng vào Google Sheets', 'ADMIN');
  return jsonResponse({ success: true, message: 'Settings saved to Google Sheets' });
}

/**
 * Xử lý Webhook từ cổng SePay
 */
function handleSepayWebhook(payload, e) {
  // Xác thực API Key từ SePay (nếu cấu hình)
  const props = PropertiesService.getScriptProperties();
  const configuredApiKey = props.getProperty('SEPAY_API_KEY');
  
  // Kiểm tra header Authorization nếu có
  if (configuredApiKey && configuredApiKey !== 'sepay_sample_secret_key') {
    // Header check (Apps Script headers có thể kiểm tra qua query params hoặc e)
    const authHeader = (e && e.headers && (e.headers['Authorization'] || e.headers['authorization'])) || '';
    const queryKey = e && e.parameter && e.parameter.apikey;
    const isValid = (authHeader && authHeader.indexOf(configuredApiKey) !== -1) || queryKey === configuredApiKey;
    if (!isValid) {
      writeLog('SEPAY_AUTH_FAILED', 'Sai API Key trong webhook SePay', 'WARNING');
      return jsonResponse({ success: false, error: 'Invalid API Key' }, 401);
    }
  }

  const fullContent = (payload.content || '') + ' ' + (payload.description || '') + ' ' + (payload.code || '');
  
  // Trích xuất mã giao dịch dạng BMC[0-9]{4,8}
  const match = fullContent.match(/BMC\d{4,8}/i);
  if (!match) {
    writeLog('SEPAY_NO_MATCH', 'Không tìm thấy mã BMC trong nội dung: ' + fullContent, 'WARNING');
    return jsonResponse({ success: false, message: 'No valid BMC code found' });
  }

  const orderCode = match[0].toUpperCase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!txSheet) return jsonResponse({ success: false, error: 'Sheet not found' });

  const data = txSheet.getDataRange().getValues();
  let rowIndex = -1;
  let currentTx = null;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() === orderCode) {
      rowIndex = i + 1; // 1-based index
      currentTx = {
        id: data[i][0],
        amount: Number(data[i][3]),
        status: data[i][8]
      };
      break;
    }
  }

  if (rowIndex === -1) {
    writeLog('SEPAY_ORDER_NOT_FOUND', 'Mã đơn ' + orderCode + ' không tồn tại', 'WARNING');
    return jsonResponse({ success: false, message: 'Order not found' });
  }

  // Chống Replay: Đã SUCCESS rồi thì không xử lý lại
  if (currentTx.status === 'SUCCESS') {
    writeLog('SEPAY_ALREADY_SUCCESS', 'Đơn ' + orderCode + ' đã được thanh toán trước đó', 'INFO');
    return jsonResponse({ success: true, message: 'Order already processed' });
  }

  // So khớp số tiền nhận được với số tiền yêu cầu
  const receivedAmount = Number(payload.transferAmount) || 0;
  if (receivedAmount < currentTx.amount) {
    writeLog('SEPAY_AMOUNT_MISMATCH', 'Đơn ' + orderCode + ': Nhận ' + receivedAmount + ' < Yêu cầu ' + currentTx.amount, 'WARNING');
    return jsonResponse({ success: false, message: 'Amount mismatch' });
  }

  // Cập nhật trạng thái SUCCESS
  const bankRef = String(payload.referenceCode || payload.id || 'SEPAY-' + new Date().getTime());
  const paidAt = new Date().toISOString();

  txSheet.getRange(rowIndex, 9).setValue('SUCCESS'); // Cột 9: Trạng thái
  txSheet.getRange(rowIndex, 10).setValue(bankRef);  // Cột 10: Mã GD ngân hàng
  txSheet.getRange(rowIndex, 12).setValue(paidAt);   // Cột 12: Thời gian thanh toán
  txSheet.getRange(rowIndex, 14).setValue(JSON.stringify(payload)); // Raw payload

  writeLog('SEPAY_SUCCESS', 'Đã xác nhận tự động đơn ' + orderCode + ' - ' + receivedAmount + ' VND', 'PAYMENT');
  return jsonResponse({ success: true, message: 'Payment confirmed successfully', orderCode: orderCode });
}

/**
 * Xử lý Webhook Tip4Serv
 */
function handleTip4servWebhook(payload) {
  const orderCode = (payload.order_id || payload.orderId || payload.id || '').toUpperCase();
  if (!orderCode) {
    return jsonResponse({ success: false, message: 'Missing order ID' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  const data = txSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() === orderCode) {
      if (data[i][8] === 'SUCCESS') {
        return jsonResponse({ success: true, message: 'Already completed' });
      }
      const rowIndex = i + 1;
      const ref = payload.reference || payload.transaction_id || 'T4S-' + new Date().getTime();
      txSheet.getRange(rowIndex, 9).setValue('SUCCESS');
      txSheet.getRange(rowIndex, 10).setValue(ref);
      txSheet.getRange(rowIndex, 12).setValue(new Date().toISOString());
      writeLog('TIP4SERV_SUCCESS', 'Đã xác nhận đơn quốc tế ' + orderCode, 'PAYMENT');
      return jsonResponse({ success: true, message: 'Tip4Serv verified' });
    }
  }

  return jsonResponse({ success: false, message: 'Order not found' });
}

/**
 * Tạo bản ghi đơn hàng mới (Trạng thái PENDING)
 */
function handleCreateTransaction(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);

  // Sinh mã đơn độc nhất BMC + số ngẫu nhiên nếu chưa có
  const id = payload.id || ('BMC' + Math.floor(10000 + Math.random() * 90000));
  const newRow = [
    id,
    sanitize(payload.donorName || 'Người bạn tốt'),
    sanitize(payload.message || ''),
    Number(payload.amount) || 0,
    payload.currency || 'VND',
    Number(payload.coffeeCount) || 1,
    payload.paymentMethod || 'vietqr',
    payload.language || 'vi',
    'PENDING',
    '', // bank transaction id
    new Date().toISOString(),
    '', // paid at
    payload.isAnonymous ? true : false,
    ''
  ];

  txSheet.appendRow(newRow);
  writeLog('CREATE_ORDER', 'Tạo đơn mới ' + id + ' - ' + payload.amount + ' ' + payload.currency, 'INFO');
  return jsonResponse({ success: true, transaction: { id: id, status: 'PENDING' } });
}

/**
 * Kiểm tra trạng thái đơn hàng
 */
function checkOrderStatus(orderCode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!txSheet) return 'NOT_FOUND';

  const data = txSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() === orderCode) {
      return String(data[i][8]); // Cột trạng thái
    }
  }
  return 'NOT_FOUND';
}

/**
 * Lấy danh sách người ủng hộ công khai (đã lọc các đơn SUCCESS)
 */
function getPublicSupporters() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!txSheet) return [];

  const data = txSheet.getDataRange().getValues();
  const list = [];

  for (let i = 1; i < data.length; i++) {
    const status = data[i][8];
    if (status === 'SUCCESS') {
      const isAnon = Boolean(data[i][12]);
      list.push({
        id: data[i][0],
        donorName: isAnon ? 'Ẩn danh' : data[i][1],
        message: data[i][2],
        amount: data[i][3],
        currency: data[i][4],
        coffeeCount: data[i][5],
        paidAt: data[i][11] || data[i][10],
        isAnonymous: isAnon
      });
    }
  }

  // Sắp xếp mới nhất lên đầu
  list.sort(function(a, b) {
    return new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime();
  });

  return list.slice(0, 50); // Lấy tối đa 50 người mới nhất
}

/**
 * Ghi nhật ký vào sheet Logs
 */
function writeLog(action, details, type) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(SHEET_LOGS);
    if (!logSheet) return;
    const logId = 'LOG-' + new Date().getTime();
    logSheet.appendRow([logId, new Date().toISOString(), action, details, type || 'INFO']);
  } catch (e) {
    Logger.log('Không thể ghi log: ' + e.toString());
  }
}

function startGithubOAuth(e) {
  const clientId = PropertiesService.getScriptProperties().getProperty('GITHUB_CLIENT_ID');
  if (!clientId) return jsonResponse({ success: false, error: 'OAuth is not configured' });
  const state = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('oauth_state_' + state, '1', 600);
  const callback = ScriptApp.getService().getUrl();
  const url = 'https://github.com/login/oauth/authorize?client_id=' + encodeURIComponent(clientId) +
    '&redirect_uri=' + encodeURIComponent(callback) + '&scope=read:user&state=' + encodeURIComponent(state);
  // Apps Script serves HtmlService inside a sandboxed frame. GitHub blocks being
  // embedded, so require a user-initiated top-level navigation instead of meta refresh.
  const safeUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>body{font:16px Arial,sans-serif;background:#f6f8fa;display:grid;place-items:center;min-height:90vh;margin:0}' +
    '.card{background:#fff;padding:28px;border-radius:14px;max-width:420px;text-align:center;box-shadow:0 4px 20px #0001}' +
    'a{display:inline-block;background:#24292f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600}</style></head>' +
    '<body><div class="card"><h2>Tiếp tục đăng nhập</h2><p>Nhấn nút bên dưới để mở GitHub và cấp quyền cho Tip4Me.</p>' +
    '<a href="' + safeUrl + '" target="_top" rel="noopener">Tiếp tục với GitHub</a></div></body></html>'
  );
}

function finishGithubOAuth(e) {
  const props = PropertiesService.getScriptProperties();
  const state = String(e.parameter.state || '');
  const cache = CacheService.getScriptCache();
  if (!state || !cache.get('oauth_state_' + state)) return HtmlService.createHtmlOutput('Invalid or expired OAuth state.');
  cache.remove('oauth_state_' + state);
  const code = String(e.parameter.code || '');
  const clientId = props.getProperty('GITHUB_CLIENT_ID');
  const clientSecret = props.getProperty('GITHUB_CLIENT_SECRET');
  if (!code || !clientId || !clientSecret) return HtmlService.createHtmlOutput('OAuth credentials are not configured.');
  const tokenRes = UrlFetchApp.fetch('https://github.com/login/oauth/access_token', {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: code, redirect_uri: ScriptApp.getService().getUrl() }),
    headers: { Accept: 'application/json' }, muteHttpExceptions: true
  });
  const accessToken = JSON.parse(tokenRes.getContentText() || '{}').access_token;
  if (!accessToken) return HtmlService.createHtmlOutput('GitHub authorization failed.');
  const userRes = UrlFetchApp.fetch('https://api.github.com/user', {
    headers: { Authorization: 'Bearer ' + accessToken, Accept: 'application/vnd.github+json', 'User-Agent': 'tip4me-admin' },
    muteHttpExceptions: true
  });
  const ghUser = JSON.parse(userRes.getContentText() || '{}');
  const username = String(ghUser.login || '').toLowerCase();
  const allowed = (props.getProperty('AUTHORIZED_GITHUB_USERS') || 'khahdihdz').split(',').map(function(x) { return x.trim().toLowerCase(); });
  if (!username || allowed.indexOf(username) < 0) return HtmlService.createHtmlOutput('GitHub account is not authorized.');
  const sessionToken = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  cache.put('admin_session_' + sessionToken, JSON.stringify({ username: username, expires: Date.now() + 21600000 }), 21600);
  const redirectUrl = 'https://khahdihdz.github.io/tip4me/#oauth_token=' +
    encodeURIComponent(sessionToken) + '&username=' + encodeURIComponent(username);
  // Apps Script runs HtmlService in a sandboxed frame. Show a user-clickable
  // top-level link so the app opens at its real mobile viewport, not inside the frame.
  const safeRedirectUrl = redirectUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>body{font:16px Arial,sans-serif;background:#f6f8fa;display:grid;place-items:center;min-height:90vh;margin:0;padding:16px}' +
    '.card{background:white;padding:28px;border-radius:14px;max-width:420px;text-align:center;box-shadow:0 4px 20px #0001}' +
    'a{display:inline-block;background:#24292f;color:white;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:600}</style></head>' +
    '<body><div class="card"><h2>Đăng nhập thành công</h2><p>Nhấn nút bên dưới để quay lại Tip4Me và mở trang quản trị.</p>' +
    '<a href="' + safeRedirectUrl + '" target="_top" rel="noopener">Quay lại Tip4Me</a></div></body></html>'
  );
}

function getAdminSession(token) {
  if (!token || typeof token !== 'string') return null;
  const raw = CacheService.getScriptCache().get('admin_session_' + token);
  if (!raw) return null;
  try { const session = JSON.parse(raw); return session.expires > Date.now() ? session : null; }
  catch (err) { return null; }
}

/**
 * Làm sạch chuỗi chống XSS
 */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

/**
 * Trả về phản hồi JSON với CORS Header
 */
function jsonResponse(obj, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
