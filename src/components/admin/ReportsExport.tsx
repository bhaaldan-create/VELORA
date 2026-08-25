"use client";

export function ReportsExport({ csv }: { csv: string }) {
  function download() {
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `velora-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2 print:hidden">
      <button
        type="button"
        onClick={download}
        className="rounded-full border border-[var(--admin-border)] px-4 py-2 text-[12px]"
      >
        تنزيل CSV
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-[var(--admin-accent)] px-4 py-2 text-[12px] text-white"
      >
        طباعة / PDF
      </button>
    </div>
  );
}
