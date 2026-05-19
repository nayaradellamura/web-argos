"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  Workflow,
  Database,
  Building2,
  LogOut,
  X,
  ClipboardList,
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
    icon: ClipboardList,
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
          "fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0",
          isCollapsed ? "w-16 min-w-16 max-w-16" : "w-64 min-w-64 max-w-64",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Topo: botão + marca */}
        <div
          className={cn(
            "border-b border-sidebar-border py-2",
            isCollapsed ? "px-0" : "px-2",
          )}
        >
          <div
            className={cn(
              "flex h-9 items-center",
              isCollapsed ? "justify-center" : "justify-end",
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="hidden text-sidebar-foreground hover:bg-sidebar-accent lg:inline-flex"
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
              className="text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar menu</span>
            </Button>
          </div>

          <div className="mt-1 flex h-12 items-center justify-center overflow-hidden">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center overflow-hidden transition-all duration-300 ease-in-out",
                isCollapsed
                  ? "w-full justify-center"
                  : "w-full justify-start px-2",
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
                <img
                  src="/eye_argos.svg"
                  alt="Logo ARGOS"
                  className="h-7 w-7 object-contain"
                />
              </div>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isCollapsed
                    ? "w-0 opacity-0 pointer-events-none"
                    : "ml-3 w-36 opacity-100",
                )}
              >
                <img
                  src="/display_argos.svg"
                  alt="ARGOS"
                  className="h-auto w-36 object-contain dark:invert"
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center rounded-lg py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out",
                      isCollapsed ? "justify-center px-2" : "gap-3 px-3",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span
                      className={cn(
                        "transition-all duration-300 ease-in-out",
                        isCollapsed
                          ? "w-0 overflow-hidden opacity-0 pointer-events-none"
                          : "w-auto opacity-100",
                      )}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-2 py-4">
          <ul className="space-y-1">
            {footerItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-lg py-2.5 text-sm font-medium whitespace-nowrap text-sidebar-foreground transition-all duration-300 ease-in-out hover:bg-sidebar-accent",
                    isCollapsed ? "justify-center px-2" : "gap-3 px-3",
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span
                    className={cn(
                      "transition-all duration-300 ease-in-out",
                      isCollapsed
                        ? "w-0 overflow-hidden opacity-0 pointer-events-none"
                        : "w-auto opacity-100",
                    )}
                  >
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
