import { forwardRef } from 'react';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-800 text-white focus:ring-gray-500 border border-gray-700",
    secondary: "bg-gray-900 hover:bg-gray-800 text-white border border-gray-800 focus:ring-gray-500",
    outline: "border-2 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white focus:ring-gray-500",
    ghost: "text-gray-300 hover:text-white hover:bg-gray-900 focus:ring-gray-500"
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg"
  };

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;