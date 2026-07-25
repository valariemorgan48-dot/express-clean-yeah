export default function BlueprintCard({
  children,
  style,
  dark = false,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
}) {
  return (
    <div
      className="card blueprint"
      style={{
        position: "relative",
        background: dark ? "var(--color-accent-900)" : "transparent",
        color: dark ? "var(--color-bg)" : "var(--color-text)",
        ...style,
      }}
    >
      <i className="corner tl" style={dark ? { color: "var(--color-bg)" } : undefined}></i>
      <i className="corner tr" style={dark ? { color: "var(--color-bg)" } : undefined}></i>
      <i className="corner bl" style={dark ? { color: "var(--color-bg)" } : undefined}></i>
      <i className="corner br" style={dark ? { color: "var(--color-bg)" } : undefined}></i>
      {children}
    </div>
  );
}
