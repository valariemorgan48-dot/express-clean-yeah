"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

const JOB_TYPES = ["Residential Cleaning", "Commercial Cleaning", "Local Moving", "Long-Distance Moving", "Lawn Care"];
const emptyForm = { employeeId: "", jobType: JOB_TYPES[0], address: "", date: "", time: "", repeats: false, rate: "" };

export default function ManagerSchedule() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function refresh() {
    const [shiftsRes, empRes] = await Promise.all([fetch("/api/shifts"), fetch("/api/employees")]);
    const shiftsData = await shiftsRes.json();
    const empData = await empRes.json();
    setShifts(shiftsData.shifts ?? []);
    setEmployees(empData.employees ?? []);
    setForm((f) => (f.employeeId ? f : { ...f, employeeId: empData.employees?.[0]?.id ?? "" }));
  }

  useEffect(() => {
    refresh();
  }, []);

  function startAdd() {
    setEditingId(null);
    setForm({ ...emptyForm, employeeId: employees[0]?.id ?? "" });
    setShowForm(true);
  }

  function startEdit(s: any) {
    setEditingId(s.id);
    setForm({
      employeeId: s.employeeId,
      jobType: s.jobType,
      address: s.address,
      date: new Date(s.date).toISOString().slice(0, 10),
      time: s.time,
      repeats: s.repeats,
      rate: s.rate !== null && s.rate !== undefined ? String(s.rate) : "",
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function submit() {
    if (!form.address || !form.time || !form.date || !form.employeeId) return;
    if (editingId) {
      await fetch("/api/shifts", { method: "PUT", body: JSON.stringify({ id: editingId, ...form }) });
    } else {
      await fetch("/api/shifts", { method: "POST", body: JSON.stringify(form) });
    }
    cancelForm();
    refresh();
  }

  async function removeShift(s: any) {
    let series = false;
    if (s.repeats) {
      series = confirm("This shift repeats weekly. Click OK to delete the entire recurring series, or Cancel to delete just this one occurrence.");
    } else if (!confirm("Delete this shift?")) {
      return;
    }
    await fetch(`/api/shifts?id=${s.id}&series=${series}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3>Schedule</h3>
        <button className="btn btn-primary" onClick={() => (showForm ? cancelForm() : startAdd())}>
          {showForm ? "Cancel" : "+ Add Shift"}
        </button>
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
          {!editingId && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginTop: 4 }}>
              <input type="checkbox" checked={form.repeats} onChange={(e) => setForm({ ...form, repeats: e.target.checked })} />
              Repeats weekly
            </label>
          )}
          {!form.repeats && (
            <div className="field">
              <label>Pay rate for this job ($/hr, optional override)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="Leave blank to use employee's normal rate" />
            </div>
          )}
          <button className="btn btn-primary btn-block" onClick={submit}>{editingId ? "Save Changes" : "Save Shift"}</button>
        </BlueprintCard>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {shifts.map((s) => (
          <BlueprintCard key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="card-title" style={{ fontSize: 15 }}>{new Date(s.date).toLocaleDateString([], { weekday: "short", timeZone: "UTC" })} · {s.time}</div>
              <div className="tag tag-accent">{s.employeeName}</div>
            </div>
            <div className="card-meta">{s.jobType} — {s.address}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {s.repeats && <div className="tag tag-outline">↻ Repeats weekly</div>}
                {s.rate != null && <div className="tag tag-accent">${s.rate.toFixed(2)}/hr</div>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => startEdit(s)}>Edit</button>
                <button className="btn" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => removeShift(s)}>Delete</button>
              </div>
            </div>
          </BlueprintCard>
        ))}
      </div>
    </div>
  );
}
