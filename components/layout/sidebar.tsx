"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  Workflow,
  Database,
  Building2,
  AlertTriangle,
  LogOut,
  Eye,
  X,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Sinistros",
    href: "/orquestracao",
    icon: Workflow,
  },
  {
    name: "Vistorias",
    href: "/vistoria",
    icon: Stethoscope,
  },
  {
    name: "Cadastros",
    href: "/registros",
    icon: Database,
  },
  {
    name: "Oficinas Credenciadas",
    href: "/rede-credenciada",
    icon: Building2,
  },
  {
    name: "Alertas",
    href: "/alertas",
    icon: AlertTriangle,
  },
];

const footerItems = [
  {
    name: "Sair",
    href: "/logout",
    icon: LogOut,
  },
];

export function Sidebar({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-72 min-w-72 max-w-72 shrink-0 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isCollapsed && "lg:w-20 lg:min-w-20 lg:max-w-20",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-20 items-center justify-between border-b border-sidebar-border px-6",
            isCollapsed && "lg:justify-center lg:px-2",
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "lg:hidden",
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Eye className="h-5 w-5 text-primary-foreground" />
            </div>
            <span
              className={cn(
                "text-lg font-semibold tracking-tight text-sidebar-foreground",
                isCollapsed && "lg:hidden",
              )}
            >
              ARGOS
            </span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onToggleCollapse}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">
              {isCollapsed ? "Abrir menu lateral" : "Retrair menu lateral"}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar menu</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto px-3 py-4",
            isCollapsed && "lg:hidden",
          )}
        >
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                      isCollapsed && "lg:justify-center lg:px-2",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className={cn(isCollapsed && "lg:hidden")}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-sidebar-border px-3 py-4",
            isCollapsed && "lg:hidden",
          )}
        >
          <ul className="space-y-1">
            {footerItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                    isCollapsed && "lg:justify-center lg:px-2",
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={cn(isCollapsed && "lg:hidden")}>
                    {item.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
