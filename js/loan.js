// 質押借款試算

renderChrome("loan.html");

// 第 7、8 檔（台股 ETF 連結）為 RR4，其餘為 RR3
const RR4 = new Set(["tw50", "twhdlv"]);
// 門檻依銀行通知表：a＝接近補倉、c＝補倉通知、l＝平倉通知；3＝7＜X≦8 成（RR1～RR3）、4＝6＜X≦7 成（RR4 以上）
const DEFAULTS = { a3: 122, c3: 120, l3: 110, a4: 140, c4: 130, l4: 120, ltv: 70, loan: 0, rate: 0, loss: 0, fx: 0, basis: 5 };
// 舊版會自動帶入的範例數字；若瀏覽器裡存的正好是範例，就清掉，改由使用者自行輸入
const OLD_SAMPLES = [
  { franklin: 150, schroder: 100, gaf: 150, janus: 150, tw50: 200, twhdlv: 100, leaders: 50, sgehi: 100 },
  { franklin: 100, schroder: 100, gaf: 100, janus: 100, pimco: 100, sgehi: 100, tw50: 150, twhdlv: 100, leaders: 50, yuantami: 100 },
];
const STORE = "fund-loan-v1";

const st = { ...DEFAULTS, hold: {}, exp: {} };
try { Object.assign(st, JSON.parse(localStorage.getItem(STORE) || "{}")); } catch (e) { /* 無法讀取時用預設值 */ }
const sameHold = (a, b) => FUNDS.every(f => (a[f.key] || 0) === (b[f.key] || 0));
if (st.loan === 500 && OLD_SAMPLES.some(x => sameHold(st.hold, x))) Object.assign(st, { hold: {}, loan: 0, rate: 0 });
const blank = v => v ? v : ""; // 0 顯示為空白，讓欄位維持未填狀態
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(st)); } catch (e) { /* 私密模式等情況略過 */ } };

const wan = (x, d = 1) => (Math.round(x * 10 ** d) / 10 ** d).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) + " 萬";
const p1 = x => isFinite(x) ? (x * 100).toFixed(1) + "%" : "—";

// 依基準期間取歷史年化報酬，不足時往較短期間找
function histReturn(f, basis) {
  const order = [10, 5, 3, 1].filter(n => n <= basis);
  for (const n of order) if (f.per[n]) return f.per[n].ret;
  for (const n of [1, 3, 5, 10]) if (f.per[n]) return f.per[n].ret;
  return null; // 成立未滿 1 年，沒有可帶入的歷史報酬
}
function expOf(f) {
  if (st.exp[f.key] != null) return st.exp[f.key];
  const h = histReturn(f, st.basis);
  return h == null ? 0 : Math.round(h * 1000) / 10;
}

// ---------- 輸入表 ----------
document.getElementById("hold-body").innerHTML = FUNDS.map(f => `<tr>
  <td class="fund">${fundLink(f, f.no + ". " + f.short)}</td>
  <td><span class="badge ${RR4.has(f.key) ? "rr4" : ""}">${RR4.has(f.key) ? "RR4" : "RR3"}</span></td>
  <td>${f.cur === "USD" ? "美元" : "新台幣"}</td>
  <td><input type="number" min="0" step="1" data-hold="${f.key}" value="${st.hold[f.key] || ""}" placeholder="0"></td>
  <td id="w-${f.key}"></td>
  <td><input type="number" step="0.1" data-exp="${f.key}" value="${expOf(f)}"></td>
</tr>`).join("");

const $ = id => document.getElementById(id);
for (const k of ["ltv", "a3", "c3", "l3", "a4", "c4", "l4"]) $(k).value = st[k];
$("loan").value = blank(st.loan); $("rate").value = blank(st.rate);
$("lossR").value = $("lossN").value = st.loss;
$("fxR").value = $("fxN").value = st.fx;
document.querySelectorAll("[data-basis]").forEach(b => b.classList.toggle("on", +b.dataset.basis === st.basis));

