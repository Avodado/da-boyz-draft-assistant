import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { gunzipSync } from "node:zlib";


const workerSource = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
const appHtml = gunzipSync(readFileSync(new URL("../app.html.gz", import.meta.url))).toString("utf8");


class FakeResponse {
  constructor(status, body) {
    this.status = status;
    this.body = body;
    this.ok = status >= 200 && status < 300;
  }

  clone() {
    return new FakeResponse(this.status, this.body);
  }
}


function keyOf(value) {
  return typeof value === "string" ? value : value?.url ?? String(value);
}


function makeWorkerHarness() {
  const listeners = {};
  const stores = new Map();
  const deleted = [];
  const added = [];
  let claimCount = 0;
  let skipWaitingCount = 0;
  let fetchImpl = async () => {
    throw new Error("offline");
  };

  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(assets) {
          added.push(...assets);
        },
        async put(key, response) {
          store.set(keyOf(key), response);
        },
        async match(key) {
          return store.get(keyOf(key));
        },
      };
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      deleted.push(name);
      return stores.delete(name);
    },
    async match(key) {
      const normalized = keyOf(key);
      for (const store of stores.values()) {
        if (store.has(normalized)) return store.get(normalized);
      }
      return undefined;
    },
  };

  const context = vm.createContext({
    URL,
    caches,
    fetch: (...args) => fetchImpl(...args),
    self: {
      registration: { scope: "https://example.test/draft/" },
      location: { origin: "https://example.test" },
      clients: {
        async claim() {
          claimCount += 1;
        },
      },
      addEventListener(type, handler) {
        listeners[type] = handler;
      },
      async skipWaiting() {
        skipWaitingCount += 1;
      },
    },
  });
  vm.runInContext(workerSource, context, { filename: "service-worker.js" });

  return {
    added,
    caches,
    context,
    deleted,
    listeners,
    setFetch(value) {
      fetchImpl = value;
    },
    stores,
    get claimCount() {
      return claimCount;
    },
    get skipWaitingCount() {
      return skipWaitingCount;
    },
  };
}


test("install precaches the complete v0.12.4-github-3 release", async () => {
  const harness = makeWorkerHarness();
  let installed;
  harness.listeners.install({ waitUntil(promise) { installed = promise; } });
  await installed;
  assert.equal(vm.runInContext("CACHE", harness.context), "daboyz-draft-assistant-v0.12.4-github-3");
  assert.deepEqual(harness.added, [
    "./",
    "./index.html",
    "./app.html.gz",
    "./version.json",
    "./manifest.webmanifest",
    "./icon-192.png",
    "./icon-512.png",
    "./icon-192.svg",
    "./icon-512.svg",
  ]);
  assert.equal(harness.skipWaitingCount, 1);
});


test("network-first keeps the cached artifact on a non-OK response", async () => {
  const harness = makeWorkerHarness();
  const cacheName = vm.runInContext("CACHE", harness.context);
  const url = "https://example.test/draft/app.html.gz";
  const cached = new FakeResponse(200, "cached-app");
  await (await harness.caches.open(cacheName)).put(url, cached);
  harness.setFetch(async () => new FakeResponse(503, "deploy-gap"));
  const networkFirst = vm.runInContext("networkFirst", harness.context);
  const response = await networkFirst({ url }, { url });
  assert.equal(response.body, "cached-app");
});


test("network-first keeps the cached artifact while offline", async () => {
  const harness = makeWorkerHarness();
  const cacheName = vm.runInContext("CACHE", harness.context);
  const url = "https://example.test/draft/app.html.gz";
  await (await harness.caches.open(cacheName)).put(url, new FakeResponse(200, "offline-app"));
  harness.setFetch(async () => { throw new Error("offline"); });
  const networkFirst = vm.runInContext("networkFirst", harness.context);
  const response = await networkFirst({ url }, { url });
  assert.equal(response.body, "offline-app");
});


test("network-first commits a successful replacement response", async () => {
  const harness = makeWorkerHarness();
  const cacheName = vm.runInContext("CACHE", harness.context);
  const url = "https://example.test/draft/app.html.gz";
  harness.setFetch(async () => new FakeResponse(200, "new-app"));
  const networkFirst = vm.runInContext("networkFirst", harness.context);
  const response = await networkFirst({ url }, { url });
  const stored = await (await harness.caches.open(cacheName)).match({ url });
  assert.equal(response.body, "new-app");
  assert.equal(stored.body, "new-app");
});


