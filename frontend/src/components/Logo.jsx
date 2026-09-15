const Logo = ({ alt = "Bichoo Logo", className = "", ...props }) => (
  <img src="/bichoo-logo.png" alt={alt} className={className} {...props} />
);

export default Logo;