document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.hold) st.hold[t.dataset.hold] = Math.max(0, +t.value || 0);
  else if (t.dataset.exp) st.exp[t.dataset.exp] = +t.value || 0;
  else if (["loan", "rate", "ltv", "a3", "c3", "l3", "a4", "c4", "l4"].includes(t.id)) st[t.id] = +t.value || 0;
  else if (t.id === "lossR" || t.id === "lossN") { st.loss = Math.min(100, Math.max(0, +t.value || 0)); $(t.id === "lossR" ? "lossN" : "lossR").value = st.loss; }
  else if (t.id === "fxR" || t.id === "fxN") { st.fx = Math.min(100, Math.max(0, +t.value || 0)); $(t.id === "fxR" ? "fxN" : "fxR").value = st.fx; }
  else return;
  save(); render();
});
document.querySelectorAll("[data-basis]").forEach(b => b.addEventListener("click", () => {
  st.basis = +b.dataset.basis; st.exp = {};
  document.querySelectorAll("[data-basis]").forEach(x => x.classList.toggle("on", x === b));
  FUNDS.forEach(f => { document.querySelector(`[data-exp="${f.key}"]`).value = expOf(f); });
  save(); render();
}));
$("reset").addEventListener("click", () => {
  Object.assign(st, { ...DEFAULTS, hold: {}, exp: {} });
  document.querySelectorAll("[data-hold]").forEach(i => { i.value = ""; });
  for (const k of ["ltv", "a3", "c3", "l3", "a4", "c4", "l4"]) $(k).value = st[k];
  $("loan").value = ""; $("rate").value = "";
  $("lossR").value = $("lossN").value = $("fxR").value = $("fxN").value = 0;
  FUNDS.forEach(f => { document.querySelector(`[data-exp="${f.key}"]`).value = expOf(f); });
  save(); render();
});

// ---------- 核心計算 ----------
// 情境：資產虧損 loss、匯率虧損 fx（只作用在美元基金），回傳市值、維持率與加權門檻
function scenario(loss, fx) {
  let A = 0, A4 = 0;
  for (const f of FUNDS) {
    const v = (st.hold[f.key] || 0) * (1 - loss) * (f.cur === "USD" ? 1 - fx : 1);
    A += v; if (RR4.has(f.key)) A4 += v;
  }
  const w4 = A > 0 ? A4 / A : 0;
  const warn = ((1 - w4) * st.a3 + w4 * st.a4) / 100;
  const call = ((1 - w4) * st.c3 + w4 * st.c4) / 100;
  const liq = ((1 - w4) * st.l3 + w4 * st.l4) / 100;
  const L = st.loan;
  return { A, w4, warn, call, liq, ratio: L > 0 ? A / L : Infinity, avail: A * st.ltv / 100 - L };
}
function status(s) {
  if (s.ratio < s.liq) return { k: "liq", t: "✕ 平倉通知" };
  if (s.ratio < s.call) return { k: "call", t: "⚠ 補倉通知" };
  if (s.ratio < s.warn) return { k: "warn", t: "◐ 接近補倉" };
  return { k: "ok", t: "✓ 正常" };
}
// 找出跌多少會碰到門檻：test(x) 由 false 變 true 的最小 x（二分搜尋）
function breakpoint(test) {
  if (test(0)) return 0;
  if (!test(0.9999)) return null;
  let lo = 0, hi = 0.9999;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; test(m) ? hi = m : lo = m; }
  return hi;
}

function gaugeHtml(s) {
  const max = Math.max(3, Math.ceil((isFinite(s.ratio) ? s.ratio : 3) * 1.15 * 2) / 2);
  const pos = x => Math.min(100, x / max * 100);
  const r = isFinite(s.ratio) ? s.ratio : max;
  const ticks = [];
  for (let t = 0.5; t <= max + 1e-9; t += 0.5) ticks.push(`<span style="left:${pos(t)}%">${Math.round(t * 100)}%</span>`);
  return `<div class="gauge">
    <div class="zone liq" style="width:${pos(s.liq)}%"></div>
    <div class="zone call" style="left:${pos(s.liq)}%;width:${pos(s.call) - pos(s.liq)}%"></div>
    <div class="zone warn" style="left:${pos(s.call)}%;width:${pos(s.warn) - pos(s.call)}%"></div>
    <div class="zone ok" style="left:${pos(s.warn)}%;right:0"></div>
    <div class="line" style="left:${pos(s.liq)}%" data-tip="平倉通知線 ${p1(s.liq)}"></div>
    <div class="line" style="left:${pos(s.call)}%" data-tip="補倉通知線 ${p1(s.call)}"></div>
    <div class="line" style="left:${pos(s.warn)}%" data-tip="接近補倉水準 ${p1(s.warn)}"></div>
    <div class="marker" style="left:${pos(r)}%"><b>${isFinite(s.ratio) ? p1(s.ratio) : "無借款"}</b></div>
  </div>
  <div class="gauge-ticks">${ticks.join("")}</div>
  <div class="legend" style="margin-top:6px"><span><i style="background:var(--liq-bg)"></i>平倉區（＜${p1(s.liq)}）</span><span><i style="background:var(--call-bg)"></i>補倉區（${p1(s.liq)}～${p1(s.call)}）</span><span><i style="background:var(--warn-bg)"></i>接近補倉（${p1(s.call)}～${p1(s.warn)}）</span><span><i style="background:var(--ok-bg)"></i>正常（≧${p1(s.warn)}）</span></div>`;
}
const tile = (k, v, sub = "", cls = "") => `<div class="tile ${cls}"><span class="k">${k}</span><span class="v">${v}</span>${sub ? `<span class="s">${sub}</span>` : ""}</div>`;

