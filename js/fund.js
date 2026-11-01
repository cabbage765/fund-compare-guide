// 個別基金頁

renderChrome("funds.html");
const id = new URLSearchParams(location.search).get("id");
const f = fundByKey[id] || FUNDS[0];
const c = color(f);
document.title = `${f.short}｜八檔基金比較`;

// 在八檔中的名次（報酬、Sharpe 由高到低；波動由低到高）
function rank(n, m) {
  const vals = FUNDS.filter(x => x.per[n]).map(x => x.per[n][m]);
  if (!f.per[n]) return "";
  const v = f.per[n][m];
  const r = (m === "vol" ? vals.filter(x => x < v) : vals.filter(x => x > v)).length + 1;
  return `<span class="sub">第 ${r} / ${vals.length}</span>`;
}

function bars(items, max, colorOf) {
  return `<div class="bar-list">${items.map(([k, v]) => `<div class="bar-item"><span>${k}</span>
    <div class="track"><div class="fill" style="width:${Math.max(0, v) / max * 100}%;--c:${colorOf ? colorOf(k) : c}"></div></div>
    <span class="val">${v.toFixed(1)}%</span></div>`).join("")}</div>`;
}

const idx = FUNDS.indexOf(f);
const prev = FUNDS[(idx + FUNDS.length - 1) % FUNDS.length], next = FUNDS[(idx + 1) % FUNDS.length];

const ddText = d => `${pct(d.dd)}（${ym(d.peak)} → ${ym(d.trough)}，${d.recover ? ym(d.recover) + " 回到高點" : "尚未回到前高"}）`;

