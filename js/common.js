// 共用：頁首頁尾、格式化、顏色、工具提示

const PERIODS = [1, 3, 5, 10];
const fundByKey = Object.fromEntries(FUNDS.map(f => [f.key, f]));

// 每檔基金固定使用自己的顏色（依編號），排序或篩選都不改變
function color(f) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--s${f.no}`).trim();
}
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function pct(x, digits = 1, sign = false) {
  if (x == null) return "—";
  const v = (x * 100).toFixed(digits);
  return (sign && x > 0 ? "+" : "") + v + "%";
}
function num(x, digits = 2) {
  return x == null ? "—" : x.toFixed(digits);
}
function ym(d) {
  return d ? d.slice(0, 7).replace("-", "/") : "";
}
function ymd(d) {
  return d ? d.replace(/-/g, "/") : "";
}
function money(aum, cur) {
  if (cur === "TWD") return `新台幣 ${Math.round(aum / 1e8).toLocaleString()} 億`;
  return `${Math.round(aum / 1e8).toLocaleString()} 億美元`;
}

// 不同基金對同一發行人的寫法不同，統一後才能合併計算
const ALIAS = { "GNMA 房貸債": "美國機構房貸債", "機構房貸債": "美國機構房貸債", "Kinder Morgan（債）": "Kinder Morgan", "American Express（債）": "American Express", "緯穎（可轉債）": "緯穎" };
const issuer = k => ALIAS[k] || k;

// 國家／地區分類不一（有國家別也有 Morningstar 區域），合併成同一組類別
const COUNTRY_GROUPS = [["美國", "--s1"], ["台灣", "--s8"], ["日本", "--s5"], ["韓國", "--s2"], ["中國", "--s6"], ["加拿大", "--s4"], ["歐洲（含英國）", "--s3"], ["已開發亞洲（未細分）", "--s7"]];
function countryGroup(k) {
  if (["美國", "台灣", "日本", "韓國", "中國", "加拿大"].includes(k)) return k;
  if (/歐|英國|荷蘭|義大利/.test(k)) return "歐洲（含英國）";
  if (k === "已開發亞洲") return "已開發亞洲（未細分）";
  return "其他／現金";
}

// 卡片與摘要用的代表數字：近 3 年，不足時用近 1 年，再不足用成立以來（累積、不年化）
function headline(f) {
  for (const n of [3, 1]) if (f.per[n]) return { label: `${n} 年年化報酬`, short: `${n} 年`, ret: f.per[n].ret, vol: f.per[n].vol, sharpe: f.per[n].sharpe };
  const s = f.per.si;
  return { label: `成立 ${s.months} 個月累積`, short: `成立 ${s.months} 個月`, ret: s.cum, vol: s.vol, sharpe: null };
}
// 第 9、10 檔顏色與前面的色相較接近，折線另加虛線區分
const dash = f => f.no >= 9 ? [6, 4] : [];

// 資料截止日（由 data.js 的 AS_OF 提供）
const md = d => d.slice(5).replace("-", "/");
function asOfText() {
  const late = AS_OF.lagging.length ? `（${AS_OF.lagging.map(x => x.short).join("、")}為 ${md(AS_OF.lagging[0].end)}）` : "";
  return ymd(AS_OF.end) + late;
}

function fundLink(f, label) {
  return `<a href="fund.html?id=${f.key}"><span class="dot" style="--c:${color(f)}"></span>${label || f.short}</a>`;
}

// 依數值深淺上色：值越大越深（單一色相）
function heatBg(v, max, rgb = "42,120,214") {
  if (v == null || max <= 0) return "";
  const a = Math.max(0, Math.min(1, v / max)) * 0.55;
  return `background: rgba(${rgb},${a.toFixed(3)})`;
}
// 正負分開上色：正值藍、負值橘
function divBg(v, max) {
  if (v == null) return "";
  const a = Math.min(1, Math.abs(v) / max) * 0.5;
  return v >= 0 ? `background: rgba(42,120,214,${a.toFixed(3)})` : `background: rgba(235,104,52,${a.toFixed(3)})`;
}

// 簡易工具提示：元素加 data-tip 即可
function initTips() {
  let tip = document.getElementById("tip");
  if (!tip) { tip = document.createElement("div"); tip.id = "tip"; document.body.appendChild(tip); }
  document.addEventListener("mousemove", e => {
    const t = e.target.closest("[data-tip]");
    if (!t) { tip.style.display = "none"; return; }
    tip.innerHTML = t.dataset.tip;
    tip.style.display = "block";
    const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
    tip.style.left = x + "px";
    tip.style.top = (e.clientY + 16) + "px";
  });
}

// 橫向 100% 堆疊條（股債比、國家等）
function stackRow(f, parts, palette) {
  const total = parts.reduce((s, p) => s + Math.max(0, p[1]), 0);
  const segs = parts.filter(p => p[1] > 0).map(([k, v], i) => {
    const w = v / total * 100;
    return `<span style="width:${w}%;background:${palette[k] || palette._[i % palette._.length]}" data-tip="<b>${f.short}</b><br>${k}：${v.toFixed(1)}%">${w >= 9 ? v.toFixed(0) + "%" : ""}</span>`;
  }).join("");
  return `<div class="stack-row"><div class="nm">${fundLink(f)}</div><div class="stack">${segs}</div></div>`;
}

function chartDefaults() {
  if (!window.Chart) return;
  Chart.defaults.font.family = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif';
  Chart.defaults.color = cssVar("--muted");
  Chart.defaults.borderColor = cssVar("--grid");
  Chart.defaults.plugins.tooltip.backgroundColor = cssVar("--text");
  Chart.defaults.plugins.tooltip.titleColor = cssVar("--bg");
  Chart.defaults.plugins.tooltip.bodyColor = cssVar("--bg");
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.legend.labels.boxHeight = 12;
}

function renderChrome(active) {
  const links = [
    ["index.html", "總覽比較"],
    ["funds.html", "個別基金"],
    ["loan.html", "質押借款試算"],
    ["method.html", "計算方式與資料來源"],
  ];
  document.getElementById("site-header").innerHTML = `
    <div class="wrap header-inner">
      <a class="brand" href="index.html">📊 十檔基金比較</a>
      <nav>${links.map(([href, label]) =>
        `<a href="${href}" class="${active === href ? "active" : ""}">${label}</a>`).join("")}</nav>
    </div>`;
  document.getElementById("site-footer").innerHTML = `
    <div class="wrap">
      <p>淨值資料計算至 ${asOfText()}，持股、配置與費用取自各基金 ${AS_OF.reports}月報。
      報酬以原幣計算（美元或新台幣），未扣申購手續費與信託管理費。</p>
      <p>質押試算的補倉／平倉門檻請以借款銀行實際規定為準。本站為個人整理的比較資料，不構成投資建議；投資前請詳閱各基金公開說明書與投資人須知，並以基金公司最新公告為準。</p>
    </div>`;
  document.querySelectorAll(".asof-full").forEach(e => { e.textContent = asOfText(); });
  document.querySelectorAll(".asof-md").forEach(e => { e.textContent = md(AS_OF.end); });
  initTips();
  chartDefaults();
}
