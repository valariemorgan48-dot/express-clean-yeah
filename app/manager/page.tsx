"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

const JOB_TYPES = ["Residential Cleaning", "Commercial Cleaning", "Local Moving", "Long-Distance Moving", "Lawn Care"];

export default function ManagerHome() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [weekLabel, setWeekLabel] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", jobType: JOB_TYPES[0], email: "", password: "", hourlyRate: "" });
  const [error, setError] = useState("");

  async function refresh() {
    const r = await fetch("/api/employees");
    const d = await r.json();
    setEmployees(d.employees ?? []);
    if (d.weekStart) {
      const fmt = (s: string) => new Date(s).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
      setWeekLabel(`Work week: ${fmt(d.weekStart)} – ${fmt(d.weekEnd)}`);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addEmployee() {
    setError("");
    if (!form.name || !form.email || !form.password) return;
    const res = await fetch("/api/employees", { method: "POST", body: JSON.stringify(form) });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Could not add employee");
      return;
    }
    setForm({ name: "", jobType: JOB_TYPES[0], email: "", password: "", hourlyRate: "" });
    setShowForm(false);
    refresh();
  }

  async function removeEmployee(id: string) {
    if (!confirm("Remove this employee? This deletes their login and history.")) return;
    const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || `Could not remove employee (status ${res.status})`);
      return;
    }
    refresh();
  }

  async function editRate(e: any) {
    const input = prompt(`New hourly rate for ${e.name}:`, e.hourlyRate);
    if (input === null) return;
    const rate = Number(input);
    if (isNaN(rate) || rate < 0) {
      alert("Enter a valid non-negative number.");
      return;
    }
    const res = await fetch("/api/employees", { method: "PATCH", body: JSON.stringify({ id: e.id, hourlyRate: rate }) });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Could not update rate");
      return;
    }
    refresh();
  }

  const onClock = employees.filter((e) => e.isClockedInNow).length;

  return (
    <div style={{ marginTop: 8 }}>
      <h6 style={{ color: "var(--color-accent-700)" }}>{weekLabel}</h6>
      <h3 style={{ marginTop: 2 }}>Team Overview</h3>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <BlueprintCard style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 600 }}>{onClock}</div>
          <div className="card-meta" style={{ justifyContent: "center" }}>On the clock</div>
        </BlueprintCard>
        <BlueprintCard style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 600 }}>{employees.length}</div>
          <div className="card-meta" style={{ justifyContent: "center" }}>Total staff</div>
        </BlueprintCard>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "20px 0 10px" }}>
        <h6 style={{ margin: 0 }}>Hours this week</h6>
        <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Employee"}
        </button>
      </div>

      {showForm && (
        <BlueprintCard style={{ marginBottom: 12, gap: 8 }}>
          <div className="field">
            <label>Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          </div>
          <div className="field">
            <label>Job type</label>
            <select className="input" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
              {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Login email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@expresssolutions.com" />
          </div>
          <div className="field">
            <label>Temporary password</label>
            <input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
          </div>
          <div className="field">
            <label>Hourly rate ($)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} placeholder="e.g. 18.50" />
          </div>
          {error && <div style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</div>}
          <button className="btn btn-primary btn-block" onClick={addEmployee}>Add Employee</button>
        </BlueprintCard>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {employees.map((e) => (
          <BlueprintCard key={e.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: e.isClockedInNow ? "var(--color-accent)" : "var(--color-neutral-400)" }} />
              <div>
                <div className="card-title" style={{ fontSize: 15 }}>{e.name}</div>
                <div className="card-meta">{e.jobType}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="tag tag-accent">{e.weeklyHours} hrs</div>
              <button onClick={() => editRate(e)} className="btn" style={{ fontSize: 11, padding: "4px 8px" }}>${e.hourlyRate.toFixed(2)}/hr</button>
              <button onClick={() => removeEmployee(e.id)} className="btn" style={{ fontSize: 11, padding: "4px 8px" }}>Remove</button>
            </div>
          </BlueprintCard>
        ))}
      </div>
    </div>
  );
}
