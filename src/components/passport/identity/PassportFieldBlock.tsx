type Props = {
  labelEn: string;
  labelAr: string;
  value: string;
  valueSecondary?: string;
  highlight?: boolean;
  large?: boolean;
};

export function PassportFieldBlock({
  labelEn,
  labelAr,
  value,
  valueSecondary,
  highlight = false,
  large = false,
}: Props) {
  return (
    <div
      className={[
        "vp-field",
        highlight ? "vp-field--highlight" : "",
        large ? "vp-field--large" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="vp-field__label">{labelEn}</p>
      <p className="vp-field__label-ar">{labelAr}</p>
      <p className="vp-field__value">{value}</p>
      {valueSecondary ? (
        <p className="vp-field__value-secondary">{valueSecondary}</p>
      ) : null}
    </div>
  );
}
