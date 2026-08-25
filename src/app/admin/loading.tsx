export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="جاري التحميل">
      <div className="admin-skeleton h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="admin-skeleton h-24" />
        <div className="admin-skeleton h-24" />
        <div className="admin-skeleton h-24" />
        <div className="admin-skeleton h-24" />
      </div>
      <div className="admin-skeleton h-48 w-full" />
      <div className="admin-skeleton h-32 w-full" />
    </div>
  );
}
