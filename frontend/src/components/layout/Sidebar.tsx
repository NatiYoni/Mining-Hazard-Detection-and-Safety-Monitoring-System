"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Activity, AlertTriangle, Settings, LogOut, Video, HardHat } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
    roles: ['Admin', 'Supervisor'],
  },
  {
    label: "Safety Check",
    icon: HardHat,
    href: "/dashboard/worker",
    color: "text-emerald-500",
    roles: ['Worker', 'Admin'],
  },
  {
    label: "Real-time Monitoring",
    icon: Activity,
    href: "/dashboard/monitoring",
    color: "text-violet-500",
    roles: ['Admin', 'Supervisor'],
  },
  {
    label: "Video Stream",
    icon: Video,
    href: "/dashboard/stream",
    color: "text-orange-500",
    roles: ['Admin', 'Supervisor'],
  },
  {
    label: "Alert Center",
    icon: AlertTriangle,
    href: "/alerts",
    color: "text-pink-700",
    roles: ['Admin', 'Supervisor', 'Worker'],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    color: "text-gray-500",
    roles: ['Admin', 'Supervisor', 'Worker'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const filteredRoutes = routes.filter(route => 
    !route.roles || (user && route.roles.includes(user.role))
  );

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-card text-card-foreground border-r border-border">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <h1 className="text-2xl font-bold">
            MineSafe
          </h1>
        </Link>
        <div className="space-y-1">
          {filteredRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-accent-foreground hover:bg-accent rounded-lg transition",
                pathname === route.href ? "text-accent-foreground bg-accent" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <button
          onClick={logout}
          className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-accent-foreground hover:bg-accent rounded-lg transition text-muted-foreground"
        >
          <div className="flex items-center flex-1">
            <LogOut className="h-5 w-5 mr-3 text-destructive" />
            Logout
          </div>
        </button>
      </div>
    </div>
  );
}
