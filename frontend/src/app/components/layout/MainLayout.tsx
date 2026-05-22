import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="ml-72 transition-all duration-300">
        <Navbar />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
