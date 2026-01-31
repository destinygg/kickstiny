import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import { useVolumeControl } from "../volume/useVolumeControl.js";
import { useFullscreenControl } from "../fullscreen/useFullscreenControl.js";
import { useChannelInfo } from "../info/useChannelInfo.js";
import { useKeyboardControls } from "./useKeyboardControls.js";
import PlayPauseButton from "../play/PlayPauseButton.jsx";
import VolumeControls from "../volume/VolumeControls.jsx";
import SettingsButton from "../settings/SettingsButton.jsx";
import FullscreenButton from "../fullscreen/FullscreenButton.jsx";
import KickButton from "../watch/KickButton.jsx";
import ChannelInfo from "../info/ChannelInfo.jsx";

export default function ControlsBar({
  core,
  videoContainer,
  shouldShow,
  barRef,
  isPlaying,
  handlePlayPause,
  showControls,
}) {
  const { volume, isMuted, handleVolumeChange, handleMuteToggle } =
    useVolumeControl(core);
  const { isFullscreen, handleFullscreenToggle } =
    useFullscreenControl(videoContainer);
  const { username, viewerCount, uptime } = useChannelInfo();

  useKeyboardControls({
    onPlayPause: handlePlayPause,
    onMuteToggle: handleMuteToggle,
    onFullscreenToggle: handleFullscreenToggle,
    container: videoContainer,
    showControls,
  });

  return (
    <Tooltip.Provider
      delayDuration={0}
      skipDelayDuration={0}
      disableHoverableContent={true}
    >
      <div
        ref={barRef}
        className={clsx("controls-bar", !shouldShow && "controls-bar--hidden")}
      >
        <div className="controls-bar__left">
          <PlayPauseButton
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
          />

          <VolumeControls
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
          />
        </div>

        <div className="controls-bar__center">
          <ChannelInfo
            username={username}
            viewerCount={viewerCount}
            uptime={uptime}
          />
        </div>

        <div className="controls-bar__right">
          <SettingsButton
            core={core}
            container={barRef.current}
            shouldShow={shouldShow}
          />

          <FullscreenButton
            isFullscreen={isFullscreen}
            onFullscreenToggle={handleFullscreenToggle}
          />

          <KickButton
            username={username}
            isPlaying={isPlaying}
            handlePlayPause={handlePlayPause}
          />
        </div>
      </div>
    </Tooltip.Provider>
  );
}
