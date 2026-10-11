// net-test.mjs [partien=1] – spielt Online-Partien zwischen zwei Tabs (BroadcastChannel statt PeerJS, ?net=bc) mit Zufalls-Bots
// und prüft, dass beide Geräte synchron bleiben (Prüfsummen nach jeder Aktivierung, gleiches Endergebnis). Braucht Node ≥ 22.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = dirname(fileURLToPath(import.meta.url)), ROOT = join(DIR, '..'), GAMES = +(process.argv[2] || 1);
const threeDir = process.env.THREE_DIR || join(DIR, '.cache', 'three');
// kleiner Webserver (BroadcastChannel braucht einen echten Ursprung)
const srv = createServer((q, r) => {
  const f = join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (!f.startsWith(ROOT) || !existsSync(f)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript' }[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f));
}).listen(0);
const base = `http://127.0.0.1:${srv.address().port}/Tau_Gefecht.html?net=bc&fx=0&norender`;
const chrome = execFileSync(join(DIR, 'chrome.sh')).toString().trim();
const prof = mkdtempSync(join(tmpdir(), 'cdp-')), port = 9300 + Math.floor(Math.random() * 500);
const args = ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`,
  '--window-size=900,600', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'];
if (process.getuid?.() === 0) args.push('--no-sandbox');
const ch = spawn(chrome, args, { stdio: 'ignore' });
const done = code => { try { ch.kill(); } catch {} srv.close(); setTimeout(() => { try { rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(code); }, 300); };
setTimeout(() => { console.error('Zeitlimit'); done(2); }, 900 * 1000 * GAMES);
let list;
for (let i = 0; i < 100 && !list; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await new Promise(r => setTimeout(r, 200)); } }
const sock = new WebSocket(list.webSocketDebuggerUrl); let id = 0; const pend = new Map(), handlers = [];
const send = (method, params = {}, sessionId) => new Promise(res => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params, sessionId })); });
sock.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else handlers.forEach(h => h(d)); };
await new Promise(r => sock.onopen = r);
async function page(url) {
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', newWindow: true });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  handlers.push(async d => {
    if (d.sessionId !== sessionId) return;
    if (d.method === 'Runtime.exceptionThrown') console.error('Seitenfehler:', d.params.exceptionDetails?.exception?.description ?? d.params.exceptionDetails?.text);
    if (d.method === 'Fetch.requestPaused') {
      const f = join(threeDir, new URL(d.params.request.url).pathname.replace(/^\/npm\/three@[^/]+\//, ''));
      if (existsSync(f)) S('Fetch.fulfillRequest', { requestId: d.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: readFileSync(f).toString('base64') });
      else S('Fetch.continueRequest', { requestId: d.params.requestId });
    }
  });
  if (existsSync(join(threeDir, 'build'))) await S('Fetch.enable', { patterns: [{ urlPattern: '*cdn.jsdelivr.net/npm/three@*' }] });
  await S('Runtime.enable'); await S('Page.enable'); await S('Page.navigate', { url });
  const ev = async (expr, wait = true) => {
    for (;;) {
      const r = await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'Fehler');
      const v = r.result?.result?.value; if (!wait || (v !== undefined && v !== null)) return v;
      await new Promise(r => setTimeout(r, 300));
    }
  };
  return ev;
}
// Bot: spielt die eigene Seite mit zufälligen, aber gültigen Aktionen (inkl. Abwehrfeuer-Entscheidungen)
const BOT = `(() => { if (window.__bot) return 1; window.__bot = setInterval(() => {
  const G = __G, N = __NET, me = N.side; if (G.speed !== 4) { G.speed = 4; }
  if (G.busy || N.running) { const ow = document.querySelector('.owbar'); if (ow) { const b = ow.querySelectorAll('button'); b[Math.floor(Math.random() * b.length)].click(); } return; }
  if (G.phase === 'deploy') { const u = G.deployQ[0]; if (u && u.side === me && !G.autoDep?.[me]) __net.autoDeploy(); return; }
  if (G.phase !== 'play' || G.turn !== me) return;
  const a = G.act, idx = u => G.units.indexOf(u);
  if (!a) { const u = G.units.find(u => u.side === me && u.alive && u.placed && !u.done); if (u) __net.act('sel', idx(u)); return; }
  if (!a.moved && Math.random() < .8 && a.nav) { const ok = []; for (let i = 0; i < a.nav.dist.length; i++) if (a.nav.ok(i)) ok.push(i); if (ok.length) { __net.act('mv', ok[Math.floor(Math.random() * ok.length)]); return; } }
  if (Math.random() < .25 && G.cp[me] >= 1 && !a.strat) { __net.act('strat', Math.random() < .5 ? 'reroll' : 'ap'); return; }
  const t = G.units.filter(e => e.side !== me && e.alive && __net.validTarget(e));
  if (t.length) __net.act('tgt', idx(t[Math.floor(Math.random() * t.length)])); else __net.act('end');
}, 120); return 1; })()`;
let fails = 0;
for (let g = 0; g < GAMES; g++) {
  const A = await page(base);
  await A(`window.__G && window.__net ? 1 : null`);
  const code = await A(`(async () => { __G.mission = ['vorherrschaft','kopfgeld','durchbruch'][${g} % 3]; __G.lists[0] = __net.randomList(); __net.hostAs(); await new Promise(r => setTimeout(r, 300)); return window.__netCode; })()`);
  const B = await page(`${base}&join=${code}`);
  await B(`window.__G && window.__net ? 1 : null`);
  await B(`(__net.joinAs(__net.randomList()), 1)`);
  const st = `JSON.stringify({ ph: __G.phase, r: __G.round, t: __G.turn, busy: __G.busy, run: __NET.running, q: __NET.q.length, act: __G.act && __G.units.indexOf(__G.act.u), dq: __G.deployQ.length, n: __NET.n, hint: document.getElementById('hint').textContent.slice(0, 60), modal: document.getElementById('modal').classList.contains('on') })`;
  const tick = process.env.DEBUG ? setInterval(async () => console.error('A', await A(st, false), JSON.stringify(await A('__NET.trace', false)), '\nB', await B(st, false), JSON.stringify(await B('__NET.trace', false)), JSON.stringify(await A('__G.units.map(u=>u.type[0]+u.side)', false)), JSON.stringify(await B('__G.units.map(u=>u.type[0]+u.side)', false))), 5000) : null;
  await A('(__NET.trace = [], 1)'); await B('(__NET.trace = [], 1)');
  await A(BOT); await B(BOT);
  const fin = `__G.phase === 'end' || window.__NET.desync ? JSON.stringify({ phase: __G.phase, vp: __G.vp, round: __G.round, desync: !!__NET.desync, n: __NET.n, hash: __net.hash() }) : null`;
  const [ra, rb] = await Promise.all([A(fin), B(fin)]); clearInterval(tick);
  const a = JSON.parse(ra), b = JSON.parse(rb), ok = !a.desync && !b.desync && a.hash === b.hash && a.vp.join() === b.vp.join();
  if (!ok) fails++;
  console.log(`Partie ${g + 1}: ${ok ? 'synchron' : 'NICHT SYNCHRON'} · Runde ${a.round} · Punkte ${a.vp.join(':')} / ${b.vp.join(':')} · ${a.n} Aktivierungen`);
}
done(fails ? 1 : 0);
