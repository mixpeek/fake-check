import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  progress: number;
  height?: number;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  showPercentage = false,
  className
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn("w-full", className)}>
      <div 
        className="w-full bg-gray-200 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {showPercentage && (
        <div className="mt-1 text-xs text-gray-500 text-right">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
};