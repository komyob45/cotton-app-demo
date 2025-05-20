"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calculator, Database, FileText, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Navigation() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const navItems = [
    {
      name: "Калькулятор",
      href: "/",
      icon: <Calculator className="h-5 w-5 mr-2" />,
    },
    {
      name: "Сохраненные расчеты",
      href: "/calculations",
      icon: <Database className="h-5 w-5 mr-2" />,
    },
  ]

  return (
    <>
      {/* Мобильная навигация */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
        <Link href="/" className="flex items-center">
          <FileText className="h-6 w-6 text-blue-600 mr-2" />
          <span className="font-bold text-lg">Система управления хлопком</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleMenu}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white pt-16">
          <nav className="flex flex-col p-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center py-3 px-4 rounded-md ${
                  pathname === item.href ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Десктопная навигация */}
      <div className="hidden md:flex bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center py-2 px-3 rounded-md text-sm ${
                    pathname === item.href ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}
