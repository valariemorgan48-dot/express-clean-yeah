"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BlueprintCard from "@/components/BlueprintCard";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function ManagerProfile() {
  const { data: session } = useSession();
  const linkStyle = { padding: "14px 4px", borderBottom: "1px solid var(--color-divider)", fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--color-text)", textDecoration: "none", display: "block" };
  return (
    <div style={{ marginTop: 8 }}>
      <h3>Profile</h3>
      <BlueprintCard style={{ marginTop: 20 }}>
        <div className="card-title">{session?.user?.name}</div>
        <div className="card-meta">Operations Manager</div>
        <div className="card-meta">Express Solutions</div>
      </BlueprintCard>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
        <Link href="/manager/timeoff" style={linkStyle}>Approve time-off requests</Link>
        <Link href="/manager/approvals" style={linkStyle}>Approve weekly hours</Link>
        <Link href="/manager/timesheets" style={linkStyle}>Edit timesheets</Link>
        <Link href="/manager/payroll" style={linkStyle}>Payroll export</Link>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