// ---------- 畫面 ----------
let incomeChart;
function render() {
  const total = FUNDS.reduce((s, f) => s + (st.hold[f.key] || 0), 0);
  const usd = FUNDS.filter(f => f.cur === "USD").reduce((s, f) => s + (st.hold[f.key] || 0), 0);
  FUNDS.forEach(f => { $("w-" + f.key).textContent = total ? p1((st.hold[f.key] || 0) / total) : "—"; });
  $("sum-cell").innerHTML = `<b>${wan(total, 0)}</b>`;
  const expW = total ? FUNDS.reduce((s, f) => s + (st.hold[f.key] || 0) * expOf(f), 0) / total : 0;
  $("exp-cell").innerHTML = `<b>${expW.toFixed(2)}%</b><span class="sub">加權</span>`;

  const s0 = scenario(0, 0), L = st.loan, stt = status(s0);
  const maxLoan = total * st.ltv / 100;

  // 維持率 KPI
  $("kpis").innerHTML =
    tile("組合總市值", wan(total), `其中美元基金 ${total ? p1(usd / total) : "—"}`) +
    tile("借款金額", wan(L), st.rate ? `年利率 ${st.rate}%` : "尚未輸入利率") +
    tile("目前維持率", L > 0 ? p1(s0.ratio) : "無借款", stt.t, "st-" + stt.k) +
    tile("加權接近補倉水準", "＜ " + p1(s0.warn), "將屆通知客戶") +
    tile("加權補倉通知線", "＜ " + p1(s0.call), `RR4 占 ${p1(s0.w4)}`) +
    tile("加權平倉通知線", "＜ " + p1(s0.liq), `RR3 占 ${p1(1 - s0.w4)}`) +
    tile("可借額度上限", wan(maxLoan), `組合淨值 × ${st.ltv}%`) +
    tile("剩餘可借額度", wan(Math.max(0, s0.avail)), s0.avail < 0 ? `已超借 ${wan(-s0.avail)}` : `已用 ${maxLoan ? p1(L / maxLoan) : "—"}`, s0.avail < 0 ? "st-liq" : "");
  $("gauge").innerHTML = L > 0 ? gaugeHtml(s0) : `<p class="note">請輸入借款金額。</p>`;

  // 可承受跌幅
  const rows = [
    ["接近補倉水準", x => scenario(x, 0), y => scenario(0, y), s => s.ratio < s.warn],
    ["補倉通知", x => scenario(x, 0), y => scenario(0, y), s => s.ratio < s.call],
    ["平倉通知", x => scenario(x, 0), y => scenario(0, y), s => s.ratio < s.liq],
    ["可借額度歸零", x => scenario(x, 0), y => scenario(0, y), s => s.avail <= 0],
  ];
  const fmtBp = (bp, base) => bp == null ? `<td class="na">跌到 0 也不會碰到</td><td class="na">—</td>`
    : bp === 0 ? `<td class="st-liq">已達到</td><td>—</td>`
    : `<td class="heat" style="${heatBg(0.5 - Math.min(bp, 0.5), 0.5, "235,104,52")}"><b>−${(bp * 100).toFixed(1)}%</b></td><td>${wan(base * (1 - bp))}</td>`;
  $("drop-table").innerHTML = L > 0 && total > 0 ? `
    <thead><tr class="group"><th></th><th colspan="2">全部資產同步下跌</th><th colspan="2">只有匯率下跌（美元基金）</th></tr>
    <tr><th>觸發條件</th><th>可承受跌幅</th><th>屆時組合市值</th><th>可承受匯率跌幅</th><th>屆時美元基金市值</th></tr></thead>
    <tbody>${rows.map(([name, fa, fx, cond]) => `<tr><td>${name}</td>${fmtBp(breakpoint(x => cond(fa(x))), total)}${usd > 0 ? fmtBp(breakpoint(y => cond(fx(y))), usd) : `<td class="na" colspan="2">無美元基金</td>`}</tr>`).join("")}</tbody>`
    : `<tbody><tr><td class="na">請輸入持有市值與借款金額。</td></tr></tbody>`;

  // 情境
  const s1 = scenario(st.loss / 100, st.fx / 100), st1 = status(s1);
  $("scn-kpis").innerHTML =
    tile("虧損後組合市值", wan(s1.A), `減少 ${wan(total - s1.A)}（${total ? p1(1 - s1.A / total) : "—"}）`) +
    tile("虧損後維持率", L > 0 ? p1(s1.ratio) : "無借款", st1.t, "st-" + st1.k) +
    tile("距接近補倉", L > 0 ? (s1.ratio >= s1.warn ? "還可跌 " + wan(s1.A - s1.warn * L) : "已低於 " + wan(s1.warn * L - s1.A)) : "—", `接近補倉 ${p1(s1.warn)}`) +
    tile("距補倉線", L > 0 ? (s1.ratio >= s1.call ? "還可跌 " + wan(s1.A - s1.call * L) : "已低於 " + wan(s1.call * L - s1.A)) : "—", `補倉線 ${p1(s1.call)}`) +
    tile("距平倉線", L > 0 ? (s1.ratio >= s1.liq ? "還可跌 " + wan(s1.A - s1.liq * L) : "低於 " + wan(s1.liq * L - s1.A)) : "—", `平倉線 ${p1(s1.liq)}`) +
    tile("剩餘可借額度", wan(Math.max(0, s1.avail)), s1.avail < 0 ? `超借 ${wan(-s1.avail)}` : "");
  $("scn-gauge").innerHTML = L > 0 ? gaugeHtml(s1) : "";

  // 對照表
  const losses = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50], fxs = [0, 2.5, 5, 7.5, 10, 12.5, 15, 20];
  const near = (arr, v) => arr.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
  const nl = near(losses, st.loss), nf = near(fxs, st.fx);
  $("grid").innerHTML = L > 0 && total > 0 ? `<thead><tr><th class="rowh">資產虧損 ＼ 匯率虧損</th>${fxs.map(y => `<th>${y}%</th>`).join("")}</tr></thead>
    <tbody>${losses.map(x => `<tr><td class="fund">−${x}%</td>${fxs.map(y => {
      const s = scenario(x / 100, y / 100), k = status(s);
      return `<td class="cell-${k.k} ${x === nl && y === nf ? "cur" : ""}" data-tip="資產 −${x}%、匯率 −${y}%<br>維持率 ${p1(s.ratio)}（${k.t}）">${p1(s.ratio)}</td>`;
    }).join("")}</tr>`).join("")}</tbody>` : `<tbody><tr><td class="na">請輸入持有市值與借款金額。</td></tr></tbody>`;

  // 預期收益與利息
  const gain = FUNDS.reduce((s, f) => s + (st.hold[f.key] || 0) * expOf(f) / 100, 0);
  const interest = L * st.rate / 100, equity = total - L;
  $("income-kpis").innerHTML =
    tile("預期年收益（淨值增加）", wan(gain), `加權預期報酬 ${expW.toFixed(2)}%`) +
    tile("借款年利息", wan(interest), `每月約 ${wan(interest / 12, 2)}`) +
    tile("扣息後預期淨收益", wan(gain - interest), "", gain - interest < 0 ? "st-liq" : "st-ok") +
    tile("自有資金報酬率", equity > 0 ? p1((gain - interest) / equity) : "—", `自有資金 ${wan(equity)}`) +
    tile("損益兩平報酬率", total ? p1(interest / total) : "—", "組合至少要賺這麼多才夠付利息");
  const rowsInc = FUNDS.filter(f => st.hold[f.key] > 0);
  const data = { labels: rowsInc.map(f => f.short), datasets: [{ data: rowsInc.map(f => st.hold[f.key] * expOf(f) / 100), backgroundColor: rowsInc.map(color), borderRadius: 4, barThickness: 16 }] };
  if (incomeChart) { incomeChart.data = data; incomeChart.update(); }
  else incomeChart = new Chart($("c-income"), {
    type: "bar", data,
    options: { indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => wan(c.raw, 2) } } }, scales: { x: { title: { display: true, text: "萬元 / 年" } }, y: { grid: { display: false } } } },
  });

  renderMix(total);
}

