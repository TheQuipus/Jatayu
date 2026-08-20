"use client";

import Image from "next/image";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import PrimaryButton from "./PrimaryButton";
import styles from "./ContactActionButton.module.css";

type ContactActionButtonProps = {
  label: string;
  avatarSrc: string;
  avatarAlt: string;
  className?: string;
  wrapperClassName?: string;
  href?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  variant?: "light" | "dark" | "orange";
  fullWidth?: boolean;
  staticLabel?: boolean;
  disabled?: boolean;
};

export default function ContactActionButton({
  label,
  avatarSrc,
  avatarAlt,
  className = "",
  wrapperClassName = "",
  href,
  onClick,
  onButtonClick,
  type = "button",
  variant,
  fullWidth,
  staticLabel,
  disabled,
}: ContactActionButtonProps) {
  return (
    <div
      className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ""} ${wrapperClassName}`.trim()}
    >
      <Image
        className={`btn__avatar ${styles.avatar}`}
        src={avatarSrc}
        alt={avatarAlt}
        width={56}
        height={56}
      />
      {href ? (
        <PrimaryButton
          label={label}
          href={href}
          onClick={onClick}
          className={className}
          variant={variant}
          fullWidth={fullWidth}
          staticLabel={staticLabel}
        />
      ) : (
        <PrimaryButton
          label={label}
          type={type}
          className={className}
          variant={variant}
          fullWidth={fullWidth}
          staticLabel={staticLabel}
          onClick={onButtonClick}
          disabled={disabled}
        />
      )}
    </div>
  );
}
