import { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'motion/react';
import './ShinyText.css';

const SPARKLES_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.173a2 2 0 0 0 1.594 1.594l5.173 1.051a1 1 0 0 1 0 1.966l-5.173 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.173a1 1 0 0 1-1.966 0l-1.051-5.173a2 2 0 0 0-1.594-1.594l-5.173-1.051a1 1 0 0 1 0-1.966l5.173-1.051a2 2 0 0 0 1.594-1.594z'/%3E%3Cpath d='M20 2v4'/%3E%3Cpath d='M22 4h-4'/%3E%3Ccircle cx='4' cy='20' r='2'/%3E%3C/svg%3E\")";

function useShinyAnimation({
  disabled = false,
  speed = 2,
  yoyo = false,
  pauseOnHover = false,
  direction = 'right',
  delay = 0
}) {
  const [isPaused, setIsPaused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef(null);
  const directionRef = useRef(direction === 'left' ? -1 : 1);

  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;

  useAnimationFrame(time => {
    if (disabled || isPaused) {
      lastTimeRef.current = null;
      return;
    }

    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += deltaTime;

    if (yoyo) {
      const cycleDuration = animationDuration + delayDuration;
      const fullCycle = cycleDuration * 2;
      const cycleTime = elapsedRef.current % fullCycle;

      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100;
        progress.set(directionRef.current === 1 ? p : 100 - p);
      } else if (cycleTime < cycleDuration) {
        progress.set(directionRef.current === 1 ? 100 : 0);
      } else if (cycleTime < cycleDuration + animationDuration) {
        const reverseTime = cycleTime - cycleDuration;
        const p = 100 - (reverseTime / animationDuration) * 100;
        progress.set(directionRef.current === 1 ? p : 100 - p);
      } else {
        progress.set(directionRef.current === 1 ? 0 : 100);
      }
    } else {
      const cycleDuration = animationDuration + delayDuration;
      const cycleTime = elapsedRef.current % cycleDuration;

      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100;
        progress.set(directionRef.current === 1 ? p : 100 - p);
      } else {
        progress.set(directionRef.current === 1 ? 100 : 0);
      }
    }
  });

  useEffect(() => {
    directionRef.current = direction === 'left' ? -1 : 1;
    elapsedRef.current = 0;
    progress.set(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false);
  }, [pauseOnHover]);

  return {
    progress,
    handleMouseEnter,
    handleMouseLeave
  };
}

function ShinyTextWithIcon({
  text,
  iconSize,
  className,
  color,
  shineColor,
  spread,
  animationProps
}) {
  const containerRef = useRef(null);
  const iconRef = useRef(null);
  const labelRef = useRef(null);
  const layoutRef = useRef({ width: 0, iconLeft: 0, labelLeft: 0 });
  const [metrics, setMetrics] = useState({ width: 0, iconLeft: 0, labelLeft: 0 });

  const { progress, handleMouseEnter, handleMouseLeave } = useShinyAnimation(animationProps);

  const measureLayout = useCallback(() => {
    const container = containerRef.current;
    const icon = iconRef.current;
    const label = labelRef.current;
    if (!container || !icon || !label) return;

    const next = {
      width: container.offsetWidth,
      iconLeft: icon.offsetLeft,
      labelLeft: label.offsetLeft
    };

    const prev = layoutRef.current;
    if (
      prev.width !== next.width ||
      prev.iconLeft !== next.iconLeft ||
      prev.labelLeft !== next.labelLeft
    ) {
      layoutRef.current = next;
      setMetrics(next);
    }
  }, []);

  useLayoutEffect(() => {
    measureLayout();

    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(measureLayout);
    observer.observe(container);

    return () => observer.disconnect();
  }, [measureLayout, text, className, iconSize]);

  const gradientImage = `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`;
  const backgroundSize = metrics.width ? `${metrics.width * 2}px 100%` : '200% auto';

  const iconBackgroundPosition = useTransform(progress, p => {
    const { width: layoutWidth, iconLeft } = layoutRef.current;
    if (!layoutWidth) return `${150 - p * 2}% center`;
    const pos = layoutWidth * (-0.5 + p * 0.02);
    return `${pos - iconLeft}px center`;
  });

  const labelBackgroundPosition = useTransform(progress, p => {
    const { width: layoutWidth, labelLeft } = layoutRef.current;
    if (!layoutWidth) return `${150 - p * 2}% center`;
    const pos = layoutWidth * (-0.5 + p * 0.02);
    return `${pos - labelLeft}px center`;
  });

  return (
    <motion.span
      ref={containerRef}
      className={`shiny-text shiny-text-row ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.span
        ref={iconRef}
        className="shiny-text-icon shiny-text-icon--sparkles"
        style={{
          backgroundImage: gradientImage,
          backgroundSize,
          backgroundPosition: iconBackgroundPosition,
          width: iconSize,
          height: iconSize,
          WebkitMaskImage: SPARKLES_MASK,
          maskImage: SPARKLES_MASK
        }}
        aria-hidden="true"
      />
      <motion.span
        ref={labelRef}
        className="shiny-text-label"
        style={{
          backgroundImage: gradientImage,
          backgroundSize,
          backgroundPosition: labelBackgroundPosition,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        {text}
      </motion.span>
    </motion.span>
  );
}

const ShinyText = ({
  text,
  icon = undefined,
  iconSize = 14,
  disabled = false,
  speed = 2,
  className = '',
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = 'right',
  delay = 0
}) => {
  const animationProps = {
    disabled,
    speed,
    yoyo,
    pauseOnHover,
    direction,
    delay
  };

  if (icon === 'sparkles') {
    return (
      <ShinyTextWithIcon
        text={text}
        iconSize={iconSize}
        className={className}
        color={color}
        shineColor={shineColor}
        spread={spread}
        animationProps={animationProps}
      />
    );
  }

  const { progress, handleMouseEnter, handleMouseLeave } = useShinyAnimation(animationProps);
  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);

  const gradientTextStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  return (
    <motion.span
      className={`shiny-text ${className}`}
      style={{ ...gradientTextStyle, backgroundPosition }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </motion.span>
  );
};

export default ShinyText;
