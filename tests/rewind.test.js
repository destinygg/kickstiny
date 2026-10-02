import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import {
  createRewindPlayer,
  recordingDuration,
} from "../src/controls/rewind/player.js";
import { fetchCurrentRecording } from "../src/utils/api.js";

function fakeCore() {
  const emitter = new EventEmitter();
  const calls = [];
  return {
    emitter: { emitter },
    calls,
    duration: Infinity,
    position: 0,
    state: "Playing",
    paused: false,
    seeking: false,
    playbackRate: 1,
    addEventListener: (event, listener) => emitter.on(event, listener),
    removeEventListener: (event, listener) => emitter.off(event, listener),
    getDuration() {
      return this.duration;
    },
    getPosition() {
      return this.position;
    },
    getState() {
      return this.state;
    },
    isPaused() {
      return this.paused;
    },
    isSeeking() {
      return this.seeking;
    },
    setPlaybackRate(rate) {
      this.playbackRate = rate;
      calls.push(["rate", rate]);
    },
    load: (source) => calls.push(["load", source]),
    seekTo(seconds) {
      this.seeking = true;
      calls.push(["seek", seconds]);
    },
    play: () => calls.push(["play"]),
  };
}

test("live playback leaves native listeners and their updates untouched", () => {
  const core = fakeCore();
  const emitter = core.emitter.emitter;
  const received = [];
  emitter.on("Ended", function (...args) {
    received.push([this, args]);
  });
  emitter.on("Ended", assert.fail);
  const ended = emitter.rawListeners("Ended");
  const player = createRewindPlayer(
    core,
    "recording",
    assert.fail,
    assert.fail,
  );
  assert.deepEqual(emitter.rawListeners("Ended"), ended);
  assert.equal(emitter.listenerCount("PlayerError"), 0);
  assert.equal(emitter.listenerCount("PlayerSeekCompleted"), 0);
  emitter.off("Ended", assert.fail);
  let once = 0;
  emitter.once("Ended", () => once++);
  emitter.emit("Ended", "reason", 123);
  emitter.emit("Ended", "again");
  assert.deepEqual(received, [
    [emitter, ["reason", 123]],
    [emitter, ["again"]],
  ]);
  assert.equal(once, 1);
  assert.equal(player.rewound, false);
  const remaining = emitter.rawListeners("Ended");
  player.dispose();
  assert.deepEqual(emitter.rawListeners("Ended"), remaining);
});

test("first seek takes over the current Ended handlers before loading once", () => {
  const core = fakeCore();
  const emitter = core.emitter.emitter;
  const errors = [];
  emitter.on("Ended", assert.fail);
  const player = createRewindPlayer(core, "recording", assert.fail, (error) =>
    errors.push(error),
  );
  emitter.off("Ended", assert.fail);
  let offline = 0;
  const nativeEnded = () => offline++;
  emitter.on("Ended", nativeEnded);
  core.load = (source) => {
    assert.equal(emitter.rawListeners("Ended").includes(nativeEnded), false);
    assert.equal(emitter.listenerCount("Ended"), 1);
    core.calls.push(["load", source]);
  };
  player.seek(60, 300);
  player.seek(90, 300);
  assert.equal(player.rewound, true);
  assert.deepEqual(core.calls, [
    ["load", "recording"],
    ["seek", 60],
    ["play"],
    ["seek", 90],
    ["play"],
  ]);
  assert.deepEqual(errors, [null, null]);
  player.dispose();
  assert.deepEqual(emitter.rawListeners("Ended"), [nativeEnded]);
  emitter.emit("Ended");
  assert.equal(offline, 1);
});

test("seeks clamp to recording duration, falling back for unknown IVS durations", () => {
  for (const [duration, expected] of [
    [120, 120],
    [Infinity, 150],
    [2 ** 30, 150],
    [NaN, 150],
    [0, 150],
  ]) {
    const core = fakeCore();
    const player = createRewindPlayer(core, "recording", assert.fail, () => {});
    player.seek(0, 150);
    core.duration = duration;
    player.seek(180, 150);
    assert.deepEqual(core.calls.at(-2), ["seek", expected]);
    player.seek(-30, 150);
    assert.deepEqual(core.calls.at(-2), ["seek", 0]);
    player.dispose();
  }
  assert.equal(recordingDuration(120), 120);
  assert.equal(recordingDuration(-1), null);
});

test("invalid seek targets do not load or start replay", () => {
  const core = fakeCore();
  const player = createRewindPlayer(
    core,
    "recording",
    assert.fail,
    assert.fail,
  );
  player.seek(NaN, 150);
  player.seek(Infinity, Infinity);
  assert.deepEqual(core.calls, []);
  assert.equal(player.rewound, false);
  player.dispose();
});

test("seeking preserves a paused player", () => {
  const core = fakeCore();
  core.paused = true;
  const player = createRewindPlayer(core, "recording", assert.fail, () => {});
  player.seek(60, 300);
  player.seek(90, 300);
  assert.deepEqual(core.calls, [
    ["load", "recording"],
    ["seek", 60],
    ["seek", 90],
  ]);
  player.dispose();
});

test("recording end returns to live without triggering Kick's offline handler", () => {
  const core = fakeCore();
  let offline = 0;
  let live = 0;
  core.emitter.emitter.on("Ended", () => offline++);
  const player = createRewindPlayer(
    core,
    "recording",
    () => live++,
    () => {},
  );
  player.seek(60, 300);
  player.setPlaybackRate(2);
  core.emitter.emitter.emit("Ended");
  core.emitter.emitter.emit("Ended");
  assert.equal(live, 1);
  assert.equal(offline, 0);
  assert.equal(core.playbackRate, 1);
  assert.deepEqual(core.calls.slice(-2), [
    ["rate", 2],
    ["rate", 1],
  ]);
  player.dispose();
});

