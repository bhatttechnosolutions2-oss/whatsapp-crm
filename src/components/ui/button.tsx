import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow":
              variant === "default",
            "bg-red-600 text-white shadow-sm hover:bg-red-700":
              variant === "destructive",
            "border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900 text-slate-700":
              variant === "outline",
            "bg-slate-100 text-slate-900 hover:bg-slate-200/80":
              variant === "secondary",
            "hover:bg-slate-100 hover:text-slate-900 text-slate-600":
              variant === "ghost",
            "text-blue-600 underline-offset-4 hover:underline p-0 h-auto":
              variant === "link",
            "h-11 px-4 py-2": size === "default",
            "h-9 rounded-lg px-3 text-xs": size === "sm",
            "h-12 rounded-xl px-6 text-base font-semibold": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
