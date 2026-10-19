// Slider lane round-2 screenshots. DELETE AFTER USE — never commit.
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const SHOTS = "/home/novexo/axislead/shots/slider";
mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsConnect(url) {
  const ws = new WebSocket(url);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  return { send, close: () => ws.close() };
}

async function main() {
  const list = JSON.parse(
    execSync("curl -s http://127.0.0.1:9222/json/list").toString(),
  );
  const page = list.find((t) => t.type === "page");
  const { send, close } = await wsConnect(page.webSocketDebuggerUrl);
  await send("Page.enable");

  async function shot(name, width, height) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await sleep(700);
    const res = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const buf = Buffer.from(res.result.data, "base64");
    const path = `${SHOTS}/${name}.png`;
    writeFileSync(path, buf);
    console.log("SHOT", name, buf.length);
  }

  async function clickAria(label) {
    const sel = "[aria-label=" + JSON.stringify(label) + "]";
    const res = await send("Runtime.evaluate", {
      expression: `(function(){var el=document.querySelector(${JSON.stringify(sel)});if(!el)return 'MISS';var r=el.getBoundingClientRect();['pointerdown','mousedown','mouseup','click'].forEach(function(t){el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,clientX:r.left+5,clientY:r.top+5}));});return 'OK';})()`,
      returnByValue: true,
    });
    console.log("CLICK", label, JSON.stringify(res.result?.result?.value));
    await sleep(900);
  }

  const demos = ["Ranges", "Selection"];
  for (const mode of ["light", "dark"]) {
    for (const demo of demos) {
      await send("Page.navigate", { url: "http://127.0.0.1:8099/" });
      await sleep(2500);
      if (mode === "dark") await clickAria("Switch to dark mode");
      await clickAria(`Open ${demo} demo`);
      const slug = demo.toLowerCase();
      await shot(`${slug}-1440-${mode}`, 1440, 900);
      await shot(`${slug}-390-${mode}`, 390, 844);
    }
  }
  close();
}

main().catch((e) => {
  console.error("SHOT-FAIL", e);
  process.exit(1);
});
