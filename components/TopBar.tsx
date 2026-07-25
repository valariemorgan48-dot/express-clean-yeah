"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export default function TopBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 10px", fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600 }}>
      <span>{time}</span>
      <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn" style={{ fontSize: 12, padding: "6px 10px" }}>
        Sign out
      </button>
    </div>
  );
}
