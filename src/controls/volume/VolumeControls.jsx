import React from "react";
import * as Slider from "@radix-ui/react-slider";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import Button from "../../components/Button.jsx";
import ControlsTooltip from "../ControlsTooltip.jsx";

export default function VolumeControls({
  volume,
  isMuted,
  onVolumeChange,
  onVolumeScroll,
  onMuteToggle,
}) {
  const label = isMuted ? "Unmute" : "Mute";
  const Icon = isMuted ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className="volume-controls">
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            variant="tertiary"
            iconOnly
            onClick={onMuteToggle}
            aria-label={label}
          >
            <Icon size={20} strokeWidth={2.5} />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <ControlsTooltip>{label} (M)</ControlsTooltip>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Slider.Root
        className="slider"
        value={[volume]}
        onValueChange={([value]) => onVolumeChange(value)}
        onWheel={onVolumeScroll}
        min={0}
        max={100}
        step={1}
        aria-label="Volume"
      >
        <Slider.Track className="slider__track">
          <Slider.Range className="slider__range" />
        </Slider.Track>
        <Slider.Thumb className="slider__thumb" />
      </Slider.Root>
    </div>
  );
}
