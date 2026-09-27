// Browser smoke test for a running Recipe Picker (vite preview or a deployed stage).
// Usage: node tools/smoke.mjs <url>   (CHROME_PATH overrides the browser binary;
//        CSP_NEGATIVE_CONTROL=1 injects an inline <style> to prove violations are detected)
import { chromium } from "playwright-core";
const url = process.argv[2];
if (!url) throw new Error("Usage: node tools/smoke.mjs <url>");
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome" });
const ctx = await browser.newContext();
await ctx.addInitScript(() => {
  window.__cspViolations = [];
  document.addEventListener("securitypolicyviolation", (e) => window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`));
});
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || /Content Security Policy/i.test(m.text())) errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
const ok = (c, msg) => { console.log(`${c ? "PASS" : "FAIL"} ${msg}`); if (!c) process.exitCode = 1; };

await page.goto(url, { waitUntil: "networkidle" });
const names = async () => page.locator("article h2").allTextContents();
const first = await names();
ok(first.length === 4, `4 meal cards rendered (${first.length})`);
const imgsLoaded = await page.$$eval("article img", (imgs) => imgs.every((i) => i.complete && i.naturalWidth > 0));
ok(imgsLoaded, "all card images loaded");

await page.getByRole("checkbox").first().click();
const locked = first[0];
await page.getByRole("button", { name: /shuffle|refresh|new/i }).first().click();
const second = await names();
ok(second[0] === locked, `locked meal kept after shuffle (${locked})`);
ok(second.join() !== first.join(), "shuffle changed unlocked meals");

await page.reload({ waitUntil: "networkidle" });
ok((await names()).join() === second.join(), "plan persists across reload (localStorage)");

const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return r.active?.scriptURL; });
ok(Boolean(sw), `service worker active (${sw})`);
await page.reload({ waitUntil: "networkidle" }); // let SW control + cache runtime assets
const cacheKeys = await page.evaluate(async () => (await caches.keys()));
console.log("caches:", cacheKeys.join(", "));

await ctx.setOffline(true);
await page.reload({ waitUntil: "load" }).catch((e) => errors.push("offline reload: " + e.message));
await page.waitForTimeout(500);
ok((await names()).length === 4, "renders offline after reload");
await ctx.setOffline(false);

const violations = await page.evaluate(() => window.__cspViolations);
ok(violations.length === 0, `no CSP violation events${violations.length ? ": " + violations.join(", ") : ""}`);
if (process.env.CSP_NEGATIVE_CONTROL) {
  await page.evaluate(() => { const s = document.createElement("style"); s.textContent = "body{}"; document.head.append(s); });
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => window.__cspViolations.length);
  ok(after > 0, `negative control: injected inline <style> is reported (${after})`);
}
const offlineNoise = /ERR_INTERNET_DISCONNECTED|Failed to load resource/;
const real = errors.filter((e) => !offlineNoise.test(e));
ok(real.length === 0, `no console/CSP errors${real.length ? ":\n  " + real.join("\n  ") : ""}`);
await browser.close();
