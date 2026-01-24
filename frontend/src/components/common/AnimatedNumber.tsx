import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  trigger?: boolean;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  delay = 0,
  className = '',
  suffix = '',
  prefix = '',
  trigger = true,
}) => {
  const count = useCountUp({ end: value, duration, delay, trigger });

  return (
    <span className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};
