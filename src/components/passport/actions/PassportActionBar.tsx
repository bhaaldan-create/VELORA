type Props = {
  ar?: boolean;
  onShare?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  onEdit?: () => void;
  saveDisabled?: boolean;
};

export function PassportActionBar({
  ar = false,
  onShare,
  onSave,
  onPrint,
  onEdit,
  saveDisabled = false,
}: Props) {
  return (
    <footer className="vp-actions">
      {onEdit ? (
        <button type="button" className="vp-actions__btn" onClick={onEdit}>
          <span className="vp-actions__icon">✎</span>
          <span>{ar ? "تعديل" : "Edit"}</span>
        </button>
      ) : null}
      {onShare ? (
        <button type="button" className="vp-actions__btn" onClick={onShare}>
          <span className="vp-actions__icon">↗</span>
          <span>{ar ? "مشاركة" : "Share"}</span>
        </button>
      ) : null}
      {onSave ? (
        <button
          type="button"
          className="vp-actions__btn"
          disabled={saveDisabled}
          onClick={onSave}
        >
          <span className="vp-actions__icon">↓</span>
          <span>{ar ? "حفظ" : "Save"}</span>
        </button>
      ) : null}
      {onPrint ? (
        <button type="button" className="vp-actions__btn" onClick={onPrint}>
          <span className="vp-actions__icon">⎙</span>
          <span>{ar ? "طباعة" : "Print"}</span>
        </button>
      ) : null}
    </footer>
  );
}
