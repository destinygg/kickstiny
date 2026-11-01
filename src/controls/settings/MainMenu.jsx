import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";
import Switch from "../../components/Switch.jsx";

export default function MainMenu({
  onNavigateQuality,
  selectedQuality,
  isIvsDebug,
  onIvsDebugChange,
  clickToPlayPause,
  onClickToPlayChange,
}) {
  return (
    <>
      <DropdownMenu.Item
        className="dropdown__item dropdown__item--nav"
        onSelect={(e) => {
          e.preventDefault();
          onNavigateQuality();
        }}
      >
        <span>Quality</span>
        <span className="dropdown__item-value">
          {selectedQuality.label}
          <ChevronRight size={16} />
        </span>
      </DropdownMenu.Item>

      <SwitchItem
        label="Pause on Click"
        checked={clickToPlayPause}
        onCheckedChange={onClickToPlayChange}
      />

      {process.env.NODE_ENV === "dev" && (
        <SwitchItem
          label="IVS Debug"
          checked={isIvsDebug}
          onCheckedChange={onIvsDebugChange}
        />
      )}
    </>
  );
}

// The whole row toggles the setting. The switch only shows the state, so it
// stays out of the tab order and ignores pointer events, which keeps a click
// on it from toggling twice.
function SwitchItem({ label, checked, onCheckedChange }) {
  return (
    <DropdownMenu.CheckboxItem
      className="dropdown__item dropdown__item--nav dropdown__item--switch"
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(e) => e.preventDefault()}
    >
      <span>{label}</span>
      <Switch size="small" checked={checked} tabIndex={-1} aria-hidden />
    </DropdownMenu.CheckboxItem>
  );
}
