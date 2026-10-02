import { useState, useCallback, useEffect } from "react";

export function usePlaybackControl(core) {
  const [isPlaying, setIsPlaying] = useState(
    () => core.getState() === "Playing",
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      core.pause();
    } else {
      setIsPlaying(true);
      core.play();
    }
  }, [core, isPlaying]);

  useEffect(() => {
    const handler = (event) => {
      const key = event.data?.arg?.key;
      if (key !== "state") {
        return;
      }

      const { value } = event.data?.arg;
      if (value === "Playing" && !isPlaying) {
        setIsPlaying(true);
      } else if (value === "Idle" && isPlaying) {
        setIsPlaying(false);
      }
    };

    core.worker.addEventListener("message", handler);
    return () => {
      core.worker.removeEventListener("message", handler);
    };
  }, [core, isPlaying]);

  return {
    isPlaying,
    handlePlayPause,
  };
}
