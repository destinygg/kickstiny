// IVS uses this large finite duration for media whose length is not known yet.
export function recordingDuration(duration) {
  return Number.isFinite(duration) && duration > 0 && duration < 2 ** 30
    ? duration
    : null;
}

export function createRewindPlayer(core, source, reloadLive, onError) {
  const emitter = core.emitter.emitter;
  let originalEnded;
  let rewound = false;
  let returningLive = false;

  const goLive = () => {
    if (returningLive) return;
    returningLive = true;
    core.setPlaybackRate(1);
    reloadLive();
  };
  const handleError = () => {
    onError("Recording unavailable. Select the channel to return to live.");
  };

  return {
    get rewound() {
      return rewound;
    },
    goLive,
    setPlaybackRate(rate) {
      if (rewound && !returningLive) core.setPlaybackRate(rate);
    },
    checkCatchUp() {
      if (
        !rewound ||
        core.isSeeking() ||
        core.isPaused() ||
        core.getState() !== "Playing"
      )
        return;
      const duration = recordingDuration(core.getDuration());
      if (duration !== null && core.getPosition() >= duration - 2) goLive();
    },
    seek(seconds, end) {
      const wasPaused = core.isPaused();
      const duration = rewound ? recordingDuration(core.getDuration()) : null;
      const target = Math.max(0, Math.min(seconds, duration ?? end));
      if (!Number.isFinite(target)) return;

      onError(null);
      if (!rewound) {
        // Kick treats Ended as the channel going offline. Take over only when
        // switching to the recording, whose end should return to live instead.
        originalEnded = emitter.rawListeners("Ended");
        originalEnded.forEach((listener) =>
          core.removeEventListener("Ended", listener),
        );
        core.addEventListener("Ended", goLive);
        core.addEventListener("PlayerError", handleError);
        rewound = true;
        core.load(source);
      }
      core.seekTo(target);
      if (!wasPaused) core.play();
    },
    dispose() {
      if (!rewound) return;
      core.removeEventListener("Ended", goLive);
      core.removeEventListener("PlayerError", handleError);
      originalEnded.forEach((listener) =>
        core.addEventListener("Ended", listener),
      );
    },
  };
}
