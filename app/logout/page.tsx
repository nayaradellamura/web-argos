"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { logout } from "@/lib/services/auth";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const performLogout = async () => {
      try {
        await logout();
      } finally {
        if (isMounted) {
          router.replace("/login");
        }
      }
    };

    void performLogout();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <AppLayout>
      <div className="h-full" />
      <LoadingScreen fullScreen message="Saindo..." />
    </AppLayout>
  );
}
