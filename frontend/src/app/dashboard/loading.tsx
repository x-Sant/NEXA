export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 border border-white/5">
            <div className="skeleton h-4 w-24 rounded mb-3" />
            <div className="skeleton h-8 w-32 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-xl" />
          ))}
        </div>
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