test("speed is replay-only, preserves pause, and resets before returning live", () => {
  const core = fakeCore();
  const player = createRewindPlayer(
    core,
    "recording",
    () => {
      assert.equal(core.playbackRate, 1);
      core.calls.push(["reload"]);
    },
    () => {},
  );
  player.setPlaybackRate(2);
  assert.deepEqual(core.calls, []);

  core.paused = true;
  player.seek(60, 300);
  core.calls.length = 0;
  player.setPlaybackRate(1.5);
  assert.deepEqual(core.calls, [["rate", 1.5]]);
  assert.equal(core.paused, true);

  player.goLive();
  player.setPlaybackRate(2);
  player.goLive();
  assert.deepEqual(core.calls, [["rate", 1.5], ["rate", 1], ["reload"]]);
  player.dispose();
});

test("catching up at increased speed resets to normal and returns live once", () => {
  const core = fakeCore();
  core.duration = 300;
  let live = 0;
  const player = createRewindPlayer(
    core,
    "recording",
    () => {
      assert.equal(core.playbackRate, 1);
      live++;
    },
    () => {},
  );
  player.seek(60, 300);
  core.seeking = false;
  player.setPlaybackRate(2);
  core.position = 297;
  player.checkCatchUp();
  assert.equal(live, 0);
  core.position = 298;
  player.checkCatchUp();
  player.checkCatchUp();
  assert.equal(live, 1);
  assert.deepEqual(core.calls.slice(-2), [
    ["rate", 2],
    ["rate", 1],
  ]);
  player.dispose();
});

test("catch-up waits for seeks and active playback with a known duration", () => {
  const core = fakeCore();
  core.duration = 300;
  core.position = 300;
  const player = createRewindPlayer(core, "recording", assert.fail, () => {});
  player.checkCatchUp(); // Still viewing the live source.
  player.seek(60, 300);
  player.checkCatchUp(); // Live position can linger while the recording loads.
  core.position = 60;
  core.seeking = false;
  player.checkCatchUp();

  core.position = 300;
  player.seek(30, 300);
  player.checkCatchUp(); // A backward seek must not jump back to live.
  core.seeking = false;
  core.seekTo(20); // IVS can also receive seeks outside this controller.
  player.checkCatchUp();
  core.seeking = false;
  core.paused = true;
  player.checkCatchUp();
  core.paused = false;
  core.state = "Buffering";
  player.checkCatchUp();
  core.state = "Playing";
  for (const duration of [Infinity, 2 ** 30, NaN, 0]) {
    core.duration = duration;
    player.checkCatchUp();
  }
  player.dispose();
});

test("recording errors are reported only during replay", () => {
  const core = fakeCore();
  const errors = [];
  let nativeErrors = 0;
  core.emitter.emitter.on("PlayerError", () => nativeErrors++);
  const player = createRewindPlayer(core, "recording", assert.fail, (error) =>
    errors.push(error),
  );
  core.emitter.emitter.emit("PlayerError");
  assert.deepEqual(errors, []);
  player.seek(60, 300);
  core.emitter.emitter.emit("PlayerError");
  assert.deepEqual(errors, [
    null,
    "Recording unavailable. Select the channel to return to live.",
  ]);
  assert.equal(nativeErrors, 2);
  player.dispose();
});

test("dispose after replay restores listener identities, order, and once semantics", () => {
  const core = fakeCore();
  const emitter = core.emitter.emitter;
  let once = 0;
  emitter.on("Ended", () => {});
  emitter.once("Ended", () => once++);
  emitter.on("Ended", () => {});
  emitter.on("PlayerError", () => {});
  emitter.on("PlayerSeekCompleted", () => {});
  const ended = emitter.rawListeners("Ended");
  const errors = emitter.rawListeners("PlayerError");
  const seeks = emitter.rawListeners("PlayerSeekCompleted");
  const player = createRewindPlayer(core, "recording", assert.fail, () => {});
  player.seek(60, 300);
  assert.deepEqual(emitter.rawListeners("PlayerSeekCompleted"), seeks);
  player.dispose();
  assert.deepEqual(emitter.rawListeners("Ended"), ended);
  assert.deepEqual(emitter.rawListeners("PlayerError"), errors);
  assert.deepEqual(emitter.rawListeners("PlayerSeekCompleted"), seeks);
  emitter.emit("Ended");
  emitter.emit("Ended");
  assert.equal(once, 1);
});

test("recording discovery selects only the exact live broadcast with a source", async (t) => {
  const current = { id: 42, is_live: true, source: "current.m3u8" };
  const ignored = [
    { id: 41, is_live: true, source: "earlier.m3u8" },
    { id: 42, is_live: false, source: "finished.m3u8" },
    { id: 42, is_live: true, source: null },
  ];
  let videos = [...ignored, current];
  const signal = new AbortController().signal;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://kick.com/api/v2/channels/lonerbox/videos");
    assert.equal(options.signal, signal);
    assert.equal(options.cache, "no-store");
    return { ok: true, json: async () => videos };
  });
  assert.equal(await fetchCurrentRecording("lonerbox", 42, signal), current);
  videos = ignored;
  assert.equal(await fetchCurrentRecording("lonerbox", 42, signal), null);
});

test("recording discovery reports failed HTTP requests", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 403 }));
  await assert.rejects(
    fetchCurrentRecording("lonerbox", 42),
    /Recording request failed: 403/,
  );
});
