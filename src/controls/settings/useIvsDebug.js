import { useEffect } from "react";
import { usePreferences } from "../usePreferences";

export function useIvsDebug(core) {
  const { isIvsDebug, setIsIvsDebug } = usePreferences();

  useEffect(() => {
    if (!isIvsDebug) {
      return;
    }

    // Sample IVS messages:
    // { type: 12, arg: { key: "bufferedPosition", value: 2.334009 } }
    // { type: 12, arg: { key: "statistics", value: { bitrate: 3109311, ... } } }
    // { type: "PlayerQualityChanged", arg: { name: "720p60", ... } }
    const handler = (event) => {
      const data = event.data;
      const type = data.type;
      const detail = data.arg?.key || data.arg?.name;

      if (detail === "bufferedPosition") {
        return;
      }

      const label = detail ? `${type} (${detail})` : type;
      console.debug(`[Kickstiny] IVS Message: ${label}`, data);
    };

    core.worker.addEventListener("message", handler);
    return () => {
      core.worker.removeEventListener("message", handler);
    };
  }, [isIvsDebug, core]);

  return { isIvsDebug, setIsIvsDebug };
}
