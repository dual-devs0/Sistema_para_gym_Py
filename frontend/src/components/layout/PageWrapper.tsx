import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface Props {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function PageWrapper({ title, children, action }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {action && <div className="flex gap-2">{action}</div>}
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
