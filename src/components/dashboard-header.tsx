
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CircleUser, Home, Search, Edit } from "lucide-react"
import React, { useState, useEffect } from "react"
import { basicDecks as initialDecks } from "@/lib/data"
import type { Deck } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

// A helper function to capitalize the first letter of a string
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const HeaderBreadcrumb = () => {
    const pathname = usePathname();
    const { user } = useAuth();
    const [deckTitle, setDeckTitle] = useState<string | undefined>(undefined);
    const pathSegments = pathname.split("/").filter(Boolean);

    useEffect(() => {
      const fetchDeckTitle = async () => {
        if (pathSegments.length >= 2 && pathSegments[0] === 'decks' && user) {
            const deckId = pathSegments[1];
            const isBasic = initialDecks.some(d => d.id === deckId);
            if (isBasic) {
                setDeckTitle(initialDecks.find(d => d.id === deckId)?.name);
            } else {
                const deckRef = doc(db, 'users', user.uid, 'decks', deckId);
                const docSnap = await getDoc(deckRef);
                if (docSnap.exists()) {
                    setDeckTitle(docSnap.data().name);
                }
            }
        } else {
          setDeckTitle(undefined);
        }
      }
      fetchDeckTitle();
    }, [pathname, pathSegments, user]);

    return (
        <Breadcrumb className="hidden flex-1 md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.map((segment, index) => {
              const href = "/" + pathSegments.slice(0, index + 1).join("/")
              const isLast = index === pathSegments.length - 1
              
              let segmentTitle: string = capitalize(segment);
              if (index === 1 && pathSegments[0] === 'decks' && deckTitle) {
                segmentTitle = deckTitle;
              }

              return (
                <React.Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-headline capitalize">
                        {segmentTitle}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href} className="font-headline capitalize">
                          {segmentTitle}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
    )
}


export function DashboardHeader() {
  const [isClient, setIsClient] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    try {
      router.push('/login');
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      {isClient ? <HeaderBreadcrumb /> : <div className="hidden flex-1 md:flex" />}
      <div className="ml-auto flex flex-shrink-0 items-center gap-4">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search decks or lessons..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user ? (
              <>
                <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground -mt-2">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/account">Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </>
            ) : (
               <>
                <DropdownMenuLabel>Welcome</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/login">Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/register">Register</Link>
                </DropdownMenuItem>
               </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
