"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

const JOB_TYPES = ["Residential Cleaning", "Commercial Cleaning", "Local Moving", "Long-Distance Moving", "Lawn Care"];
const emptyForm = { employeeId: "", jobType: JOB_TYPES[0], address: "", date: "", time: "", repeats: false };

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
          <button className="btn btn-primary btn-block" onClick={submit}>{editingId ? "Save Changes" : "Save Shift"}</button>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              {s.repeats ? <div className="tag tag-outline">↻ Repeats weekly</div> : <span />}
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
app/api/shifts/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWorkWeekBounds } from "@/lib/workweek";

// Expands any active RecurringTemplate into a concrete Shift for the
// current work week if one doesn't already exist for that template+week.
async function ensureShiftsForCurrentWeek() {
  const { start } = getWorkWeekBounds();
  const templates = await prisma.recurringTemplate.findMany({ where: { active: true } });

  for (const t of templates) {
    const shiftDate = new Date(start);
    const daysFromFriday = (t.dayOfWeek - 5 + 7) % 7;
    shiftDate.setDate(start.getDate() + daysFromFriday);

    const existing = await prisma.shift.findFirst({
      where: { templateId: t.id, date: shiftDate },
    });
    if (!existing) {
      await prisma.shift.create({
        data: {
          employeeId: t.employeeId,
          date: shiftDate,
          time: t.time,
          jobType: t.jobType,
          address: t.address,
          templateId: t.id,
        },
      });
    }
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureShiftsForCurrentWeek();

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const { start, end } = getWorkWeekBounds();

  const shifts = await prisma.shift.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(employeeId ? { employeeId } : {}),
    },
    include: { employee: true, template: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return NextResponse.json({
    shifts: shifts.map((s) => ({
      id: s.id,
      date: s.date,
      time: s.time,
      employeeId: s.employeeId,
      employeeName: s.employee.name,
      jobType: s.jobType,
      address: s.address,
      repeats: !!s.templateId,
    })),
  });
}

// Manager creates a shift. If `repeats` is true, also creates a
// RecurringTemplate so future work weeks auto-generate the instance.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }

  const body = await req.json();
  const { employeeId, date, time, jobType, address, repeats } = body;
  if (!employeeId || !date || !time || !jobType || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let templateId: string | undefined;
  if (repeats) {
    const template = await prisma.recurringTemplate.create({
      data: { employeeId, dayOfWeek: new Date(date).getDay(), time, jobType, address },
    });
    templateId = template.id;
  }

  const shift = await prisma.shift.create({
    data: { employeeId, date: new Date(date), time, jobType, address, templateId },
  });

  return NextResponse.json({ shift });
}

// Manager edits a single shift instance's details.
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const body = await req.json();
  const { id, employeeId, date, time, jobType, address } = body;
  if (!id || !employeeId || !date || !time || !jobType || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const shift = await prisma.shift.update({
    where: { id },
    data: { employeeId, date: new Date(date), time, jobType, address },
  });
  return NextResponse.json({ shift });
}

// Manager deletes a shift. `series=true` also stops and removes all future
// instances of its weekly recurrence (if it has one).
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const series = searchParams.get("series") === "true";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (series && shift.templateId) {
    await prisma.shift.deleteMany({ where: { templateId: shift.templateId } });
    await prisma.recurringTemplate.update({ where: { id: shift.templateId }, data: { active: false } });
  } else {
    await prisma.shift.delete({ where: { id } });
  }
  return NextResponse.json({ ok: true });
}
