import { ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface PageWrapperProps {
  title?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export default function PageWrapper({ title, action, children }: PageWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <section className="flex-1 overflow-y-auto p-lg bg-surface-container-lowest">
          {(title || action) && (
            <div className="mb-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
              {title && <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>}
              {action}
            </div>
          )}
          {children ?? <Outlet />}
        </section>
      </main>
    </div>
  );
}