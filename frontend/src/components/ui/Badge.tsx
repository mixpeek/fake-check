import React from 'react';
import { cn } from '../../lib/utils';
import { DetectionTag } from '../../types';

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800',
  secondary: 'bg-secondary-100 text-secondary-800',
  success: 'bg-success-100 text-success-800',
  warning: 'bg-warning-100 text-warning-800',
  error: 'bg-error-100 text-error-800',
};

const badgeSizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const DetectionTagBadge: React.FC<{ tag: DetectionTag }> = ({ tag }) => {
  const getTagVariant = (): BadgeProps['variant'] => {
    switch (tag) {
      case 'Lipsync Issue Detected':
        return 'error';
      case 'Anomaly Detected':
        return 'warning';
      case 'Visual Artifacts Detected':
        return 'secondary';
      case 'Unusual Blink Pattern Detected':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getTagVariant()} className="mr-2 mb-2">
      {tag}
    </Badge>
  );
};