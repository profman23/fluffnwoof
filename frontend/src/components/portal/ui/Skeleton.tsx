/**
 * Portal Skeleton Component
 * Loading placeholders with shimmer animation
 */

import React from 'react';

// ============================================
// TYPES
// ============================================

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'shimmer' | 'none';
}

// ============================================
// COMPONENT
// ============================================

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'rectangular',
  animation = 'shimmer',
}) => {
  const variantStyles: Record<string, string> = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const animationStyles: Record<string, string> = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`
        bg-gray-200 dark:bg-gray-700
        ${variantStyles[variant]}
        ${animationStyles[animation]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      style={style}
    />
  );
};

// ============================================
// PRESET SKELETONS
// ============================================

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        height={16}
        width={i === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
}) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
  };

  return (
    <Skeleton
      variant="circular"
      width={sizes[size]}
      height={sizes[size]}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm ${className}`}>
    <div className="flex items-start gap-3">
      <SkeletonAvatar size="lg" />
      <div className="flex-1">
        <Skeleton variant="text" height={20} width="60%" className="mb-2" />
        <Skeleton variant="text" height={16} width="40%" />
      </div>
    </div>
    <div className="mt-4">
      <SkeletonText lines={2} />
    </div>
  </div>
);

export const SkeletonAppointmentCard: React.FC = () => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton variant="rounded" width={48} height={48} />
      <div className="flex-1">
        <Skeleton variant="text" height={18} width="50%" className="mb-1" />
        <Skeleton variant="text" height={14} width="30%" />
      </div>
      <Skeleton variant="rounded" width={70} height={24} />
    </div>
    <div className="flex items-center gap-4 text-sm">
      <Skeleton variant="text" height={14} width={80} />
      <Skeleton variant="text" height={14} width={60} />
    </div>
  </div>
);

export const SkeletonPetCard: React.FC = () => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
    <div className="flex items-center gap-3">
      <Skeleton variant="rounded" width={56} height={56} />
      <div className="flex-1">
        <Skeleton variant="text" height={18} width="40%" className="mb-1" />
        <Skeleton variant="text" height={14} width="60%" />
      </div>
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number; card?: 'appointment' | 'pet' | 'default' }> = ({
  count = 3,
  card = 'default',
}) => {
  const CardComponent = {
    appointment: SkeletonAppointmentCard,
    pet: SkeletonPetCard,
    default: SkeletonCard,
  }[card];

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
};

export default Skeleton;
