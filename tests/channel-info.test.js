import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { useChannelInfo } from "../src/controls/info/useChannelInfo.js";

const channel = {
  user: { username: "lonerbox" },
  livestream: { id: 42, viewer_count: 100 },
};
const response = (data) => ({ ok: true, json: async () => data });

async function mountChannelInfo(t) {
  const dom = new JSDOM("<div id='root'></div>", {
    url: "https://player.kick.com/lonerbox",
  });
  const globals = {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = new Map();
  for (const [name, value] of Object.entries(globals)) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
  }

  const container = document.getElementById("root");
  const root = createRoot(container);
  let mounted = true;
  const unmount = async () => {
    if (!mounted) return;
    await act(async () => root.unmount());
    mounted = false;
  };
  t.after(async () => {
    await unmount();
    dom.window.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });

  function ChannelInfoProbe() {
    return React.createElement(
      "output",
      null,
      JSON.stringify(useChannelInfo()),
    );
  }
  await act(async () => root.render(React.createElement(ChannelInfoProbe)));
  return {
    state: () => JSON.parse(container.textContent),
    unmount,
  };
}

test("channel discovery recovers after an initial HTTP failure and starts one viewer poll", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  t.mock.method(console, "error", () => {});
  let infoRequests = 0;
  let viewerRequests = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/info")) {
      assert.equal(options.cache, "no-store");
      assert.ok(options.signal instanceof AbortSignal);
      infoRequests++;
      return infoRequests === 1
        ? { ok: false, status: 503 }
        : response(channel);
    }
    assert.equal(url, "https://kick.com/current-viewers?ids[]=42");
    viewerRequests++;
    return response([{ viewers: 100 + viewerRequests }]);
  });

  const view = await mountChannelInfo(t);
  assert.equal(view.state().livestreamId, null);
  await act(async () => t.mock.timers.tick(59999));
  assert.equal(infoRequests, 1);
  await act(async () => t.mock.timers.tick(1));
  assert.deepEqual(view.state(), {
    username: "lonerbox",
    viewerCount: 101,
    uptime: null,
    livestreamId: 42,
  });
  await act(async () => t.mock.timers.tick(60000));
  assert.equal(infoRequests, 2);
  assert.equal(viewerRequests, 2);
  assert.equal(view.state().viewerCount, 102);

  await view.unmount();
  await act(async () => t.mock.timers.tick(60000));
  assert.equal(viewerRequests, 2);
});

test("channel discovery retries metadata without a current broadcast", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  let infoRequests = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/info")) {
      infoRequests++;
      return response(
        infoRequests === 1 ? { ...channel, livestream: null } : channel,
      );
    }
    assert.equal(url, "https://kick.com/current-viewers?ids[]=42");
    return response([{ viewers: 101 }]);
  });

  const view = await mountChannelInfo(t);
  assert.equal(view.state().livestreamId, null);
  await act(async () => t.mock.timers.tick(60000));
  assert.equal(infoRequests, 2);
  assert.equal(view.state().livestreamId, 42);
});

test("unmount cancels a pending channel discovery retry", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  t.mock.method(console, "error", () => {});
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, signal: options?.signal });
    return { ok: false, status: 503 };
  });

  const view = await mountChannelInfo(t);
  assert.equal(requests.length, 1);
  await view.unmount();
  assert.equal(requests[0].signal.aborted, true);
  await act(async () => t.mock.timers.tick(180000));
  assert.equal(requests.length, 1);
});

test("a late channel response after unmount cannot start viewer polling", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  let finishRequest;
  const requests = [];
  t.mock.method(globalThis, "fetch", (url, options) => {
    requests.push({ url, signal: options?.signal });
    if (url.endsWith("/info")) {
      // Deliberately ignore abort, as a response may already be parsing.
      return Promise.resolve({
        ok: true,
        json: () => new Promise((resolve) => (finishRequest = resolve)),
      });
    }
    return Promise.resolve(response([{ viewers: 101 }]));
  });

  const view = await mountChannelInfo(t);
  assert.equal(requests.length, 1);
  await view.unmount();
  assert.equal(requests[0].signal.aborted, true);
  await act(async () => finishRequest(channel));
  await act(async () => t.mock.timers.tick(180000));
  assert.equal(requests.length, 1);
});
