"use client";

import { useAuth } from "@/context/AuthContext";
import { User } from "lucide-react";

export function Header() {
  const { user } = useAuth();

  return (
    <div className="border-b border-border p-4 flex justify-between items-center bg-background">
      <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-5 w-5 text-secondary-foreground" />
          </div>
          <span className="font-medium text-foreground">{user?.username || "User"}</span>
          <span className="text-xs text-secondary-foreground bg-secondary px-2 py-1 rounded-full capitalize">
            {user?.role || "Guest"}
          </span>
        </div>
      </div>
    </div>
  );
}
