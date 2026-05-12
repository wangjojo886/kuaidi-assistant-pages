const ACCESS_HASH = "c2d7340697d488a8de0c97f38f523c19765980398e5ae310cbc777d3cd76e7d4";
const ACCESS_GATE_KEY = "kuaidi_access_granted_v2";
const ADMIN_PASSWORD_KEY = "kuaidi_admin_password_v1";

const supabaseConfig = window.SUPABASE_CONFIG || {};
const hasSupabase =
  typeof supabaseConfig.url === "string" &&
  typeof supabaseConfig.anonKey === "string" &&
  supabaseConfig.url.startsWith("https://") &&
  supabaseConfig.anonKey.length > 20 &&
  !supabaseConfig.url.includes("REPLACE") &&
  !supabaseConfig.anonKey.includes("REPLACE");

const sb = hasSupabase
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const state = {
  packages: [],
  recentPackages: [],
  locations: [],
  latestUpdatedAt: "",
  sourceExportTime: "",
};

function q(id) {
  return document.getElementById(id);
}

function setModeBanner(text, type = "") {
  const el = q("modeBanner");
  el.textContent = text;
  el.className = `mode-banner ${type}`.trim();
}

function setStatus(id, message, type = "") {
  const el = q(id);
  el.textContent = message;
  el.className = `status ${type}`.trim();
}

function getErrorReason(err, fallback = "未知错误") {
  if (!err) return fallback;
  if (typeof err === "string" && err.trim()) return err.trim();
  if (typeof err.message === "string" && err.message.trim()) return err.message.trim();
  return fallback;
}

function setAppReady() {
  q("gate").style.display = "none";
  q("app").classList.remove("app-hidden");
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach((el) => el.classList.add("view-hidden"));
  q(viewId).classList.remove("view-hidden");
}

