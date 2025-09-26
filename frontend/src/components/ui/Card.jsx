const Card = ({
  children,
  className = '',
  hover = true,
  gradient = false,
  padding = 'md',
  ...props
}) => {
  const baseClasses = "bg-gray-900 border border-gray-800 rounded-2xl transition-all duration-200";
  const hoverClasses = hover ? "hover:border-gray-700 hover:shadow-xl hover:shadow-purple-500/10" : "";
  const gradientClasses = gradient ? "bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20" : "";

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