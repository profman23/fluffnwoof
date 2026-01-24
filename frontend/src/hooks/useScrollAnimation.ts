import { useEffect, useRef, useState, useCallback } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;      // نسبة ظهور العنصر (0-1)
  rootMargin?: string;     // مسافة إضافية
  triggerOnce?: boolean;   // مرة واحدة فقط أم كل مرة
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = false } = options;
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (triggerOnce) setHasAnimated(true);
      } else if (!triggerOnce) {
        setIsVisible(false); // Reset للسماح بالـ animation مرة أخرى
      }
    });
  }, [triggerOnce]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && hasAnimated)) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observer.observe(element);

    // فحص أولي - هل العنصر مرئي الآن؟
    const rect = element.getBoundingClientRect();
    const isCurrentlyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (isCurrentlyVisible) {
      setIsVisible(true);
      if (triggerOnce) setHasAnimated(true);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasAnimated, handleIntersection]);

  return { ref: elementRef, isVisible };
};
