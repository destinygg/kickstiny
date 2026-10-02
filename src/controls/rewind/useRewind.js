import { useEffect, useRef, useState } from "react";
import { fetchCurrentRecording } from "../../utils/api.js";
import { extractUsernameFromUrl } from "../../utils/format.js";
import { createRewindPlayer, recordingDuration } from "./player.js";

const reloadLive = () => window.location.reload();

export function useRewind(core, livestreamId) {
  const playerRef = useRef(null);
  const [timeline, setTimeline] = useState(null);
  const [error, setError] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const username = extractUsernameFromUrl(window.location.href);
    // If Kick changes its internal player API, leave normal playback untouched.
    if (
      !username ||
      !livestreamId ||
      typeof core.emitter?.emitter?.rawListeners !== "function" ||
      typeof core.isSeeking !== "function"
    )
      return;

    const abort = new AbortController();
    let retry;
    let progress;

    const discover = async () => {
      try {
        const recording = await fetchCurrentRecording(
          username,
          livestreamId,
          abort.signal,
        );
        if (abort.signal.aborted) return;
        if (!recording) {
          retry = setTimeout(discover, 60000);
          return;
        }

        const startedAt = Date.parse(
          recording.start_time.replace(" ", "T") + "Z",
        );
        if (!Number.isFinite(startedAt)) return;
        const player = createRewindPlayer(
          core,
          recording.source,
          reloadLive,
          setError,
        );
        playerRef.current = player;
        const update = () => {
          player.checkCatchUp();
          // The recording trails the live feed; Kick also leaves a 30s margin.
          const available = Math.max(0, (Date.now() - startedAt) / 1000 - 30);
          const duration = player.rewound
            ? recordingDuration(core.getDuration())
            : null;
          const end = duration ?? available;
          const position = player.rewound
            ? Math.min(core.getPosition(), end)
            : end;
          setTimeline({ end, position, rewound: player.rewound });
        };
        update();
        progress = setInterval(update, 1000);
      } catch (error) {
        if (!abort.signal.aborted) {
          console.warn("[Kickstiny] Recording not available", error);
          retry = setTimeout(discover, 60000);
        }
      }
    };

    discover();
    return () => {
      abort.abort();
      clearTimeout(retry);
      clearInterval(progress);
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [core, livestreamId]);

  const seek = (seconds) => {
    if (!timeline) return;
    try {
      playerRef.current?.seek(seconds, timeline.end);
      setTimeline({ ...timeline, position: seconds, rewound: true });
    } catch {
      setError("Recording unavailable. Select the channel to return to live.");
    }
  };

  const goLive = () => playerRef.current?.goLive();
  const changePlaybackRate = (rate) => {
    playerRef.current?.setPlaybackRate(rate);
    setPlaybackRate(rate);
  };

  return { timeline, error, seek, goLive, playbackRate, changePlaybackRate };
}
