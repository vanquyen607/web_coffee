import React from 'react';
import { motion } from 'motion/react';

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] lg:rounded-[3.5rem] p-4 lg:p-5 border border-bento-accent/30 flex flex-col h-full animate-pulse">
      <div className="aspect-[4/5] rounded-[1.5rem] lg:rounded-[2.5rem] bg-bento-bg" />
      <div className="p-4 flex-1 space-y-6">
        <div className="space-y-3">
          <div className="h-6 bg-bento-bg rounded-full w-2/3" />
          <div className="h-4 bg-bento-bg rounded-full w-1/3" />
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-bento-bg rounded-full w-full" />
          <div className="h-2 bg-bento-bg rounded-full w-4/5" />
        </div>
      </div>
    </div>
  );
}
