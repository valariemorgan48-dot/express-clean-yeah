"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav({ base, homeLabel }: { base: "employee" | "manager"; homeLabel: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/${base}`, label: homeLabel },
    { href: `/${base}/schedule`, label: "Schedule" },
    { href: `/${base}/profile`, label: "Profile" },
  ];
  return (
    <div style={{ position: "sticky", bottom: 0, display: "flex", background: "var(--color-bg)", borderTop: "1px solid var(--color-divider)", padding: "10px 10px 16px" }}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, padding: 6, color: active ? "var(--color-accent-700)" : "var(--color-text)", textDecoration: "none" }}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
