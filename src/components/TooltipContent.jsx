import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

export default function TooltipContent({ ref, children, ...props }) {
  return (
    <Tooltip.Content ref={ref} className="tooltip" {...props}>
      {children}
    </Tooltip.Content>
  );
}
