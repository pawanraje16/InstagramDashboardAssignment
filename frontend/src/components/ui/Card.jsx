const Card = ({
  children,
  className = '',
  hover = true,
  gradient = false,
  padding = 'md',
  ...props
}) => {
  const baseClasses = "bg-gray-950 border border-gray-900 rounded-2xl transition-all duration-200";
  const hoverClasses = hover ? "hover:border-gray-800 hover:shadow-xl hover:shadow-white/5" : "";
  const gradientClasses = gradient ? "bg-gradient-to-br from-gray-950 via-black to-gray-900/50" : "";

  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    none: ""
  };

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;