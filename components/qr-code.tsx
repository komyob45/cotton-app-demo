"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface QRCodeProps {
  value: string
  size?: number
}

export function QRCode({ value, size = 200 }: QRCodeProps) {
  const [QRCodeComponent, setQRCodeComponent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Динамически импортируем библиотеку только на клиенте
    const loadQRCode = async () => {
      try {
        setIsLoading(true)
        // Импортируем библиотеку qrcode.react
        const QRCodeReactModule = await import("qrcode.react")
        setQRCodeComponent(() => QRCodeReactModule.default)
      } catch (error) {
        console.error("Failed to load QR code library:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadQRCode()
  }, [])

  if (isLoading || !QRCodeComponent) {
    return <Skeleton className="rounded-md" style={{ width: size, height: size }} />
  }

  return <QRCodeComponent value={value} size={size} />
}
