import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import styles from "./SecondaryCTA.module.css";

type SecondaryCTAProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label?: ReactNode;
  showArrow?: boolean;
  arrowSize?: number;
  leadingIcon?: ReactNode;
  icon?: ReactNode;
};

function ButtonLabel({ label }: { label: ReactNode }) {
  return (
    <span className={styles.labelText}>
      <span className={styles.labelTrack}>
        <span className={styles.labelUp}>{label}</span>
        <span className={styles.labelUp} aria-hidden="true">
          {label}
        </span>
      </span>
    </span>
  );
}

export default function SecondaryCTA({
  label = "Continue",
  showArrow = true,
  arrowSize = 14,
  leadingIcon,
  icon,
  className = "",
  type = "button",
  ...props
}: SecondaryCTAProps) {
  return (
    <button
      type={type}
      className={[styles.secondaryCtaBtn, className].filter(Boolean).join(" ")}
      {...props}
    >
      {leadingIcon}
      <ButtonLabel label={label} />
      {icon ? icon : showArrow ? <ArrowRight size={arrowSize} /> : null}
    </button>
  );
}
