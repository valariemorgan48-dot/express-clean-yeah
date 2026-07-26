"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BlueprintCard from "@/components/BlueprintCard";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function EmployeeProfile() {
  const { data: session } = useSession();
  const linkStyle = { padding: "14px 4px", borderBottom: "1px solid var(--color-divider)", fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--color-text)", textDecoration: "none", display: "block" };
  return (
    <div style={{ marginTop: 8 }}>
      <h3>Profile</h3>
      <BlueprintCard style={{ marginTop: 20 }}>
        <div className="card-title">{session?.user?.name}</div>
        <div className="card-meta">{session?.user?.email}</div>
        <div className="card-meta">Express Solutions</div>
      </BlueprintCard>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
        <Link href="/employee/timeoff" style={linkStyle}>Time-off requests</Link>
        <Link href="/employee/history" style={linkStyle}>Pay & hours history</Link>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
