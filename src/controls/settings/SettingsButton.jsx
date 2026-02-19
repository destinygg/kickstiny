import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Settings } from "lucide-react";
import Button from "../../components/Button.jsx";
import ControlsTooltip from "../ControlsTooltip.jsx";
import MainMenu from "./MainMenu.jsx";
import QualityMenu from "./QualityMenu.jsx";
import { useSettings } from "./useSettings.js";
import { useQualitySelector } from "./useQualitySelector.js";
import { useIvsDebug } from "./useIvsDebug.js";

export default function SettingsButton({
  core,
  container,
  shouldShow,
  clickToPlayPause,
  onClickToPlayChange,
}) {
  const {
    currentMenu,
    handleOpenChange,
    isOpen,
    navigateBack,
    navigateToQuality,
    SETTINGS_CONSTANTS: { MENU_MAIN, MENU_QUALITY },
  } = useSettings(shouldShow);

  const { selectedQuality, qualityOptions, handleQualityChange } =
    useQualitySelector(core);

  const { isIvsDebug, setIsIvsDebug } = useIvsDebug(core);

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
            {currentMenu === MENU_MAIN && (
              <MainMenu
                onNavigateQuality={navigateToQuality}
                selectedQuality={selectedQuality}
                isIvsDebug={isIvsDebug}
                onIvsDebugChange={setIsIvsDebug}
                clickToPlayPause={clickToPlayPause}
                onClickToPlayChange={onClickToPlayChange}
              />
            )}

            {currentMenu === MENU_QUALITY && (
              <QualityMenu
                selectedQuality={selectedQuality}
                options={qualityOptions}
                onChange={handleQualityChange}
                onNavigateBack={navigateBack}
              />
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </Tooltip.Root>
  );
}
