import React from "react";
import { twMerge } from "tailwind-merge";

type AppTextProps = {
  children: React.ReactNode;
  variant?:
    | "heading"
    | "title"
    | "subHeading"
    | "secondaryTitle"
    | "body"
    | "subtitle"
    | "label"
    | "label2"
    | "caption"
    | "meta"
    | "small"
    | "meta2";

  className?: string;
  as?: "p" | "span" | "h1" | "h2" | "h3" | "h4" | "figcaption";
};

const variants = {
  heading: "text-2xl font-bold",
  title: "text-lg font-semibold text-accent font-roboto-serif",
  subHeading: "text-md font-semibold text-text-primary font-roboto-serif",
  secondaryTitle: "text-xl",
  subtitle: "text-md font-semibold ",
  body: "text-sm font-semibold text-text-primary ",
  label2: "text-md text-accent  font-semibold underline decoration-[0.5px] decoration-accent underline-offset-4 cursor-pointer",
  label: "text-sm text-accent  underline decoration-[0.5px] decoration-accent underline-offset-4 cursor-pointer",
  caption: "text-xs font-semibold ",
  meta: "text-2xs  font-semibold font-roboto-serif underline underline-offset-2 underline-accent cursor-pointer",
  meta2: "text-2xs  font-semibold cursor-pointer",
  small: "text-3xs   text-text-secondary cursor-pointer font-semibold ",
};

export default function AppText({
  children,
  variant = "body",
  className,
  as: Component = "p",
}: AppTextProps) {
  const textClass = variants[variant];

  const combinedClass = twMerge(textClass, className);

  return (
    <Component className={combinedClass}>
      {children}
    </Component>
  );
}