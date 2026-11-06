// 首頁：各項比較圖表

renderChrome("index.html");
document.getElementById("updated").innerHTML = `🕒 資料最後更新：<b>${ymd(AS_OF.updated)}</b>｜淨值計算至 ${asOfText()}｜持股與配置為 ${AS_OF.reports}月報`;
const charts = {};

// ---------- 基金卡片 ----------
document.getElementById("cards").innerHTML = FUNDS.map(f => {
  const p = headline(f);
  return `<a class="card" href="fund.html?id=${f.key}" style="--c:${color(f)}">
    <h3>${f.no}. ${f.short}</h3>
    <div class="meta">${f.shareClass}｜${f.type}</div>
    <div class="kpis">
      <div class="kpi"><span class="k">${p.label}</span><span class="v">${pct(p.ret)}</span></div>
      <div class="kpi"><span class="k">${p.short}波動</span><span class="v">${pct(p.vol)}</span></div>
      <div class="kpi"><span class="k">內扣費用</span><span class="v">${f.fee.total.toFixed(2)}%</span></div>
    </div>
    <span class="more">看介紹與注意事項 →</span>
  </a>`;
}).join("");

// ---------- 報酬／波動／Sharpe ----------
let period = 3;
const periodChips = document.getElementById("period-chips");
periodChips.innerHTML += PERIODS.map(n => `<button class="chip ${n === period ? "on" : ""}" data-n="${n}">${n} 年</button>`).join("");
periodChips.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  period = +b.dataset.n;
  periodChips.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
  drawPerf();
});

function barChart(id, metric, fmt) {
  const rows = FUNDS.filter(f => f.per[period]).map(f => ({ f, v: f.per[period][metric] }));
  rows.sort((a, b) => metric === "vol" ? a.v - b.v : b.v - a.v);
  const data = {
    labels: rows.map(r => r.f.short),
    datasets: [{ data: rows.map(r => metric === "sharpe" ? r.v : r.v * 100), backgroundColor: rows.map(r => color(r.f)), borderRadius: 4, barThickness: 16 }],
  };
  if (charts[id]) { charts[id].data = data; charts[id].update(); return; }
  charts[id] = new Chart(document.getElementById(id), {
    type: "bar", data,
    options: {
      indexAxis: "y", maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.raw) } } },
      scales: { x: { ticks: { callback: v => fmt(v) } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } },
    },
  });
}

function drawPerf() {
  barChart("c-ret", "ret", v => v.toFixed(1) + "%");
  barChart("c-vol", "vol", v => v.toFixed(1) + "%");
  barChart("c-sharpe", "sharpe", v => (+v).toFixed(2));
  const miss = FUNDS.filter(f => !f.per[period]).map(f => f.short);
  document.getElementById("perf-missing").textContent = miss.length ? `成立未滿 ${period} 年、不列入：${miss.join("、")}` : "";
}
drawPerf();

// 完整數據表（可排序）
let perfSort = null;
function drawPerfTable() {
  const cols = [];
  for (const m of ["ret", "vol", "sharpe"]) for (const n of PERIODS) cols.push({ m, n });
  const best = {};
  for (const c of cols) {
    const vals = FUNDS.map(f => f.per[c.n] && f.per[c.n][c.m]).filter(v => v != null);
    best[c.m + c.n] = c.m === "vol" ? Math.min(...vals) : Math.max(...vals);
  }
  let rows = FUNDS.slice();
  if (perfSort) {
    const [m, n] = perfSort;
    rows.sort((a, b) => {
      const va = a.per[n] ? a.per[n][m] : null, vb = b.per[n] ? b.per[n][m] : null;
      if (va == null) return 1; if (vb == null) return -1;
      return m === "vol" ? va - vb : vb - va;
    });
  }
  const title = { ret: "年化報酬率", vol: "年化波動率", sharpe: "Sharpe Ratio" };
  document.getElementById("perf-table").innerHTML = `
    <thead><tr class="group"><th></th>${["ret", "vol", "sharpe"].map(m => `<th colspan="4">${title[m]}</th>`).join("")}</tr>
    <tr><th>基金</th>${cols.map(c => `<th><button data-s="${c.m},${c.n}" class="${perfSort && perfSort.join() === c.m + "," + c.n ? "on" : ""}">${c.n} 年</button></th>`).join("")}</tr></thead>
    <tbody>${rows.map(f => `<tr><td class="fund">${fundLink(f)}</td>${cols.map(c => {
      const p = f.per[c.n];
      if (!p) return `<td class="na">—</td>`;
      const v = p[c.m], isBest = v === best[c.m + c.n];
      const txt = c.m === "sharpe" ? num(v) : pct(v);
      const bg = c.m === "ret" ? divBg(v, 0.5) : c.m === "sharpe" ? divBg(v, 2.5) : heatBg(v, 0.3, "120,120,120");
      return `<td class="heat ${isBest ? "best" : ""}" style="${bg}">${txt}</td>`;
    }).join("")}</tr>`).join("")}</tbody>`;
}
document.getElementById("perf-table").addEventListener("click", e => {
  const b = e.target.closest("button[data-s]"); if (!b) return;
  const [m, n] = b.dataset.s.split(",");
  perfSort = perfSort && perfSort[0] === m && perfSort[1] === +n ? null : [m, +n];
  drawPerfTable();
});
drawPerfTable();

