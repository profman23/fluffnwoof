import React from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

type AnimationType = 'fadeInUp' | 'fadeInScale' | 'slideInRight' | 'slideInLeft';

interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  triggerOnce?: boolean;
  onVisibilityChange?: (isVisible: boolean) => void;
}

const animationClasses: Record<AnimationType, string> = {
  fadeInUp: 'animate-fade-in-up',
  fadeInScale: 'animate-fade-in-scale',
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
};

export const ScrollAnimationWrapper: React.FC<ScrollAnimationWrapperProps> = ({
  children,
  animation = 'fadeInScale',
  delay = 0,
  className = '',
  triggerOnce = false,
  onVisibilityChange,
}) => {
  const { ref, isVisible } = useScrollAnimation({ triggerOnce });

  // Notify parent about visibility changes
  React.useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(isVisible);
    }
  }, [isVisible, onVisibilityChange]);

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? animationClasses[animation] : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
