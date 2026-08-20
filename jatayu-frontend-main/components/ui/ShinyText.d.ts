import type { FC } from "react";

export type ShinyTextProps = {
  text: string;
  icon?: "sparkles";
  iconSize?: number;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  delay?: number;
};

declare const ShinyText: FC<ShinyTextProps>;

export default ShinyText;
