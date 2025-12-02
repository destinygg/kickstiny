import React, { useRef } from "react";
import ControlsBar from "../bar/ControlsBar.jsx";
import { useControlsVisibility } from "./useControlsVisibility.js";

export default function Container({ core, videoContainer }) {
  const containerRef = useRef(null);
  const barRef = useRef(null);
  const { shouldShow } = useControlsVisibility(containerRef, barRef);

  return (
    <div ref={containerRef} className="kickstiny-container">
      <ControlsBar
        core={core}
        videoContainer={videoContainer}
        shouldShow={shouldShow}
        barRef={barRef}
      />
    </div>
  );
}