// ---------- 淨值走勢 ----------
const shiftYears = (d, n) => { const t = new Date(d + "T00:00:00Z"); t.setUTCFullYear(t.getUTCFullYear() - n); return t.toISOString().slice(0, 10); };
let navPeriod = 5;
const navOn = new Set(FUNDS.map(f => f.key));

function fundChips(el, set, redraw) {
  el.innerHTML = FUNDS.map(f => `<button class="chip fund-chip ${set.has(f.key) ? "on" : ""}" data-k="${f.key}"><span class="dot" style="--c:${color(f)}"></span>${f.short}</button>`).join("");
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const k = b.dataset.k;
    set.has(k) ? set.delete(k) : set.add(k);
    b.classList.toggle("on", set.has(k));
    redraw();
  });
}

function rebased(f, from) {
  const s = SERIES[f.key];
  const startIdx = s.findIndex(p => p[0] > from) - 1;
  if (startIdx < 0) return null;
  const base = s[startIdx][1];
  return s.slice(startIdx).map(([d, v]) => ({ x: d, y: v / base * 100 }));
}

function drawNav() {
  const end = AS_OF.end, from = shiftYears(end, navPeriod);
  const datasets = FUNDS.filter(f => navOn.has(f.key)).map(f => {
    const pts = rebased(f, from);
    return pts && { label: f.short, data: pts, borderColor: color(f), backgroundColor: color(f), borderDash: dash(f), borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0 };
  }).filter(Boolean);
  const cfg = {
    type: "line", data: { datasets },
    options: {
      maintainAspectRatio: false, parsing: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        tooltip: { itemSort: (a, b) => b.raw.y - a.raw.y, callbacks: { title: it => it[0] && ymd(it[0].raw.x), label: c => `${c.dataset.label}：${c.raw.y.toFixed(1)}` } },
      },
      scales: { x: { type: "category", labels: undefined, ticks: { maxTicksLimit: 8, callback(v) { return ym(this.getLabelForValue(v)); } } }, y: { title: { display: true, text: "期初 = 100" } } },
    },
  };
  // 以時間最長的資料集作為 x 軸標籤
  const labels = [...new Set(datasets.flatMap(d => d.data.map(p => p.x)))].sort();
  cfg.options.scales.x.labels = labels;
  if (charts.nav) charts.nav.destroy();
  charts.nav = new Chart(document.getElementById("c-nav"), cfg);
}
const navChips = document.getElementById("nav-chips");
navChips.innerHTML += PERIODS.map(n => `<button class="chip ${n === navPeriod ? "on" : ""}" data-n="${n}">${n} 年</button>`).join("");
navChips.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  navPeriod = +b.dataset.n;
  navChips.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
  drawNav();
});
fundChips(document.getElementById("nav-funds"), navOn, drawNav);
drawNav();

