const API = "https://script.google.com/macros/s/AKfycbwhETLuQ0Jl8BjvQ-w4lywLtVoHODceoigKYttiilpNH1grovoE8tJ6_K91U52SQ0hU/exec";
const $ = id => document.getElementById(id);
let orderCode = "";
let timer = null;

const fmt = n => new Intl.NumberFormat("vi-VN").format(n) + " ₫";
const digitWords = ["không","một","hai","ba","bốn","năm","sáu","bảy","tám","chín"];
function readThree(n, full = false) {
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10;
  let out = [];
  if (h || full) out.push(digitWords[h] + " trăm");
  if (t > 1) {
    out.push(digitWords[t] + " mươi");
    if (u === 1) out.push("mốt");
    else if (u === 5) out.push("lăm");
    else if (u) out.push(digitWords[u]);
  } else if (t === 1) {
    out.push("mười");
    if (u === 5) out.push("lăm");
    else if (u) out.push(digitWords[u]);
  } else if (u) {
    if (h || full) out.push("lẻ");
    out.push(digitWords[u]);
  }
  return out.join(" ");
}
function amountToWords(value) {
  if (!Number.isSafeInteger(value) || value < 0) return "";
  if (value === 0) return "Không đồng";
  const units = ["","nghìn","triệu","tỷ","nghìn tỷ","triệu tỷ"];
  const groups = [];
  let n = value;
  while (n > 0) { groups.unshift(n % 1000); n = Math.floor(n / 1000); }
  const words = [];
  const offset = groups.length - 1;
  groups.forEach((group, i) => {
    if (!group) return;
    const lowerFollows = groups.slice(i + 1).some(Boolean);
    words.push(readThree(group, i > 0 && group < 100 && lowerFollows));
    if (units[offset - i]) words.push(units[offset - i]);
  });
  const result = words.join(" ").replace(/\\s+/g, " ").trim();
  return result.charAt(0).toLocaleUpperCase("vi-VN") + result.slice(1) + " đồng";
}
function parseAmount(value) { return Number(String(value).replace(/[^0-9]/g, "")); }
function updateAmountDisplay() {
  const input = $("amount");
  const amount = parseAmount(input.value);
  if (input.value.trim()) input.value = Number.isSafeInteger(amount) ? new Intl.NumberFormat("vi-VN").format(amount) : "";
  $("amountWords").textContent = amount > 0 && Number.isSafeInteger(amount) ? amountToWords(amount) : "Nhập số tiền để xem cách đọc bằng chữ";
}
const showError = message => {
  const box = $("formError");
  if (box) {
    box.textContent = message;
    box.classList.remove("d-none");
  } else {
    alert(message);
  }
};
const clearError = () => $("formError")?.classList.add("d-none");

$("amount").addEventListener("input", updateAmountDisplay);
updateAmountDisplay();

document.querySelectorAll("[data-amount]").forEach(button => {
  button.addEventListener("click", () => {
    $("amount").value = new Intl.NumberFormat("vi-VN").format(Number(button.dataset.amount));
    updateAmountDisplay();
    document.querySelectorAll("[data-amount]").forEach(item => item.classList.toggle("active", item === button));
  });
});

async function get(action, params = {}) {
  const url = new URL(API);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);
  if (!response.ok) throw new Error("Máy chủ phản hồi HTTP " + response.status);
  return response.json();
}

async function post(data) {
  const response = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Không thể kết nối máy chủ (HTTP " + response.status + ").");
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Máy chủ trả về dữ liệu không hợp lệ. Hãy kiểm tra lại URL triển khai Google Apps Script.");
  }
}

$("donationForm").addEventListener("submit", async event => {
  event.preventDefault();
  clearError();

  const amount = parseAmount($("amount").value);
  if (!Number.isSafeInteger(amount) || amount < 1000) {
    showError("Số tiền ủng hộ tối thiểu là 1.000đ.");
    return;
  }

  const button = $("submit");
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Đang tạo mã thanh toán…";

  try {
    const id = "BMC" + Math.floor(10000 + Math.random() * 90000);
    const result = await post({
      action: "create_transaction",
      id,
      donorName: $("name").value.trim() || "Người bạn tốt",
      message: $("message").value.trim(),
      amount,
      currency: "VND",
      coffeeCount: 1,
      paymentMethod: "vietqr",
      language: "vi"
    });

    if (!result || result.success !== true || !result.transaction || !result.transaction.id) {
      throw new Error(result?.error || result?.message || "Không tạo được giao dịch. Vui lòng thử lại.");
    }

    orderCode = String(result.transaction.id);
    const transferContent = "UNGHO " + orderCode;
    const qrUrl = new URL("https://api.vietqr.io/image/970422-8880812999-GuEo6F2.jpg");
    qrUrl.searchParams.set("accountName", "DINH TRONG KHANH");
    qrUrl.searchParams.set("amount", String(amount));
    qrUrl.searchParams.set("addInfo", transferContent);

    $("qr").onerror = () => {
      $("qrError").classList.remove("d-none");
      $("qr").classList.add("d-none");
    };
    $("qr").onload = () => {
      $("qrError").classList.add("d-none");
      $("qr").classList.remove("d-none");
    };
    $("qr").src = qrUrl.toString();
    $("payAmount").textContent = fmt(amount);
    $("payCode").textContent = transferContent;
    $("order").textContent = orderCode;
    $("status").className = "alert alert-info";
    $("status").textContent = "Đang chờ thanh toán…";
    $("payment").classList.remove("d-none");
    $("payment").scrollIntoView({ behavior: "smooth", block: "center" });

    clearInterval(timer);
    timer = setInterval(check, 5000);
  } catch (error) {
    console.error("Không thể khởi tạo thanh toán:", error);
    showError(error.message || "Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.");
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
});

async function check() {
  if (!orderCode) return;
  try {
    const result = await get("check_status", { order_code: orderCode });
    if (result.status === "SUCCESS") {
      $("status").className = "alert alert-success";
      $("status").textContent = "Thanh toán thành công! Cảm ơn bạn đã ủng hộ ❤️";
      clearInterval(timer);
      loadSummary();
    }
  } catch (error) {
    console.warn("Không kiểm tra được trạng thái giao dịch:", error);
  }
}

async function loadSummary() {
  try {
    const result = await get("get_supporters");
    if (!result.success) throw new Error("Không tải được dữ liệu");
    const supporters = result.supporters || [];
    const paid = supporters.filter(item => String(item.status || "SUCCESS") === "SUCCESS");
    $("total").textContent = fmt(paid.reduce((sum, item) => sum + Number(item.amount || 0), 0));
    $("count").textContent = paid.length;
    $("supporters").innerHTML = paid.slice(0, 5).map(item =>
      '<div class="d-flex justify-content-between border-bottom py-2"><span>' +
      esc(item.name || item.donorName || "Một người bạn") + "</span><b>" +
      fmt(Number(item.amount || 0)) + "</b></div>"
    ).join("") || "Chưa có lời cảm ơn công khai.";
  } catch (error) {
    $("supporters").textContent = "Không tải được thống kê.";
  }
}

function esc(value) {
  return String(value).replace(/[&<>"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  })[character]);
}

loadSummary();