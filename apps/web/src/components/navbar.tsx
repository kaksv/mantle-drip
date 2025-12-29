"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Droplets, Repeat, Wallet, Trophy } from "lucide-react"

import { ConnectButton } from "@/components/connect-button"
import { WalletButton } from "@/components/wallet-button"

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Streams", href: "/streams", icon: Droplets },
  { name: "Subscriptions", href: "/subscriptions", icon: Repeat },
  { name: "Treasury", href: "/treasury", icon: Wallet },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
]

export function Navbar() {
  const pathname = usePathname()
  
  return (
    <>
      {/* Top navbar - simplified on mobile, full on desktop */}
      <header className="sticky top-0 z-50 w-full border-b border-white/15 bg-transparent backdrop-blur-sm supports-[backdrop-filter]:bg-transparent md:relative md:border-b">
        <div className="container flex h-14 md:h-16 max-w-[1280px] items-center justify-between px-4">
          {/* Logo - always visible */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <span className="font-bold text-lg md:text-xl text-green group-hover:scale-105 transition-transform">
              Drip
            </span>
          </Link>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:text-green hover:scale-105 ${
                    pathname === link.href
                      ? "text-green"
                      : "text-foreground/70"
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
            
            {/* Wallet Connection - Show ConnectButton if not connected, WalletButton if connected */}
            <div className="flex items-center gap-3 min-w-[140px] justify-end">
              <div className="flex items-center">
                <ConnectButton />
              </div>
              <div className="flex items-center">
                <WalletButton />
              </div>
            </div>
          </nav>

          {/* Mobile: Wallet button only at top */}
          <div className="flex md:hidden items-center">
            <ConnectButton />
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar - Mobile only - Always visible on all pages */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden border-t border-white/15 bg-black/60 backdrop-blur-lg supports-[backdrop-filter]:bg-black/60 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="container max-w-[1280px]">
          <div className="grid grid-cols-4 h-16">
            {navLinks.map((link) => {
              const Icon = link.icon
              // Match exact path or paths that start with the link href (for nested routes)
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all active:scale-95 ${
                    isActive
                      ? "text-green"
                      : "text-foreground/60"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-green" : ""}`} />
                  <span className="text-[10px]">{link.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
