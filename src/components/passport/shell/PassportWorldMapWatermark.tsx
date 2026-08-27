/**
 * Abstract fine-line world map — security-paper watermark only.
 * Recognizable continent silhouettes, no labels / pins / travel UI.
 */
export function PassportWorldMapWatermark() {
  return (
    <div className="vp-document__worldmap" aria-hidden>
      <svg
        className="vp-document__worldmap-svg"
        viewBox="0 0 1000 500"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="vp-map-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.07" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.93" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask
            id="vp-map-feather"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1000"
            height="500"
          >
            <rect width="1000" height="500" fill="url(#vp-map-fade)" />
          </mask>
        </defs>

        <g mask="url(#vp-map-feather)">
          {/* Soft latitude / longitude lattice */}
          <g
            fill="none"
            stroke="#9A84C9"
            strokeWidth="0.35"
            opacity="0.35"
          >
            <ellipse cx="500" cy="250" rx="460" ry="210" />
            <ellipse cx="500" cy="250" rx="460" ry="140" />
            <ellipse cx="500" cy="250" rx="460" ry="70" />
            <path d="M40 250 H960" />
            <path d="M500 40 V460" />
            <path d="M280 55 V445" />
            <path d="M720 55 V445" />
            <path d="M160 80 V420" />
            <path d="M840 80 V420" />
          </g>

          {/* Continent silhouettes — fill + fine outline */}
          <g stroke="#7E68B5" strokeWidth="0.7" strokeLinejoin="round">
            {/* North America */}
            <path
              fill="rgba(126,104,181,0.07)"
              d="M95 95 L145 75 L190 85 L220 115 L235 155 L215 195 L195 230 L175 255 L155 285 L165 320 L145 345 L115 335 L100 295 L110 255 L95 220 L80 180 L85 140 Z"
            />
            {/* Central America bridge */}
            <path
              fill="rgba(126,104,181,0.06)"
              d="M165 320 L185 335 L195 355 L180 365 L160 350 Z"
            />
            {/* South America */}
            <path
              fill="rgba(126,104,181,0.07)"
              d="M185 365 L215 375 L235 410 L225 455 L200 475 L175 460 L165 420 L170 390 Z"
            />
            {/* Greenland hint */}
            <path
              fill="rgba(126,104,181,0.05)"
              d="M250 70 L275 60 L295 80 L280 105 L255 95 Z"
            />
            {/* Europe */}
            <path
              fill="rgba(126,104,181,0.07)"
              d="M455 115 L490 105 L525 115 L540 140 L520 155 L490 150 L460 140 Z"
            />
            {/* Africa */}
            <path
              fill="rgba(126,104,181,0.075)"
              d="M455 165 L510 155 L545 180 L560 230 L545 290 L515 335 L485 360 L455 345 L440 290 L445 230 L450 190 Z"
            />
            {/* Middle East / Arabia */}
            <path
              fill="rgba(126,104,181,0.06)"
              d="M545 175 L575 170 L595 195 L580 220 L550 205 Z"
            />
            {/* Asia */}
            <path
              fill="rgba(126,104,181,0.07)"
              d="M540 105 L620 90 L700 100 L760 125 L800 160 L820 200 L800 240 L755 260 L710 245 L680 210 L640 185 L595 160 L560 140 Z"
            />
            {/* India */}
            <path
              fill="rgba(126,104,181,0.065)"
              d="M680 245 L710 255 L720 295 L700 320 L675 295 L675 260 Z"
            />
            {/* SE Asia / Indonesia hints */}
            <path
              fill="rgba(126,104,181,0.05)"
              d="M760 265 L800 270 L820 295 L800 305 L765 290 Z"
            />
            {/* East Asia */}
            <path
              fill="rgba(126,104,181,0.06)"
              d="M800 145 L845 140 L875 165 L865 200 L830 205 L805 175 Z"
            />
            {/* Australia */}
            <path
              fill="rgba(126,104,181,0.07)"
              d="M820 335 L880 320 L925 345 L935 385 L900 410 L850 400 L820 370 Z"
            />
            {/* NZ hint */}
            <path
              fill="rgba(126,104,181,0.05)"
              d="M945 395 L960 400 L955 420 L940 415 Z"
            />
          </g>

          {/* Rare champagne micro-points */}
          <g fill="#C4B08A" opacity="0.55">
            <circle cx="165" cy="180" r="1.3" />
            <circle cx="500" cy="200" r="1.1" />
            <circle cx="700" cy="160" r="1.2" />
            <circle cx="870" cy="365" r="1.1" />
          </g>
        </g>
      </svg>
    </div>
  );
}
