import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  FileCheck,
  Phone,
  MessageSquare,
  Bell,
  Calculator,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "../ui/utils";
import { useState } from "react";

const menuItems = [
  { icon: FileText, label: "Filings", path: "/filings" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: FileCheck, label: "Documents", path: "/documents" },
  { icon: Phone, label: "Callbacks", path: "/callbacks" },
  { icon: MessageSquare, label: "Support", path: "/support" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Calculator, label: "Tax Tools", path: "/tax-tools" },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-4 top-4 bottom-4 bg-white rounded-3xl shadow-lg transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div>
                <h1 className="font-semibold text-text-dark">D Tax Rail</h1>
                <p className="text-xs text-text-light">Admin Panel</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-text-mid" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-text-mid" />
            )}
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md"
                      : "text-text-mid hover:bg-secondary hover:text-primary"
                  )}
                >
                  <Icon className={cn("w-5 h-5", collapsed && "mx-auto")} />
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-text-light text-center">
            <p>Version 1.0.0</p>
            <p className="mt-1">© 2026 D Tax Rail</p>
          </div>
        </div>
      )}
    </aside>
  );
}
