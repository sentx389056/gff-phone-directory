"use client"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { ModeToggle } from "@/components/ui/mode-toggle"


import * as React from "react"
import { usePathname } from "next/navigation"
import { LoginForm } from "./login-form"

export function SiteHeader() {
  const [isAuth, setIsAuth] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname();

  React.useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch("/api/auth/me");
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setIsAuth(!!data?.authenticated);
        } else {
          setIsAuth(false);
        }
      } catch {
        setIsAuth(false);
      }
      setMounted(true);
    }
    check();
    return () => { active = false; };
  }, []);

  let sectionTitle = "";
  if (pathname === "/") {
    sectionTitle = "Главная";
  } else if (pathname.startsWith("/dashboard")) {
    sectionTitle = "Панель управления";
  } else if (pathname.startsWith("/post")) {
    sectionTitle = "Посты";
  } else {
    sectionTitle = "Раздел";
  }

  return (
    <header className="py-2 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* <SidebarTrigger className="-ml-1" /> */}
        <ModeToggle/>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{sectionTitle}</h1>
        {/* <span className="ml-6 text-xs text-muted-foreground font-semibold">
          Статус: {mounted ? (isAuth ? 'Администратор' : 'Гость') : '...'}
        </span> */}
        <div className="ml-auto flex items-center gap-3">
          {/* <LoginForm/> */}
        </div>
      </div>
    </header>
  )
}
