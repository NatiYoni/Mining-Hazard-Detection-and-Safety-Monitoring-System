"use client";

import { useAuth } from "@/context/AuthContext";
import { User } from "lucide-react";

export function Header() {
  const { user } = useAuth();

  return (
    <div className="border-b p-4 flex justify-between items-center bg-white">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-500" />
          </div>
          <span className="font-medium">{user?.username || "User"}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">
            {user?.role || "Guest"}
          </span>
        </div>
      </div>
    </div>
  );
}
