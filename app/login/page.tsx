"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setError("Invalid email or password.");
    else router.push("/");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form onSubmit={onSubmit} className="card blueprint" style={{ width: 340, position: "relative" }}>
        <i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
        <h3>Express Solutions</h3>
        <p style={{ fontSize: 13, opacity: 0.7, marginTop: -4 }}>Sign in to track your time</p>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div style={{ color: "#ff6b6b", fontSize: 13, marginTop: 8 }}>{error}</div>}
        <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} type="submit">Sign In</button>
      </form>
    </div>
  );
}
