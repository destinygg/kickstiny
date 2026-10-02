import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronLeft } from "lucide-react";
import clsx from "clsx";
import { formatPlaybackRate } from "../../utils/format.js";

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function SpeedMenu({ playbackRate, onChange, onNavigateBack }) {
  return (
    <>
      <DropdownMenu.Item
        className="dropdown__header"
        onSelect={(e) => {
          e.preventDefault();
          onNavigateBack();
        }}
      >
        <ChevronLeft size={16} />
        <span>Playback Speed</span>
      </DropdownMenu.Item>

      <DropdownMenu.Separator className="dropdown__separator" />

      <DropdownMenu.RadioGroup
        value={String(playbackRate)}
        onValueChange={(value) => onChange(Number(value))}
      >
        {PLAYBACK_RATES.map((rate) => (
          <DropdownMenu.RadioItem
            key={rate}
            value={String(rate)}
            className={clsx(
              "dropdown__item",
              playbackRate === rate && "dropdown__item--active",
            )}
          >
            {formatPlaybackRate(rate)}
          </DropdownMenu.RadioItem>
        ))}
      </DropdownMenu.RadioGroup>
    </>
  );
}
