const Logo = ({ alt = "Nazar Logo", className = "", ...props }) => (
  <img src="/nazar-logo.png" alt={alt} className={className} {...props} />
);

export default Logo;