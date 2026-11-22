// Genera le icone PNG dell'app da scripts/brand/lievora-mark.svg, con Edge/Chrome headless (CDP).
// Uso: avvia Edge con --headless=new --remote-debugging-port=9333, poi
//      node scripts/brand/generate-icons.mjs 9333
import { readFileSync, writeFileSync } from "node:fs";
const [port] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const svg = readFileSync(new URL("./lievora-mark.svg", import.meta.url), "utf8");
const BG = "#17130F";

// size: lato in px; scale: quanto spazio occupa il disegno (le icone "maskable" vogliono margine, zona sicura 80 %);
// radius: angoli arrotondati (0 = quadrata, il sistema applica la sua maschera).
const ICONS = [
  { file: "icon-192.png", size: 192, scale: 1, radius: 0.23 },
  { file: "icon-512.png", size: 512, scale: 1, radius: 0.23 },
  { file: "icon-maskable-512.png", size: 512, scale: 0.78, radius: 0 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.9, radius: 0 },
];

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable");
await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });

for (const icon of ICONS) {
  const inner = svg.replace(/<svg[^>]*>/, "").replace("</svg>", "");
  const pad = ((1 - icon.scale) / 2) * 64;
  const page = `<!doctype html><html><body style="margin:0;background:transparent">
    <svg xmlns="http://www.w3.org/2000/svg" width="${icon.size}" height="${icon.size}" viewBox="0 0 64 64" style="display:block">
      <rect width="64" height="64" rx="${icon.radius * 64}" fill="${BG}"/>
      <g transform="translate(${pad} ${pad}) scale(${icon.scale})">${inner}</g>
    </svg></body></html>`;
  await send("Emulation.setDeviceMetricsOverride", { width: icon.size, height: icon.size, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "data:text/html;base64," + Buffer.from(page).toString("base64") });
  await sleep(400);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: icon.size, height: icon.size, scale: 1 } });
  writeFileSync(new URL(`../../public/icons/${icon.file}`, import.meta.url), Buffer.from(shot.result.data, "base64"));
  console.log("generata", icon.file);
}
ws.close(); process.exit(0);
