import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
  };

  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeClasses[size], "w-auto", className)}
    >
      {/* Icon: Abstract Isles / 'P' Shape */}
      <path
        d="M40 80C40 57.9086 57.9086 40 80 40H90V80H40Z"
        fill="currentColor"
      />
      <path
        d="M60 90C60 78.9543 68.9543 70 80 70H110V90C110 101.046 101.046 110 90 110H60V90Z"
        fill="currentColor"
        className="opacity-80"
      />

      {/* Typography */}
      <text
        x="130"
        y="75"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="38"
        fill="currentColor"
      >
        PRIME
      </text>
      <text
        x="130"
        y="105"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontWeight="300"
        fontSize="28"
        letterSpacing="0.15em"
        fill="currentColor"
      >
        CHAT
      </text>
    </svg>
  );
};

export default Logo;
