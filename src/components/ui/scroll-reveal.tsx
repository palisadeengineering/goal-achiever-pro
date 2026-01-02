'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale';
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  once = true,
  className,
  ...props
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, once]);

  const animationStyles: Record<string, { initial: string; visible: string }> = {
    'fade-up': {
      initial: 'opacity-0 translate-y-8',
      visible: 'opacity-100 translate-y-0',
    },
    'fade-in': {
      initial: 'opacity-0',
      visible: 'opacity-100',
    },
    'slide-left': {
      initial: 'opacity-0 translate-x-8',
      visible: 'opacity-100 translate-x-0',
    },
    'slide-right': {
      initial: 'opacity-0 -translate-x-8',
      visible: 'opacity-100 translate-x-0',
    },
    scale: {
      initial: 'opacity-0 scale-95',
      visible: 'opacity-100 scale-100',
    },
  };

  const styles = animationStyles[animation];

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        isVisible ? styles.visible : styles.initial,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Staggered children animation wrapper
interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  staggerDelay?: number;
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale';
}

export function StaggerContainer({
  children,
  staggerDelay = 100,
  animation = 'fade-up',
  className,
  ...props
}: StaggerContainerProps) {
  const childArray = React.Children.toArray(children);

  return (
    <div className={className} {...props}>
      {childArray.map((child, index) => (
        <ScrollReveal
          key={index}
          animation={animation}
          delay={index * staggerDelay}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
