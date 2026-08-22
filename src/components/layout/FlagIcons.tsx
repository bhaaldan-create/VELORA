/** Real SVG flags — Windows often breaks emoji flags into "IQ" / "US" text */
export function FlagIraq({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="24" height="5.34" fill="#CE1126" />
      <rect y="5.34" width="24" height="5.32" fill="#FFFFFF" />
      <rect y="10.66" width="24" height="5.34" fill="#000000" />
      <g fill="#007A3D">
        <rect x="5.1" y="7.55" width="0.85" height="2.1" rx="0.15" />
        <rect x="6.3" y="7.55" width="0.85" height="2.1" rx="0.15" />
        <rect x="7.5" y="7.55" width="0.85" height="2.1" rx="0.15" />
        <rect x="9.1" y="7.55" width="0.85" height="2.1" rx="0.15" />
        <rect x="10.3" y="7.55" width="0.85" height="2.1" rx="0.15" />
        <rect x="11.5" y="7.55" width="0.85" height="2.1" rx="0.15" />
        <rect x="13.1" y="7.55" width="0.85" height="2.1" rx="0.15" />
        <rect x="14.3" y="7.55" width="0.85" height="2.1" rx="0.15" />
        <rect x="15.5" y="7.55" width="0.85" height="2.1" rx="0.15" />
        <rect x="16.7" y="7.55" width="0.85" height="2.1" rx="0.15" />
      </g>
    </svg>
  );
}

export function FlagUSA({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="24" height="16" fill="#FFFFFF" />
      {[0, 2.46, 4.92, 7.38, 9.85, 12.31, 14.77].map((y) => (
        <rect key={y} y={y} width="24" height="1.23" fill="#B22234" />
      ))}
      <rect width="9.6" height="8.6" fill="#3C3B6E" />
      {[1.35, 3.15, 4.95, 6.75, 8.55].flatMap((x, xi) =>
        [1.35, 3.0, 4.65, 6.3, 7.95].map((y, yi) =>
          (xi + yi) % 2 === 0 ? (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.38" fill="#FFFFFF" />
          ) : null,
        ),
      )}
    </svg>
  );
}
