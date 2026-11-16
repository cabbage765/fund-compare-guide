// 各基金最新消息：經理人評論、持股調整、人事與事件
// 每月 16 日前後依各基金上月月報與經理人評論更新；新的消息加在陣列前面
// type：持股調整｜經理人異動｜績效與觀點｜配息｜待觀察
// verified: false 表示只找到二手摘要、尚未由基金公司文件確認
const NEWS_META = {
  updated: "2026-11-16",
  next: "2026-12-01",
  frequency: "每月 1 日、16 日（多數基金公司在月中前公布上月月報；1 日追蹤人事、評論與事件）",
};

const NEWS = [
  {
    fund: "leaders", date: "2026-11", asOf: "2026-10-31", type: "持股調整",
    title: "10 月大砍 SK hynix，加碼加拿大油砂與 Kinder Morgan 公司債，現金升至近 17%",
    points: [
      "減碼（占淨值變化）：SK hynix −2.56%（6.48% → 3.92%）、Montage Gold −0.66%、NVIDIA −0.33%。",
      "加碼：Kinder Morgan 公司債 +2.16%（升至 4.81%）、Canadian Natural Resources +2.01%（升至 5.01%）、Microsoft +0.72%、Quanta Services +0.59%、ASML +0.58%。",
      "Lundin Mining 與 American Express 公司債退出前十大。",
      "資產配置：現金 14.4% → 16.8%、公司債約 11.5% → 15.0%，股票約 74% → 68%，整體轉向保守。",
    ],
    source: { name: "MoneyDJ 持股資料（基金公司公布，2026/10/31）", url: "https://yuantabank.moneydj.com/w/wr/wr04.djhtm?a=ACYT168" },
    verified: true,
  },
  {
    fund: "yuantami", date: "2026-11", asOf: "2026-10-31", type: "持股調整",
    title: "10 月加碼 Microsoft、Apple 與健康照護 ETF，減碼 Lumentum",
    points: [
      "加碼：Microsoft +1.61%（升至 3.74%，成為第一大持股）、SPDR 健康照護 ETF +1.32%、Apple +0.61%。",
      "減碼：Lumentum −0.94%、Micron −0.24%、Bloom Energy −0.22%、NVIDIA −0.12%。",
      "CrowdStrike、AMD、Alphabet、Lam Research 退出前十大。",
      "資產配置：美國公債 25.6% → 26.4%、現金 5.7% → 7.4%、ETF 約 9%，股票約 59% → 57%。",
    ],
    source: { name: "MoneyDJ 持股資料（基金公司公布，2026/10/31）", url: "https://yuantabank.moneydj.com/w/wr/wr04.djhtm?a=ACYT227" },
    verified: true,
  },
  {
    fund: "sgehi", date: "2026-11-15", asOf: "2026-10-31", type: "持股調整",
    title: "10 月前十大：Alphabet 明顯下降，新增 Procter & Gamble、Samsung",
    points: [
      "9/30 → 10/31：NVIDIA 4.73% → 4.28%，Apple 3.55% → 3.27%，Alphabet 3.27% → 2.13%，Cisco 2.41% → 2.11%，Accenture 1.81% → 2.11%。",
      "新進前十大：Procter & Gamble 1.93%、Samsung Electronics 1.49%；Fortinet、Analog Devices 退出。前十大合計 22.5%。",
      "持股 341 檔，基金規模約 177 億美元；官方 3 年波動率 8.23%。",
      "量化模型每月調整，未找到經理人文字評論。",
    ],
    source: { name: "貝萊德 2026/10/31 月報", url: "https://www.blackrock.com/sg/en/literature/fact-sheet/bgf-systematic-global-equity-high-income-fund-class-a2-usd-factsheet-lu0265550359-sg-en-individual.pdf" },
    verified: true,
  },
  {
    fund: "schroder", date: "2026-11", asOf: "2026-09-30", type: "持股調整",
    title: "9 月三支柱維持各約三分之一，前十大債券改為哥倫比亞、阿曼",
    points: [
      "資產配置（8/31 → 9/30）：全球股票 33.4% → 33.6%、全球債券 32.4% → 33.7%、可轉債 32.2% → 32.6%。",
      "前十大新進：ExxonMobil、Alphabet 公司債、阿曼公債、哥倫比亞公債（7%）、第二筆卡達公債；匈牙利公債、NVIDIA、Microsoft 退出前十大。",
      "區域：北美 44.6%、新興市場 22.8%、歐洲（不含英國）15.3%。",
      "9 月 −2.2%，與比較指標（−2.1%）相近；今年以來 +11.5%，比較指標 +4.7%。尚未找到經理人文字評論。",
    ],
    source: { name: "施羅德香港月報（2026/9/30）", url: "https://www.sunlife.com.hk/content/dam/sunlife/regional/hong-kong/documents/E_WSAIU_FACTSHEET.pdf" },
    note: "月報為同一基金的配息級別，資產配置與持股相同。",
    verified: true,
  },
  {
    fund: "tw50", date: "2026-09-18", asOf: null, type: "持股調整",
    title: "9 月指數審核：藥華藥納入、世芯-KY 刪除",
    points: [
      "臺灣 50 指數 9 月定期審核：藥華藥因市值排名進入前 40 名而納入，世芯-KY 刪除並轉入臺灣中型 100，9/18 收盤後生效。",
      "候補名單：台塑、群創、景碩、瑞昱、萬海。",
    ],
    source: { name: "優分析報導", url: "https://uanalyze.com.tw/articles/1117754689" },
    note: "目前只找到媒體報導，尚未核對臺灣指數公司／證交所原始公告。",
    verified: false,
  },
  {
    fund: "franklin", date: "2026-11", asOf: "2026-09-30", type: "待觀察",
    title: "暫無新的經理人評論",
    points: [
      "10/31 月報尚未取得，最新官方資料為 2026/9/30 月報與第 3 季評論；第 4 季評論預計 2027 年 1 月公布。",
    ],
    source: { name: "Franklin Income Fund 第 3 季評論（2026/9/30）", url: "https://www.franklintempletonme.com/download/gem/product-commentary/90ddf8f9-4a1d-4a77-b345-92543e855cd3/ProductCommentary-FranklinIncomeFund-40155-AE-en-GB.pdf" },
    verified: true,
  },
  {
    fund: "gaf", date: "2026-11", asOf: "2026-09-30", type: "待觀察",
    title: "暫無新的經理人評論",
    points: [
      "11/16 查詢時新加坡、香港、英國、盧森堡版本月報仍為 2026/9/30，經理人月評也仍是 10 月發布、9/30 資料的版本。",
    ],
    source: { name: "BlackRock Global Allocation 月評", url: "https://www.blackrock.com/us/individual/literature/fund-commentary/oef-global-allocation-fund-usd-mtd-commentary-en-us.pdf" },
    verified: true,
  },
  {
    fund: "janus", date: "2026-11", asOf: "2026-09-30", type: "待觀察",
    title: "暫無新的經理人評論",
    points: [
      "香港版月報仍為 2026/9/30；第 4 季評論預計 2027 年 1 月公布。",
      "11/16 查詢駿利美國官網產品頁，經理人仍列 Jeremiah Buckley、Greg Wilensky、Michael Keough。",
    ],
    source: { name: "駿利亨德森平衡月報", url: "https://www.janushenderson.com/hkpi-en/Document/108725/janus-henderson-balanced-fund-factsheet" },
    verified: true,
  },
  {
    fund: "pimco", date: "2026-11", asOf: "2026-09-30", type: "待觀察",
    title: "暫無新的經理人評論",
    points: [
      "Fundsupermart 提供的月報仍為 2026/9/30（前十大持股截至 6/30），尚未找到 10 月月報或經理人評論。",
    ],
    source: { name: "PIMCO 月報（2026/9/30）", url: "https://secure.fundsupermart.com/fsm/admin/buy/factsheet/factsheetALZP63.pdf" },
    verified: true,
  },
  {
    fund: "gaf", date: "2026-10-28", asOf: "2026-09-30", type: "持股調整",
    title: "9 月加碼股票與黃金，減碼債券（特別是新興市場利率）",
    points: [
      "增加：黃金與股票曝險，提高科技、通訊服務比重。",
      "減少：固定收益部位，尤其是新興市場利率；調降工業、金融、非必需消費。",
      "區域：日本由 4% 升至 5%；美元曝險由 59% 升至 60%，現金約 12%。",
      "整體維持「股票小幅加碼、債券減碼」，債券維持短存續期間，挑選信用與證券化資產增加收益。",
    ],
    source: { name: "BlackRock Global Allocation 月評（2026/10）", url: "https://www.blackrock.com/us/individual/literature/fund-commentary/oef-global-allocation-fund-usd-mtd-commentary-en-us.pdf" },
    note: "評論來自同一團隊管理的美國共同基金版本（MDLOX），盧森堡 BGF 版本策略相同但持股比例可能略有差異。",
    verified: true,
  },
  {
    fund: "gaf", date: "2026-10-28", asOf: "2026-09-30", type: "績效與觀點",
    title: "經理人：利率走高壓力漸增，偏好企業獲利穩健的股票",
    points: [
      "美國 10 年期公債殖利率自 8 月以來上升超過 65 個基點，主要由實質利率推動。",
      "9 月標普 500 的 11 個產業中有 10 個持平或下跌，漲勢集中在半導體與 AI 相關。",
      "股債相關性接近 25 年高點，長天期債券的分散效果下降，因此維持短存續期間。",
      "9 月表現落後參考指標：現金與科技加碼有貢獻，黃金與金融選股拖累。",
    ],
    source: { name: "BlackRock Global Allocation 月評（2026/10）", url: "https://www.blackrock.com/us/individual/literature/fund-commentary/oef-global-allocation-fund-usd-mtd-commentary-en-us.pdf" },
    verified: true,
  },
  {
    fund: "franklin", date: "2026-09-30", asOf: "2026-09-30", type: "持股調整",
    title: "第 3 季同時增加股票與債券，讓現金部位下降",
    points: [
      "季內提高固定收益與股票曝險，現金略為減少。",
      "9 月市場集中度升高時，趁機加碼金融與公用事業類股。",
      "債券部位：能源類債券有正貢獻；美國公債、金融與證券化商品拖累。個別發行人中 Broadcom、Venture Global、Bausch Health 貢獻最多，美國公債、Community Health Systems、Amazon 拖累。",
      "股票部位：Microsoft、Chevron、ExxonMobil 貢獻；Home Depot、IBM、Southern Co. 拖累。",
    ],
    source: { name: "Franklin Income Fund 第 3 季評論（2026/9/30）", url: "https://www.franklintempletonme.com/download/gem/product-commentary/90ddf8f9-4a1d-4a77-b345-92543e855cd3/ProductCommentary-FranklinIncomeFund-40155-AE-en-GB.pdf" },
    note: "評論文件為投資同一主基金的杜拜聯接級別，主基金與本站分析的 A(acc) USD 相同。",
    verified: true,
  },
  {
    fund: "franklin", date: "2026-09-30", asOf: "2026-09-30", type: "績效與觀點",
    title: "經理人看好公債的避險角色，對非投資等級債維持精挑細選",
    points: [
      "第 3 季 A(Mdis) 級別表現優於混合指標。",
      "公債：殖利率相對歷史偏高，具吸引力，可在市場波動時發揮避險效果。",
      "投資等級公司債：絕對殖利率吸引人，但信用利差仍窄，未來報酬主要來自利率與票息。",
      "非投資等級債：偏好有能力處理到期債務的公司，維持平衡且謹慎的選債。",
    ],
    source: { name: "Franklin Income Fund 第 3 季評論（2026/9/30）", url: "https://www.franklintempletonme.com/download/gem/product-commentary/90ddf8f9-4a1d-4a77-b345-92543e855cd3/ProductCommentary-FranklinIncomeFund-40155-AE-en-GB.pdf" },
    verified: true,
  },
  {
    fund: "janus", date: "2026-10", asOf: "2026-09-30", type: "經理人異動",
    title: "傳債券經理人 Greg Wilensky 將退休，不另補人",
    points: [
      "第 3 季評論摘要提到 Wilensky 將退休、不會指定直接接替者，由 Jeremiah Buckley 與 Michael Keough 續任共同經理人。",
      "駿利官方 9/30 月報與美國官網產品頁（11/16 查詢）仍列有 Wilensky，尚未找到基金公司正式公告。",
    ],
    source: { name: "Seeking Alpha 轉載之第 3 季評論摘要", url: "https://seekingalpha.com/article/4958494-janus-henderson-balanced-fund-q3-2026-commentary" },
    verified: false,
  },
  {
    fund: "janus", date: "2026-10", asOf: "2026-09-30", type: "持股調整",
    title: "8 月調降股票部位控制風險，債券存續期間偏短",
    points: [
      "第 3 季報酬 −0.30%，同期標普 500 +2.30%、美國綜合債券指數 −3.51%。",
      "整季維持股票相對加碼（有正貢獻），但在 8 月股市大漲後調降股票比重以控制風險。",
      "債券：信用部位加碼、美國公債減碼，因信用債表現落後公債而小幅拖累；存續期間大部分時間低於指標。",
    ],
    source: { name: "Seeking Alpha 轉載之第 3 季評論摘要", url: "https://seekingalpha.com/article/4958494-janus-henderson-balanced-fund-q3-2026-commentary" },
    verified: false,
  },
  {
    fund: "pimco", date: "2026-09-30", asOf: "2026-09-30", type: "經理人異動",
    title: "月報列名經理人由 4 位減為 3 位，Erin Browne 不再列名",
    points: [
      "2026/3/31 月報：Emmanuel Sharef、Erin Browne、Daniel Ivascyn、Joshua Anderson。",
      "2026/8/31 與 9/30 月報：Emmanuel Sharef、Daniel Ivascyn、Joshua Anderson。",
      "尚未找到 PIMCO 對此人事變動的說明。",
    ],
    source: { name: "PIMCO 月報（2026/3/31 與 2026/9/30）", url: "https://secure.fundsupermart.com/fsm/admin/buy/factsheet/factsheetALZP63.pdf" },
    verified: true,
  },
  {
    fund: "pimco", date: "2026-09-30", asOf: "2026-09-30", type: "持股調整",
    title: "債券風險由公債轉向證券化（機構房貸），存續期間小幅拉長",
    points: [
      "存續期間貢獻：政府相關 3.09 年（3 月）→ 2.7 年（9 月）；證券化 2.19 年 → 3.1 年。",
      "整體有效存續期間 2.38 年（3 月）→ 2.51 年（8 月）→ 2.57 年（9 月）。",
      "8 月 → 9 月：美股 41.4% → 42.3%，新興市場債 5.9% → 5.6%，規模 189 億 → 198 億美元。",
    ],
    source: { name: "PIMCO 月報（2026/3/31、8/31、9/30）", url: "https://secure.fundsupermart.com/fsm/admin/buy/factsheet/factsheetALZP63.pdf" },
    verified: true,
  },
  {
    fund: "sgehi", date: "2026-09-30", asOf: "2026-09-30", type: "持股調整",
    title: "前十大：Apple、Alphabet 比重下降，Cisco、NVIDIA 上升",
    points: [
      "6/30 → 9/30：NVIDIA 4.52% → 4.73%，Apple 4.20% → 3.55%，Alphabet 3.68% → 3.27%，Cisco 2.17% → 2.41%。",
      "9/30 前十大另有 Verizon、Accenture、Microsoft、Costco、Fortinet、Analog Devices，合計約 24%。",
      "量化模型每月調整，未找到經理人文字評論。",
    ],
    source: { name: "貝萊德官網與 2026/9/30 月報", url: "https://www.blackrock.com/sg/en/literature/fact-sheet/bgf-systematic-global-equity-high-income-fund-class-a2-usd-factsheet-lu0265550359-sg-en-individual.pdf" },
    verified: true,
  },
  {
    fund: "leaders", date: "2026-10", asOf: "2026-09-30", type: "持股調整",
    title: "9 月加碼記憶體與煉油，減碼 GE Vernova 與金礦",
    points: [
      "加碼（占淨值變化）：SK hynix +0.43%、Valero +0.43%、Microsoft +0.27%、NVIDIA +0.21%、台積電 +0.19%。",
      "減碼：GE Vernova −0.77%、Lundin Mining −0.32%、Montage Gold −0.20%。",
      "新進前段持股：Canadian Natural Resources、Quanta Services、Alphabet、Meta、ASML、Micron。",
      "10/30 週資料：存款約 13.1%、債券約 14.3%，股票部位北美約 46.9%。",
    ],
    source: { name: "MoneyDJ 持股資料（基金公司公布）", url: "https://yuantabank.moneydj.com/w/wr/wr04.djhtm?a=ACYT168-YT81" },
    verified: true,
  },
  {
    fund: "yuantami", date: "2026-10", asOf: "2026-09-30", type: "持股調整",
    title: "9 月減碼 Microsoft、台達電，加碼 Lumentum，新增多檔 AI 與記憶體股",
    points: [
      "減碼：Microsoft −1.29%、台達電 −0.85%、Micron −0.48%、納斯達克 100 ETF −0.36%、NVIDIA −0.34%。",
      "加碼：Lumentum +0.69%。",
      "新進持股：Palantir、SanDisk、SK hynix、台積電、SpaceX、Intel、Kioxia、健康照護與半導體 ETF、韓國價值提升 ETF。",
      "美國長天期公債兩筆合計約 4.3%，比重小幅下降。",
    ],
    source: { name: "MoneyDJ 持股資料（基金公司公布）", url: "https://yuantabank.moneydj.com/w/wr/wr04.djhtm?a=ACYT227" },
    verified: true,
  },
  {
    fund: "yuantami", date: "2026-11", asOf: null, type: "配息",
    title: "B 類型預計 11 月首次配息（本站分析的 A 類型不配息）",
    points: [
      "募集時報導指出採月配息設計，首次配息預計在 11 月；配息來源可能為本金。",
      "11/16 查詢時尚未找到元大投信的 B 類型配息公告，實際除息日與金額以官方公告為準，12/1 再追蹤。",
    ],
    source: { name: "旺得富報導（2026/6/29）", url: "https://wantrich.chinatimes.com/news/20260629900463-420401" },
    verified: true,
  },
  {
    fund: "twhdlv", date: "2026-12", asOf: null, type: "待觀察",
    title: "00713 指數 12 月定期審核，成分股可能調整",
    points: [
      "臺灣指數公司特選高股息低波動指數每年 6、12 月定期審核，以 12 月第 7 個交易日為審核日、資料截至 11 月最後一個交易日，結果通常在生效前一週左右公布。",
      "連結基金持有 00713，成分股調整會直接反映在透視後的持股與產業比重。",
    ],
    source: { name: "Money101：00713 介紹", url: "https://www.money101.com.tw/blog/00713-元大高息低波-etf-配息" },
    verified: true,
  },
  {
    fund: "tw50", date: "2026-12", asOf: null, type: "待觀察",
    title: "台灣 50 指數每季審核，下一次在 12 月",
    points: [
      "0050 追蹤的臺灣 50 指數每季定期審核（3、6、9、12 月）；去年 12 月審核以 11 月下旬資料為準、結果在 12 月初公布。",
      "台積電權重約 56%，成分股異動對連結基金影響主要在權重較小的成分股。",
    ],
    source: { name: "MoneyDJ：0050 基本資料", url: "https://www.moneydj.com/ETF/X/Basic/Basic0004.xdjhtm?etfid=0050.TW" },
    verified: true,
  },
];
