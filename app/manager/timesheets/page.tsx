"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";
import { getPastWorkWeeks } from "@/lib/workweek";

const JOB_TYPES = ["Residential Cleaning", "Commercial Cleaning", "Local Moving", "Long-Distance Moving", "Lawn Care"];
const weeks = getPastWorkWeeks(12);

function toLocalInput(d: string | null) {
  if (!d) return "";
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ManagerTimesheets() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [weekIdx, setWeekIdx] = useState(0);
  const [entries, setEntries] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ clockIn: "", clockOut: "", jobType: JOB_TYPES[0], address: "", rate: "" });
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        setEmployees(d.employees ?? []);
        if (d.employees?.length && !employeeId) setEmployeeId(d.employees[0].id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    if (!employeeId) return;
    const weekStartISO = weeks[weekIdx].start.toISOString();
    const [r, summaryRes] = await Promise.all([
      fetch(`/api/timeentries?employeeId=${employeeId}&weekStart=${weekStartISO}`),
      fetch(`/api/payroll/summary?start=${weekStartISO}`),
    ]);
    const d = await r.json();
    const summaryData = await summaryRes.json();
    setEntries(d.entries ?? []);
    setApproved((summaryData.summary ?? []).find((s: any) => s.id === employeeId)?.approved ?? false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, weekIdx]);

  function startAdd() {
    setEditingId(null);
    setForm({ clockIn: "", clockOut: "", jobType: JOB_TYPES[0], address: "", rate: "" });
    setError("");
    setShowForm(true);
  }

  function startEdit(e: any) {
    setEditingId(e.id);
    setForm({
      clockIn: toLocalInput(e.clockIn),
      clockOut: toLocalInput(e.clockOut),
      jobType: e.jobType || JOB_TYPES[0],
      address: e.address || "",
      rate: e.rate !== null && e.rate !== undefined ? String(e.rate) : "",
    });
    setError("");
    setShowForm(true);
  }

  async function submit() {
    setError("");
    if (!form.clockIn) {
      setError("Clock-in time is required.");
      return;
    }
    const fixedForm = {
      ...form,
      clockIn: new Date(form.clockIn).toISOString(),
      clockOut: form.clockOut ? new Date(form.clockOut).toISOString() : "",
    };
    const payload = { employeeId, ...fixedForm };
    const res = editingId
      ? await fetch("/api/timeentries", { method: "PUT", body: JSON.stringify({ id: editingId, ...fixedForm }) })
      : await fetch("/api/timeentries", { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not save entry");
      return;
    }
    setShowForm(false);
    setEditingId(null);
    refresh();
  }

  async function removeEntry(id: string) {
    if (!confirm("Delete this time entry?")) return;
    await fetch(`/api/timeentries?id=${id}`, { method: "DELETE" });
    refresh();
  }

  const weekStartISO = weeks[weekIdx].start.toISOString();

  async function toggleApproval() {
    if (approved) {
      if (!confirm("Remove approval for this employee's hours this week?")) return;
      await fetch(`/api/approvals?employeeId=${employeeId}&weekStart=${weekStartISO}`, { method: "DELETE" });
    } else {
      await fetch("/api/approvals", { method: "POST", body: JSON.stringify({ employeeId, weekStart: weekStartISO }) });
    }
    refresh();
  }

  return (
    <div style={{ marginTop: 8 }}>
      <h3>Timesheets</h3>
      <p style={{ fontSize: 13, opacity: 0.7, marginTop: -4 }}>Add or fix an employee's clock in/out times — e.g. a missed punch.</p>

      <BlueprintCard style={{ marginTop: 16, gap: 8 }}>
        <div className="field">
          <label>Employee</label>
          <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Work week</label>
          <select className="input" value={weekIdx} onChange={(e) => setWeekIdx(Number(e.target.value))}>
            {weeks.map((w, i) => (
              <option key={i} value={i}>{w.label}{i === 0 ? " (current)" : ""}</option>
            ))}
          </select>
        </div>
      </BlueprintCard>

      <BlueprintCard style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <div className="card-meta" style={{ fontSize: 13 }}>{approved ? "✓ Hours approved for this week" : "Hours not yet approved for this week"}</div>
        <button className={approved ? "btn" : "btn btn-primary"} style={{ fontSize: 12, padding: "6px 10px" }} onClick={toggleApproval}>
          {approved ? "Approved — undo" : "Approve Hours"}
        </button>
      </BlueprintCard>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0 10px" }}>
        <h6 style={{ margin: 0 }}>Entries</h6>
        <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => (showForm ? setShowForm(false) : startAdd())}>
          {showForm ? "Cancel" : "+ Add Entry"}
        </button>
      </div>

      {showForm && (
        <BlueprintCard style={{ marginBottom: 12, gap: 8 }}>
          <div className="field">
            <label>Clock in</label>
            <input className="input" type="datetime-local" value={form.clockIn} onChange={(e) => setForm({ ...form, clockIn: e.target.value })} />
          </div>
          <div className="field">
            <label>Clock out (leave blank if still open)</label>
            <input className="input" type="datetime-local" value={form.clockOut} onChange={(e) => setForm({ ...form, clockOut: e.target.value })} />
          </div>
          <div className="field">
            <label>Job type</label>
            <select className="input" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
              {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Address (optional)</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
          </div>
          <div className="field">
            <label>Pay rate for this entry ($/hr, optional override)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="Leave blank to use employee's normal rate" />
          </div>
          {error && <div style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</div>}
          <button className="btn btn-primary btn-block" onClick={submit}>{editingId ? "Save Changes" : "Add Entry"}</button>
        </BlueprintCard>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((e) => (
          <BlueprintCard key={e.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="card-title" style={{ fontSize: 15 }}>
                {new Date(e.clockIn).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                {" – "}
                {e.clockOut ? new Date(e.clockOut).toLocaleString([], { hour: "numeric", minute: "2-digit" }) : "still clocked in"}
              </div>
              {e.jobType && <div className="tag tag-accent">{e.jobType}</div>}
            </div>
            {e.address && <div className="card-meta">{e.address}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button className="btn" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => startEdit(e)}>Edit</button>
              <button className="btn" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => removeEntry(e.id)}>Delete</button>
            </div>
          </BlueprintCard>
        ))}
        {entries.length === 0 && <div style={{ fontSize: 13, opacity: 0.6 }}>No entries for this week.</div>}
      </div>
    </div>
  );
}
