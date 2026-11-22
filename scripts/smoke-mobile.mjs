// Prova di fumo su telefono emulato (Edge/Chrome headless via CDP):
// apre ogni scheda, fa screenshot a pagina intera, prova le interazioni principali e raccoglie gli errori.
// Uso: avvia l'app (npm run dev) ed Edge con --remote-debugging-port=9333, poi
//      node scripts/smoke-mobile.mjs http://localhost:5173/ 9333 <cartellaScreenshot> [light|dark]
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const [base, port, outDir, scheme = "dark"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push("EXC " + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text));
  if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) errors.push(m.params.type + " " + m.params.args.map((a) => a.value ?? a.description).join(" "));
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (e) => {
  const r = await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? "eval error");
  return r.result?.result?.value;
};

await send("Runtime.enable"); await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });

async function shot(name) {
  const { result } = await send("Page.getLayoutMetrics");
  const h = Math.ceil(result.cssContentSize.height);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: Math.max(844, h), deviceScaleFactor: 2, mobile: true });
  await sleep(300);
  const s = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(s.result.data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
}

// Trova l'input associato a un'etichetta (testo che termina con labelText).
const inputFor = (labelText) =>
  `document.getElementById([...document.querySelectorAll("label")].find((l) => l.textContent.trim().endsWith(${JSON.stringify(labelText)})).htmlFor)`;
// Scrive in un campo controllato da React (setter nativo + evento input).
const typeInto = (labelText, value) => evaluate(`(() => {
  const input = ${inputFor(labelText)};
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, ${JSON.stringify(value)});
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
})()`);
const valueOf = (labelText) => evaluate(`${inputFor(labelText)}.value`);
const clickText = (text) => evaluate(`(() => { const b = [...document.querySelectorAll("button, a")].find((e) => e.textContent.trim() === ${JSON.stringify(text)}); if (!b) throw new Error("pulsante non trovato: " + ${JSON.stringify(text)}); b.click(); return true; })()`);
const summary = () => evaluate(`[...document.querySelectorAll("header dd")].map((d) => d.textContent).join(" | ")`);

// Aspetta che la pagina sia disegnata (al primo avvio Vite può ricaricarla per ottimizzare le dipendenze).
async function waitFor(selector, timeout = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`).catch(() => false)) return;
    await sleep(250);
  }
  throw new Error("timeout in attesa di " + selector);
}
async function go(hash) {
  await send("Page.navigate", { url: base + hash });
  await waitFor("main h2");
  await sleep(400);
}

// stato pulito
await send("Page.navigate", { url: base });
await waitFor("main h2");
await sleep(3000); // lascia finire un'eventuale ricarica di Vite
await evaluate(`localStorage.clear(); true`);
await send("Page.reload");
await waitFor("main h2");
await sleep(500);

const report = {};
report.avvio = await summary();
await shot("1-impasto");

await typeInto("Farina", "1200");
await sleep(200);
report.dopoFarina1200 = await summary();

await clickText("Biga");
await sleep(300);
report.prefermentiDopoBiga = await evaluate(`document.querySelectorAll('[aria-label="Rimuovi prefermento"]').length`);
report.dopoBiga = await summary();
await shot("2-impasto-con-biga");

await go("#/tempi");
await shot("3-tempi");

await go("#/risultati");
await clickText("Usa questa dose nell’impasto");
await sleep(500);
report.toast = await evaluate(`document.querySelector("[data-sonner-toast]")?.textContent ?? null`);
await shot("4-risultati");

await go("#/impasto");
report.lievitoDopoUsaDose = await valueOf("Quantità");

await send("Page.reload");
await waitFor("main h2");
await sleep(500);
report.dopoRicarica = await summary();

await go("#/diario");
await shot("5-diario");

report.overflowX = await evaluate(`document.documentElement.scrollWidth > innerWidth`);
console.log(JSON.stringify(report, null, 2));
console.log("errori:", errors.length ? errors : "nessuno");
ws.close(); process.exit(0);
