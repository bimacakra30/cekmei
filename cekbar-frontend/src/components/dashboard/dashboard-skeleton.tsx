export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="rounded-2xl gradient-brand p-6 sm:p-8">
        <div className="space-y-2">
          <div className="h-6 bg-white/20 rounded-md w-56 animate-skeleton" />
          <div className="h-4 bg-white/10 rounded-md w-80 animate-skeleton" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div>
        <div className="h-4 bg-muted rounded-md w-32 animate-skeleton mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-muted rounded-md w-24 animate-skeleton" />
                  <div className="h-7 bg-muted rounded-md w-12 animate-skeleton" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted animate-skeleton shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center">
          <div className="h-5 bg-muted rounded-md w-36 animate-skeleton" />
          <div className="h-4 bg-muted rounded-md w-20 animate-skeleton" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-border last:border-0">
            <div className="flex gap-8">
              <div className="h-4 bg-muted rounded-md w-36 animate-skeleton" />
              <div className="h-4 bg-muted rounded-md w-28 animate-skeleton" />
              <div className="h-4 bg-muted rounded-md w-32 animate-skeleton hidden md:block" />
              <div className="h-4 bg-muted rounded-full w-16 animate-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
