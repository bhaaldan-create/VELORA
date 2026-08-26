type Props = { ar?: boolean };

export function PassportSignature({ ar = false }: Props) {
  return (
    <div className="vp-signature">
      <svg viewBox="0 0 160 48" className="vp-signature__mark" aria-hidden>
        <path
          d="M8 32 C28 18, 48 42, 68 28 S108 18, 128 32"
          fill="none"
          stroke="var(--vp-lavender-700)"
          strokeWidth="1.2"
          opacity="0.65"
        />
        <text
          x="80"
          y="28"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="18"
          fontStyle="italic"
          fill="var(--vp-lavender-700)"
          opacity="0.75"
        >
          Velora
        </text>
      </svg>
      <p className="vp-signature__caption">
        {ar ? "صادر رسميًا عن VELORA" : "Officially issued by VELORA"}
      </p>
    </div>
  );
}
