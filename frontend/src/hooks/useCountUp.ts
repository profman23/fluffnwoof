import { useState, useEffect } from 'react';

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;  // in milliseconds
  delay?: number;     // delay before starting
  trigger?: boolean;  // trigger the animation (for scroll-based triggers)
}

export const useCountUp = ({
  start = 0,
  end,
  duration = 1000,
  delay = 0,
  trigger = true
}: UseCountUpOptions) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    // Reset count when trigger becomes false
    if (!trigger) {
      setCount(start);
      return;
    }

    if (end === start) {
      setCount(end);
      return;
    }

    const timeout = setTimeout(() => {
      const startTime = Date.now();

      const updateCount = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);

        // easeOutQuart for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentCount = Math.floor(start + (end - start) * easeProgress);

        setCount(currentCount);

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(updateCount);
    }, delay);

    return () => clearTimeout(timeout);
  }, [end, start, duration, delay, trigger]);

  return count;
};
