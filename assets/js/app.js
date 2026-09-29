const API = "https://script.google.com/macros/s/AKfycbwhETLuQ0Jl8BjvQ-w4lywLtVoHODceoigKYttiilpNH1grovoE8tJ6_K91U52SQ0hU/exec";
const $ = id => document.getElementById(id);
let orderCode = "";
let timer = null;

const fmt = n => new Intl.NumberFormat("vi-VN").format(n) + "đ";
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

document.querySelectorAll("[data-amount]").forEach(button => {
  button.addEventListener("click", () => {
    $("amount").value = button.dataset.amount;
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

  const amount = Number($("amount").value);
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