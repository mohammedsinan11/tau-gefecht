// cdp-eval.mjs <url> <js-ausdruck> [timeout_s] – öffnet die Seite in kopflosem Chrome (DevTools-Protokoll, ohne Zusatzpakete),
// wertet den Ausdruck wiederholt aus, bis er einen Wert ungleich null/undefined liefert, und gibt ihn aus. Braucht Node ≥ 22.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const [url, expr, tmo = '600'] = process.argv.slice(2);
const chrome = execFileSync(join(dirname(fileURLToPath(import.meta.url)), 'chrome.sh')).toString().trim();
const prof = mkdtempSync(join(tmpdir(), 'cdp-')), port = 9300 + Math.floor(Math.random() * 500);
const args = ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--window-size=900,600', 'about:blank'];
if (process.getuid?.() === 0) args.push('--no-sandbox');
const ch = spawn(chrome, args, { stdio: 'ignore' });
const done = code => { try { ch.kill(); } catch {} setTimeout(() => { try { rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(code); }, 300); };
setTimeout(() => { console.error('Zeitlimit'); done(2); }, +tmo * 1000);
let ws;
for (let i = 0; i < 100 && !ws; i++) {
  try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = list.find(t => t.type === 'page'); if (p) ws = p.webSocketDebuggerUrl; } catch {}
  if (!ws) await new Promise(r => setTimeout(r, 200));
}
const sock = new WebSocket(ws); let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
sock.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Runtime.exceptionThrown') console.error('Seitenfehler:', d.params.exceptionDetails?.exception?.description ?? d.params.exceptionDetails?.text); };
await new Promise(r => sock.onopen = r);
await send('Runtime.enable'); await send('Page.enable'); await send('Page.navigate', { url });
for (;;) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  const v = r.result?.result?.value;
  if (v !== undefined && v !== null) { console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 1)); done(0); break; }
  await new Promise(r => setTimeout(r, 500));
}
