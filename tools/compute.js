const fs = require("fs");
const FUNDS = [
  ["franklin", "B15287"], ["schroder", "B2M1AXH"], ["gaf", "B09091"], ["janus", "B22012"], ["pimco", "B460127"],
  ["sgehi", "B09324"], ["tw50", "A1mZHrw"], ["twhdlv", "A05189"], ["leaders", "A05158"], ["yuantami", "A05219"],
];
const day = t => new Date((t + 8 * 3600) * 1000).toISOString().slice(0, 10);
const load = f => JSON.parse(fs.readFileSync("raw/" + f + ".json"));
function series(info) {
  const s = info.tradeDate.map((t, i) => [day(t), info.nav[i]]).filter(x => x[1] != null);
  s.sort((a, b) => a[0] < b[0] ? -1 : 1);
  return s;
}
// 富蘭克林 A(acc) 成立 2015-01-08，鉅亨資料自 2016-11-28 起；之前以 A(Mdis) 含息再投資報酬回推
function franklinExtended(acc) {
  const m = load("franklin_mdis");
  const nav = m.tradeDate.map((t, i) => [day(t), m.nav[i]]).filter(x => x[1] != null).sort((a, b) => a[0] < b[0] ? -1 : 1);
  const div = {}; for (const d of m.divs) div[day(d.excludingDate)] = +d.totalDistribution;
  const tr = []; let idx = 1, prev = null;
  const divDates = Object.keys(div).sort(); let di = 0;
  for (const [d, v] of nav) {
    if (prev) {
      let dv = 0; while (di < divDates.length && divDates[di] <= d) { if (divDates[di] > prev[0]) dv += div[divDates[di]]; di++; }
      idx *= (v + dv) / prev[1];
    } else { while (di < divDates.length && divDates[di] <= d) di++; }
    tr.push([d, idx]); prev = [d, v];
  }
  const first = acc[0][0];
  const anchor = tr.filter(x => x[0] <= first).at(-1);
  const scale = acc[0][1] / anchor[1];
  const pre = tr.filter(x => x[0] >= "2015-01-08" && x[0] < first).map(([d, v]) => [d, +(v * scale).toFixed(4)]);
  // 驗證：重疊期間 Mdis 含息報酬 vs acc
  const accEnd = acc.at(-1), trEnd = tr.filter(x => x[0] <= accEnd[0]).at(-1);
  console.log("franklin check: acc ret", (accEnd[1] / acc[0][1] - 1).toFixed(4), "mdis TR", (trEnd[1] / anchor[1] - 1).toFixed(4));
  return { s: pre.concat(acc), from: first };
}
// 含息總報酬指數：配息在除息日加回並再投資
function totalReturn(nav, divs) {
  const div = {}; for (const d of divs) div[day(d.excludingDate)] = (div[day(d.excludingDate)] || 0) + +d.totalDistribution;
  const out = []; let idx = 1, prev = null;
  for (const [d, v] of nav) {
    if (prev) { let dv = 0; for (const k in div) if (k > prev[0] && k <= d) dv += div[k]; idx *= (v + dv) / prev[1]; }
    out.push([d, idx]); prev = [d, v];
  }
  return out;
}
// PIMCO M 累積：鉅亨資料自 2024-07 起。2023-11-30～2024-06 以 M 月收息（同費率）含息回推；
// 更早以機構 H 累積回推並每日扣除費率差（M 1.60% − H 1.12% = 0.48%/年），只取到 2023-10-27 以涵蓋 3 年
function pimcoExtended(acc) {
  const mk = f => { const r = load(f); return { s: r.tradeDate.map((t, i) => [day(t), r.nav[i]]).filter(x => x[1] != null).sort((a, b) => a[0] < b[0] ? -1 : 1), divs: r.divs }; };
  const mi = mk("B460110"), h = mk("B460114");
  const trM = totalReturn(mi.s, mi.divs);
  const first = acc[0][0];
  // 驗證：M 月收息含息報酬與 M 累積在重疊期間的差異
  const a0 = trM.filter(x => x[0] <= first).at(-1), a1 = trM.filter(x => x[0] <= acc.at(-1)[0]).at(-1);
  console.log("pimco check: acc", (acc.at(-1)[1] / acc[0][1] - 1).toFixed(4), "M inc TR", (a1[1] / a0[1] - 1).toFixed(4));
  const scaleM = acc[0][1] / a0[1];
  const partM = trM.filter(x => x[0] < first).map(([d, v]) => [d, v * scaleM]);
  const mStart = partM[0];
  // H 累積扣費率差
  const hs = h.s.filter(x => x[0] >= "2023-10-27" && x[0] <= mStart[0]);
  const adj = hs.map(([d, v]) => { const yrs = (new Date(d) - new Date(hs[0][0])) / 31557600000; return [d, v * Math.exp(-0.0048 * yrs)]; });
  const hEnd = adj.at(-1), scaleH = mStart[1] / hEnd[1];
  const partH = adj.filter(x => x[0] < mStart[0]).map(([d, v]) => [d, v * scaleH]);
  const hChk = h.s.filter(x => x[0] >= mStart[0]), tChk = trM.filter(x => x[0] <= hChk.at(-1)[0]);
  console.log("pimco check: H acc", (hChk.at(-1)[1] / hChk[0][1] - 1).toFixed(4), "M inc TR same period", (tChk.at(-1)[1] / trM[0][1] - 1).toFixed(4));
  return { s: partH.concat(partM, acc).map(([d, v]) => [d, +v.toFixed(4)]), from: first };
}
const rfUsd = load("rf_usd");
const rfUsdDates = Object.keys(rfUsd).sort();
const TW = [["2000-01-01", 1.04], ["2020-03-20", 0.78], ["2022-03-24", 1.03], ["2022-06-17", 1.165], ["2022-09-23", 1.29], ["2022-12-16", 1.415], ["2023-03-24", 1.565], ["2024-03-22", 1.7]];
function rfAvg(cur, a, b) {
  if (cur === "USD") { const v = rfUsdDates.filter(d => d > a && d <= b).map(d => rfUsd[d]); return v.reduce((x, y) => x + y, 0) / v.length / 100; }
  // 台幣：台銀一年期定存機動利率（近似），依日數加權
  let sum = 0, n = 0;
  for (let t = new Date(a); t <= new Date(b); t.setDate(t.getDate() + 7)) { const d = t.toISOString().slice(0, 10); sum += TW.filter(x => x[0] <= d).at(-1)[1]; n++; }
  return sum / n / 100;
}
function weekly(s) { // 每週最後一個淨值
  const out = []; let key = null;
  for (const [d, v] of s) {
    const t = new Date(d + "T00:00:00Z"); const k = new Date(t - ((t.getUTCDay() + 1) % 7) * 864e5).toISOString().slice(0, 10); // 週六起算
    if (k === key) out[out.length - 1] = [d, v]; else { out.push([d, v]); key = k; }
  }
  return out;
}
const shiftYears = (d, n) => { const t = new Date(d + "T00:00:00Z"); t.setUTCFullYear(t.getUTCFullYear() - n); return t.toISOString().slice(0, 10); };
function mdd(s) {
  let peak = s[0], best = { dd: 0 };
  for (const p of s) { if (p[1] > peak[1]) peak = p; const dd = p[1] / peak[1] - 1; if (dd < best.dd) best = { dd, peak: peak[0], trough: p[0], peakV: peak[1] }; }
  if (best.peak) { const r = s.find(p => p[0] > best.trough && p[1] >= best.peakV); best.recover = r ? r[0] : null; delete best.peakV; }
  return best;
}
const result = {};
for (const [key, file] of FUNDS) {
  const raw = load(file), info = raw.info;
  let s = series(info), reconstructedBefore = null;
  if (key === "franklin") { const e = franklinExtended(s); s = e.s; reconstructedBefore = e.from; }
  if (key === "pimco") { const e = pimcoExtended(s); s = e.s; reconstructedBefore = e.from; }
  const end = s.at(-1)[0], cur = info.classCurrency;
  const w = weekly(s);
  const per = {};
  for (const n of [1, 3, 5, 10]) {
    const a = shiftYears(end, n);
    if (s[0][0] > a) { per[n] = null; continue; }
    const start = s.filter(x => x[0] <= a).at(-1);
    const ret = Math.pow(s.at(-1)[1] / start[1], 1 / n) - 1;
    // 日對數報酬標準差 × √(每年實際交易日數)
    const dd = [start].concat(s.filter(x => x[0] > a));
    const r = dd.slice(1).map((x, i) => Math.log(x[1] / dd[i][1]));
    const mean = r.reduce((x, y) => x + y, 0) / r.length;
    const vol = Math.sqrt(r.reduce((x, y) => x + (y - mean) ** 2, 0) / (r.length - 1)) * Math.sqrt(r.length / n);
    const rf = rfAvg(cur, a, end);
    per[n] = { ret, vol, sharpe: (ret - rf) / vol, rf };
  }
  // 成立以來（給成立未滿 1 年的基金用）：累積報酬與日報酬年化波動
  {
    const r = s.slice(1).map((x, i) => Math.log(x[1] / s[i][1])), days = (new Date(end) - new Date(s[0][0])) / 864e5;
    const mean = r.reduce((x, y) => x + y, 0) / r.length;
    per.si = { cum: s.at(-1)[1] / s[0][1] - 1, vol: Math.sqrt(r.reduce((x, y) => x + (y - mean) ** 2, 0) / (r.length - 1)) * Math.sqrt(r.length / (days / 365.25)), months: Math.round(days / 30.44 * 10) / 10 };
  }
  const a3 = shiftYears(end, 3);
  const cal = {}; // 曆年報酬
  for (let y = +s[0][0].slice(0, 4); y <= +end.slice(0, 4); y++) {
    const st = s.filter(x => x[0] <= `${y - 1}-12-31`).at(-1), en = s.filter(x => x[0] <= `${y}-12-31`).at(-1);
    if (st && en) cal[y] = en[1] / st[1] - 1;
  }
  result[key] = {
    id: file, isin: info.isin, name: info.displayNameLocal, cur, end, dataStart: s[0][0], reconstructedBefore,
    inception: day(info.inceptionDate), aum: info.totalNetAsset, aumCur: info.netAssetCurrency, mgmtFee: info.managementFee, frontLoad: info.frontLoadFee,
    category: info.categoryLocal, risk: info.riskLevel, managers: info.managerNameLocal, benchmark: info.primaryProspectusIndexName, domicile: info.domicileLocal, star: info.starRating,
    per, mdd3: mdd(s.filter(x => x[0] >= (s.filter(y => y[0] <= a3).at(-1) || s[0])[0])), mddAll: mdd(s), cal,
    cnyes: { r1: info.return1Year, r3: info.accReturn3Year, r5: info.accReturn5Year, r10: info.accReturn10Year },
    weekly: w.map(([d, v]) => [d, +v.toFixed(4)]),
  };
  const R = result[key];
  console.log(key, cur, R.dataStart, end, Object.entries(per).filter(([n]) => n !== "si").map(([n, p]) => p ? `${n}y ${(p.ret * 100).toFixed(2)}%/${(p.vol * 100).toFixed(1)}%/${p.sharpe.toFixed(2)}` : `${n}y -`).join("  "));
  console.log("   check cnyes cum:", R.cnyes, " mine cum3/5/10:", [3, 5, 10].map(n => per[n] ? ((Math.pow(1 + per[n].ret, n) - 1) * 100).toFixed(2) : "-").join(","));
  console.log("   mdd3", JSON.stringify(R.mdd3), "\n   mddAll", JSON.stringify(R.mddAll));
}
// 週報酬相關係數（近 3 年，共同週）
const keys = Object.keys(result); const corr = {};
const wk = {}; for (const k of keys) { const m = {}; const w = result[k].weekly; for (let i = 1; i < w.length; i++) { const t = new Date(w[i][0] + "T00:00:00Z"); const kk = new Date(t - ((t.getUTCDay() + 1) % 7) * 864e5).toISOString().slice(0, 10); m[kk] = Math.log(w[i][1] / w[i - 1][1]); } wk[k] = m; }
const from = shiftYears(Object.values(result).map(r => r.end).sort()[0], 3); // 以最早的資料截止日往前 3 年
for (const a of keys) { corr[a] = {}; for (const b of keys) {
  const common = Object.keys(wk[a]).filter(d => d > from && d in wk[b]);
  const x = common.map(d => wk[a][d]), y = common.map(d => wk[b][d]);
  const mx = x.reduce((p, q) => p + q, 0) / x.length, my = y.reduce((p, q) => p + q, 0) / y.length;
  let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  corr[a][b] = { r: sxy / Math.sqrt(sxx * syy), n: common.length };
} }
console.log(keys.map(a => a.padEnd(9) + keys.map(b => corr[a][b].r.toFixed(2).padStart(6)).join("")).join("\n"));
fs.writeFileSync("metrics.json", JSON.stringify({ funds: result, corr }));