test("activate removes only obsolete DA BOYZ caches", async () => {
  const harness = makeWorkerHarness();
  const current = vm.runInContext("CACHE", harness.context);
  harness.stores.set(current, new Map());
  harness.stores.set("daboyz-draft-assistant-v0.12.3-github-1", new Map());
  harness.stores.set("unrelated-cache", new Map());
  let activated;
  harness.listeners.activate({ waitUntil(promise) { activated = promise; } });
  await activated;
  assert.deepEqual(harness.deleted, ["daboyz-draft-assistant-v0.12.3-github-1"]);
  assert.equal(harness.stores.has(current), true);
  assert.equal(harness.stores.has("unrelated-cache"), true);
  assert.equal(harness.claimCount, 1);
});


test("v0.12.3 cache upgrades to v0.12.4 and remains offline-usable", async () => {
  const harness = makeWorkerHarness();
  const current = vm.runInContext("CACHE", harness.context);
  const old = "daboyz-draft-assistant-v0.12.3-github-2";
  harness.stores.set(old, new Map([["https://example.test/draft/index.html", new FakeResponse(200, "old-index")]]));
  let installed;
  harness.listeners.install({ waitUntil(promise) { installed = promise; } });
  await installed;
  assert.equal(harness.stores.has(current), true);
  await (await harness.caches.open(current)).put("https://example.test/draft/index.html", new FakeResponse(200, "v0.12.4-index"));
  let activated;
  harness.listeners.activate({ waitUntil(promise) { activated = promise; } });
  await activated;
  assert.deepEqual(harness.deleted, [old]);
  assert.equal(harness.stores.has(current), true);
  harness.setFetch(async () => { throw new Error("offline"); });
  const networkFirst = vm.runInContext("networkFirst", harness.context);
  const response = await networkFirst({ url: "https://example.test/draft/index.html" }, { url: "https://example.test/draft/index.html" });
  assert.equal(response.body, "v0.12.4-index");
});


test("hosted update comparison accepts only a newer semantic build", () => {
  const start = appHtml.indexOf("function parseBuild");
  const end = appHtml.indexOf("async function checkHostedUpdate", start);
  const source = appHtml.slice(start, end);
  const context = vm.createContext({});
  vm.runInContext(source, context);
  const isNewerBuild = vm.runInContext("isNewerBuild", context);
  assert.equal(isNewerBuild("v0.12.5", "v0.12.4"), true);
  assert.equal(isNewerBuild("v0.13.0", "v0.12.4"), true);
  assert.equal(isNewerBuild("v1.0.0", "v0.12.4"), true);
  assert.equal(isNewerBuild("v0.12.4", "v0.12.4"), false);
  assert.equal(isNewerBuild("v0.12.3", "v0.12.4"), false);
  assert.equal(isNewerBuild("v0.12.2", "v0.12.4"), false);
  assert.equal(isNewerBuild("latest", "v0.12.4"), false);
});


function hostedUpdateHarness(meta, currentBuild = "v0.12.3") {
  const start = appHtml.indexOf("const CURRENT_BUILD");
  const end = appHtml.indexOf("async function applyHostedUpdate", start);
  const boxes = {
    updateNotice: { style: { display: "none" } },
    updateNoticeTitle: { textContent: "" },
    updateNoticeText: { textContent: "" },
  };
  const context = vm.createContext({
    location: { protocol: "https:" },
    navigator: { onLine: true },
    async fetch() { return { ok: true, async json() { return meta; } }; },
    document: { getElementById(id) { return boxes[id] || null; } },
  });
  const source = appHtml.slice(start, end).replace('const CURRENT_BUILD="v0.12.4"', `const CURRENT_BUILD="${currentBuild}"`);
  vm.runInContext(source, context);
  return { checkHostedUpdate: vm.runInContext("checkHostedUpdate", context), boxes };
}