document.getElementById("main").innerHTML = `
  <a class="back" href="funds.html">← 全部基金介紹</a>
  <div class="detail-head" style="--c:${c}">
    <h1>${f.no}. ${f.name}</h1>
    <p>${f.shareClass}｜${f.type}｜${f.house}</p>
  </div>

  <div class="facts">
    <div class="fact"><div class="k">ISIN</div><div class="v">${f.isin}</div></div>
    <div class="fact"><div class="k">計價幣別／註冊地</div><div class="v">${f.cur === "USD" ? "美元" : "新台幣"}／${f.domicile}</div></div>
    <div class="fact"><div class="k">級別成立日</div><div class="v">${ymd(f.inception)}</div></div>
    <div class="fact"><div class="k">基金規模（所有級別合計）</div><div class="v">${money(f.aum, f.aumCur)}</div></div>
    <div class="fact"><div class="k">晨星分類／風險等級</div><div class="v">${f.category}／${f.risk}</div></div>
    <div class="fact"><div class="k">內扣費用（整體）</div><div class="v">${f.fee.total.toFixed(2)}% / 年</div></div>
    <div class="fact"><div class="k">經理人</div><div class="v" style="font-size:.88rem">${f.managers}</div></div>
  </div>

  <div class="panel"><h3>基金簡介</h3><p style="margin:0">${f.intro}</p></div>
  <div class="two-col" style="margin-top:14px">
    <div class="panel good"><h3>特別之處</h3><ul class="points">${f.special.map(s => `<li>${s}</li>`).join("")}</ul></div>
    <div class="panel warn"><h3>需要留意</h3><ul class="points">${f.cautions.map(s => `<li>${s}</li>`).join("")}</ul></div>
  </div>

  <h2>績效與風險</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>期間</th><th>年化報酬率</th><th>年化波動率</th><th>Sharpe Ratio</th><th>無風險利率</th></tr></thead>
    <tbody>${PERIODS.map(n => {
      const p = f.per[n];
      if (!p) return `<tr><td>${n} 年</td><td class="na" colspan="4">成立時間不足</td></tr>`;
      return `<tr><td>${n} 年</td><td>${pct(p.ret)}${rank(n, "ret")}</td><td>${pct(p.vol)}${rank(n, "vol")}</td><td>${num(p.sharpe)}${rank(n, "sharpe")}</td><td>${pct(p.rf, 2)}</td></tr>`;
    }).join("")}</tbody>
  </table></div>
  <div class="facts">
    <div class="fact"><div class="k">近 3 年最大回撤</div><div class="v">${ddText(f.mdd3)}</div></div>
    <div class="fact"><div class="k">成立以來最大回撤（資料自 ${ymd(f.dataStart)}）</div><div class="v">${ddText(f.mddAll)}</div></div>
  </div>

  <div class="panel"><h3>淨值走勢（${f.cur === "USD" ? "美元" : "新台幣"}，資料起點 = 100）</h3><div class="chart-box"><canvas id="c-nav"></canvas></div></div>
  <div class="panel"><h3>曆年報酬</h3><div class="chart-box short"><canvas id="c-cal"></canvas></div><p class="src">${Object.keys(f.cal).includes("2026") ? "2026 年為年初至 10/30。" : ""}</p></div>

  <h2>持有資產</h2>
  <div class="two-col">
    <div class="panel"><h3>資產配置</h3>${bars(f.alloc, 100)}<p class="src">來源：${f.allocSrc}</p></div>
    <div class="panel"><h3>債券評等</h3>${f.credit.items.length ? bars(f.credit.items, Math.max(...f.credit.items.map(x => x[1])), k => /非投資|Ba$|^B$|未評等/.test(k) ? cssVar("--s2") : c) : ""}
      <p class="note" style="margin:8px 0 0">${f.credit.note}</p>${f.credit.src ? `<p class="src">來源：${f.credit.src}</p>` : ""}</div>
    <div class="panel"><h3>產業分布（股票部位 = 100%）</h3>${bars(f.sectors, Math.max(...f.sectors.map(x => x[1])))}<p class="src">來源：鉅亨網／Morningstar 產業分類</p></div>
    <div class="panel"><h3>國家／地區</h3>${bars(f.countries, Math.max(...f.countries.map(x => x[1])))}<p class="src">來源：${f.countriesSrc}</p></div>
  </div>
  <div class="panel" style="margin-top:14px"><h3>主要持股（占基金淨值）</h3>${bars(f.holdings, Math.max(...f.holdings.map(x => x[1])))}<p class="src">來源：${f.holdingsSrc}</p></div>
  <div class="panel"><h3>費用</h3><div class="kv"><div>帳列費用率</div><div>${f.fee.ocf.toFixed(2)}%</div><div>整體內扣（含母 ETF）</div><div>${f.fee.total.toFixed(2)}%</div></div><p class="src">來源：${f.fee.src}</p></div>

  <p style="margin-top:24px">${fundLink(prev, "← " + prev.short)}　｜　${fundLink(next, next.short + " →")}</p>
`;

// 淨值走勢
const s = SERIES[f.key];
new Chart(document.getElementById("c-nav"), {
  type: "line",
  data: { labels: s.map(p => p[0]), datasets: [{ data: s.map(p => p[1] / s[0][1] * 100), borderColor: c, backgroundColor: c, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }] },
  options: {
    maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: false }, tooltip: { callbacks: { title: it => ymd(it[0].label), label: x => `${x.raw.toFixed(1)}（淨值 ${s[x.dataIndex][1]}）` } } },
    scales: { x: { ticks: { maxTicksLimit: 8, callback(v) { return ym(this.getLabelForValue(v)); } } } },
  },
});

// 曆年報酬
const years = Object.keys(f.cal);
new Chart(document.getElementById("c-cal"), {
  type: "bar",
  data: { labels: years, datasets: [{ data: years.map(y => f.cal[y] * 100), backgroundColor: years.map(y => f.cal[y] >= 0 ? cssVar("--pos") : cssVar("--neg")), borderRadius: 4, maxBarThickness: 28 }] },
  options: {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: x => `${x.raw > 0 ? "+" : ""}${x.raw.toFixed(1)}%` } } },
    scales: { y: { ticks: { callback: v => v + "%" } }, x: { grid: { display: false } } },
  },
});
