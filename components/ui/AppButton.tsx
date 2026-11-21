import { twMerge } from "tailwind-merge";
import React from "react";

type AppButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "tertiary" | "link" | "icon" | "outline" | "filter" | "filterMob" | "toolbar" ;
    active?: boolean;
    activeClassName?: string;
  };



export default function AppButton({
  children,
  active = false,
  variant = "primary",
  activeClassName,
  className,
  ...props
}: AppButtonProps) {
const variants = {
  primary:
    "bg-primary text-premium pb-[2.5px] rounded-full hover-pointer hover:bg-primary/80 cursor-pointer duration-200 text-sm px-4 items-center justify-center",

  secondary:
    "bg-secondary text-white",

  tertiary:
    "bg-tertiary text-white",

  icon:
    "bg-transparent text-text-primary",
  
  
  link:
    "bg-transparent text-text-primary border-b-1 border-transparent rounded-full hover-pointer hover:border-b    cursor-pointer duration-200 text-sm px-4 pb-[1.5px] items-center justify-center font-semibold hover:text-accent  hover:border-accent",

  outline : "rounded-sm  border-b  border-accent/50 bg-premium px-3 py-2 text-xs sm:text-xs text-text-primary",

  filter: `flex w-full items-center justify-start gap-3 rounded-sm font-semibold  border-b border-transparent px-3 py-2.5 text-left text-sm ${active ? "border-accent/25 text-accent bg-accent/7 ":"text-text-primary  hover:bg-background/50 hover:text-text-primary "}`,

  toolbar :
      "inline-flex items-center gap-1.5   px-2.5 py-2 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent",



  filterMob:`flex shrink-0 items-center gap-2 font-semibold  border-b border-transparent px-3 py-2 text-xs transition ${
  active ? "border-accent  text-accent " : "text-text-primary "}`





  


};


  const buttonClass = variants[variant];

  const combinedClass = twMerge(buttonClass, className ,active && activeClassName);

  return (
    <button
      {...props}
      className={combinedClass}
    >
      {children}
    </button>
  );
}