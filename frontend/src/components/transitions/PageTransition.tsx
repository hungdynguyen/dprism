import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { transitionVariants, type TransitionVariant } from '@/components/transitions/variants';
export function PageTransition({
  children,
  variant = 'fade',
  className = '',
}: Readonly<{ children: ReactNode; variant?: TransitionVariant; className?: string }>) {
  const reduce = useReducedMotion(),
    preset = transitionVariants[variant];
  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'initial'}
      animate="enter"
      variants={preset.variants}
      transition={reduce ? { duration: 0 } : preset.transition}
    >
      {children}
    </motion.div>
  );
}
