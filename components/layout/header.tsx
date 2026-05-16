"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { subscribeAuthState } from "@/lib/services/auth";
import { db } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [userInitials, setUserInitials] = useState("US");
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);

  const resolvePhotoFromUsersCollection = async (
    uid?: string | null,
    email?: string | null,
  ) => {
    const usersRef = collection(db, "users");

    const tryGetPhotoFromQuery = async (
      field: "authUid" | "uid" | "email",
      value?: string | null,
    ) => {
      if (!value) return null;

      const snapshot = await getDocs(
        query(usersRef, where(field, "==", value), limit(1)),
      );
      const first = snapshot.docs[0]?.data();
      const photoURL = first?.photoURL;
      return typeof photoURL === "string" && photoURL.trim()
        ? photoURL.trim()
        : null;
    };

    return (
      (await tryGetPhotoFromQuery("authUid", uid)) ||
      (await tryGetPhotoFromQuery("uid", uid)) ||
      (await tryGetPhotoFromQuery("email", email))
    );
  };

  const getInitials = (value: string) => {
    const parts = value.trim().split(/\s+/).filter(Boolean).slice(0, 2);

    if (parts.length === 0) return "US";

    return parts
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (user) => {
      const resolvedName =
        user?.displayName?.trim() || user?.email?.trim() || "Usuário";
      setUserName(resolvedName);
      setUserInitials(getInitials(resolvedName));

      const authPhoto = user?.photoURL?.trim() || null;
      if (authPhoto) {
        setUserPhotoUrl(authPhoto);
        return;
      }

      if (!user) {
        setUserPhotoUrl(null);
        return;
      }

      try {
        const dbPhoto = await resolvePhotoFromUsersCollection(
          user.uid,
          user.email,
        );
        setUserPhotoUrl(dbPhoto);
      } catch {
        setUserPhotoUrl(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 min-h-20 shrink-0 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-foreground hover:bg-muted"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </Button>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-foreground hover:bg-muted"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Alternar tema</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 px-2 hover:bg-muted"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={userPhotoUrl ?? undefined}
                  alt={userName}
                  className="object-[center_30%]"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-foreground">
                  {userName}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild className="text-destructive">
              <Link href="/logout">Sair</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
