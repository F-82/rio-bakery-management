type LogoProps = {
  /** Edge length in px. The mark is always square. */
  size?: number;
  className?: string;
};

/**
 * Placeholder mark — logo artwork not supplied yet (CLAUDE.md §Assets).
 * Swap the internals once the client sends real artwork; keep the props
 * contract so every call site stays untouched.
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Rio Bakers Hut"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="var(--color-ink)" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontFamily="var(--font-general-sans), sans-serif"
        fontWeight={500}
        fontSize="18"
        fill="var(--color-on-black)"
      >
        R
      </text>
    </svg>
  );
}
