import { BookOpen, Home, Library, LogOut } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { signOut } from "@/lib/supabase"
import { isTelegramWebApp } from "@/lib/telegram"
import { cn } from "@/lib/utils"

import { Button } from "./ui/button"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isTelegram = isTelegramWebApp()

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Study", href: "/study", icon: BookOpen },
    { name: "Library", href: "/library", icon: Library },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - hidden in Telegram */}
      {!isTelegram && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <Link to="/" className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6" />
                <span className="font-bold">LinguaMind</span>
              </Link>
            </div>

            <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80",
                    location.pathname === item.href
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="container py-6">{children}</main>

      {/* Bottom navigation for mobile/Telegram */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex justify-around">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center py-3 text-xs",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
