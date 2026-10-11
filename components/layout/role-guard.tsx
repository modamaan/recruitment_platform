"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthToken, authFetch } from "@/lib/auth/token";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkRole() {
      try {
        const token = await getAuthToken();

        if (!token) {
          if (isMounted) router.push("/login");
          return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await authFetch(`${backendUrl}/api/me`);

        if (res.ok) {
          const user = await res.json();
          
          const getDashboardPath = (role: string) => {
            if (role === "placement_cell") return "/dashboard/placement-cell";
            return `/dashboard/${role}`;
          };

          if (pathname.startsWith("/dashboard/student") && user.role !== "student") {
            if (isMounted) router.push(getDashboardPath(user.role));
            return;
          }
          
          if (pathname.startsWith("/dashboard/recruiter") && user.role !== "recruiter") {
            if (isMounted) router.push(getDashboardPath(user.role));
            return;
          }

          if (pathname.startsWith("/dashboard/placement-cell") && user.role !== "placement_cell") {
            if (isMounted) router.push(getDashboardPath(user.role));
            return;
          }
          
          if (isMounted) setIsAuthorized(true);
        } else {
          localStorage.removeItem("authToken");
          if (isMounted) router.push("/login");
        }
      } catch (err) {
        localStorage.removeItem("authToken");
        if (isMounted) router.push("/login");
      }
    }

    checkRole();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  return (
    <>
      {!isAuthorized && (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="size-12 rounded-full border-4 border-black border-t-transparent animate-spin mb-4"></div>
            <p className="font-kalam text-xl">Verifying access...</p>
          </div>
        </div>
      )}
      <div style={{ display: isAuthorized ? 'block' : 'none' }}>
        {children}
      </div>
    </>
  );
}
