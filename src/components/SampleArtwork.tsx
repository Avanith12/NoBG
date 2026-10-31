import React from 'react'

/**
 * Sample artwork for preview state.
 * Contains both the original image (with background) and the cutout image (transparent background)
 * without requiring any external network requests or background removal models.
 */

export const SampleBackground: React.FC = () => (
  <g id="sample-bg">
    {/* Studio background gradient */}
    <defs>
      <radialGradient id="studio-spotlight" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#2e2e38" />
        <stop offset="60%" stopColor="#18181f" />
        <stop offset="100%" stopColor="#0c0c10" />
      </radialGradient>
      <linearGradient id="pedestal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3f3f4e" />
        <stop offset="100%" stopColor="#1e1e26" />
      </linearGradient>
      <linearGradient id="accent-stripe" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ff2d95" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#ff70ba" stopOpacity="0.2" />
      </linearGradient>
    </defs>

    {/* Backdrop */}
    <rect width="600" height="450" fill="url(#studio-spotlight)" />

    {/* Background geometric design elements */}
    <circle cx="120" cy="110" r="70" fill="#252532" opacity="0.5" />
    <circle cx="480" cy="140" r="90" fill="#22222d" opacity="0.6" />
    <rect x="80" y="300" width="440" height="4" fill="url(#accent-stripe)" rx="2" />

    {/* Floor pedestal */}
    <ellipse cx="300" cy="380" rx="190" ry="32" fill="url(#pedestal-grad)" />
    <ellipse cx="300" cy="375" rx="180" ry="24" fill="#2d2d38" />
    <ellipse cx="300" cy="372" rx="150" ry="16" fill="#1b1b22" />
  </g>
)

export const SampleSubject: React.FC = () => (
  <g id="sample-subject">
    <defs>
      <linearGradient id="camera-body" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2c2c35" />
        <stop offset="50%" stopColor="#1c1c22" />
        <stop offset="100%" stopColor="#111116" />
      </linearGradient>
      <linearGradient id="lens-outer" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff2d95" />
        <stop offset="100%" stopColor="#d11475" />
      </linearGradient>
      <radialGradient id="lens-glass" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="25%" stopColor="#0891b2" />
        <stop offset="70%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#020617" />
      </radialGradient>
      <linearGradient id="strap-pink" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ff2d95" />
        <stop offset="100%" stopColor="#e0127e" />
      </linearGradient>
      <filter id="camera-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#000000" floodOpacity="0.6" />
      </filter>
    </defs>

    {/* Cast Shadow under camera */}
    <ellipse cx="300" cy="365" rx="125" ry="18" fill="#050508" opacity="0.75" />

    {/* Main Camera Body */}
    <g filter="url(#camera-shadow)">
      {/* Top flash / viewfinder housing */}
      <path d="M 230 145 L 250 120 L 350 120 L 370 145 Z" fill="#22222a" stroke="#33333f" strokeWidth="2" />
      {/* Flash window */}
      <rect x="258" y="127" width="34" height="14" rx="3" fill="#facc15" opacity="0.9" stroke="#ca8a04" strokeWidth="1.5" />
      {/* Sensor dot */}
      <circle cx="340" cy="134" r="5" fill="#ff2d95" />

      {/* Camera Main Body */}
      <rect x="175" y="145" width="250" height="190" rx="24" fill="url(#camera-body)" stroke="#3a3a46" strokeWidth="2" />

      {/* Grip Texture (Left side) */}
      <rect x="185" y="165" width="40" height="150" rx="10" fill="#141419" stroke="#252530" strokeWidth="1" />
      <line x1="195" y1="180" x2="195" y2="300" stroke="#ff2d95" strokeWidth="2" strokeDasharray="4 6" opacity="0.8" />
      <line x1="205" y1="180" x2="205" y2="300" stroke="#333340" strokeWidth="2" strokeDasharray="4 6" />
      <line x1="215" y1="180" x2="215" y2="300" stroke="#333340" strokeWidth="2" strokeDasharray="4 6" />

      {/* Hot Pink Accent Line */}
      <path d="M 235 155 L 415 155" stroke="url(#strap-pink)" strokeWidth="4" strokeLinecap="round" />

      {/* Shutter Button */}
      <rect x="382" y="136" width="28" height="9" rx="3" fill="#e4e4e7" stroke="#71717a" strokeWidth="1" />

      {/* Mode Dial */}
      <rect x="195" y="137" width="24" height="8" rx="2" fill="#52525b" />

      {/* Central Large Lens Assembly */}
      <circle cx="310" cy="245" r="76" fill="#18181f" stroke="#383844" strokeWidth="3" />
      {/* Pink ring accent */}
      <circle cx="310" cy="245" r="68" fill="none" stroke="url(#lens-outer)" strokeWidth="5" />
      {/* Outer lens bevel */}
      <circle cx="310" cy="245" r="62" fill="#0f0f14" stroke="#2a2a35" strokeWidth="2" />
      {/* Glass */}
      <circle cx="310" cy="245" r="54" fill="url(#lens-glass)" />
      {/* Lens reflections */}
      <ellipse cx="295" cy="225" rx="20" ry="10" fill="#ffffff" opacity="0.45" transform="rotate(-30 295 225)" />
      <ellipse cx="328" cy="265" rx="10" ry="5" fill="#67e8f9" opacity="0.3" transform="rotate(-30 328 265)" />
      <circle cx="310" cy="245" r="16" fill="#050508" opacity="0.85" />
      <circle cx="308" cy="243" r="4" fill="#ffffff" opacity="0.9" />

      {/* Brand Badge */}
      <rect x="245" y="166" width="56" height="16" rx="4" fill="#ff2d95" />
      <text x="273" y="178" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1">
        NoBG
      </text>

      {/* Red tally light */}
      <circle cx="400" cy="175" r="4" fill="#ef4444" />
      <circle cx="400" cy="175" r="2" fill="#fca5a5" />
    </g>
  </g>
)

/**
 * Complete original artwork with background.
 */
export const SampleOriginalArtwork: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 600 450"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Sample photograph of a camera with original background"
  >
    <SampleBackground />
    <SampleSubject />
  </svg>
)

/**
 * Cutout subject with transparent background.
 */
export const SampleCutoutArtwork: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 600 450"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Sample cutout of camera with background removed"
  >
    <SampleSubject />
  </svg>
)
