"use client"

import * as React from "react"
import { Home, Briefcase, FileText, Users, Mic, LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const studentNav = [
  { title: "Dashboard", url: "/dashboard/student", icon: Home },
  { title: "My Profile & Resume", url: "/dashboard/student/profile", icon: FileText },
  { title: "Matched Jobs", url: "/dashboard/student/jobs", icon: Briefcase },
  { title: "Mock Interview", url: "/dashboard/student/interview", icon: Mic },
]

const recruiterNav = [
  { title: "Dashboard", url: "/dashboard/recruiter", icon: Home },
  { title: "Post a Job", url: "/dashboard/recruiter/jobs", icon: Briefcase },
  { title: "Candidates", url: "/dashboard/recruiter/candidates", icon: Users },
  { title: "Reports", url: "/dashboard/recruiter/reports", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await authClient.signOut();
    router.refresh();
    router.push("/login");
  };

  // Determine role based on the current URL path for this mockup phase
  const isStudent = pathname?.startsWith("/dashboard/student")
  const isRecruiter = pathname?.startsWith("/dashboard/recruiter")

  return (
    <Sidebar>
      <SidebarHeader className="p-6 pb-4">
        <h2 className="text-3xl font-bold tracking-tight text-black font-kalam transform -rotate-1">
          <span className="bg-[#fcec6a] px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-sm inline-block border border-black">n.</span> Placement
        </h2>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>

        {/* Render Student Navigation if on a student route */}
        {isStudent && (
          <SidebarGroup>
            <SidebarGroupLabel>Student Portal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {studentNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<a href={item.url} />} isActive={pathname === item.url}>
                      <item.icon />
                      <span className={pathname === item.url ? "font-bold underline decoration-2 underline-offset-4" : ""}>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Render Recruiter Navigation if on a recruiter route */}
        {isRecruiter && (
          <SidebarGroup>
            <SidebarGroupLabel>Recruiter Portal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recruiterNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<a href={item.url} />} isActive={pathname === item.url}>
                      <item.icon />
                      <span className={pathname === item.url ? "font-bold underline decoration-2 underline-offset-4" : ""}>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="text-muted-foreground" />
              <span className="text-muted-foreground">Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
