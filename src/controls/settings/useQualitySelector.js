import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "../usePreferences.js";

export function useQualitySelector(core) {
  const { savedQuality, setSavedQuality } = usePreferences();
  const [selectedQuality, setSelectedQuality] = useState({
    label: "Auto",
    value: "auto",
  });
  const [qualities, setQualities] = useState([]);

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

      if (value === "auto") {
        core.setAutoQualityMode(true);
        setSavedQuality("auto");
        return;
      }

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
      const arg = event.data.arg;
      if (arg?.key !== "qualities") {
        return;
      }

      if (!arg.value.length) {
        return;
      }

      setQualities(arg.value);
    };

    core.worker.addEventListener("message", handler);
    return () => {
      core.worker.removeEventListener("message", handler);
    };
  }, [core]);

  useEffect(() => {
    if (!savedQuality || !qualities.length) {
      return;
    }

    if (savedQuality === "auto") {
      handleQualityChange("auto");
      return;
    }

    if (qualities.some((quality) => quality.name === savedQuality)) {
      handleQualityChange(savedQuality);
    }
  }, [qualities, savedQuality, handleQualityChange]);

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
