
import { cn } from "@/lib/utils";

type CekbarIconProps = {
  size?: number;
  className?: string;
  /** Use "dark" when icon sits on a blue primary background */
  variant?: "default" | "dark";
};

export function CekbarIcon({ size = 36, className, variant = "default" }: CekbarIconProps) {
  const bgFill = variant === "dark" ? "#0B1B4A" : "#1F5BFF";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Ikon Cekbar"
      className={className}
    >
      <rect width="120" height="120" rx="28" fill={bgFill} />
      <path
        d="M32 58 L52 78 L90 36"
        fill="none"
        stroke="#fff"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="32" y="94" width="58" height="10" rx="5" fill="#7DD3FC" />
    </svg>
  );
}

type CekbarWordmarkProps = {
  className?: string;
  /** "light" → Cek in navy, bar in royal-blue.
   *  "dark"  → Cek in white, bar in sky-blue. */
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeMap = {
  sm: "text-[14px]",
  md: "text-[17px]",
  lg: "text-[28px]",
  xl: "text-[44px]",
};

export function CekbarWordmark({ className, variant = "light", size = "md" }: CekbarWordmarkProps) {
  const cekColor = variant === "dark" ? "text-white" : "text-[#0B1B4A]";
  const barColor = variant === "dark" ? "text-[#38BDF8]" : "text-[#1F5BFF]";

  return (
    <span
      className={cn(
        "font-extrabold tracking-[-0.045em] leading-none font-[family-name:var(--font-bricolage)]",
        sizeMap[size],
        className,
      )}
    >
      <span className={cekColor}>Cek</span>
      <span className={barColor}>bar</span>
    </span>
  );
}

type CekbarLogoProps = {
  className?: string;
  iconSize?: number;
  /** "light" for light backgrounds, "dark" for dark/navy backgrounds */
  variant?: "light" | "dark";
  /** Optional subtitle displayed below the wordmark */
  subtitle?: string;
  subtitleClassName?: string;
  size?: "sm" | "md" | "lg";
};

const logoIconSize = { sm: 28, md: 36, lg: 48 };
const wordmarkSize: Record<string, "sm" | "md" | "lg"> = { sm: "sm", md: "md", lg: "lg" };

export function CekbarLogo({
  className,
  iconSize,
  variant = "light",
  subtitle,
  subtitleClassName,
  size = "md",
}: CekbarLogoProps) {
  const resolvedIconSize = iconSize ?? logoIconSize[size];
  const subtitleColor = variant === "dark"
    ? "text-blue-200/75"
    : "text-blue-500/60 dark:text-blue-400/50";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <CekbarIcon size={resolvedIconSize} />
      <span className="flex flex-col">
        <CekbarWordmark variant={variant} size={wordmarkSize[size]} />
        {subtitle && (
          <span
            className={cn(
              "text-[10px] font-semibold leading-none mt-1 uppercase tracking-widest",
              subtitleColor,
              subtitleClassName,
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
