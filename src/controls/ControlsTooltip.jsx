import React from "react";
import TooltipContent from "../components/TooltipContent.jsx";
import TooltipArrow from "../components/TooltipArrow.jsx";

export default function ControlsTooltip({ ref, children }) {
  return (
    <TooltipContent ref={ref} side="top" sideOffset={-4}>
      {children}
      <TooltipArrow />
    </TooltipContent>
  );
}
