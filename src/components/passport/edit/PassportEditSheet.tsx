"use client";

import { IRAQ_GOVERNORATES } from "@/lib/passport/governorates";

type Props = {
  ar?: boolean;
  open: boolean;
  dob: string;
  governorate: string;
  saving?: boolean;
  onClose: () => void;
  onDobChange: (v: string) => void;
  onGovernorateChange: (v: string) => void;
  onSave: () => void;
};

export function PassportEditSheet({
  ar = false,
  open,
  dob,
  governorate,
  saving = false,
  onClose,
  onDobChange,
  onGovernorateChange,
  onSave,
}: Props) {
  if (!open) return null;

  return (
    <div className="vp-sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="vp-sheet"
        role="dialog"
        aria-labelledby="vp-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="vp-edit-title" className="vp-sheet__title">
          {ar ? "تعديل الهوية" : "Edit Identity"}
        </h2>
        <label className="vp-sheet__field">
          <span>{ar ? "تاريخ الميلاد" : "Date of Birth"}</span>
          <input
            type="date"
            value={dob}
            onChange={(e) => onDobChange(e.target.value)}
          />
        </label>
        <label className="vp-sheet__field">
          <span>{ar ? "المحافظة" : "Governorate"}</span>
          <select
            value={governorate}
            onChange={(e) => onGovernorateChange(e.target.value)}
          >
            <option value="">{ar ? "اختاري" : "Select"}</option>
            {IRAQ_GOVERNORATES.map((g) => (
              <option key={g.id} value={g.id}>
                {ar ? g.ar : g.en}
              </option>
            ))}
          </select>
        </label>
        <div className="vp-sheet__actions">
          <button type="button" className="vp-sheet__cancel" onClick={onClose}>
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            className="vp-sheet__save"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
