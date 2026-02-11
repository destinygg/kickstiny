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
      setVolume(clampedVolume);
      setSavedVolume(clampedVolume);
      core.setVolume(normalizeVolume(clampedVolume));
      core.setMuted(clampedVolume === 0);
      setIsMuted(clampedVolume === 0);
    },
    [core, setSavedVolume],
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
    handleMuteToggle,
  };
}
