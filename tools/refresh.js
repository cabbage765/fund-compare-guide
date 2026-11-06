// 只更新淨值、配息與無風險利率；持股與配置沿用月報資料
const fs = require("fs");
const get = async u => (await (await fetch(u)).json()).items;
const navUrl = id => `https://fund.api.cnyes.com/fund/api/v1/funds/${encodeURIComponent(id)}/nav?startAt=0&endAt=1900000000&format=array`;
const day = t => new Date((t + 8 * 3600) * 1000).toISOString().slice(0, 10);
async function divs(id) { const out = []; let p = 1, last = 1; do { const j = await get(`https://fund.api.cnyes.com/fund/api/v1/funds/${encodeURIComponent(id)}/dividend?page=${p}`); last = j.last_page; out.push(...j.data); p++; } while (p <= last); return out; }
(async () => {
  const main = { B15287: "B15,287", B2M1AXH: "B2M1AXH", B09091: "B09,091", B22012: "B22,012", B460127: "B460127", B09324: "B09,324", A1mZHrw: "A1mZHrw", A05189: "A05189", A05158: "A05158", A05219: "A05219" };
  for (const [file, id] of Object.entries(main)) {
    const o = JSON.parse(fs.readFileSync(`raw/${file}.json`));
    const old = day(o.info.tradeDate[0]);
    const info = await get(navUrl(id));
    o.info = { ...o.info, ...info };
    fs.writeFileSync(`raw/${file}.json`, JSON.stringify(o));
    console.log(file, old, "→", day(info.tradeDate[0]), "n=", info.nav.length);
  }
  for (const [file, id] of [["B460110", "B460110"], ["B460114", "B460114"]]) {
    const o = JSON.parse(fs.readFileSync(`raw/${file}.json`)), info = await get(navUrl(id));
    Object.assign(o, { nav: info.nav, tradeDate: info.tradeDate, divs: await divs(id) });
    fs.writeFileSync(`raw/${file}.json`, JSON.stringify(o));
    console.log(file, day(info.tradeDate[0]), "divs", o.divs.length);
  }
  { const info = await get(navUrl("B15,108")); const o = { nav: info.nav, tradeDate: info.tradeDate, divs: await divs("B15,108") }; fs.writeFileSync("raw/franklin_mdis.json", JSON.stringify(o)); console.log("franklin_mdis", day(info.tradeDate[0]), "divs", o.divs.length); }
  const rf = JSON.parse(fs.readFileSync("raw/rf_usd.json"));
  const t = await (await fetch(`https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_bill_rates&field_tdr_date_value=2026&page&_format=csv`, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const lines = t.trim().split("\n"), hdr = lines[0].split(",").map(s => s.replace(/"/g, "")), c = hdr.indexOf("13 WEEKS COUPON EQUIVALENT");
  for (const l of lines.slice(1)) { const p = l.split(","); const [m, d, y] = p[0].split("/"); if (p[c]) rf[`${y}-${m}-${d}`] = +p[c]; }
  fs.writeFileSync("raw/rf_usd.json", JSON.stringify(rf)); console.log("rf latest", Object.keys(rf).sort().at(-1));
})();
