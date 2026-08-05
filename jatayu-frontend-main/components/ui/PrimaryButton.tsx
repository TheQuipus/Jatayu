"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./PrimaryButton.module.css";

type SharedPrimaryButtonProps = {
  label?: ReactNode;
  variant?: "light" | "dark" | "orange";
  fullWidth?: boolean;
  iconPosition?: "left" | "right";
  iconSrc?: string;
  className?: string;
  staticLabel?: boolean;
};

type PrimaryButtonAsButton = SharedPrimaryButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedPrimaryButtonProps> & {
    href?: undefined;
  };

type PrimaryButtonAsLink = SharedPrimaryButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedPrimaryButtonProps> & {
    href: string;
  };

type PrimaryButtonProps = PrimaryButtonAsButton | PrimaryButtonAsLink;

function ButtonIcon({ iconSrc = "/assets/buttonsvg.svg" }: { iconSrc?: string }) {
  return (
    <span className={`btn__icon ${styles.buttonIcon}`} aria-hidden="true">
      <img src={iconSrc} alt="" width={26} height={26} />
    </span>
  );
}

function ButtonLabel({ label, staticLabel = false }: { label: ReactNode; staticLabel?: boolean }) {
  if (staticLabel) {
    return <span className={`${styles.buttonText} ${styles.buttonTextStatic} btn__text`}>{label}</span>;
  }

  return (
    <span className={`${styles.buttonText} btn__text`}>
      <span className={`${styles.labelTrack} btn__label-track`}>
        <span className={`${styles.labelUp} btn__label-up`}>{label}</span>
        <span className={`${styles.labelUp} btn__label-up`} aria-hidden="true">
          {label}
        </span>
      </span>
    </span>
  );
}

function ButtonContent({
  label,
  iconPosition,
  iconSrc,
  staticLabel,
}: Pick<SharedPrimaryButtonProps, "label" | "iconPosition" | "iconSrc" | "staticLabel">) {
  const text = <ButtonLabel label={label ?? ""} staticLabel={staticLabel} />;

  if (iconPosition === "left") {
    return (
      <>
        <ButtonIcon iconSrc={iconSrc} />
        {text}
      </>
    );
  }

  return (
    <>
      {text}
      <ButtonIcon iconSrc={iconSrc} />
    </>
  );
}

function getSharedLayout(props: SharedPrimaryButtonProps) {
  const {
    label = "Get matched with an expert",
    variant = "light",
    fullWidth = false,
    iconPosition = "right",
    iconSrc = "/assets/buttonsvg.svg",
    className = "",
    staticLabel = false,
  } = props;

  return {
    label,
    iconPosition,
    iconSrc,
    staticLabel,
    buttonClassName: [
      "btn",
      `btn--${variant}`,
      styles.primaryButton,
      className,
      fullWidth ? styles.buttonFullWidth : "",
    ]
      .filter(Boolean)
      .join(" "),
    wrapperClassName: [styles.wrapper, fullWidth ? styles.fullWidth : ""].filter(Boolean).join(" "),
  };
}

function omitSharedProps<T extends SharedPrimaryButtonProps>(props: T) {
  const {
    label: _label,
    variant: _variant,
    fullWidth: _fullWidth,
    iconPosition: _iconPosition,
    iconSrc: _iconSrc,
    className: _className,
    staticLabel: _staticLabel,
    ...rest
  } = props;

  return rest;
}

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

export default function PrimaryButton(props: PrimaryButtonProps) {
  const layout = getSharedLayout(props);
  const content = (
    <ButtonContent
      label={layout.label}
      iconPosition={layout.iconPosition}
      iconSrc={layout.iconSrc}
      staticLabel={layout.staticLabel}
    />
  );

  if ("href" in props && props.href) {
    const { href, ...anchorProps } = omitSharedProps(props) as Omit<
      PrimaryButtonAsLink,
      keyof SharedPrimaryButtonProps
    >;

    if (isInternalHref(href)) {
      return (
        <div className={layout.wrapperClassName}>
          <Link href={href} className={layout.buttonClassName} {...anchorProps}>
            {content}
          </Link>
        </div>
      );
    }

    return (
      <div className={layout.wrapperClassName}>
        <a href={href} className={layout.buttonClassName} {...anchorProps}>
          {content}
        </a>
      </div>
    );
  }

  const { type = "submit", ...buttonProps } = omitSharedProps(
    props
  ) as Omit<PrimaryButtonAsButton, keyof SharedPrimaryButtonProps>;

  return (
    <div className={layout.wrapperClassName}>
      <button type={type} className={layout.buttonClassName} {...buttonProps}>
        {content}
      </button>
    </div>
  );
}
