/**
 * Server-rendered launch markup — paints before React hydrates.
 * Shown only when html[data-launch="1"] (set by boot script / NativeAppShell).
 */
export function VeloraBootLaunch() {
  return (
    <div
      id="velora-boot-launch"
      className="velora-launch"
      role="presentation"
      aria-hidden="true"
    >
      <div className="velora-launch__atmosphere" />
      <div className="velora-launch__glow velora-launch__glow--a" />
      <div className="velora-launch__glow velora-launch__glow--b" />
      <div className="velora-launch__glow velora-launch__glow--c" />

      <div className="velora-launch__petals" aria-hidden="true">
        <span className="velora-launch__petal velora-launch__petal--1" />
        <span className="velora-launch__petal velora-launch__petal--2" />
        <span className="velora-launch__petal velora-launch__petal--3" />
        <span className="velora-launch__petal velora-launch__petal--4" />
        <span className="velora-launch__petal velora-launch__petal--5" />
      </div>

      <div className="velora-launch__particles" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className={`velora-launch__dot velora-launch__dot--${i + 1}`}
          />
        ))}
      </div>

      <div className="velora-launch__stage">
        <div className="velora-launch__logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/velora-logo-dark.png"
            alt=""
            className="velora-launch__logo"
            width={240}
            height={92}
            decoding="async"
            fetchPriority="high"
          />
          <span className="velora-launch__sheen" />
        </div>

        <p className="velora-launch__word velora-launch__word--velora">VELORA</p>
        <p className="velora-launch__word velora-launch__word--beauty">BEAUTY</p>
        <p className="velora-launch__word velora-launch__word--tag">
          Beauty Revealed
        </p>
      </div>
    </div>
  );
}
