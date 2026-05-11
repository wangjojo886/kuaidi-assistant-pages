const state = {
  packages: [],
  latestUpdatedAt: '',
  sourceExportTime: '',
};

function normalizePackages(rawPackages) {
  if (!Array.isArray(rawPackages)) return [];

  return rawPackages.map((item) => {
    const trackingNumbers = Array.isArray(item.trackingNumbers)
      ? item.trackingNumbers
      : Array.isArray(item.tracking_numbers)
        ? item.tracking_numbers
        : [];

    return {
      trackingNumbers: trackingNumbers
        .map((x) => String(x || '').trim())
        .filter(Boolean),
      date: String(item.date || '').trim(),
      location: String(item.location || '').trim(),
      createdAt: String(item.createdAt || item.created_at || '').trim(),
      order: Number(item.order || item.order_num || 0) || 0,
    };
  }).filter((item) => item.trackingNumbers.length > 0);
}

function formatDateTime(input) {
  if (!input) return '未知';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleString('zh-CN', { hour12: false });
}

function setStatus(message, type = '') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function renderUpdatedAt() {
  const updatedAtEl = document.getElementById('updatedAt');
  const latest = formatDateTime(state.latestUpdatedAt);
  const source = formatDateTime(state.sourceExportTime);

  if (state.sourceExportTime) {
    updatedAtEl.textContent = `最新更新时间：${latest}（值班导出时间：${source}）`;
    return;
  }

  updatedAtEl.textContent = `最新更新时间：${latest}`;
}

function renderEmpty(text) {
  document.getElementById('results').innerHTML = `<div class="empty">${text}</div>`;
}

function renderResults(items) {
  const root = document.getElementById('results');
  if (items.length === 0) {
    renderEmpty('没有匹配到快递记录');
    return;
  }

  root.innerHTML = items.map((item) => `
    <article class="card">
      <div class="row">
        <span class="label">单号</span>
        <div class="value tags">
          ${item.trackingNumbers.map((tn) => `<span class="tag">${tn}</span>`).join('')}
        </div>
      </div>
      <div class="row">
        <span class="label">日期</span>
        <span class="value">${item.date || '-'}</span>
      </div>
      <div class="row">
        <span class="label">位置</span>
        <span class="value">${item.location || '-'}</span>
      </div>
    </article>
  `).join('');
}

function doSearch() {
  const query = document.getElementById('trackingInput').value.trim().toLowerCase();
  const date = document.getElementById('dateInput').value;

  if (!query && !date) {
    setStatus('请至少输入单号或选择日期', 'error');
    renderEmpty('请输入查询条件');
    return;
  }

  const result = state.packages.filter((item) => {
    const queryMatched = !query || item.trackingNumbers.some((tn) => tn.toLowerCase().includes(query));
    const dateMatched = !date || item.date === date;
    return queryMatched && dateMatched;
  });

  setStatus(`查询完成：共 ${result.length} 条`, 'success');
  renderResults(result);
}

async function loadLatestJson() {
  setStatus('正在加载最新数据...');
  try {
    const response = await fetch(`./latest.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`获取数据失败（HTTP ${response.status}）`);
    }

    const data = await response.json();
    state.packages = normalizePackages(data.packages);
    state.latestUpdatedAt = String(data.latestUpdatedAt || data.exportTime || '').trim();
    state.sourceExportTime = String(data.exportTime || '').trim();

    renderUpdatedAt();
    renderEmpty('输入单号或日期后查询');
    setStatus(`数据已加载：共 ${state.packages.length} 条`, 'success');
  } catch (err) {
    console.error(err);
    setStatus(`加载失败：${err.message || '未知错误'}`, 'error');
    renderEmpty('数据加载失败，请联系值班人员重新发布最新数据');
  }
}

function bindEvents() {
  document.getElementById('searchBtn').addEventListener('click', doSearch);
  document.getElementById('trackingInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') doSearch();
  });
  document.getElementById('dateInput').addEventListener('change', doSearch);
}

async function init() {
  bindEvents();
  await loadLatestJson();
}

init();
