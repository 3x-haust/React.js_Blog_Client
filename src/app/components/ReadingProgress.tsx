import { motion, useScroll, useSpring } from 'motion/react';

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-14 left-0 right-0 h-[2px] bg-border z-50">
      <motion.div
        className="h-full w-full bg-foreground origin-left"
        style={{ scaleX }}
      />
    </div>
  );
}
