import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import { useFullscreenControl } from "../fullscreen/useFullscreenControl.js";
import { useChannelInfo } from "../info/useChannelInfo.js";
import { useKeyboardControls } from "./useKeyboardControls.js";
import PlayPauseButton from "../play/PlayPauseButton.jsx";
import VolumeControls from "../volume/VolumeControls.jsx";
import SettingsButton from "../settings/SettingsButton.jsx";
import FullscreenButton from "../fullscreen/FullscreenButton.jsx";
import KickButton from "../watch/KickButton.jsx";
import ChannelInfo from "../info/ChannelInfo.jsx";
import RewindControls from "../rewind/RewindControls.jsx";
import { useRewind } from "../rewind/useRewind.js";

export default function ControlsBar({
  core,
  videoContainer,
  videoElement,
  shouldShow,
  barRef,
  isPlaying,
  handlePlayPause,
  showControls,
  clickToPlayPause,
  onClickToPlayChange,
  volume,
  isMuted,
  handleVolumeChange,
  handleVolumeScroll,
  handleMuteToggle,
}) {
  const { isFullscreen, handleFullscreenToggle } = useFullscreenControl(
    videoContainer,
    videoElement,
  );
  const { username, viewerCount, uptime, livestreamId } = useChannelInfo();
  const rewind = useRewind(core, livestreamId);

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
        onWheel={(event) => event.stopPropagation()}
        className={clsx("controls-bar", !shouldShow && "controls-bar--hidden")}
      >
        <RewindControls {...rewind} />

        <div className="controls-bar__row">
          <div className="controls-bar__left">
            <PlayPauseButton
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
            />

            <VolumeControls
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onVolumeScroll={handleVolumeScroll}
              onMuteToggle={handleMuteToggle}
            />
          </div>

          <div className="controls-bar__center">
            <ChannelInfo
              username={username}
              viewerCount={viewerCount}
              uptime={uptime}
              rewound={Boolean(rewind.timeline?.rewound || rewind.error)}
              onGoLive={rewind.goLive}
            />
          </div>

          <div className="controls-bar__right">
            <SettingsButton
              core={core}
              container={barRef.current}
              shouldShow={shouldShow}
              clickToPlayPause={clickToPlayPause}
              onClickToPlayChange={onClickToPlayChange}
              showPlaybackSpeed={Boolean(
                rewind.timeline?.rewound && !rewind.error,
              )}
              playbackRate={rewind.playbackRate}
              onPlaybackRateChange={rewind.changePlaybackRate}
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
      </div>
    </Tooltip.Provider>
  );
}
