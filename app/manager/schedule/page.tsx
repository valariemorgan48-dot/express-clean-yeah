"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

const JOB_TYPES = ["Residential Cleaning", "Commercial Cleaning", "Local Moving", "Long-Distance Moving", "Lawn Care"];

export default function ManagerSchedule() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: "", jobType: JOB_TYPES[0], address: "", date: "", time: "", repeats: false });

  async function refresh() {
    const [shiftsRes, empRes] = await Promise.all([fetch("/api/shifts"), fetch("/api/employees")]);
    const shiftsData = await shiftsRes.json();
    const empData = await empRes.json();
    setShifts(shiftsData.shifts ?? []);
    setEmployees(empData.employees ?? []);
    if (empData.employees?.length && !form.employeeId) {
      setForm((f) => ({ ...f, employeeId: empData.employees[0].id }));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submit() {
    if (!form.address || !form.time || !form.date || !form.employeeId) return;
    await fetch("/api/shifts", { method: "POST", body: JSON.stringify(form) });
    setForm((f) => ({ ...f, address: "", time: "", repeats: false }));
    setShowForm(false);
    refresh();
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3>Schedule</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Shift"}</button>
      </div>

      {showForm && (
        <BlueprintCard style={{ marginTop: 14, gap: 8 }}>
          <div className="field">
            <label>Employee</label>
            <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Job type</label>
            <select className="input" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
              {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Date</label>
              <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Time</label>
              <input className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="9:00 AM" />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginTop: 4 }}>
            <input type="checkbox" checked={form.repeats} onChange={(e) => setForm({ ...form, repeats: e.target.checked })} />
            Repeats weekly
          </label>
          <button className="btn btn-primary btn-block" onClick={submit}>Save Shift</button>
        </BlueprintCard>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {shifts.map((s) => (
          <BlueprintCard key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="card-title" style={{ fontSize: 15 }}>{new Date(s.date).toLocaleDateString([], { weekday: "short" })} · {s.time}</div>
              <div className="tag tag-accent">{s.employeeName}</div>
            </div>
            <div className="card-meta">{s.jobType} — {s.address}</div>
            {s.repeats && <div className="tag tag-outline" style={{ width: "fit-content" }}>↻ Repeats weekly</div>}
          </BlueprintCard>
        ))}
      </div>
    </div>
  );
}
