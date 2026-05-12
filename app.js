const ACCESS_KEY = "kuaidi_access_granted_v1";
const ACCESS_HASH = "c2d7340697d488a8de0c97f38f523c19765980398e5ae310cbc777d3cd76e7d4";

const state = {
  packages: [],
  latestUpdatedAt: "",
  sourceExportTime: "",
};

function normalizePackages(rawPackages) {
  if (!Array.isArray(rawPackages)) return [];

  return rawPackages
    .map((item) => {
      const trackingNumbers = Array.isArray(item.trackingNumbers)
        ? item.trackingNumbers
        : Array.isArray(item.tracking_numbers)
          ? item.tracking_numbers
          : [];

      return {
        trackingNumbers: trackingNumbers
          .map((x) => String(x || "").trim())
          .filter(Boolean),
        date: String(item.date || "").trim(),
        location: String(item.location || "").trim(),
        createdAt: String(item.createdAt || item.created_at || "").trim(),
        order: Number(item.order || item.order_num || 0) || 0,
      };
    })
    .filter((item) => item.trackingNumbers.length > 0);
}

function formatDateTime(input) {
  if (!input) return "未知";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function setStatus(message, type = "") {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function setGateStatus(message, type = "") {
  const statusEl = document.getElementById("gateStatus");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function renderUpdatedAt() {
  const updatedAtEl = document.getElementById("updatedAt");
  const latest = formatDateTime(state.latestUpdatedAt);
  const source = formatDateTime(state.sourceExportTime);

  if (state.sourceExportTime) {
    updatedAtEl.textContent = `最新更新时间：${latest}（值班导出时间：${source}）`;
    return;
  }

  updatedAtEl.textContent = `最新更新时间：${latest}`;
}

function renderEmpty(text) {
  document.getElementById("results").innerHTML = `<div class="empty">${text}</div>`;
}

function renderResults(items) {
  const root = document.getElementById("results");
  if (items.length === 0) {
    renderEmpty("没有匹配到快递记录");
    return;
  }

  root.innerHTML = items
    .map(
      (item) => `
    <article class="card">
      <div class="row">
        <span class="label">单号</span>
        <div class="value tags">
          ${item.trackingNumbers.map((tn) => `<span class="tag">${tn}</span>`).join("")}
        </div>
      </div>
      <div class="row">
        <span class="label">日期</span>
        <span class="value">${item.date || "-"}</span>
      </div>
      <div class="row">
        <span class="label">位置</span>
        <span class="value">${item.location || "-"}</span>
      </div>
    </article>
  `,
    )
    .join("");
}

function doSearch() {
  const query = document.getElementById("trackingInput").value.trim().toLowerCase();
  const date = document.getElementById("dateInput").value;

  if (!query && !date) {
    setStatus("请至少输入单号或选择日期", "error");
    renderEmpty("请输入查询条件");
    return;
  }

  const result = state.packages.filter((item) => {
    const queryMatched = !query || item.trackingNumbers.some((tn) => tn.toLowerCase().includes(query));
    const dateMatched = !date || item.date === date;
    return queryMatched && dateMatched;
  });

  setStatus(`查询完成：共 ${result.length} 条`, "success");
  renderResults(result);
}

async function loadLatestJson() {
  setStatus("正在加载最新数据...");
  try {
    const response = await fetch(`./latest.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`获取数据失败（HTTP ${response.status}）`);
    }

    const data = await response.json();
    state.packages = normalizePackages(data.packages);
    state.latestUpdatedAt = String(data.latestUpdatedAt || data.exportTime || "").trim();
    state.sourceExportTime = String(data.exportTime || "").trim();

    renderUpdatedAt();
    renderEmpty("输入单号或日期后查询");
    setStatus(`数据已加载：共 ${state.packages.length} 条`, "success");
  } catch (err) {
    console.error(err);
    setStatus(`加载失败：${err.message || "未知错误"}`, "error");
    renderEmpty("数据加载失败，请联系值班人员重新发布最新数据");
  }
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function unlockApp() {
  localStorage.setItem(ACCESS_KEY, ACCESS_HASH);
  document.getElementById("gate").style.display = "none";
  document.getElementById("app").classList.remove("app-hidden");
  document.getElementById("trackingInput").focus();
}

async function handleGateLogin() {
  const passwordInput = document.getElementById("gatePassword");
  const password = passwordInput.value.trim();
  if (!password) {
    setGateStatus("请输入访问密码", "error");
    return;
  }

  setGateStatus("正在验证...");
  const hash = await sha256(password);
  if (hash !== ACCESS_HASH) {
    setGateStatus("密码错误，请重试", "error");
    passwordInput.select();
    return;
  }

  setGateStatus("验证成功", "success");
  unlockApp();
  await loadLatestJson();
}

function logoutAccess() {
  localStorage.removeItem(ACCESS_KEY);
  document.getElementById("app").classList.add("app-hidden");
  document.getElementById("gate").style.display = "flex";
  document.getElementById("gatePassword").value = "";
  setGateStatus("");
  setStatus("");
  renderEmpty("请输入访问密码后查看数据");
}

function bindEvents() {
  document.getElementById("searchBtn").addEventListener("click", doSearch);
  document.getElementById("trackingInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") doSearch();
  });
  document.getElementById("dateInput").addEventListener("change", doSearch);

  document.getElementById("gateBtn").addEventListener("click", handleGateLogin);
  document.getElementById("gatePassword").addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleGateLogin();
  });
  document.getElementById("logoutBtn").addEventListener("click", logoutAccess);
}

async function init() {
  bindEvents();
  renderEmpty("请输入访问密码后查看数据");

  if (localStorage.getItem(ACCESS_KEY) === ACCESS_HASH) {
    unlockApp();
    await loadLatestJson();
    return;
  }

  document.getElementById("gatePassword").focus();
}

init();
