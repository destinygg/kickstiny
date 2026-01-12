import React from "react";
import { cva } from "class-variance-authority";
import clsx from "clsx";

const buttonVariants = cva("button", {
  variants: {
    variant: {
      primary: "button--primary",
      secondary: "button--secondary",
      tertiary: "button--tertiary",
      danger: "button--danger",
    },
    size: {
      default: "",
      small: "button--small",
      large: "button--large",
    },
    fullWidth: {
      true: "button--full-width",
    },
    iconOnly: {
      true: "button--icon-only",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

export default function Button({
  ref,
  variant,
  size,
  fullWidth,
  iconOnly,
  className,
  children,
  ...props
}) {
  return (
    <button
      ref={ref}
      className={clsx(
        buttonVariants({ variant, size, fullWidth, iconOnly }),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
