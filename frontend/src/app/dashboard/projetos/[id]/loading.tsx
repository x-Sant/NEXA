export default function ProjetoLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="skeleton h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-6 w-64 rounded" />
            <div className="skeleton h-4 w-48 rounded" />
          </div>
          <div className="skeleton h-8 w-24 rounded-xl" />
        </div>
        <div className="skeleton h-2 w-full rounded-full" />
      </div>
      <div className="flex gap-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="skeleton h-9 w-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-14 w-full rounded-xl" />
          ))}
        </div>
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
