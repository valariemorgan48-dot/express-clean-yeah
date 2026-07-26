"use client";
import { useSession } from "next-auth/react";
import BlueprintCard from "@/components/BlueprintCard";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function EmployeeProfile() {
  const { data: session } = useSession();
  return (
    <div style={{ marginTop: 8 }}>
      <h3>Profile</h3>
      <BlueprintCard style={{ marginTop: 20 }}>
        <div className="card-title">{session?.user?.name}</div>
        <div className="card-meta">{session?.user?.email}</div>
        <div className="card-meta">Express Solutions</div>
      </BlueprintCard>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 4px", borderBottom: "1px solid var(--color-divider)", fontFamily: "var(--font-heading)", fontWeight: 600, opacity: 0.5 }}>Time-off requests (coming soon)</div>
        <div style={{ padding: "14px 4px", borderBottom: "1px solid var(--color-divider)", fontFamily: "var(--font-heading)", fontWeight: 600, opacity: 0.5 }}>Pay & hours history (coming soon)</div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
