import React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

export default function Switch({
  checked,
  onCheckedChange,
  size,
  ...props
}) {
  return (
    <SwitchPrimitive.Root
      className={`switch__slider${size === "small" ? " switch__slider--small" : ""}`}
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...props}
    >
      <SwitchPrimitive.Thumb className="switch__thumb" />
    </SwitchPrimitive.Root>
  );
}
