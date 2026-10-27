// Serves a local copy of the dashboard page with a stand-in for the `dash` runtime, for recording the demo.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f));
const datasets = {
  state_results: JSON.parse(read('data/state_results_2r.json')),
  national: JSON.parse(read('data/national_2r.json')),
  state_shapes: JSON.parse(read('data/state_shapes.json')).rows,
  abroad_total: JSON.parse(read('data/abroad_total_2r.json')),
  abroad_cities: JSON.parse(read('data/abroad_cities_2r.json')),
  polls: JSON.parse(read('data/polls_2r.json')),
};

const mock = `
<script>
(function () {
  const DATA = ${JSON.stringify(datasets)};
  const calcs = {}, cache = {}, subs = [];
  const get = (id) => {
    if (id in DATA) return DATA[id];
    if (id in cache) return cache[id];
    const c = calcs[id]; if (!c) return null;
    const ins = c.inputs.map(get);
    if (ins.some((x) => x == null)) return null;
    return (cache[id] = c.fn(...ins));
  };
  window.dash = {
    colors: ['#d81e2c', '#1f5fc4'],
    calc: (id, def) => { calcs[id] = def; },
    loader: () => {},
    data: (id) => { const d = get(id); return d ? { status: 'ok', data: d, columns: Object.keys(d[0] || {}), meta: [] } : { status: 'loading', data: [] }; },
    onData: (fn) => { subs.push(fn); setTimeout(fn, 0); },
    params: () => ({}), setParams: () => {}, resetParams: () => {}, setLink: () => {}, refresh: () => {},
  };
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => subs.forEach((f) => f()), 100); });
})();
</script>`;

