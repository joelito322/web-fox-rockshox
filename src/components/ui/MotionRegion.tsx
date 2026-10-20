import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Fade updated content without replacing its controls or resetting their state. */
export function MotionRegion({
  children,
  motionKey,
  className,
  disabled = false,
}: {
  children: ReactNode;
  motionKey: string;
  className?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (!element?.animate || disabled || preference.matches) return;
    const animation = element.animate([{ opacity: 0.65 }, { opacity: 1 }], {
      duration: 180,
      easing: "ease-out",
    });
    const cancel = () => { if (preference.matches) animation.cancel(); };
    preference.addEventListener("change", cancel);
    return () => {
      animation.cancel();
      preference.removeEventListener("change", cancel);
    };
  }, [motionKey, disabled]);
  return <div ref={ref} className={className}>{children}</div>;
}
