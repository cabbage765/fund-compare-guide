const qs = process.argv.slice(2);
(async () => {
  for (const q of qs) {
    const r = await fetch(`https://ess.api.cnyes.com/ess/api/v1/siteSearch/main?q=${encodeURIComponent(q)}&category=FUND&limit=40`);
    const j = await r.json();
    console.log("==", q);
    const seen = new Set();
    for (const f of j.data.quoteFunds || []) {
      if (seen.has(f.cnyesId)) continue; seen.add(f.cnyesId);
      console.log(f.cnyesId, f.isin, f.displayNameLocal.replace(/<\/?mark>/g, ""), "|", f.displayName);
    }
  }
})();
