'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  delay?: number;
  className?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  delay = 0,
  className,
  decimals = 0,
}: AnimatedCounterProps) {
  const [count, setCount] = React.useState(0);
  const [hasStarted, setHasStarted] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasStarted]);

  React.useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now() + delay;
    const endTime = startTime + duration;

    const updateCount = () => {
      const now = Date.now();

      if (now < startTime) {
        requestAnimationFrame(updateCount);
        return;
      }

      if (now >= endTime) {
        setCount(value);
        return;
      }

      const progress = (now - startTime) / duration;
      // Easing function: easeOutExpo
      const easeProgress = 1 - Math.pow(2, -10 * progress);
      const currentValue = easeProgress * value;

      setCount(currentValue);
      requestAnimationFrame(updateCount);
    };

    requestAnimationFrame(updateCount);
  }, [hasStarted, value, duration, delay]);

  const displayValue = decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toLocaleString();

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
