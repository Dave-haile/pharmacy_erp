import { FlaskConical } from "lucide-react";
interface AppLogoProps {
  src?: string; // Image source (optional)
  text?: string; // Logo text (optional)
  size?: number; // Size for icon/image
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
}

function AppLogo({ text, className = "", onClick }: AppLogoProps) {
  return (
    <div
      className={`flex items-center gap-2 ${onClick ? "cursor-pointer hover:opacity-80" : ""} ${className}`}
      onClick={onClick}
    >
      {/* Show image if src provided, otherwise show icon */}
      {/* {src ? (
        <AppImage
          src={src}
          alt="Logo"
          width={size}
          height={size}
          className="shrink-0"
        />
      ) : (
        <Hospital size={size} className="shrink-0" />
      )} */}
      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
        <FlaskConical className="text-white w-5 h-5" />
      </div>

      {/* Show text if provided */}
      {text && <span className="text-xl font-bold">{text}</span>}
    </div>
  );
}

export default AppLogo;
