import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";

export default function MainMenu({ onNavigateQuality }) {
  return (
    <DropdownMenu.Item
      className="dropdown__item dropdown__item--nav"
      onSelect={(e) => {
        e.preventDefault();
        onNavigateQuality();
      }}
    >
      <span>Quality</span>
      <ChevronRight size={16} />
    </DropdownMenu.Item>
  );
}
