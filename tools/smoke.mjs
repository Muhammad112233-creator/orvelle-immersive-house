/* ---------------------------------------------------------------------------
   Runtime smoke test.

   A production build type-checks nothing and renders nothing, so this drives a
   real browser through the experience and fails on any console error, page
   error or failed network request. Not part of the shipped site — a dev tool.

   Usage:  node tools/smoke.mjs [baseUrl]
   --------------------------------------------------------------------------- */

import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:5173";

const errors = [];
const failedRequests = [];
const consoleLog = [];

function note(label) {
  console.log(`\n── ${label}`);
}

const browser = await chromium.launch({
  args: [
    "--no-sandbox",
    "--use-gl=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on("console", (msg) => {
  const text = msg.text();
  consoleLog.push(`[${msg.type()}] ${text}`);
  if (msg.type() === "error") errors.push(text);
});
page.on("pageerror", (err) => errors.push(`PAGEERROR ${err.message}`));
page.on("requestfailed", (req) => {
  // Vite's HMR websocket is expected to be noisy in a headless run.
  if (req.url().includes("/@vite/client")) return;
  failedRequests.push(`${req.failure()?.errorText}  ${req.url()}`);
});
page.on("response", (res) => {
  if (res.status() >= 400)
    failedRequests.push(`HTTP ${res.status()}  ${res.url()}`);
});

note(`Loading ${BASE}`);
await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });

// Is the gate showing instead of the app?
const unsupported = await page.locator("#old-browser, .old-browser").count();
console.log(
  "   WebGL2 available:",
  await page.evaluate(() => {
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  }),
);
console.log("   unsupported-gate elements:", unsupported);

console.log(
  "   #app children:",
  await page.evaluate(
    () => document.querySelector("#app")?.childElementCount ?? -1,
  ),
);
console.log("   canvas count:", await page.locator("canvas").count());

await page.waitForTimeout(3500);
await page.screenshot({ path: "tools/shot-intro.png" });
note("Captured intro gate");

// The intro gate must be dismissed before anything else exists. Clicking it
// is also what unlocks audio, exactly as a real visitor would.
const enter = page.getByRole("button", { name: /enter/i }).first();
if (await enter.count()) {
  await enter.click({ force: true });
  console.log("   clicked Enter");
} else {
  console.log("   !! no Enter button found");
}
await page.waitForTimeout(5000);
await page.screenshot({ path: "tools/shot-home.png" });
note("Captured home");

for (const room of ["vestibule", "parlour", "atelier"]) {
  await page.goto(`${BASE}/#/room/${room}`, { waitUntil: "load" });
  await page.waitForTimeout(4500);
  const hotspots = await page.locator(".hotspot").count();
  console.log(`   ${room}: hotspots=${hotspots}`);
  await page.screenshot({ path: `tools/shot-${room}.png` });
}

// Open each interaction in the parlour by clicking its hotspot.
await page.goto(`${BASE}/#/room/parlour`, { waitUntil: "load" });
await page.waitForTimeout(4000);
const spots = page.locator(".hotspot");
const n = await spots.count();
note(`Parlour: opening ${n} interactions`);
for (let i = 0; i < n; i++) {
  try {
    await spots.nth(i).click({ timeout: 5000, force: true });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `tools/shot-parlour-interaction-${i}.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1200);
  } catch (e) {
    errors.push(`INTERACTION ${i} click failed: ${e.message}`);
  }
}

// Complete the game and open the journal + end page.
note("Forcing completion");
await page.evaluate(() => window.$game?.complete?.());
await page.waitForTimeout(1500);
await page.screenshot({ path: "tools/shot-complete.png" });

note("RESULTS");
console.log(`console errors : ${errors.length}`);
errors.slice(0, 25).forEach((e) => console.log("   ✗", e.slice(0, 300)));
console.log(`failed requests: ${failedRequests.length}`);
[...new Set(failedRequests)]
  .slice(0, 25)
  .forEach((e) => console.log("   ✗", e.slice(0, 200)));

await browser.close();
process.exit(errors.length || failedRequests.length ? 1 : 0);
