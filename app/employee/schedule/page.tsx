"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import BlueprintCard from "@/components/BlueprintCard";

export default function EmployeeSchedule() {
  const { data: session } = useSession();
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    const employeeId = (session?.user as any)?.employeeId;
    if (!employeeId) return;
    fetch(`/api/shifts?employeeId=${employeeId}`)
      .then((r) => r.json())
      .then((d) => setShifts(d.shifts ?? []));
  }, [session]);

  return (
    <div style={{ marginTop: 8 }}>
      <h3>My Schedule</h3>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {shifts.map((s) => (
          <BlueprintCard key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
             <div className="card-title">{new Date(s.date).toLocaleDateString([], { weekday: "short", timeZone: "UTC" })}</div>
              <div className="tag tag-accent">{s.time}</div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{s.jobType}</div>
            <div className="card-meta">{s.address}</div>
            {s.repeats && <div className="tag tag-outline" style={{ width: "fit-content" }}>↻ Repeats weekly</div>}
          </BlueprintCard>
        ))}
        {shifts.length === 0 && <div style={{ fontSize: 13, opacity: 0.6 }}>No shifts scheduled this work week.</div>}
      </div>
    </div>
  );
}
