import "./rolling-text.css";

interface RollingTextProps {
  children: string;
  className?: string;
  /** Keep hover roll when the user has prefers-reduced-motion enabled (footer links). */
  alwaysAnimate?: boolean;
}

export default function RollingText({
  children,
  className,
  alwaysAnimate = true,
}: RollingTextProps) {
  return (
    <span
      className={[
        "rolling-text",
        alwaysAnimate && "rolling-text--always",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="rolling-text__track">
        <span className="rolling-text__line">{children}</span>
        <span className="rolling-text__line" aria-hidden="true">
          {children}
        </span>
      </span>
    </span>
  );
}
