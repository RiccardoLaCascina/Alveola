// Fa girare la prima versione (legacy/index.html) in Edge headless con gli scenari di
// scripts/legacy-scenarios.json e salva quello che mostra a schermo in
// src/domain/__fixtures__/legacy-parity.json. Il test di parità confronta poi il nuovo dominio.
//
// Uso: avvia "python -m http.server 8010 --directory legacy" e Edge con --remote-debugging-port=9333, poi
//      node scripts/capture-legacy.mjs http://127.0.0.1:8010/ 9333
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const [base, port] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const scenarios = JSON.parse(readFileSync(new URL("./legacy-scenarios.json", import.meta.url), "utf8"));

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable");
await send("Page.navigate", { url: base });
await sleep(1500);

const read = `(() => {
  const t = (id) => document.getElementById(id)?.textContent.replace(/\\u00a0/g, " ").trim() ?? null;
  const rows = (id) => [...document.querySelectorAll("#" + id + " tr")].map((tr) => [...tr.children].map((td) => td.textContent.replace(/\\u00a0/g, " ").trim()));
  const flags = (id) => [...document.querySelectorAll("#" + id + " li")].map((li) => ({ tone: li.classList.contains("ok") ? "info" : "warning", message: li.textContent }));
  return {
    hydration: t("rHyd"), hydrationNote: t("rHydNote"), total: t("mTot"),
    bakers: rows("rTable"), compositionFlags: flags("rFlags"), pieces: t("rPieces"), rest: t("rRest"),
    yeast: t("rYeast"), yeastNote: t("rYeastNote"), maturation: rows("rMat"),
    waterTemp: t("rTw"), w: t("rW"), wNote: t("rWNote"), maturationFlags: flags("mFlags"),
    schedule: [...document.querySelectorAll("#sched li")].map((li) => [...li.children].map((s) => s.textContent.trim())),
  };
})()`;

const out = [];
for (const s of scenarios) {
  await evaluate(`localStorage.setItem("banco-impasti-bozza", ${JSON.stringify(JSON.stringify(s.state))}); true`);
  await send("Page.reload");
  await sleep(1200);
  out.push({ name: s.name, state: s.state, shown: await evaluate(read) });
  console.log("catturato:", s.name);
}
mkdirSync(new URL("../src/domain/__fixtures__/", import.meta.url), { recursive: true });
writeFileSync(new URL("../src/domain/__fixtures__/legacy-parity.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
ws.close(); process.exit(0);
