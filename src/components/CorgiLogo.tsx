import React from "react";

interface CorgiLogoProps {
  className?: string;
  size?: number;
}

export function CorgiLogo({ className = "w-6 h-6", size = 28 }: CorgiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Gymlo Dumbbell"
    >
      <g transform="translate(32, 32) rotate(-45) translate(-32, -32)">
        {/* Handle */}
        <rect x="26" y="30" width="12" height="4" rx="2" />
        {/* Left Plates */}
        <rect x="23.5" y="27" width="2" height="10" rx="1" opacity="0.8" />
        <rect x="17.5" y="22" width="5.5" height="20" rx="2.5" />
        <rect x="13.5" y="25" width="3.5" height="14" rx="1.5" />
        {/* Right Plates */}
        <rect x="38.5" y="27" width="2" height="10" rx="1" opacity="0.8" />
        <rect x="41" y="22" width="5.5" height="20" rx="2.5" />
        <rect x="47" y="25" width="3.5" height="14" rx="1.5" />
      </g>
    </svg>
  );
}
