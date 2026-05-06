'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isLoggedIn, logout } from '@/lib/api'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [pathname])

  const navItems = [
    { href: '/', label: '今日', icon: '🌿' },
    { href: '/write', label: '书写', icon: '✍️' },
    { href: '/history', label: '回顾', icon: '📖' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[#F5F0EB]/80 backdrop-blur-md border-b border-[#EBE7E2]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🕯️</span>
            <span className="text-[#2C2420] font-medium text-base tracking-wide"
              style={{ fontFamily: 'var(--font-serif)' }}>
              哀伤日记
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all duration-150 ${
                  pathname === item.href
                    ? 'bg-[#4A6352] text-white'
                    : 'text-[#6B6560] hover:text-[#2C2420] hover:bg-[#EBE7E2]/50'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <button
                onClick={logout}
                className="text-sm text-[#6B6560] hover:text-[#2C2420] transition-colors px-3 py-1.5 rounded-full hover:bg-[#EBE7E2]/50"
              >
                退出
              </button>
            ) : (
              <Link
                href="/login"
                className={`text-sm px-4 py-2 rounded-full transition-all duration-150 ${
                  pathname === '/login'
                    ? 'bg-[#4A6352] text-white'
                    : 'text-[#4A6352] bg-[#E8EDE9] hover:bg-[#D4E0D6]'
                }`}
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
