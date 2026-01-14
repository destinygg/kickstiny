import { useEffect, useState } from "react";
import { useQualitySelector } from "./useQualitySelector";

export function useSettings(core, shouldShow, MENU_MAIN, MENU_QUALITY) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState(MENU_MAIN);

  useEffect(() => {
    if (!shouldShow) {
      setIsOpen(false);
      setCurrentMenu(MENU_MAIN);
    }
  }, [shouldShow]);

  const { selectedQuality, qualityOptions, handleQualityChange } =
    useQualitySelector(core);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      setCurrentMenu(MENU_MAIN);
    }
  };

  const navigateToQuality = () => {
    setCurrentMenu(MENU_QUALITY);
  };

  const navigateBack = () => {
    setCurrentMenu(MENU_MAIN);
  };

  return {
    isOpen,
    currentMenu,
    selectedQuality,
    qualityOptions,
    handleOpenChange,
    handleQualityChange,
    navigateToQuality,
    navigateBack,
  };
}
