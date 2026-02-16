import React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

export default function Switch({ checked, onCheckedChange, ...props }) {
  return (
    <SwitchPrimitive.Root
      className="switch__slider"
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...props}
    >
      <SwitchPrimitive.Thumb className="switch__thumb" />
    </SwitchPrimitive.Root>
  );
}
