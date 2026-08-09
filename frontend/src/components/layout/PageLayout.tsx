import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";

export default function PageLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-lg py-xl">
        <section className="animate-fade-in">{children ?? <Outlet />}</section>
      </main>
    </div>
  );
}