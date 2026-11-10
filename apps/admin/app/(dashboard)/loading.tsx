export default function DashboardLoading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading">
      <div className="h-44 animate-pulse bg-neutral-100" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-20 animate-pulse bg-neutral-100" />
        ))}
      </div>
      <div className="h-72 animate-pulse bg-neutral-100" />
    </div>
  );
}
