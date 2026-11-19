import React from 'react';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 34 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="2" y="2" width="17" height="17" rx="4.5" fill="#059669" />
      <rect x="21" y="2" width="17" height="17" rx="4.5" fill="#EA580C" />
      <rect x="2" y="21" width="17" height="17" rx="4.5" fill="#7C3AED" />
      <rect x="21" y="21" width="17" height="17" rx="4.5" fill="#2563EB" />
      <circle cx="10.5" cy="10.5" r="3" fill="#FFFFFF" fillOpacity="0.92" />
      <rect x="26.5" y="7.5" width="6" height="6" rx="1.5" fill="#FFFFFF" fillOpacity="0.92" />
      <path d="M10.5 25.5L14.5 32.5H6.5L10.5 25.5Z" fill="#FFFFFF" fillOpacity="0.92" />
      <path
        d="M29.5 25L33.5 29.5L29.5 34L25.5 29.5L29.5 25Z"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />
    </svg>
  );
};
