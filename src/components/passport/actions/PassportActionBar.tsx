type Props = {
  ar?: boolean;
  onEdit: () => void;
};

/** Single Edit CTA — same visual language as «أضف للحقيبة». */
export function PassportActionBar({ ar = false, onEdit }: Props) {
  return (
    <div className="vp-actions">
      <button
        type="button"
        className="vp-edit-cta"
        onClick={onEdit}
        aria-label={ar ? "تعديل" : "Edit"}
      >
        <span className="vp-edit-cta__wash" aria-hidden />
        <span className="vp-edit-cta__inner">
          <svg viewBox="0 0 24 24" className="vp-edit-cta__icon" aria-hidden>
            <path
              d="M4 20h4l10.5-10.5a1.4 1.4 0 0 0 0-2L14 3.5a1.4 1.4 0 0 0-2 0L4 12v8Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            <path
              d="M12.5 5.5 18.5 11.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
            />
          </svg>
          <span className="vp-edit-cta__label">
            {ar ? "تعديل" : "Edit"}
          </span>
        </span>
      </button>
    </div>
  );
}
