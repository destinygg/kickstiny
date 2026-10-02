import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Settings } from "lucide-react";
import Button from "../../components/Button.jsx";
import ControlsTooltip from "../ControlsTooltip.jsx";
import MainMenu from "./MainMenu.jsx";
import QualityMenu from "./QualityMenu.jsx";
import SpeedMenu from "./SpeedMenu.jsx";
import { useSettings } from "./useSettings.js";
import { useQualitySelector } from "./useQualitySelector.js";
import { useIvsDebug } from "./useIvsDebug.js";

export default function SettingsButton({
  core,
  container,
  shouldShow,
  clickToPlayPause,
  onClickToPlayChange,
  showPlaybackSpeed,
  playbackRate,
  onPlaybackRateChange,
}) {
  const {
    currentMenu,
    handleOpenChange,
    isOpen,
    navigateBack,
    navigateToQuality,
    navigateToSpeed,
    SETTINGS_CONSTANTS: { MENU_MAIN, MENU_QUALITY, MENU_SPEED },
  } = useSettings(shouldShow);

  const { selectedQuality, qualityOptions, handleQualityChange } =
    useQualitySelector(core);

  const { isIvsDebug, setIsIvsDebug } = useIvsDebug(core);

  // Speed only applies while rewound; fall back if that ends mid-menu.
  const menu =
    currentMenu === MENU_SPEED && !showPlaybackSpeed ? MENU_MAIN : currentMenu;

  return (
    <Tooltip.Root>
      <DropdownMenu.Root
        modal={false}
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        <Tooltip.Trigger asChild>
          <DropdownMenu.Trigger asChild>
            <Button variant="tertiary" iconOnly aria-label="Settings">
              <Settings size={20} strokeWidth={2.5} />
            </Button>
          </DropdownMenu.Trigger>
        </Tooltip.Trigger>
        {shouldShow && !isOpen && (
          <Tooltip.Portal>
            <ControlsTooltip>Settings</ControlsTooltip>
          </Tooltip.Portal>
        )}
        <DropdownMenu.Portal container={container}>
          <DropdownMenu.Content
            className="settings-dropdown dropdown"
            side="top"
            align="end"
            sideOffset={8}
            collisionPadding={8}
            onClick={(e) => e.stopPropagation()}
          >
            {menu === MENU_MAIN && (
              <MainMenu
                onNavigateQuality={navigateToQuality}
                selectedQuality={selectedQuality}
                showPlaybackSpeed={showPlaybackSpeed}
                playbackRate={playbackRate}
                onNavigateSpeed={navigateToSpeed}
                isIvsDebug={isIvsDebug}
                onIvsDebugChange={setIsIvsDebug}
                clickToPlayPause={clickToPlayPause}
                onClickToPlayChange={onClickToPlayChange}
              />
            )}

            {menu === MENU_QUALITY && (
              <QualityMenu
                selectedQuality={selectedQuality}
                options={qualityOptions}
                onChange={handleQualityChange}
                onNavigateBack={navigateBack}
              />
            )}

            {menu === MENU_SPEED && (
              <SpeedMenu
                playbackRate={playbackRate}
                onChange={onPlaybackRateChange}
                onNavigateBack={navigateBack}
              />
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </Tooltip.Root>
  );
}