function formatDateTime(input) {
  if (!input) return "未知";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function normalizeStaticPackages(rawPackages) {
  if (!Array.isArray(rawPackages)) return [];
  return rawPackages
    .map((item) => ({
      trackingNumber: Array.isArray(item.trackingNumbers)
        ? String(item.trackingNumbers[0] || "").trim()
        : String(item.tracking_number || "").trim(),
      trackingNumbers: Array.isArray(item.trackingNumbers)
        ? item.trackingNumbers.map((x) => String(x).trim()).filter(Boolean)
        : [String(item.tracking_number || "").trim()].filter(Boolean),
      date: String(item.date || item.package_date || "").trim(),
      location: String(item.location || "").trim(),
      createdAt: String(item.createdAt || item.created_at || "").trim(),
    }))
    .filter((item) => item.trackingNumbers.length > 0);
}

function renderUpdatedAt() {
  const latest = formatDateTime(state.latestUpdatedAt);
  const source = formatDateTime(state.sourceExportTime);
  if (state.sourceExportTime) {
    q("updatedAt").textContent = `最新更新时间：${latest}（导出时间：${source}）`;
    return;
  }
  q("updatedAt").textContent = `最新更新时间：${latest}`;
}

function renderEmpty(text) {
  q("results").innerHTML = `<div class="empty">${text}</div>`;
}

function renderQueryResults(items) {
  if (items.length === 0) {
    renderEmpty("没有匹配到快递记录");
    return;
  }

  q("results").innerHTML = items
    .map(
      (item) => `
      <article class="card">
        <div class="row">
          <span class="label">单号</span>
          <div class="value tags">
            ${(item.trackingNumbers || [item.trackingNumber])
              .map((tn) => `<span class="tag">${tn}</span>`)
              .join("")}
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

function renderRecentEntries() {
  if (!state.recentPackages.length) {
    q("recentEntries").innerHTML = '<div class="empty">暂无记录</div>';
    return;
  }

  q("recentEntries").innerHTML = state.recentPackages
    .map(
      (item) => `
      <div class="recent-item">
        <div class="recent-main">${item.trackingNumber}</div>
        <div class="recent-sub">${item.location} · ${item.date}</div>
      </div>
    `,
    )
    .join("");
}

function populateLocationOptions() {
  const select = q("entryLocation");
  if (!state.locations.length) {
    select.innerHTML = '<option value="">暂无位置</option>';
    return;
  }

  select.innerHTML = state.locations
    .map((location) => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`)
    .join("");
}

async function loadStaticJson() {
  const response = await fetch(`./latest.json?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`获取 latest.json 失败（HTTP ${response.status}）`);
  }

  const data = await response.json();
  state.packages = normalizeStaticPackages(data.packages);
  state.recentPackages = state.packages.slice(0, 8);
  state.locations = Array.from(new Set(state.packages.map((item) => item.location).filter(Boolean)));
  state.latestUpdatedAt = String(data.latestUpdatedAt || data.exportTime || "").trim();
  state.sourceExportTime = String(data.exportTime || "").trim();
}

async function loadSupabaseData() {
  const { data, error } = await sb
    .from("packages")
    .select("tracking_number, package_date, location, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;

  state.packages = (data || []).map((item) => ({
    trackingNumber: String(item.tracking_number || "").trim(),
    trackingNumbers: [String(item.tracking_number || "").trim()].filter(Boolean),
    date: String(item.package_date || "").trim(),
    location: String(item.location || "").trim(),
    createdAt: String(item.created_at || "").trim(),
  }));

  state.recentPackages = state.packages.slice(0, 8);
  state.latestUpdatedAt = state.packages[0]?.createdAt || "";
  state.sourceExportTime = "";

  const { data: locations, error: locationError } = await sb
    .from("locations")
    .select("name")
    .order("id", { ascending: true });

  if (locationError) throw locationError;
  state.locations = (locations || []).map((item) => String(item.name || "").trim()).filter(Boolean);
}

async function reloadData() {
  if (hasSupabase) {
    await loadSupabaseData();
    setModeBanner("当前为实时云端模式：支持手机录入 + 即时查询", "success");
  } else {
    await loadStaticJson();
    setModeBanner("当前为静态查询模式：未配置 Supabase 时只能查询", "warning");
  }

  renderUpdatedAt();
  populateLocationOptions();
  renderRecentEntries();
}

function filterPackages(query, date) {
  const normalizedQuery = query.trim().toLowerCase();
  return state.packages.filter((item) => {
    const byQuery =
      !normalizedQuery ||
      (item.trackingNumbers || []).some((tn) => tn.toLowerCase().includes(normalizedQuery));
    const byDate = !date || item.date === date;
    return byQuery && byDate;
  });
}

function runQuery() {
  const query = q("trackingInput").value;
  const date = q("dateInput").value;

  if (!query.trim() && !date) {
    setStatus("queryStatus", "请至少输入单号或选择日期", "error");
    renderEmpty("请输入查询条件");
    return;
  }

  const result = filterPackages(query, date);
  setStatus("queryStatus", `查询完成：共 ${result.length} 条`, "success");
  renderQueryResults(result);
}

function openQueryView() {
  showView("queryView");
  renderEmpty("输入单号或日期后查询");
  setStatus("queryStatus", hasSupabase ? "已连接实时云端数据" : "当前读取 latest.json 静态数据", "success");
  q("trackingInput").focus();
}

function openAdminFlow() {
  if (!hasSupabase) {
    showView("adminLoginView");
    setStatus("adminLoginStatus", "当前站点还没有接入 Supabase，暂时只能查询。先按 README 完成云端配置。", "warning");
    return;
  }

  const cachedPassword = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
  if (cachedPassword) {
    openAdminEntryView();
    return;
  }

  showView("adminLoginView");
  setStatus("adminLoginStatus", "请输入值班录入密码后进入", "success");
  q("adminPassword").focus();
}

function openAdminEntryView() {
  showView("adminEntryView");
  setStatus("entryStatus", "扫码枪接入后，保持光标在输入框中即可连续录入。", "success");
  renderRecentEntries();
  focusEntryInput();
}

function focusEntryInput() {
  const input = q("entryInput");
  input.focus();
  input.select();
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function handleGateLogin() {
  const password = q("gatePassword").value.trim();
  if (!password) {
    setStatus("gateStatus", "请输入访问密码", "error");
    return;
  }

  setStatus("gateStatus", "正在验证...", "success");
  const hash = await sha256(password);
  if (hash !== ACCESS_HASH) {
    setStatus("gateStatus", "访问密码错误，请重试", "error");
    q("gatePassword").select();
    return;
  }

  localStorage.setItem(ACCESS_GATE_KEY, ACCESS_HASH);
  sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
  setAppReady();
  await reloadData();
  showView("homeView");
}

async function handleAdminLogin() {
  const password = q("adminPassword").value.trim();
  if (!password) {
    setStatus("adminLoginStatus", "请输入录入密码", "error");
    return;
  }

  setStatus("adminLoginStatus", "正在验证...", "success");
  const { data, error } = await sb.rpc("admin_login", { p_password: password });
  if (error) {
    console.error(error);
    setStatus("adminLoginStatus", `登录失败：${getErrorReason(error)}`, "error");
    return;
  }

  if (!data) {
    setStatus("adminLoginStatus", "录入密码错误", "error");
    return;
  }

  sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
  setStatus("adminLoginStatus", "登录成功", "success");
  q("adminPassword").value = "";
  await reloadData();
  openAdminEntryView();
}

async function handleEntryAdd() {
  if (!hasSupabase) {
    setStatus("entryStatus", "未配置 Supabase，不能录入。", "warning");
    return;
  }

  const password = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
  const location = q("entryLocation").value;
  const trackingNumber = q("entryInput").value.trim();

  if (!password) {
    setStatus("entryStatus", "录入会话已失效，请重新进入值班录入。", "error");
    showView("adminLoginView");
    return;
  }

  if (!trackingNumber) {
    setStatus("entryStatus", "请先扫描或输入快递单号", "error");
    focusEntryInput();
    return;
  }

  if (!location) {
    setStatus("entryStatus", "请先选择位置", "error");
    return;
  }

  setStatus("entryStatus", "正在提交...", "success");
  const { data, error } = await sb.rpc("insert_package_with_password", {
    p_password: password,
    p_tracking_number: trackingNumber,
    p_location: location,
    p_package_date: new Date().toISOString().slice(0, 10),
  });

  if (error) {
    console.error(error);
    setStatus("entryStatus", `录入失败：${getErrorReason(error)}`, "error");
    focusEntryInput();
    return;
  }

  const message = data?.message || "录入成功";
  q("entryInput").value = "";
  setStatus("entryStatus", message, "success");
  await reloadData();
  focusEntryInput();
}

function handleLogout() {
  localStorage.removeItem(ACCESS_GATE_KEY);
  sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
  q("app").classList.add("app-hidden");
  q("gate").style.display = "flex";
  q("gatePassword").value = "";
  setStatus("gateStatus", "", "");
  q("gatePassword").focus();
}

function bindEvents() {
  q("gateBtn").addEventListener("click", handleGateLogin);
  q("gatePassword").addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleGateLogin();
  });

  q("logoutBtn").addEventListener("click", handleLogout);
  q("openQueryBtn").addEventListener("click", openQueryView);
  q("openAdminBtn").addEventListener("click", openAdminFlow);
  q("searchBtn").addEventListener("click", runQuery);
  q("trackingInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") runQuery();
  });
  q("dateInput").addEventListener("change", runQuery);

  q("adminLoginBtn").addEventListener("click", handleAdminLogin);
  q("adminPassword").addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleAdminLogin();
  });

  q("entryAddBtn").addEventListener("click", handleEntryAdd);
  q("entryInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleEntryAdd();
    }
  });
  q("focusInputBtn").addEventListener("click", focusEntryInput);
  q("adminLogoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    showView("homeView");
  });

  document.querySelectorAll("[data-go-home]").forEach((el) => {
    el.addEventListener("click", () => showView("homeView"));
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function init() {
  bindEvents();
  renderEmpty("输入单号或日期后查询");

  if (localStorage.getItem(ACCESS_GATE_KEY) === ACCESS_HASH) {
    setAppReady();
    await reloadData();
    showView("homeView");
    return;
  }

  q("gatePassword").focus();
}

init();