// ---------- 最大回撤 ----------
function ddCell(d) {
  const rec = d.recover ? `回到高點：${ymd(d.recover)}` : "尚未回到前高";
  return `<td class="heat" style="${heatBg(-d.dd, 0.4, "235,104,52")}">${pct(d.dd)}</td>
    <td style="text-align:left">${ym(d.peak)} → ${ym(d.trough)}<span class="sub">${rec}</span></td>`;
}
document.getElementById("mdd-table").innerHTML = `
  <thead><tr class="group"><th></th><th colspan="2">近 3 年</th><th colspan="2">成立以來（資料期間）</th><th></th></tr>
  <tr><th>基金</th><th>最大回撤</th><th style="text-align:left">高點 → 低點（年月）</th><th>最大回撤</th><th style="text-align:left">高點 → 低點（年月）</th><th style="text-align:left">資料起點</th></tr></thead>
  <tbody>${FUNDS.map(f => `<tr><td class="fund">${fundLink(f)}</td>${ddCell(f.mdd3)}${ddCell(f.mddAll)}
    <td style="text-align:left">${ymd(f.dataStart)}<span class="sub">成立 ${ymd(f.inception)}${f.dataNote ? "（" + f.dataNote + "）" : f.dataStart > f.inception ? "（較早資料未取得）" : ""}</span></td></tr>`).join("")}</tbody>`;

const uwOn = new Set(FUNDS.map(f => f.key));
function drawUw() {
  const from = shiftYears(AS_OF.end, 3);
  const datasets = FUNDS.filter(f => uwOn.has(f.key)).map(f => {
    const s = SERIES[f.key].filter(p => p[0] >= from);
    let peak = -Infinity;
    const data = s.map(([d, v]) => { peak = Math.max(peak, v); return { x: d, y: (v / peak - 1) * 100 }; });
    return { label: f.short, data, borderColor: color(f), backgroundColor: color(f), borderDash: dash(f), borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 };
  });
  const labels = [...new Set(datasets.flatMap(d => d.data.map(p => p.x)))].sort();
  if (charts.uw) charts.uw.destroy();
  charts.uw = new Chart(document.getElementById("c-uw"), {
    type: "line", data: { datasets },
    options: {
      maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom" }, tooltip: { itemSort: (a, b) => a.raw.y - b.raw.y, callbacks: { title: it => it[0] && ymd(it[0].raw.x), label: c => `${c.dataset.label}：${c.raw.y.toFixed(1)}%` } } },
      scales: { x: { type: "category", labels, ticks: { maxTicksLimit: 8, callback(v) { return ym(this.getLabelForValue(v)); } } }, y: { max: 0, ticks: { callback: v => v + "%" } } },
    },
  });
}
fundChips(document.getElementById("uw-funds"), uwOn, drawUw);
drawUw();

// ---------- 曆年報酬 ----------
(() => {
  const years = [...new Set(FUNDS.flatMap(f => Object.keys(f.cal)))].map(Number).filter(y => y >= 2016).sort();
  document.getElementById("cal-table").innerHTML = `
    <thead><tr><th>基金</th>${years.map(y => `<th>${y}${y === 2026 ? `<span class='sub'>至 ${md(AS_OF.end)}</span>` : ""}</th>`).join("")}</tr></thead>
    <tbody>${FUNDS.map(f => `<tr><td class="fund">${fundLink(f)}</td>${years.map(y => {
      const v = f.cal[y];
      return v == null ? `<td class="na">—</td>` : `<td class="heat" style="${divBg(v, 0.5)}" data-tip="<b>${f.short}</b><br>${y} 年：${pct(v, 1, true)}">${pct(v, 1, true)}</td>`;
    }).join("")}</tr>`).join("")}</tbody>`;
})();

// ---------- 內扣費用 ----------
(() => {
  const rows = FUNDS.slice().sort((a, b) => b.fee.total - a.fee.total);
  new Chart(document.getElementById("c-fee"), {
    type: "bar",
    data: { labels: rows.map(f => f.short), datasets: [{ data: rows.map(f => f.fee.total), backgroundColor: rows.map(color), borderRadius: 4, barThickness: 16 }] },
    options: {
      indexAxis: "y", maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `整體內扣約 ${c.raw.toFixed(2)}% / 年` } } },
      scales: { x: { title: { display: true, text: "% / 年" } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } },
    },
  });
  document.getElementById("fee-table").innerHTML = `
    <thead><tr><th>基金</th><th>帳列費用率</th><th>整體內扣</th></tr></thead>
    <tbody>${rows.map(f => `<tr><td class="fund">${fundLink(f)}</td><td>${f.fee.ocf.toFixed(2)}%</td><td data-tip="${f.fee.src}"><b>${f.fee.total.toFixed(2)}%</b></td></tr>`).join("")}</tbody>`;
})();

