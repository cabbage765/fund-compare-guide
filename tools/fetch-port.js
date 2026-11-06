const fs = require("fs");
const get = async u => (await (await fetch(u)).json()).items;
const day = t => t ? new Date((t + 8 * 3600) * 1000).toISOString().slice(0, 10) : "-";
const ids = { B15287: "B15,287", B2M1AXH: "B2M1AXH", B09091: "B09,091", B22012: "B22,012", B460127: "B460127", B09324: "B09,324", A1mZHrw: "A1mZHrw", A05189: "A05189", A05158: "A05158", A05219: "A05219", A13012: "A13012", A4bYjWU: "A4bYjWU" };
(async () => {
  for (const [f, id] of Object.entries(ids)) {
    const base = `https://fund.api.cnyes.com/fund/api/v1/funds/${encodeURIComponent(id)}`, out = {};
    for (const p of ["portfolios", "holdings", "regions", "industries"]) out[p] = await get(`${base}/${p}`);
    fs.writeFileSync(`raw_oct/${f}.json`, JSON.stringify(out));
    console.log(f, "portfolios", day(out.portfolios?.portfolioDate), "regions", day(out.regions?.portfolioDate), "holdings", out.holdings?.data?.length);
  }
})();