// ---------- 組合透視 ----------
function barList(items, colorOf, fmt = v => v.toFixed(1) + "%") {
  if (!items.length) return `<p class="note">請先輸入持有市值。</p>`;
  const max = Math.max(...items.map(x => x[1]));
  return `<div class="bar-list">${items.map(([k, v, tip]) => `<div class="bar-item" ${tip ? `data-tip="${tip}"` : ""}><span>${k}</span>
    <div class="track"><div class="fill" style="width:${v / max * 100}%;--c:${colorOf(k)}"></div></div><span class="val">${fmt(v)}</span></div>`).join("")}</div>`;
}
const sortDesc = o => Object.entries(o).filter(x => x[1] > 0.0001).sort((a, b) => b[1] - a[1]);

function renderMix(total) {
  const w = f => total ? (st.hold[f.key] || 0) / total : 0;

  // 基金權重
  $("weights").innerHTML = total ? `<div class="stack">${FUNDS.filter(f => w(f) > 0).map(f =>
    `<span style="width:${w(f) * 100}%;background:${color(f)}" data-tip="${f.short}：${p1(w(f))}">${w(f) >= 0.07 ? p1(w(f)) : ""}</span>`).join("")}</div>
    <div class="legend" style="margin-top:8px">${FUNDS.filter(f => w(f) > 0).map(f => `<span><i style="background:${color(f)}"></i>${f.short} ${p1(w(f))}</span>`).join("")}</div>` : `<p class="note">請先輸入持有市值。</p>`;

  // 股債比：可轉債與股票連結票據另列；現金類合併
  const allocName = k => /現金|短天期/.test(k) ? "現金（含衍生性商品）" : /可轉債/.test(k) ? "可轉債／股票連結票據" : /ETF/.test(k) ? "股票" : k;
  const alloc = {};
  FUNDS.forEach(f => {
    const sum = f.alloc.reduce((s, x) => s + x[1], 0);
    f.alloc.forEach(([k, v]) => { const n = allocName(k); alloc[n] = (alloc[n] || 0) + w(f) * v / sum * 100; });
  });
  const allocCol = { "股票": cssVar("--s1"), "債券": cssVar("--s3"), "可轉債／股票連結票據": cssVar("--s7"), "原物料相關": cssVar("--s4") };
  $("mix-alloc").innerHTML = barList(sortDesc(alloc), k => allocCol[k] || "#8f9ba1") + `<p class="src">可轉債與股票連結票據兼具股債性質；股票連結票據（富蘭克林）實質上偏股票。</p>`;

  // 債券評等：歸成投資等級／非投資等級／未評等／未揭露
  const credit = {};
  const add = (k, v, f) => { credit[k] = credit[k] || { v: 0, by: {} }; credit[k].v += v; credit[k].by[f.short] = (credit[k].by[f.short] || 0) + v; };
  FUNDS.forEach(f => {
    const c = f.credit, ww = w(f);
    if (!ww || c.kind === "na") return;
    if (c.kind === "none") { const b = f.alloc.find(x => x[0] === "債券"); if (b) add("未揭露信評", ww * b[1], f); return; }
    c.items.forEach(([k, v]) => {
      const g = c.kind === "avg" ? "僅揭露平均信評（PIMCO AA-）" : /非投資|^Ba$|^B$/.test(k) ? "非投資等級" : /未評等/.test(k) ? "未評等" : "投資等級（含公債、機構房貸債）";
      add(g, ww * v, f);
    });
  });
  const creditItems = Object.entries(credit).map(([k, o]) => [k, o.v, Object.entries(o.by).map(([n, v]) => `${n}：${v.toFixed(2)}%`).join("<br>")]).sort((a, b) => b[1] - a[1]);
  const bondTotal = creditItems.reduce((s, x) => s + x[1], 0);
  $("mix-credit").innerHTML = barList(creditItems, k => /非投資/.test(k) ? cssVar("--s2") : /未/.test(k) ? "#8f9ba1" : cssVar("--s1"), v => v.toFixed(1) + "%") +
    `<p class="src">占整個組合比例；債券合計 ${bondTotal.toFixed(1)}%。換算成債券部位 = 100%：${creditItems.map(([k, v]) => `${k} ${bondTotal ? (v / bondTotal * 100).toFixed(0) : 0}%`).join("、")}。滑過可看來自哪幾檔。</p><p class="caveat">施羅德與貝萊德環球資產配置月報未揭露信評，列為「未揭露信評」；富蘭克林只揭露債券類別，非投資等級公司債以外都歸為投資等級；元大全球優質龍頭依持債內容判斷為投資等級。</p>`;

  // 產業：各基金股票部位 × 產業比重
  const sec = {}; let eq = 0;
  FUNDS.forEach(f => {
    const e = f.alloc.filter(x => /^股票/.test(x[0])).reduce((s, x) => s + x[1], 0) / 100 * w(f);
    eq += e;
    f.sectors.forEach(([k, v]) => { sec[k] = (sec[k] || 0) + e * v; });
  });
  const secItems = sortDesc(sec).map(([k, v]) => [k, eq ? v / eq : 0]);
  $("mix-sector").innerHTML = barList(secItems, () => cssVar("--s1")) + `<p class="src">組合中股票部位約 ${p1(eq)}，以 Morningstar 產業分類計。</p>`;

  // 國家：各基金國家分布換算 100% 後加權
  const ctry = {};
  FUNDS.forEach(f => {
    const sum = f.countries.reduce((s, x) => s + x[1], 0);
    f.countries.forEach(([k, v]) => { const g = countryGroup(k); ctry[g] = (ctry[g] || 0) + w(f) * v / sum * 100; });
  });
  const ccol = Object.fromEntries(COUNTRY_GROUPS.map(([k, v]) => [k, cssVar(v)]));
  $("mix-country").innerHTML = barList(sortDesc(ctry), k => ccol[k] || "#b9c2c6") + `<p class="src">部分境外基金只提供 Morningstar 區域（如歐元區、已開發亞洲），已併入對應類別。</p>`;

  // 前二十大
  const hold = {};
  FUNDS.forEach(f => f.holdings.forEach(([k, v]) => {
    const n = issuer(k);
    hold[n] = hold[n] || { v: 0, by: [] };
    hold[n].v += w(f) * v;
    if (w(f) > 0) hold[n].by.push([f, w(f) * v]);
  }));
  const top = Object.entries(hold).filter(x => x[1].v > 0).sort((a, b) => b[1].v - a[1].v).slice(0, 20);
  const maxV = top.length ? top[0][1].v : 1;
  $("top-table").innerHTML = top.length ? `<thead><tr><th>#</th><th style="text-align:left">標的</th><th style="text-align:left">占組合比例</th><th>約當金額</th><th style="text-align:left">來自哪些基金</th></tr></thead>
    <tbody>${top.map(([n, o], i) => `<tr><td>${i + 1}</td><td style="text-align:left"><b>${n}</b></td>
      <td style="text-align:left"><div class="inline-bar"><div style="width:${o.v / maxV * 100}%"></div><span>${o.v.toFixed(2)}%</span></div></td>
      <td>${wan(total * o.v / 100)}</td>
      <td style="text-align:left">${o.by.sort((a, b) => b[1] - a[1]).map(([f, v]) => `<span class="src-chip" style="--c:${color(f)}" data-tip="${f.short}：${v.toFixed(2)}%">${f.no}</span>`).join("")}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td></td><td style="text-align:left">前二十大合計</td><td style="text-align:left"><b>${top.reduce((s, x) => s + x[1].v, 0).toFixed(2)}%</b></td><td>${wan(total * top.reduce((s, x) => s + x[1].v, 0) / 100)}</td><td></td></tr></tfoot>`
    : `<tbody><tr><td class="na">請先輸入持有市值。</td></tr></tbody>`;
}

render();
