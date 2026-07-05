import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", children, ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer active:scale-[0.98]";
    
    let variantStyles = "";
    if (variant === "primary") {
      variantStyles = "bg-accent hover:bg-accent-hover text-black font-semibold shadow-sm focus-visible:ring-accent";
    } else if (variant === "secondary") {
      variantStyles = "bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white focus-visible:ring-zinc-700";
    } else if (variant === "danger") {
      variantStyles = "bg-rose-950 border border-rose-900 hover:bg-rose-900 text-rose-200 focus-visible:ring-rose-700";
    } else if (variant === "ghost") {
      variantStyles = "text-zinc-400 hover:text-white hover:bg-zinc-900/50 focus-visible:ring-zinc-700";
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
