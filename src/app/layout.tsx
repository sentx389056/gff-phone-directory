import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "next-themes";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Телефонный справочник"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased min-h-screen flex`}>
        <SidebarProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <AppSidebar variant="inset" />
            <div className="flex-1 flex flex-col min-h-screen">
              <SidebarInset>
                <SiteHeader />
                {children}
              </SidebarInset>
            </div>
          </ThemeProvider>

        </SidebarProvider>
      </body>
    </html>
  );
}
