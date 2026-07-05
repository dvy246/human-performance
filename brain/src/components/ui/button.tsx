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
      variantStyles = "bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-hover-bg)] focus-visible:ring-accent";
    } else if (variant === "danger") {
      variantStyles = "bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm focus-visible:ring-red-500";
    } else if (variant === "ghost") {
      variantStyles = "text-[var(--btn-ghost-text)] hover:bg-[var(--btn-ghost-hover-bg)] text-foreground/80 hover:text-foreground focus-visible:ring-accent";
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

