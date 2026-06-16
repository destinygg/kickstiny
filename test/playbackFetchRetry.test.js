import assert from "node:assert/strict";
import test from "node:test";
import { installPlaybackFetchRetry } from "../src/utils/playbackFetchRetry.js";

function immediateTimeout(callback) {
  callback();
  return 1;
}

test("retries a transient playback URL fetch failure", async () => {
  const responses = [
    () => Promise.reject(new TypeError("Failed to fetch")),
    () => Promise.resolve(new Response('{"data":"playback-url"}')),
  ];
  const windowRef = {
    fetch() {
      return responses.shift()();
    },
  };

  installPlaybackFetchRetry({
    windowRef,
    locationRef: { href: "https://player.kick.com/channel" },
    delays: [100],
    setTimeoutRef: immediateTimeout,
  });

  const response = await windowRef.fetch(
    "https://kick.com/api/v2/channels/channel/playback-url",
    { credentials: "include" },
  );

  assert.equal(await response.text(), '{"data":"playback-url"}');
  assert.equal(responses.length, 0);
});

test("retries a transient server status", async () => {
  const responses = [
    new Response("unavailable", { status: 503 }),
    new Response('{"data":"playback-url"}', { status: 200 }),
  ];
  const windowRef = {
    fetch() {
      return Promise.resolve(responses.shift());
    },
  };

  installPlaybackFetchRetry({
    windowRef,
    locationRef: { href: "https://player.kick.com/channel" },
    delays: [100],
    setTimeoutRef: immediateTimeout,
  });

  const response = await windowRef.fetch(
    "https://kick.com/api/v2/channels/channel/playback-url",
  );

  assert.equal(response.status, 200);
  assert.equal(responses.length, 0);
});

test("does not retry unrelated requests", async () => {
  let calls = 0;
  const windowRef = {
    fetch() {
      calls++;
      return Promise.reject(new TypeError("Failed to fetch"));
    },
  };

  installPlaybackFetchRetry({
    windowRef,
    locationRef: { href: "https://player.kick.com/channel" },
    delays: [100, 400],
    setTimeoutRef: immediateTimeout,
  });

  await assert.rejects(
    windowRef.fetch("https://kick.com/current-viewers"),
    TypeError,
  );
  assert.equal(calls, 1);
});

test("restores the original fetch implementation on disconnect", () => {
  const originalFetch = () => Promise.resolve(new Response());
  const windowRef = { fetch: originalFetch };

  const retry = installPlaybackFetchRetry({
    windowRef,
    locationRef: { href: "https://player.kick.com/channel" },
  });
  assert.notEqual(windowRef.fetch, originalFetch);

  retry.disconnect();
  assert.equal(windowRef.fetch, originalFetch);
});
