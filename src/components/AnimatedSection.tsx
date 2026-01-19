import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right';
  delay?: number;
  className?: string;
}

export default function AnimatedSection({
  children,
  animation = 'fade-in',
  delay = 0,
  className = '',
}: AnimatedSectionProps) {
  const { elementRef, isVisible } = useScrollAnimation();

  const animationClass = {
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'slide-left': 'animate-slide-left',
    'slide-right': 'animate-slide-right',
  }[animation];

  return (
    <div
      ref={elementRef}
      className={`${className} ${isVisible ? animationClass : 'opacity-0'} transition-all`}
      style={{
        animationDelay: isVisible ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </div>
  );
}
