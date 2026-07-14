import React from "react"

export function TestSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-3/4 rounded-md bg-subtle"></div>
        <div className="h-4 w-full rounded bg-subtle"></div>
        <div className="h-4 w-5/6 rounded bg-subtle"></div>
      </div>

      {/* Test area skeleton */}
      <div className="rounded-lg border border-card-border bg-card p-8">
        <div className="flex flex-col items-center gap-6">
          <div className="h-32 w-32 rounded-full bg-subtle"></div>
          <div className="h-12 w-48 rounded-md bg-subtle"></div>
          <div className="h-4 w-64 rounded bg-subtle"></div>
        </div>
      </div>

      {/* Controls skeleton */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 rounded-md bg-subtle"></div>
        <div className="h-10 flex-1 rounded-md bg-subtle"></div>
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-card-border bg-card p-4">
      <div className="space-y-3">
        <div className="h-6 w-3/4 rounded bg-subtle"></div>
        <div className="h-4 w-full rounded bg-subtle"></div>
        <div className="h-4 w-5/6 rounded bg-subtle"></div>
        <div className="mt-4 flex gap-2">
          <div className="h-8 flex-1 rounded bg-subtle"></div>
          <div className="h-8 w-20 rounded bg-subtle"></div>
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-card-border bg-card p-3"
        >
          <div className="h-10 w-10 rounded-full bg-subtle"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-subtle"></div>
            <div className="h-3 w-1/2 rounded bg-subtle"></div>
          </div>
          <div className="h-6 w-16 rounded bg-subtle"></div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-card-border bg-card p-4"
          >
            <div className="space-y-2">
              <div className="h-3 w-1/2 rounded bg-subtle"></div>
              <div className="h-8 w-3/4 rounded bg-subtle"></div>
              <div className="h-2 w-full rounded bg-subtle"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-lg border border-card-border bg-card p-6">
        <div className="space-y-4">
          <div className="h-6 w-1/3 rounded bg-subtle"></div>
          <div className="h-64 rounded bg-subtle"></div>
        </div>
      </div>

      {/* List skeleton */}
      <div className="rounded-lg border border-card-border bg-card p-6">
        <div className="space-y-4">
          <div className="h-6 w-1/4 rounded bg-subtle"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded bg-subtle"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
