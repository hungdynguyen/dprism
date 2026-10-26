import type { Transition, Variants } from 'framer-motion';
interface TransitionPreset {
  variants: Variants;
  transition: Transition;
}
export const transitionVariants = {
  fade: {
    variants: { initial: { opacity: 0, y: 7 }, enter: { opacity: 1, y: 0 }, exit: { opacity: 0 } },
    transition: { duration: 0.16, ease: 'easeOut' },
  },
} satisfies Record<string, TransitionPreset>;
export type TransitionVariant = keyof typeof transitionVariants;
