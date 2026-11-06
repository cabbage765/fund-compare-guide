const [,, url] = process.argv;
(async () => {
  const b = Buffer.from(await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).arrayBuffer());
  let t = b.toString("utf8"); if (/charset=big5/i.test(t)) t = new TextDecoder("big5").decode(b);
  t = t.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  console.log(t.slice(0, 6000));
})();
