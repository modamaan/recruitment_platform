"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthToken, authFetch } from "@/lib/auth/token";
import { RecruiterApprovalGate } from "@/components/layout/recruiter-approval-gate";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pendingRecruiter, setPendingRecruiter] = useState<any | null>(null);

  const checkRole = useCallback(async () => {
    try {
      const token = await getAuthToken();

      if (!token) {
        router.push("/login");
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
          router.push(getDashboardPath(user.role));
          return;
        }
        
        if (pathname.startsWith("/dashboard/recruiter")) {
          if (user.role !== "recruiter") {
            router.push(getDashboardPath(user.role));
            return;
          }
          // Strict Placement Cell Approval Check for Recruiters:
          // Prevents students from registering as recruiters to gain unauthorized access!
          if (user.verificationStatus !== "verified") {
            setPendingRecruiter(user);
            setIsAuthorized(false);
            return;
          } else {
            setPendingRecruiter(null);
          }
        }

        if ((pathname.startsWith("/dashboard/placement-cell") || pathname.startsWith("/dashboard/placement_cell")) && user.role !== "placement_cell") {
          router.push(getDashboardPath(user.role));
          return;
        }
        
        setPendingRecruiter(null);
        setIsAuthorized(true);
      } else {
        localStorage.removeItem("authToken");
        router.push("/login");
      }
    } catch (err) {
      localStorage.removeItem("authToken");
      router.push("/login");
    }
  }, [pathname, router]);

  useEffect(() => {
    checkRole();
  }, [checkRole]);

  return (
    <>
      {pendingRecruiter ? (
        <RecruiterApprovalGate user={pendingRecruiter} onRefresh={checkRole} />
      ) : !isAuthorized ? (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="size-12 rounded-full border-4 border-black border-t-transparent animate-spin mb-4"></div>
            <p className="font-kalam text-xl">Verifying access...</p>
          </div>
        </div>
      ) : null}
      <div style={{ display: isAuthorized && !pendingRecruiter ? 'block' : 'none' }}>
        {children}
      </div>
    </>
  );
}
