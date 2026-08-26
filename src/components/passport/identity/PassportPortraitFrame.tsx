import { PassportStamp } from "./PassportStamp";

type Props = {
  avatarUrl: string | null;
  initials: string;
  ar?: boolean;
  onChangePhoto?: () => void;
};

export function PassportPortraitFrame({
  avatarUrl,
  initials,
  ar = false,
  onChangePhoto,
}: Props) {
  return (
    <div className="vp-portrait">
      <div className="vp-portrait__frame">
        <div className="vp-portrait__inner">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="vp-portrait__photo" />
          ) : (
            <div className="vp-portrait__fallback">{initials}</div>
          )}
        </div>
        <PassportStamp className="vp-portrait__stamp" ar={ar} />
      </div>
      {onChangePhoto ? (
        <button type="button" className="vp-portrait__edit" onClick={onChangePhoto}>
          {ar ? "تغيير الصورة" : "Change photo"}
        </button>
      ) : null}
    </div>
  );
}
