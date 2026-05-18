import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "../usePreferences.js";

const AUTO_QUALITY = { label: "Auto", value: "auto" };
const MAX_QUALITY = { label: "Maximum", value: "max" };

export function useQualitySelector(core) {
  const { savedQuality, setSavedQuality } = usePreferences();
  const [selectedQuality, setSelectedQuality] = useState(AUTO_QUALITY);
  const [qualities, setQualities] = useState([]);

  const handleQualityChange = useCallback(
    (value) => {
      if (!value) {
        return;
      }

      if (value === "auto") {
        setSelectedQuality(AUTO_QUALITY);
        core.setAutoQualityMode(true);
        setSavedQuality("auto");
        return;
      }

      if (value === "max") {
        // "max" is a fake option, resolves to the highest bitrate
        const maxQuality = qualities[0];
        if (maxQuality) {
          setSelectedQuality({
            value: "max",
            label: maxQuality.name,
          });
          core.setAutoQualityMode(false);
          core.setQuality(maxQuality);
        } else {
          // fallback to auto, keep saved selection as max
          console.warn("[KickQuality] max quality could not be resolved");
          setSelectedQuality(AUTO_QUALITY);
          core.setAutoQualityMode(true);
        }
        setSavedQuality("max");
        return;
      }

      setSelectedQuality({ label: value, value: value });

      const targetQuality = qualities.find((quality) => quality.name === value);
      if (!targetQuality) {
        console.warn("[KickQuality] quality option missing", value);
        return;
      }

      core.setAutoQualityMode(false);
      core.setQuality(targetQuality);

      setSavedQuality(value);
    },
    [core, qualities, setSavedQuality],
  );

  useEffect(() => {
    const handler = (event) => {
      const { type, arg } = event.data;

      if (arg?.key === "qualities") {
        if (arg.value?.length) {
          // defensive to ensure "max" functionality, `arg.value` should already be sorted
          const sorted = [...arg.value].sort((a, b) => b.bitrate - a.bitrate);
          setQualities(sorted);
        }
        return;
      }

      if (!savedQuality) {
        return;
      }

      if (type === 12 && arg?.key === "autoQualityMode") {
        const shouldBeAuto = savedQuality === "auto";
        if (arg.value !== shouldBeAuto) {
          console.debug(
            `[Kickstiny] Enforcing auto quality mode ${shouldBeAuto} (player changed to ${arg.value})`,
          );
          handleQualityChange(savedQuality);
        }
      }
    };

    core.worker.addEventListener("message", handler);
    return () => {
      core.worker.removeEventListener("message", handler);
    };
  }, [core, savedQuality, handleQualityChange]);

  useEffect(() => {
    if (!savedQuality || !qualities.length) {
      return;
    }

    if (["auto", "max"].includes(savedQuality)) {
      handleQualityChange(savedQuality);
      return;
    }

    if (qualities.some((quality) => quality.name === savedQuality)) {
      handleQualityChange(savedQuality);
    }
  }, [qualities, savedQuality, handleQualityChange]);

  const qualityOptions = [
    AUTO_QUALITY,
    MAX_QUALITY,
    ...qualities.map((q) => ({ value: q.name, label: q.name })),
  ];

  return {
    selectedQuality,
    qualityOptions,
    handleQualityChange,
  };
}
