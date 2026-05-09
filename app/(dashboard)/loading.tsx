export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div style={{ height: "2.25rem", width: "14rem", borderRadius: "0.5rem", background: "var(--border)" }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ height: "5.5rem", borderRadius: "1rem", background: "var(--border)" }} />
        ))}
      </div>
      <div style={{ height: "18rem", borderRadius: "1rem", background: "var(--border)" }} />
    </div>
  );
}