const harness = () => {
  const page = fs.readFileSync(path.join(ROOT, 'dashboard/index.html'), 'utf8');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Brazil 2026 · Runoff</title>
<style>
:root { --cds-gap-xs: 4px; --cds-gap-sm: 8px; --cds-gap-md: 16px; --cds-gap-lg: 24px; --cds-gap-xl: 32px;
  --cds-pad-xs: 4px; --cds-pad-sm: 8px; --cds-pad-md: 12px; --cds-pad-lg: 20px; --cds-pad-xl: 28px;
  --cds-font-size-caption: 12px; --cds-font-size-body: 14px; --cds-font-size-heading: 16px; --cds-font-size-title: 26px;
  --cds-font-weight-medium: 500; --cds-radius: 10px; --cds-dur-slow: .3s; }
html, body { margin: 0; background: #fff; }
body { font: 14px/1.5 system-ui, sans-serif; }
#cap { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); max-width: 1000px; width: calc(100% - 120px); background: rgba(16, 18, 24, .88); color: #fff;
  font: 500 19px/1.45 'Poppins', sans-serif; padding: 14px 22px; border-radius: 12px; z-index: 99; transition: opacity .35s; box-shadow: 0 10px 30px rgba(0,0,0,.25); }
#cap:empty { opacity: 0; }
#card { position: fixed; inset: 0; z-index: 100; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; transition: opacity .6s; font-family: 'Poppins', sans-serif; text-align: center; }
#card.off { opacity: 0; pointer-events: none; }
#card .k { font-size: 14px; letter-spacing: .18em; text-transform: uppercase; color: #646873; font-weight: 600; }
#card h1 { margin: 0; font-size: 56px; font-weight: 700; letter-spacing: -.03em; color: #17181c; }
#card h1 span { color: #d81e2c; }
#card p { margin: 0; font-size: 18px; color: #646873; max-width: 720px; }
#card .by { display: flex; align-items: center; gap: 12px; margin-top: 28px; padding: 10px 18px 10px 10px; border: 1px solid #e5e7ec; border-radius: 999px; }
#card .by img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
#card .by b { display: block; font-size: 15px; color: #17181c; text-align: left; } #card .by span { display: block; font-size: 13px; color: #646873; text-align: left; }
.li { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 4px; background: #0a66c2; color: #fff; font: 700 12px/1 Arial, sans-serif; flex: none; }
#badge { position: fixed; top: 14px; right: 14px; z-index: 97; display: flex; align-items: center; gap: 8px; padding: 6px 12px 6px 6px; background: rgba(255,255,255,.94); border: 1px solid #e5e7ec; border-radius: 999px; box-shadow: 0 6px 18px rgba(20,24,40,.12); font: 500 12px/1.2 'Poppins', sans-serif; color: #17181c; transition: opacity .5s; }
#badge img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; } #badge small { display: flex; align-items: center; gap: 5px; color: #646873; font-size: 11px; }
#badge.off { opacity: 0; }
#card .prof { display: flex; flex-direction: column; align-items: center; gap: 10px; }
#card .prof img { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 5px #fff, 0 0 0 7px #0a66c2, 0 14px 36px rgba(20,24,40,.18); }
#card .prof .nm { font-size: 30px; font-weight: 700; color: #17181c; letter-spacing: -.01em; }
#card .prof .hl { font-size: 15px; color: #646873; max-width: 640px; }
#card .prof .url { display: inline-flex; align-items: center; gap: 10px; margin-top: 6px; padding: 10px 18px; border-radius: 10px; background: #0a66c2; color: #fff; font-size: 16px; font-weight: 600; }
#card .prof .url .li { background: #fff; color: #0a66c2; width: 22px; height: 22px; font-size: 14px; }
#card .src { font-size: 13px; color: #8a8f99; max-width: 820px; margin-top: 18px; }
#card .bar { width: 360px; height: 10px; border-radius: 99px; overflow: hidden; display: flex; margin-top: 8px; }
#cursor { position: fixed; width: 22px; height: 22px; border-radius: 50%; background: rgba(23, 24, 28, .25); border: 2px solid rgba(23,24,28,.7); z-index: 98; pointer-events: none; transform: translate(-50%, -50%); transition: transform .12s; left: -50px; top: -50px; }
#cursor.down { transform: translate(-50%, -50%) scale(.7); }
</style>
<script src="/d3.js"></script>${mock}
</head><body>
<div id="dash-root">${page}</div>
<div id="cap"></div>
<div id="card"><span class="k">Brazil 2026 · Presidential election</span><h1>Runoff <span>dashboard</span></h1><p>Results by state, voting abroad, polls vs. result and statistical analysis</p><div class="bar"><div style="width:51.79%;background:#d81e2c"></div><div style="width:48.21%;background:#1f5fc4"></div></div><div class="by"><img src="/me.jpg" alt=""><div><b>Kenny Yusimy Garcia Angarita</b><span>Data Analyst · linkedin.com/in/kennyyusimygarciaangarita</span></div></div></div>
<div id="badge" class="off"><img src="/me.jpg" alt=""><div>Kenny Garcia Angarita<small><span class="li">in</span> kennyyusimygarciaangarita</small></div></div>
<div id="cursor"></div>
<script>
document.addEventListener('mousemove', (e) => { const c = document.getElementById('cursor'); c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
document.addEventListener('mousedown', () => document.getElementById('cursor').classList.add('down'));
document.addEventListener('mouseup', () => document.getElementById('cursor').classList.remove('down'));
</script>
</body></html>`;
};

const files = {
  '/d3.js': [path.join(ROOT, 'node_modules/d3/dist/d3.min.js'), 'text/javascript'],
  '/fonts.css': [path.join(ROOT, 'dashboard/fonts.css'), 'text/css'],
  '/flags.js': [path.join(ROOT, 'dashboard/flags.js'), 'text/javascript'],
  '/_blob/9aaf4563631245d4a3f60e86af229490': [path.join(ROOT, 'assets/lula.webp'), 'image/webp'],
  '/me.jpg': [path.join(ROOT, 'assets/me.jpg'), 'image/jpeg'],
  '/_blob/c980b27205fe0ea3225e09b0992beb02': [path.join(ROOT, 'assets/flavio.webp'), 'image/webp'],
};

http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  if (u === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(harness()); }
  const f = files[u] || (u.startsWith('/') && files['/' + path.basename(u)]);
  if (!f) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f[1] }); res.end(fs.readFileSync(f[0]));
}).listen(8765, () => console.log('http://localhost:8765'));
