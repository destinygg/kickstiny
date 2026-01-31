import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronLeft } from "lucide-react";
import clsx from "clsx";

export default function QualityMenu({
  selectedQuality,
  options,
  onChange,
  onNavigateBack,
}) {
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
        <span>Quality</span>
      </DropdownMenu.Item>

      <DropdownMenu.Separator className="dropdown__separator" />

      <DropdownMenu.RadioGroup
        value={selectedQuality.value}
        onValueChange={onChange}
      >
        {options.map((option) => (
          <DropdownMenu.RadioItem
            key={option.value}
            value={option.value}
            className={clsx(
              "dropdown__item",
              selectedQuality.value === option.value &&
                "dropdown__item--active",
            )}
          >
            {option.label}
          </DropdownMenu.RadioItem>
        ))}
      </DropdownMenu.RadioGroup>
    </>
  );
}
