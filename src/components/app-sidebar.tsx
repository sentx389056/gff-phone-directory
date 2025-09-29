"use client"
import * as React from "react"
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"
import { Separator } from "@/components/ui/separator"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Главная",
    url: "/",
    icon: Home,
  },
  {
    title: "Панель управления",
    url: "/dashboard",
    icon: Inbox,
    adminOnly: true as const,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isAuth, setIsAuth] = React.useState(false)
  const [login, setLogin] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function check() {
      try {
        const res = await fetch("/api/auth/me")
        if (!mounted) return
        if (res.ok) {
          const data = await res.json()
          setIsAuth(!!data?.authenticated)
          setLogin(data?.login || null)
        } else {
          setIsAuth(false)
          setLogin(null)
        }
      } catch {
        setIsAuth(false)
        setLogin(null)
      }
    }
    check()
    return () => { mounted = false }
  }, [])

  const visibleItems = items.filter((it) => !("adminOnly" in it) || isAuth)

  return (
    <div style={{display:'flex', minHeight: '100vh', height: '100%'}}>
      <Sidebar collapsible="offcanvas" {...props} style={{height: '100%'}}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <a href="/">
                  <span className="text-base font-semibold">Телефонный справочник</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent style={{display:'flex',flexDirection:'column',height:'100%'}}>
          <div style={{flex:1}}>
            <SidebarGroup>
              <SidebarGroupLabel>Госфильмофонд России</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item: typeof items[number]) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
          <div style={{padding:'16px 12px 8px 12px',fontSize:13,color:'#888',borderTop:'1px solid #eee',textAlign:'left'}}>
            {isAuth && login ? (
              <>
                <div>Авторизован</div>
                <div style={{fontWeight:500}}>{login}</div>
              </>
            ) : (
              <div>Не авторизован</div>
            )}
          </div>
        </SidebarContent>
      </Sidebar>
  <Separator orientation="vertical" className="border-r border-border h-full" decorative={false} />
    </div>
  )
}