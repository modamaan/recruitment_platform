"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkRole() {
      try {
        let token = localStorage.getItem("authToken");
        
        // If no token in local storage, try to fetch it from auth client
        if (!token) {
          const { data: tokenData, error } = await authClient.token();
          token = tokenData?.token as string;
          if (token) {
            localStorage.setItem("authToken", token);
          }
        }

        if (!token) {
          if (isMounted) router.push("/login");
          return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const user = await res.json();
          
          if (pathname.startsWith("/dashboard/student") && user.role !== "student") {
            if (isMounted) router.push(`/dashboard/${user.role}`);
            return;
          }
          
          if (pathname.startsWith("/dashboard/recruiter") && user.role !== "recruiter") {
            if (isMounted) router.push(`/dashboard/${user.role}`);
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
