import { Suspense } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import RoleGuard from "@/components/layout/role-guard"

export const instant = false;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className="bg-[#f6f5ef] relative overflow-hidden text-[#1a1a1a]">
        {/* Background Lined Paper Effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50 z-0"
          style={{
            backgroundImage: 'linear-gradient(#e5e4dc 1px, transparent 1px), linear-gradient(90deg, #e5e4dc 1px, transparent 1px)',
            backgroundSize: '100% 2rem, 4rem 100%',
          }}
        />
        <div className="absolute left-8 md:left-12 top-0 bottom-0 w-[2px] bg-red-400/30 z-0 hidden sm:block"></div>
        <div className="absolute left-9 md:left-[3.25rem] top-0 bottom-0 w-[2px] bg-red-400/30 z-0 hidden sm:block"></div>

        <header className="flex h-16 shrink-0 items-center gap-2 border-b-2 border-black/10 px-4 relative z-10 bg-[#f6f5ef]/80 backdrop-blur-sm">
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 relative z-10 font-sans">
          <Suspense fallback={<div className="flex h-[80vh] items-center justify-center">Verifying...</div>}>
            <RoleGuard>
              {children}
            </RoleGuard>
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
