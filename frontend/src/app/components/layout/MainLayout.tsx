import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface">

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={`transition-all duration-300 ${
          collapsed ? "ml-28" : "ml-72"
        }`}
      >
        <Navbar />

        <main className="p-8">
          {children}
        </main>
      </div>

    </div>
  );
}