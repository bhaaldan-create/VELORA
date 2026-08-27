"use client";

type Props = {
  ar?: boolean;
  onClear: () => void;
};

export function SearchEmptyState({ ar = false, onClear }: Props) {
  return (
    <div className="vs-empty">
      <h3>{ar ? "لا توجد منتجات" : "No products found"}</h3>
      <p>
        {ar
          ? "جرّبي إزالة بعض الفلاتر أو تعديل كلمة البحث."
          : "Try removing some filters or refining your search."}
      </p>
      <button type="button" className="vs-btn vs-btn--primary" onClick={onClear}>
        {ar ? "مسح الفلاتر" : "Clear filters"}
      </button>
    </div>
  );
}

export function ResultCount({
  ar = false,
  total,
}: {
  ar?: boolean;
  total: number;
}) {
  return (
    <p className="vs-count">
      {ar ? `${total.toLocaleString("ar-IQ")} منتجًا` : `${total.toLocaleString("en-US")} Products`}
    </p>
  );
}
