import { useState, useEffect, useCallback, useRef } from "react";
import { usePreferences } from "../usePreferences.js";

// Time to wait after applying quality to allow player to process the change and emit events.
const QUALITY_APPLY_DEBOUNCE_MS = 500;

export function useQualitySelector(core) {
  const { savedQuality, setSavedQuality } = usePreferences();
  const [selectedQuality, setSelectedQuality] = useState(() => {
    if (savedQuality && savedQuality !== "auto") {
      return { label: savedQuality, value: savedQuality };
    }
    return { label: "Auto", value: "auto" };
  });
  const [qualities, setQualities] = useState([]);
  const qualitiesRef = useRef([]);
  const savedQualityRef = useRef(savedQuality);
  const isApplyingQuality = useRef(false);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    qualitiesRef.current = qualities;
  }, [qualities]);

  useEffect(() => {
    savedQualityRef.current = savedQuality;
  }, [savedQuality]);

  const scheduleDebounceReset = useCallback(() => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      isApplyingQuality.current = false;
    }, QUALITY_APPLY_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceTimerRef.current);
  }, []);

  const applyQualityToPlayer = useCallback(
    (value, availableQualities) => {
      if (!value || !availableQualities.length) {
        return;
      }

      if (value === "auto") {
        core.setAutoQualityMode(true);
        return;
      }

      const targetQuality = availableQualities.find((q) => q.name === value);
      if (!targetQuality) {
        return;
      }

      core.setAutoQualityMode(false);
      core.setQuality(targetQuality);
    },
    [core],
  );

  const handleQualityChange = useCallback(
    (value) => {
      if (!value) {
        return;
      }

      const option =
        value === "auto"
          ? { label: "Auto", value: "auto" }
          : { label: value, value: value };

      setSelectedQuality(option);
      setSavedQuality(value);

      isApplyingQuality.current = true;
      applyQualityToPlayer(value, qualities);
      scheduleDebounceReset();
    },
    [qualities, setSavedQuality, applyQualityToPlayer, scheduleDebounceReset],
  );

  useEffect(() => {
    const handler = (event) => {
      const arg = event.data?.arg;
      if (!arg?.key) {
        return;
      }

      if (arg.key === "qualities" && arg.value?.length) {
        qualitiesRef.current = arg.value;
        setQualities(arg.value);
      }

      // IVS resets to auto quality mode when transitioning from Idle to Playing which happens on both stream reload and pause/unpause. This is IVS behavior where it internally reconnects to the stream. We re-apply the user's saved quality preference when this reset is detected.
      if (arg.key === "state" && arg.value === "Playing") {
        if (isApplyingQuality.current) {
          return;
        }

        const currentSavedQuality = savedQualityRef.current;
        const currentQualities = qualitiesRef.current;

        if (!currentSavedQuality || currentSavedQuality === "auto") {
          return;
        }

        if (!currentQualities.some((q) => q.name === currentSavedQuality)) {
          return;
        }

        const isAutoMode = core.isAutoQualityMode?.();
        const currentQuality = core.getQuality?.()?.name;

        if (!isAutoMode && currentQuality === currentSavedQuality) {
          return;
        }

        isApplyingQuality.current = true;
        applyQualityToPlayer(currentSavedQuality, currentQualities);
        scheduleDebounceReset();
      }
    };

    core.worker.addEventListener("message", handler);
    return () => {
      core.worker.removeEventListener("message", handler);
    };
  }, [core, applyQualityToPlayer, scheduleDebounceReset]);

  const qualityOptions = [
    { value: "auto", label: "Auto" },
    ...qualities.map((q) => ({ value: q.name, label: q.name })),
  ];

  return {
    selectedQuality,
    qualityOptions,
    handleQualityChange,
  };
}
