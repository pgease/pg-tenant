import React from 'react';

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="h-3 w-24 rounded-full bg-gray-100 animate-pulse" />
          <div className="mt-3 h-3 w-3/4 rounded-full bg-gray-100 animate-pulse" />
          <div className="mt-2 h-3 w-1/2 rounded-full bg-gray-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
};
