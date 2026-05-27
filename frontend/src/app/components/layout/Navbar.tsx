import {
  Search,
  ChevronDown,
  LogOut
} from "lucide-react";

import { Input } from "../ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import {
  Avatar,
  AvatarFallback
} from "../ui/avatar";

import { useAuth } from "../../contexts/AuthContext";

import { useNavigate } from "react-router";

import { toast } from "sonner";

export function Navbar() {

  const { logout } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {

    logout();

    toast.success(
      "Logged out successfully"
    );

    navigate("/login");
  };

  return (

    <header className="bg-white border-b border-border px-8 py-4">

      <div className="flex items-center justify-between">

        {/* SEARCH */}
        <div>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">

          {/* DATE */}
          <div className="text-sm text-text-mid hidden md:block">

            Today:{" "}

            {new Date().toLocaleDateString(
              "en-IN",
              {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            )}

          </div>

          {/* ADMIN */}
          <DropdownMenu>

            <DropdownMenuTrigger asChild>

              <button className="flex items-center gap-3 px-3 py-2 hover:bg-secondary rounded-xl transition-colors">

                <Avatar className="h-9 w-9">

                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-white">

                    AR

                  </AvatarFallback>

                </Avatar>

                <div className="text-left hidden lg:block">

                  <p className="text-sm font-medium text-text-dark">
                    Admin User
                  </p>

                  <p className="text-xs text-text-light">
                    Super Admin
                  </p>

                </div>

                <ChevronDown className="w-4 h-4 text-text-mid hidden lg:block" />

              </button>

            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-44"
            >

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
              >

                <LogOut className="w-4 h-4 mr-2" />

                Logout

              </DropdownMenuItem>

            </DropdownMenuContent>

          </DropdownMenu>

        </div>

      </div>

    </header>
  );
}