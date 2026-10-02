import React from "react";
import { Users, Clock } from "lucide-react";
import NumberFlow from "@number-flow/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import ControlsTooltip from "../ControlsTooltip.jsx";

export default function ChannelInfo({
  username,
  viewerCount,
  uptime,
  rewound,
  onGoLive,
}) {
  return (
    <span className="channel-info">
      {username && (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              className={clsx(
                "channel-info__username",
                rewound && "channel-info__username--rewound",
              )}
              aria-label={`${username}: ${rewound ? "Go to live" : "Live"}`}
              aria-disabled={!rewound}
              onClick={() => rewound && onGoLive()}
              onKeyDown={(event) => {
                if (rewound && (event.key === " " || event.key === "Enter"))
                  event.stopPropagation();
              }}
            >
              <span className="channel-info__live-dot" />
              <span className="channel-info__username-text">{username}</span>
              <span className="channel-info__mobile-live" aria-hidden="true">
                LIVE
              </span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <ControlsTooltip>{rewound ? "Go to live" : "Live"}</ControlsTooltip>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
      {viewerCount != null && (
        <span className="channel-info__meta">
          <Users size={12} strokeWidth={3} />
          <NumberFlow value={viewerCount} />
        </span>
      )}
      {uptime != null && (
        <span className="channel-info__meta">
          <Clock size={12} strokeWidth={3} />
          {uptime}
        </span>
      )}
    </span>
  );
}
