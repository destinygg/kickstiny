import { useEffect, useState } from "react";

const MENU_MAIN = "MENU_MAIN";
const MENU_QUALITY = "MENU_QUALITY";
const MENU_SPEED = "MENU_SPEED";

export function useSettings(shouldShow) {
  const SETTINGS_CONSTANTS = {
    MENU_MAIN,
    MENU_QUALITY,
    MENU_SPEED,
  };

  const [isOpen, setIsOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState(MENU_MAIN);

  useEffect(() => {
    if (!shouldShow) {
      setIsOpen(false);
      setCurrentMenu(MENU_MAIN);
    }
  }, [shouldShow]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      setCurrentMenu(MENU_MAIN);
    }
  };

  const navigateToQuality = () => {
    setCurrentMenu(MENU_QUALITY);
  };

  const navigateToSpeed = () => {
    setCurrentMenu(MENU_SPEED);
  };

  const navigateBack = () => {
    setCurrentMenu(MENU_MAIN);
  };

  return {
    isOpen,
    currentMenu,
    handleOpenChange,
    navigateToQuality,
    navigateToSpeed,
    navigateBack,
    SETTINGS_CONSTANTS,
  };
}
