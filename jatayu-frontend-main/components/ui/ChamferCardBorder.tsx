import React from "react";
import styles from "./ChamferCardBorder.module.css";

interface ChamferCardBorderProps {
  className?: string;
  polygonClassName?: string;
}

const POLYGON_POINTS =
  "10,3.179 12.647,0 91.177,0 96.765,4.48 96.765,53.757 100,57.659 100,95.376 95.294,100 0,100 0,19.364 10,8.736 10,3.179";

export default function ChamferCardBorder({
  className = "",
  polygonClassName = "",
}: ChamferCardBorderProps) {
  return (
    <svg
      className={`${styles.chamferSvg} ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon
        points={POLYGON_POINTS}
        vectorEffect="non-scaling-stroke"
        className={`${styles.chamferPolygon} ${polygonClassName}`}
      />
    </svg>
  );
}

