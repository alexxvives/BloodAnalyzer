import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

/** Soft shimmer block — matches clinical-warm surface tokens. */
export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`ba-skeleton rounded-lg ${className}`}
      style={style}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** Overview row: biomarker summary + score + action plan. */
export function ReportOverviewSkeleton() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-3"
      role="status"
      aria-label="Loading overview"
    >
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-8 w-40" />
          <SkeletonText lines={3} className="mt-4" />
          <div className="mt-5 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <Skeleton className="mt-auto pt-6 h-4 w-36" />
        </div>
      ))}
    </div>
  );
}

/** Full report page placeholder while D1/report fetch runs. */
export function ReportPageSkeleton() {
  return (
    <div className="space-y-8 ba-reveal" role="status" aria-label="Loading report">
      <ReportOverviewSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-16 w-10 rounded-md" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HistoryListSkeleton() {
  return (
    <ul
      className="flex flex-col gap-4 pt-2"
      role="status"
      aria-label="Loading history"
    >
      {Array.from({ length: 3 }, (_, i) => (
        <li
          key={i}
          className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div className="space-y-10 ba-reveal" role="status" aria-label="Loading home">
      <ReportOverviewSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-4 h-28 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActionPlanCardSkeleton() {
  return (
    <div className="mt-4 space-y-3" role="status" aria-label="Generating action plan">
      <SkeletonText lines={3} />
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-40" />
    </div>
  );
}
