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
  volumeScrollStep,
  setVolumeScrollStep,
}) {
  return (
    <>
      <DropdownMenu.Item
        className="dropdown__item dropdown__item--nav"
        onSelect={(e) => {
          e.preventDefault();
          onNavigateQuality();
        }}
        onPointerMove={(e) => e.preventDefault()}
        onPointerLeave={(e) => e.preventDefault()}
      >
        <span>Quality</span>
        <span className="dropdown__item-value">
          {selectedQuality.label}
          <ChevronRight size={16} />
        </span>
      </DropdownMenu.Item>

      <DropdownMenu.Item
        className="dropdown__item dropdown__item--nav"
        onSelect={(e) => {
          e.preventDefault();
        }}
        onPointerMove={(e) => e.preventDefault()}
        onPointerLeave={(e) => e.preventDefault()}
      >
        <span>Pause on Click</span>
        <Switch
          checked={clickToPlayPause}
          onCheckedChange={onClickToPlayChange}
        />
      </DropdownMenu.Item>

      <DropdownMenu.Item
        className="dropdown__item dropdown__item--nav"
        onSelect={(e) => {
          e.preventDefault();
        }}
        onPointerMove={(e) => e.preventDefault()}
        onPointerLeave={(e) => e.preventDefault()}
      >
        <span>Volume Scroll Step</span>
        <div className="input" style={{ width: 55 }}>
          <div className="input__area">
            <div className="input__container">
              <input
                placeholder="0"
                value={volumeScrollStep || ""}
                onChange={(e) => {
                  const valid = /^(100|[1-9]\d?|0)?$/.test(e.target.value); // 0-100 or empty
                  if (valid) setVolumeScrollStep(e.target.value);
                }}
              />
            </div>
          </div>
        </div>
      </DropdownMenu.Item>

      {process.env.NODE_ENV === "dev" && (
        <DropdownMenu.Item
          className="dropdown__item dropdown__item--nav"
          onSelect={(e) => {
            e.preventDefault();
          }}
          onPointerMove={(e) => e.preventDefault()}
          onPointerLeave={(e) => e.preventDefault()}
        >
          <span>IVS Debug</span>
          <Switch checked={isIvsDebug} onCheckedChange={onIvsDebugChange} />
        </DropdownMenu.Item>
      )}
    </>
  );
}
