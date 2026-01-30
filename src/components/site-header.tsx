"use client"
import { Separator } from "@/components/ui/separator"

import { ModeToggle } from "@/components/ui/mode-toggle"
import {Image} from "next/dist/client/image-component";

export function SiteHeader() {
  return (
    <header className="py-2 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Image className="invert dark:invert-0" src="logo_gff_white.svg" width={97} height={46} alt="logo_gff_white.svg"/>

        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Телефонный справочник</h1>
        {/* Не забыть добавить иконку ГФФ и наверное название */}
        <div className="ml-auto flex items-center gap-3">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
