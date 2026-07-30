import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function PageLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <section className="flex-1 overflow-y-auto p-lg bg-surface-container-lowest">
          {children ?? <Outlet />}
        </section>
      </main>
    </div>
  );
}