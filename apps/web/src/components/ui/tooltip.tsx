"use client";

import * as React from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-normal max-w-xs pointer-events-none ${sideClasses[side]}`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 rotate-45 ${
              side === "top"
                ? "top-full left-1/2 -translate-x-1/2 -mt-1"
                : side === "bottom"
                ? "bottom-full left-1/2 -translate-x-1/2 -mb-1"
                : side === "left"
                ? "left-full top-1/2 -translate-y-1/2 -ml-1"
                : "right-full top-1/2 -translate-y-1/2 -mr-1"
            }`}
          />
        </div>
      )}
    </div>
  );
}

