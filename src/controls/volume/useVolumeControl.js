import { useState, useCallback, useEffect, useRef } from "react";
import { usePreferences } from "../usePreferences.js";

function clampVolume(volume) {
  return Math.max(0, Math.min(100, volume));
}

function normalizeVolume(volume) {
  return clampVolume(volume) / 100;
}

function getUrlMuted() {
  try {
    return new URLSearchParams(window.location.search).get("muted") === "true";
  } catch {
    return false;
  }
}

export function useVolumeControl(core) {
  const { savedVolume, setSavedVolume } = usePreferences();
  const urlMuted = getUrlMuted();
  const [volume, setVolume] = useState(savedVolume);
  const [isMuted, setIsMuted] = useState(urlMuted);
  const hasAppliedInitialVolume = useRef(false);

  const handleVolumeChange = useCallback(
    (newVolume) => {
      const clampedVolume = clampVolume(newVolume);
      if (clampedVolume === volume) return;
      setVolume(clampedVolume);
      setSavedVolume(clampedVolume);
      core.setVolume(normalizeVolume(clampedVolume));
      core.setMuted(clampedVolume === 0);
      setIsMuted(clampedVolume === 0);
    },
    [core, volume, setSavedVolume],
  );

  const handleVolumeScroll = useCallback(
    (event) => {
      event.preventDefault();

      if (event.deltaY === 0) return;

      // Step 1 unit if trackpad, 5 units if mouse wheel
      const isLikelyTrackpad =
        !Number.isInteger(event.deltaY) ||
        (event.deltaMode === 0 && Math.abs(event.deltaY) < 10);
      const stepSize = isLikelyTrackpad ? 1 : 5;
      const direction = Math.sign(-event.deltaY);

      handleVolumeChange(volume + direction * stepSize);
    },
    [volume, handleVolumeChange],
  );

  const handleMuteToggle = useCallback(() => {
    setVolume(isMuted ? savedVolume : 0);
    setIsMuted(!isMuted);
    core.setMuted(!isMuted);
  }, [core, isMuted, savedVolume]);

  useEffect(() => {
    const handler = (event) => {
      // Re-apply initial volume after the player is ready, after Kick sets it
      // to their default of 0.6. Respect muted=true in URL (embed hosts that pass ?muted=true).
      if (
        !hasAppliedInitialVolume.current &&
        event.data?.arg?.key === "state" &&
        event.data?.arg?.value === "Ready"
      ) {
        console.debug("[Kickstiny] Re-applying saved volume");
        hasAppliedInitialVolume.current = true;
        if (urlMuted) {
          core.setVolume(normalizeVolume(savedVolume));
          core.setMuted(true);
          setVolume(savedVolume);
          setIsMuted(true);
        } else {
          handleVolumeChange(savedVolume);
        }
      }

      if (event.data?.arg?.key === "muted") {
        const newMuted = event.data.arg.value;
        if (newMuted !== isMuted) {
          setIsMuted(newMuted);
          setVolume(newMuted ? 0 : savedVolume);
        }
      }
    };

    core.worker.addEventListener("message", handler);
    return () => {
      core.worker.removeEventListener("message", handler);
    };
  }, [core, savedVolume, isMuted, handleVolumeChange, urlMuted]);

  return {
    volume,
    isMuted,
    handleVolumeChange,
    handleVolumeScroll,
    handleMuteToggle,
  };
}
