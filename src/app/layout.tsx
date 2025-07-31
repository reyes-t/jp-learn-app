
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  FileQuestion,
  Languages,
  LayoutDashboard,
  Layers,
  ShieldCheck,
  User,
} from "lucide-react"
import React, { useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useAuth();
  const { setOpenMobile } = useSidebar();
  
  const isActive = (path: string) => pathname === path

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const noNavRoutes = ['/login', '/register', '/admin'];
  const showNav = user && !noNavRoutes.includes(pathname);
  const isAdmin = user?.email === 'admin@sakuralearn.com';


  return (
    <>
      {showNav && (
        <Sidebar>
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2">
              <Languages className="size-8 text-primary" />
              <span className="text-xl font-bold font-headline text-primary-foreground group-data-[collapsible=icon]:hidden">
                SakuraLearn
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/")}
                  tooltip="Dashboard"
                >
                  <Link href="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/decks")}
                  tooltip="Decks"
                >
                  <Link href="/decks">
                    <Layers />
                    <span>Decks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/grammar")}
                  tooltip="Grammar"
                >
                  <Link href="/grammar">
                    <BookOpen />
                    <span>Grammar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/quizzes")}
                  tooltip="Quizzes"
                >
                  <Link href="/quizzes">
                    <FileQuestion />
                    <span>Quizzes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
               {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/admin")}
                    tooltip="Admin"
                  >
                    <Link href="/admin/dashboard">
                      <ShieldCheck />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/account")}
                  tooltip="Account"
                >
                  <Link href="/account">
                    <User />
                    <span>Account</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      )}
      <SidebarInset className={cn("flex flex-col", !showNav && "m-0 p-0 h-screen")}>
        {showNav && <DashboardHeader />}
        <main className={cn("flex-1 overflow-y-auto", showNav && "p-4 md:p-6 lg:p-8")}>
          {children}
        </main>
      </SidebarInset>
    </>
  );
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <SidebarProvider>
            <AppContent>{children}</AppContent>
          </SidebarProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
