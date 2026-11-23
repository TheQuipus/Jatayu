import styles from "./Spinner.module.css";

type SpinnerProps = {
  size?: number;
  className?: string;
};

export default function Spinner({ size = 16, className = "" }: SpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
