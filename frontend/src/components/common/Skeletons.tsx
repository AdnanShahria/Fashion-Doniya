import React from 'react';

export const PageSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
    <div className="h-8 w-56 bg-[#EDE5D9] rounded-lg" />
    <div className="h-48 w-full bg-[#EDE5D9]/60 rounded-2xl" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="h-64 bg-[#EDE5D9]/70 rounded-xl" />
      ))}
    </div>
  </div>
);

export const AdminPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#FAF8F4] p-6 space-y-6 animate-pulse">
    <div className="h-10 w-64 bg-[#EDE5D9] rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="h-28 bg-white border border-[#EDE5D9] rounded-xl" />
      ))}
    </div>
    <div className="h-96 bg-white border border-[#EDE5D9] rounded-xl" />
  </div>
);
