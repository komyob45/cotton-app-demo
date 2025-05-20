"use client"

import { useEffect, useState } from "react"
import QRCodeReact from "qrcode.react"

interface QRCodeWrapperProps {
  value: string
  size?: number
}

export function QRCodeWrapper({ value, size = 200 }: QRCodeWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Возвращаем пустой div с такими же размерами для предотвращения скачков макета
    return <div style={{ width: size, height: size }} className="bg-gray-100 rounded-md"></div>
  }

  return <QRCodeReact value={value} size={size} />
}
