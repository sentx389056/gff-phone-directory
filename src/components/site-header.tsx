"use client"
import { Separator } from "@/components/ui/separator"

import { ModeToggle } from "@/components/ui/mode-toggle"

import { usePathname } from "next/navigation"

import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="py-2 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Image
          className="invert dark:invert-0 cursor-pointer hover:opacity-70 transition-opacity"
          src="logo_gff_white.svg"
          width={97}
          height={46}
          alt="logo_gff_white.svg"
          onClick={() => window.dispatchEvent(new Event('scroll-to-top'))}
        />

        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1
          className="text-base font-medium cursor-pointer hover:opacity-70 transition-opacity"
          onClick={() => window.dispatchEvent(new Event('scroll-to-top'))}
        >
          Телефонный справочник
        </h1>
        <div className="ml-auto flex items-center gap-3">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
