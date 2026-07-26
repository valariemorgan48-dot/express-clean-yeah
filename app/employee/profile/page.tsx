"use client";
import { useState } from "react";
import BlueprintCard from "./BlueprintCard";

export default function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit() {
    setMessage(null);
    const res = await fetch("/api/account/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ text: data.error || "Could not update password", ok: false });
      return;
    }
    setMessage({ text: "Password updated.", ok: true });
    setCurrent("");
    setNext("");
  }

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: "14px 4px", fontFamily: "var(--font-heading)", fontWeight: 600, cursor: "pointer" }}
      >
        Settings — Change Password
      </div>
      {open && (
        <BlueprintCard style={{ marginTop: 8, gap: 8 }}>
          <div className="field">
            <label>Current password</label>
            <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="field">
            <label>New password</label>
            <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          {message && <div style={{ fontSize: 13, color: message.ok ? "var(--color-accent-700)" : "#a33" }}>{message.text}</div>}
          <button className="btn btn-primary btn-block" onClick={submit}>Update Password</button>
        </BlueprintCard>
      )}
    </div>
  );
}
