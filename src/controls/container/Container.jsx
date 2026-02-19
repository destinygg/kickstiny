import React, { useRef } from "react";
import ControlsBar from "../bar/ControlsBar.jsx";
import { useControlsVisibility } from "./useControlsVisibility.js";
import { usePlaybackControl } from "../play/usePlaybackControl.js";
import { usePreferences } from "../usePreferences.js";

export default function Container({ core, videoContainer }) {
  const containerRef = useRef(null);
  const barRef = useRef(null);
  const { shouldShow, showControls } = useControlsVisibility(
    containerRef,
    barRef,
  );
  const { isPlaying, handlePlayPause } = usePlaybackControl(core);
  const { clickToPlayPause, setClickToPlayPause } = usePreferences();

  const handleContainerClick = (e) => {
    const isInControlsBar = barRef.current?.contains(e.target);
    if (!isInControlsBar) {
      if (clickToPlayPause) {
        handlePlayPause();
      }
      showControls();
    }
  };

  return (
    <div
      ref={containerRef}
      className="kickstiny-container"
      onClick={handleContainerClick}
    >
      <ControlsBar
        core={core}
        videoContainer={videoContainer}
        shouldShow={shouldShow}
        barRef={barRef}
        isPlaying={isPlaying}
        handlePlayPause={handlePlayPause}
        showControls={showControls}
        clickToPlayPause={clickToPlayPause}
        onClickToPlayChange={setClickToPlayPause}
      />
    </div>
  );
}