// ---------- 股債比 ----------
(() => {
  const pal = {
    "股票": cssVar("--s1"), "股票型 ETF": "#7fb0ea", "債券": cssVar("--s3"), "可轉債／股票連結票據": cssVar("--s7"), "可轉債": cssVar("--s7"),
    "原物料相關": cssVar("--s4"), "現金": "#8f9ba1", "現金及其他": "#8f9ba1", "現金及衍生性商品": "#8f9ba1", "其他": "#b9c2c6", _: ["#b9c2c6"],
  };
  const keys = [["股票", "--s1"], ["債券", "--s3"], ["可轉債／股票連結票據", "--s7"], ["原物料相關", "--s4"]];
  document.getElementById("alloc-legend").innerHTML = keys.map(([k, v]) => `<span><i style="background:${cssVar(v)}"></i>${k}</span>`).join("") +
    `<span><i style="background:#7fb0ea"></i>股票型 ETF</span><span><i style="background:#8f9ba1"></i>現金（含衍生性商品）</span><span><i style="background:#b9c2c6"></i>其他</span>`;
  document.getElementById("alloc-list").innerHTML = FUNDS.map(f => stackRow(f, f.alloc, pal)).join("") +
    `<p class="caveat">PIMCO 收益增長以淨曝險呈現：債券 34.7% 為債券部位 55.3% 扣除 −20.6% 短天期工具淨額（期貨等衍生性商品的抵銷部位）後的數字；若以總曝險計，股＋債約 121%。</p>`;
})();

// ---------- 債券評等 ----------
(() => {
  const ratingCol = { "Aaa": 700, "Aa": 600, "A": 500, "Baa": 400 };
  document.getElementById("credit-cards").innerHTML = FUNDS.map(f => {
    const c = f.credit;
    let body = "";
    if (c.kind === "na") body = `<p class="note">${c.note}</p>`;
    else {
      const max = Math.max(...c.items.map(x => x[1]), 1);
      body = c.items.length ? `<div class="bar-list">${c.items.map(([k, v]) => {
        const hy = /非投資|Ba$|^B$|未評等/.test(k);
        return `<div class="bar-item"><span>${k}</span><div class="track"><div class="fill" style="width:${v / max * 100}%;--c:${hy ? cssVar("--s2") : cssVar("--s1")}"></div></div><span class="val">${v.toFixed(2)}%</span></div>`;
      }).join("")}</div>` : "";
      body += `<p class="note" style="margin:8px 0 0">${c.note}</p>${c.src ? `<p class="src">來源：${c.src}</p>` : ""}`;
    }
    const tag = { rating: "逐級信評", ig: "全為投資等級", sector: "債券類別", avg: "僅平均信評", none: "未揭露信評", na: "無債券" }[c.kind];
    return `<div class="panel"><h3>${fundLink(f)} <span class="badge">${tag}</span></h3>${body}</div>`;
  }).join("");
})();

// ---------- 產業分布 ----------
(() => {
  const names = {};
  FUNDS.forEach(f => f.sectors.forEach(([k, v]) => { names[k] = (names[k] || 0) + v; }));
  const cols = Object.keys(names).sort((a, b) => names[b] - names[a]);
  document.getElementById("sector-table").innerHTML = `
    <thead><tr><th class="rowh">基金</th>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${FUNDS.map(f => {
      const m = Object.fromEntries(f.sectors);
      return `<tr><td class="fund">${fundLink(f)}</td>${cols.map(c => m[c] == null ? `<td class="na">—</td>` :
        `<td class="heat" style="${heatBg(m[c], 60)}" data-tip="<b>${f.short}</b><br>${c}：占股票部位 ${m[c].toFixed(1)}%">${m[c].toFixed(1)}%</td>`).join("")}</tr>`;
    }).join("")}</tbody>`;
})();

