import { ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function PageLayout({ children }: { children?: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Content */}
        <section className="flex-1 overflow-y-auto p-lg bg-surface-container-lowest">
          {children ?? <Outlet />}
        </section>
      </main>
    </div>
  );
}