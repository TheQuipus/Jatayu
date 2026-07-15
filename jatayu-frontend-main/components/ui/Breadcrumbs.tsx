import Link from "next/link";
import { Fragment } from "react";
import styles from "./Breadcrumbs.module.css";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumbs">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? (
              <span className={styles.breadcrumbSeparator} aria-hidden="true">
                /
              </span>
            ) : null}
            {item.href && !isLast ? (
              <Link href={item.href} className={styles.breadcrumbLink}>
                {item.label}
              </Link>
            ) : isLast ? (
              <span className={styles.breadcrumbCurrent}>{item.label}</span>
            ) : (
              <span className={`${styles.breadcrumbLink} ${styles.breadcrumbText}`}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
