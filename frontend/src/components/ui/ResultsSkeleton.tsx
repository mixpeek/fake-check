import React from 'react';
import { motion } from 'framer-motion';

export const ResultsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 opacity-60">
      {/* Left Column - Video Player Skeleton */}
      <div className="space-y-6">
        {/* Confidence Banner Skeleton */}
        <div className="rounded-lg bg-gray-200 h-12 animate-pulse" />
        
        {/* Video Player Skeleton */}
        <div className="relative aspect-video bg-gray-300 rounded-lg overflow-hidden animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-gray-500 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Video Details Skeleton */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-24 mb-3 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-36 animate-pulse" />
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-20 mb-1 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column - Analysis Results Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="h-5 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
          
          {/* Failed Checks Skeleton */}
          <div className="space-y-3 mb-6">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            {[1, 2, 3].map((item) => (
              <motion.div
                key={item}
                className="rounded-lg border bg-gray-50 border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: item * 0.1 }}
              >
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 bg-gray-200 rounded w-12 animate-pulse" />
                    <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Passed Checks Skeleton */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
            {[1, 2, 3].map((item) => (
              <motion.div
                key={item}
                className="rounded-lg border bg-gray-50 border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: (item + 3) * 0.1 }}
              >
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 bg-gray-200 rounded w-12 animate-pulse" />
                    <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
      </div>
    </div>
  );
}; 