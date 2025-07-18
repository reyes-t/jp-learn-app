
"use client"

import Link from "next/link"
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
import { CircleUser, Home, Search } from "lucide-react"
import React, { useState, useEffect } from "react"
import { basicDecks as initialDecks } from "@/lib/data"
import type { Deck } from "@/lib/types"

// A helper function to capitalize the first letter of a string
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const HeaderBreadcrumb = () => {
    const pathname = usePathname();
    const [deckTitle, setDeckTitle] = useState<string | undefined>(undefined);
    const pathSegments = pathname.split("/").filter(Boolean);

    useEffect(() => {
      if (pathSegments.length >= 2 && pathSegments[0] === 'decks') {
          const deckId = pathSegments[1];
          const storedDecks = JSON.parse(localStorage.getItem('userDecks') || '[]');
          const allDecks: Deck[] = [...initialDecks, ...storedDecks];
          const currentDeck = allDecks.find(d => d.id === deckId);
          if (currentDeck) {
              setDeckTitle(currentDeck.name);
          }
      } else {
        setDeckTitle(undefined);
      }
    }, [pathname, pathSegments]);

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
              
              let segmentTitle: string;
              if (index === 1 && pathSegments[0] === 'decks' && deckTitle) {
                segmentTitle = deckTitle;
              } else if (index === 2 && pathSegments[0] === 'decks' && deckTitle) {
                segmentTitle = capitalize(segment);
              }
              else {
                segmentTitle = capitalize(segment);
              }
              
              if (isLast) {
                 if (index > 0 && pathSegments[index-1] === 'decks' && deckTitle) {
                    segmentTitle = deckTitle;
                 }
              }

              // Special handling for study page
              if (segment === 'study' && deckTitle) {
                  segmentTitle = deckTitle;
              }


              // Create a breadcrumb structure that makes sense
              const breadcrumbItems = [];
              if (pathSegments[0]) {
                  breadcrumbItems.push({
                      href: `/${pathSegments[0]}`,
                      title: capitalize(pathSegments[0])
                  });
              }
              if (pathSegments[0] === 'decks' && deckTitle && pathSegments[1]) {
                   breadcrumbItems.push({
                      href: `/decks/${pathSegments[1]}`,
                      title: deckTitle
                  });
              }
               if (pathSegments[2]) {
                   breadcrumbItems.push({
                      href: `/decks/${pathSegments[1]}/${pathSegments[2]}`,
                      title: capitalize(pathSegments[2])
                  });
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

  useEffect(() => {
    setIsClient(true);
  }, []);


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
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/account">Account</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
