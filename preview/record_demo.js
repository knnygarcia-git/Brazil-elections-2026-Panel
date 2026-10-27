// Records the dashboard walkthrough with on-screen captions; run `node server.js` first.
const { chromium } = require('playwright');
const fs = require('fs');

const R = JSON.parse(fs.readFileSync(__dirname + '/captions.json', 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: __dirname + '/raw', size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  const v0 = Date.now();
  await page.goto('http://localhost:8765/');
  await page.waitForTimeout(1200);

  const cap = (t) => page.evaluate((t) => { document.getElementById('cap').textContent = t; }, t);
  const scrollTo = (sel, off = 24, ms = 1400) => page.evaluate(([sel, off, ms]) => new Promise((done) => {
    const el = sel ? document.querySelector(sel) : null;
    const to = el ? el.getBoundingClientRect().top + window.scrollY - off : 0, from = window.scrollY, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; window.scrollTo(0, from + (to - from) * e); k < 1 ? requestAnimationFrame(step) : done(); };
    requestAnimationFrame(step);
  }), [sel, off, ms]);
  const center = (sel) => page.evaluate((sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const ufCenter = (uf) => page.evaluate((uf) => {
    const p = [...document.querySelectorAll('#mapbox path.uf')].find((n) => n.__data__ && n.__data__.uf === uf);
    const b = p.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2];
  }, uf);
  const move = async ([x, y], steps = 25) => { await page.mouse.move(x, y, { steps }); };
  const hoverAcross = async (sel, n = 8, pause = 450) => {
    const b = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }, sel);
    for (let i = 0; i <= n; i++) { await move([b[0] + b[2] * (0.12 + 0.76 * i / n), b[1] + b[3] * 0.45], 12); await sleep(pause); }
  };
  const clickText = async (sel, text) => { const el = page.locator(sel, { hasText: text }).first(); const bb = await el.boundingBox(); await move([bb.x + bb.width / 2, bb.y + bb.height / 2], 20); await sleep(200); await el.click(); };
  const setSlider = async (to, ms = 2500) => page.evaluate(([to, ms]) => new Promise((done) => {
    const el = document.getElementById('swing'), from = +el.value, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / ms); el.value = (from + (to - from) * k).toFixed(1); el.dispatchEvent(new Event('input')); k < 1 ? requestAnimationFrame(step) : done(); };
    requestAnimationFrame(step);
  }), [to, ms]);

  const actions = {
    abertura: async () => { await sleep(R[0].dur * 1000 - 900); await page.evaluate(() => { document.getElementById('card').classList.add('off'); document.getElementById('badge').classList.remove('off'); }); },
    placar: async () => { await move(await center('.cand.win .pc'), 30); await sleep(5000); await move(await center('.cand:not(.win) .pc'), 40); await sleep(4000); await move(await center('.cand:not(.win) .vt'), 20); },
    mapa: async () => { for (const uf of ['BA', 'MG', 'SP', 'SC', 'AM']) { await move(await ufCenter(uf), 22); await sleep(2100); } },
    regioes: async () => { await clickText('#regioes .chip', 'Northeast'); await sleep(3000); await clickText('#regioes .chip', 'South'); await sleep(3000); await clickText('#regioes .chip', 'All'); },
    exterior: async () => { await scrollTo('.extline', 260, 1000); await move(await center('.extline'), 25); },
    vantagem: async () => { await scrollTo('#margens', 20); const b = await page.evaluate(() => { const r = document.querySelector('#barbox').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
      for (const k of [0.04, 0.5, 0.97]) { await move([b[0] + b[2] * 0.55, b[1] + b[3] * k], 25); await sleep(1800); } },
    tabela: async () => { await clickText('#tab th button', 'Lula'); await sleep(1500); const s = await center('#busca'); await move(s, 15); await page.click('#busca'); await page.type('#busca', 'Minas', { delay: 160 }); await sleep(1500); await page.fill('#busca', ''); await page.evaluate(() => document.getElementById('busca').dispatchEvent(new Event('input'))); },
    regiao: async () => { await scrollTo('#analises', 20); await sleep(1500); await hoverAcross('#stripbox', 6, 700); },
    hist: async () => { await move(await center('#histbox'), 25); await sleep(1200); await hoverAcross('#histbox', 3, 900); },
    simulador: async () => { await scrollTo('#simulador', 140); await move(await center('#swing'), 20); await setSlider(1.0, 1800); await sleep(800); await setSlider(2.5, 1800); await sleep(1800); await setSlider(-3, 2500); await sleep(1300); await setSlider(0, 1200); },
    pesquisas: async () => { await scrollTo('#polls', 20); await sleep(2500); await hoverAcross('#projbox', 9, 750); },
    chance: async () => { await hoverAcross('#chancebox', 6, 500); },
    vies: async () => { await scrollTo('#institutos', 20, 1200); await sleep(4500); await scrollTo('#vies', 20, 1200); await move(await center('#viesbox'), 25); await sleep(1500); await move(await center('#calibracao .kpis'), 25); },
    cidades: async () => { await scrollTo('#exterior', 20); const b = await page.evaluate(() => { const r = document.querySelector('#extbox').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
      for (const k of [0.05, 0.4, 0.95]) { await move([b[0] + b[2] * 0.5, b[1] + b[3] * k], 25); await sleep(1800); } },
    fim: async () => { await page.mouse.move(1, 1); await page.evaluate(() => {
      const c = document.getElementById('card');
      document.getElementById('badge').classList.add('off');
      c.innerHTML = `<div class="prof"><span class="k">Built by</span><img src="/me.jpg" alt="Kenny Yusimy Garcia Angarita">
        <span class="nm">Kenny Yusimy Garcia Angarita</span>
        <span class="hl">Data Analyst · SQL · Python · Power BI · Azure · CRM, Retail & Predictive Analytics · Turning data into business decisions</span>
        <span class="url"><span class="li">in</span>linkedin.com/in/kennyyusimygarciaangarita</span></div>
        <p class="src">Sources: TSE (via Band, Bloomberg Línea, Exame, Nexo, BBC News Brasil) · Datafolha, Genial/Quaest and AtlasIntel/Bloomberg polls</p>`;
      c.classList.remove('off');
    }); },
  };

  const marks = [];
  for (const r of R) {
    const t0 = Date.now();
    marks.push({ id: r.id, at: (t0 - v0) / 1000 });
    await cap(r.id === 'abertura' ? '' : r.cap);
    if (r.id === 'abertura') setTimeout(() => cap(r.cap), 600);
    await actions[r.id]();
    const left = t0 + r.dur * 1000 + 700 - Date.now();
    if (left > 0) await sleep(left);
  }
  await sleep(1500);
  const total = (Date.now() - v0) / 1000;
  const vid = await page.video().path();
  await ctx.close(); await browser.close();
  fs.writeFileSync(__dirname + '/marks.json', JSON.stringify({ marks, total, vid }, null, 1));
  console.log(vid, total);
})();