// ---------- 國家分布 ----------
(() => {
  const groups = COUNTRY_GROUPS, toGroup = countryGroup;
  const pal = Object.fromEntries(groups.map(([k, v]) => [k, cssVar(v)]));
  pal["其他／現金"] = "#b9c2c6"; pal._ = ["#b9c2c6"];
  document.getElementById("country-legend").innerHTML = groups.map(([k, v]) => `<span><i style="background:${cssVar(v)}"></i>${k}</span>`).join("") + `<span><i style="background:#b9c2c6"></i>其他／現金</span>`;
  document.getElementById("country-list").innerHTML = FUNDS.map(f => {
    const agg = {};
    f.countries.forEach(([k, v]) => { const g = toGroup(k); agg[g] = (agg[g] || 0) + v; });
    const order = groups.map(g => g[0]).concat("其他／現金");
    return stackRow(f, order.filter(k => agg[k]).map(k => [k, agg[k]]), pal);
  }).join("");
  document.getElementById("country-src").innerHTML = "滑過色塊可看數字。原始明細：" + FUNDS.map(f => `<br><b>${f.short}</b>：${f.countries.map(([k, v]) => `${k} ${v}%`).join("、")}（${f.countriesSrc}）`).join("");
})();

// ---------- 重疊曝險矩陣 ----------
function overlap(a, b) {
  const ma = {}, mb = {};
  a.holdings.forEach(([k, v]) => { ma[issuer(k)] = (ma[issuer(k)] || 0) + v; });
  b.holdings.forEach(([k, v]) => { mb[issuer(k)] = (mb[issuer(k)] || 0) + v; });
  const common = Object.keys(ma).filter(k => k in mb).map(k => [k, Math.min(ma[k], mb[k])]).sort((x, y) => y[1] - x[1]);
  return { v: common.reduce((s, c) => s + c[1], 0), common };
}
let ovMode = "hold";
const ovModes = { hold: "前十大持股重疊（%）", corr: "近 3 年週報酬相關係數" };
const ovChips = document.getElementById("ov-chips");
ovChips.innerHTML = Object.entries(ovModes).map(([k, v]) => `<button class="chip ${k === ovMode ? "on" : ""}" data-m="${k}">${v}</button>`).join("");
ovChips.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  ovMode = b.dataset.m;
  ovChips.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
  drawOverlap();
});
function drawOverlap() {
  const head = `<thead><tr><th class="rowh"></th>${FUNDS.map(f => `<th data-tip="${f.short}"><span class="dot" style="--c:${color(f)}"></span>${f.no}</th>`).join("")}</tr></thead>`;
  const body = FUNDS.map(a => `<tr><td class="fund">${fundLink(a, a.no + ". " + a.short)}</td>${FUNDS.map(b => {
    if (a === b) return `<td class="self">—</td>`;
    if (ovMode === "hold") {
      const o = overlap(a, b);
      const tip = `<b>${a.short} × ${b.short}</b><br>` + (o.common.length ? o.common.map(([k, v]) => `${k}：${v.toFixed(2)}%`).join("<br>") : "前十大無共同持股");
      return `<td class="heat" style="${heatBg(o.v, 25)}" data-tip="${tip}">${o.v ? o.v.toFixed(1) + "%" : "0"}</td>`;
    }
    const r = CORR[a.key][b.key];
    if (r == null) return `<td class="na" data-tip="<b>${a.short} × ${b.short}</b><br>共同資料不足半年，不計算">—</td>`;
    return `<td class="heat" style="${heatBg(r, 1)}" data-tip="<b>${a.short} × ${b.short}</b><br>相關係數 ${r.toFixed(2)}">${r.toFixed(2)}</td>`;
  }).join("")}</tr>`).join("");
  document.getElementById("ov-table").innerHTML = head + `<tbody>${body}</tbody>`;
  document.getElementById("ov-note").innerHTML = ovMode === "hold"
    ? "計算方式：以發行人為單位，把兩檔基金共同持有的部位各取較小權重後加總（占基金淨值 %）。只使用月報公布的前十大持股（元大全球優質龍頭、元大優質收益成長為前 20 餘大；ETF 連結基金透視母 ETF；PIMCO 不含衍生性商品），所以是<strong>重疊程度的下限</strong>。美國公債、機構房貸債視為同一發行人。滑過格子可看共同持股明細。"
    : "計算方式：近 3 年（2023/10–2026/10）每週報酬的皮爾森相關係數；成立未滿 3 年的基金以成立以來計；元大優質收益成長多重資產成立未滿半年，樣本太短不列出。越接近 1 代表漲跌越同步、分散效果越小。台股基金與境外基金的淨值時點不同（時差），相關係數會略為低估。";
}
drawOverlap();