test("hosted v0.12.4 metadata visibly announces an update from v0.12.3", async () => {
  const harness = hostedUpdateHarness({ build: "v0.12.4" });
  await harness.checkHostedUpdate();
  assert.equal(harness.boxes.updateNotice.style.display, "block");
  assert.equal(harness.boxes.updateNoticeTitle.textContent, "Update available • v0.12.4");
  assert.match(harness.boxes.updateNoticeText.textContent, /Running v0\.12\.3/);
});


test("older or malformed hosted metadata stays hidden", async () => {
  for (const meta of [{ build: "v0.12.3" }, { build: "latest" }, {}, { build: "0.12.4" }]) {
    const harness = hostedUpdateHarness(meta);
    harness.boxes.updateNotice.style.display = "block";
    await harness.checkHostedUpdate();
    assert.equal(harness.boxes.updateNotice.style.display, "none");
  }
});


test("update handler never deletes the working cache or updates unrelated scopes", () => {
  const start = appHtml.indexOf("async function applyHostedUpdate");
  const end = appHtml.indexOf("function renderReadiness", start);
  const source = appHtml.slice(start, end);
  assert.doesNotMatch(source, /caches\.delete/);
  assert.match(source, /navigator\.serviceWorker\.getRegistration\(\)/);
  assert.doesNotMatch(source, /getRegistrations/);
  assert.match(source, /save\("pre-update"\)/);
  assert.match(source, /worker\.state==="activated"/);
});


function updateHandlerHarness({ updateRejects = false, draftState = null } = {}) {
  const start = appHtml.indexOf("async function applyHostedUpdate");
  const end = appHtml.indexOf("function renderReadiness", start);
  const source = appHtml.slice(start, end);
  const calls = { alert: [], cacheDelete: 0, getRegistration: 0, reload: 0, save: [] , update: 0, savedDraft: null };
  const registration = {
    installing: null,
    waiting: null,
    async update() {
      calls.update += 1;
      if (updateRejects) throw new Error("update failed");
    },
  };
  const context = vm.createContext({
    alert(message) { calls.alert.push(message); },
    caches: { async delete() { calls.cacheDelete += 1; } },
    confirm() { return true; },
    document: { querySelector() { return null; } },
    location: { reload() { calls.reload += 1; } },
    navigator: {
      onLine: true,
      serviceWorker: {
        async getRegistration() {
          calls.getRegistration += 1;
          return registration;
        },
      },
    },
    renderReadiness() {},
    save(reason) {
      calls.save.push(reason);
      if (reason === "pre-update" && draftState) calls.savedDraft = JSON.parse(JSON.stringify(draftState));
      return true;
    },
  });
  vm.runInContext(source, context);
  return { applyHostedUpdate: vm.runInContext("applyHostedUpdate", context), calls };
}


test("update handler saves, updates only its registration, and reloads without deleting cache", async () => {
  const { applyHostedUpdate, calls } = updateHandlerHarness();
  await applyHostedUpdate();
  assert.deepEqual(calls.save, ["pre-update"]);
  assert.equal(calls.getRegistration, 1);
  assert.equal(calls.update, 1);
  assert.equal(calls.cacheDelete, 0);
  assert.equal(calls.reload, 1);
  assert.deepEqual(calls.alert, []);
});


test("v0.12.3 draft state is saved intact before the v0.12.4 reload", async () => {
  const draftState = {
    teams: [{ name: "No Chumps", card: 6, my: true }],
    picks: [{ overall: 1, player: { name: "Jahmyr Gibbs", position: "RB" } }],
    settings: { preset: "daboyz", ownerModel: true, profileStrength: 1, mockSeed: 10001 },
  };
  const { applyHostedUpdate, calls } = updateHandlerHarness({ draftState });
  await applyHostedUpdate();
  assert.deepEqual(calls.savedDraft, draftState);
  assert.deepEqual(calls.save, ["pre-update"]);
  assert.equal(calls.reload, 1);
});


test("failed update leaves the current app running and reports the safe fallback", async () => {
  const { applyHostedUpdate, calls } = updateHandlerHarness({ updateRejects: true });
  await applyHostedUpdate();
  assert.equal(calls.cacheDelete, 0);
  assert.equal(calls.reload, 0);
  assert.equal(calls.alert.length, 1);
  assert.match(calls.alert[0], /saved draft and current offline cache remain available/);
});
