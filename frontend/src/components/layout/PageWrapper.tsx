import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";

interface PageWrapperProps {
  title?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export default function PageWrapper({ title, action, children }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-lg py-xl">
        {(title || action) && (
          <div className="mb-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
            {title && <h1 className="text-2xl font-bold text-on-surface">{title}</h1>}
            {action}
          </div>
        )}
        {children ?? <Outlet />}
      </main>
    </div>
  );
}