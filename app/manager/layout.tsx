import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar />
      <div style={{ flex: 1, padding: "4px 20px 20px" }}>{children}</div>
      <BottomNav base="manager" homeLabel="Team" />
    </div>
  );
}
