import React from 'react';

export function TestSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-subtle rounded-md w-3/4"></div>
        <div className="h-4 bg-subtle rounded w-full"></div>
        <div className="h-4 bg-subtle rounded w-5/6"></div>
      </div>

      {/* Test area skeleton */}
      <div className="border border-card-border rounded-lg p-8 bg-card">
        <div className="flex flex-col items-center gap-6">
          <div className="w-32 h-32 bg-subtle rounded-full"></div>
          <div className="h-12 bg-subtle rounded-md w-48"></div>
          <div className="h-4 bg-subtle rounded w-64"></div>
        </div>
      </div>

      {/* Controls skeleton */}
      <div className="flex gap-3">
        <div className="h-10 bg-subtle rounded-md flex-1"></div>
        <div className="h-10 bg-subtle rounded-md flex-1"></div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse border border-card-border rounded-lg p-4 bg-card">
      <div className="space-y-3">
        <div className="h-6 bg-subtle rounded w-3/4"></div>
        <div className="h-4 bg-subtle rounded w-full"></div>
        <div className="h-4 bg-subtle rounded w-5/6"></div>
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-subtle rounded flex-1"></div>
          <div className="h-8 bg-subtle rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3 border border-card-border rounded-lg bg-card">
          <div className="w-10 h-10 bg-subtle rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-subtle rounded w-3/4"></div>
            <div className="h-3 bg-subtle rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-subtle rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-card-border rounded-lg p-4 bg-card">
            <div className="space-y-2">
              <div className="h-3 bg-subtle rounded w-1/2"></div>
              <div className="h-8 bg-subtle rounded w-3/4"></div>
              <div className="h-2 bg-subtle rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="border border-card-border rounded-lg p-6 bg-card">
        <div className="space-y-4">
          <div className="h-6 bg-subtle rounded w-1/3"></div>
          <div className="h-64 bg-subtle rounded"></div>
        </div>
      </div>

      {/* List skeleton */}
      <div className="border border-card-border rounded-lg p-6 bg-card">
        <div className="space-y-4">
          <div className="h-6 bg-subtle rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-subtle rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
