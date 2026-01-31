import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";

export default function MainMenu({ onNavigateQuality, selectedQuality }) {
  return (
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
  );
}
