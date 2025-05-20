"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Layers } from "lucide-react"
import Link from "next/link"

type CalculationListItem = {
  id: string
  createdAt: string
  batchCount: number
  title: string
  quotationDate?: string | null
  dollarRate?: number | null
}

export default function CalculationsPage() {
  const [calculations, setCalculations] = useState<CalculationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCalculations = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/calculations")

        // Проверяем, что ответ успешный
        if (!response.ok) {
          // Используем статус и statusText для формирования сообщения об ошибке
          setError(`Ошибка сервера: ${response.status} ${response.statusText}`)
          setLoading(false)
          return
        }

        // Пытаемся распарсить JSON
        try {
          const data = await response.json()

          if (!data.success) {
            setError(data.error || "Не удалось загрузить список расчетов")
            setLoading(false)
            return
          }

          setCalculations(data.calculations || [])
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError)
          setError("Ошибка при обработке ответа сервера")
        }
      } catch (err) {
        console.error("Error fetching calculations:", err)
        setError("Произошла ошибка при загрузке данных")
      } finally {
        setLoading(false)
      }
    }

    fetchCalculations()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Сохраненные расчеты</h1>
        <Button asChild>
          <Link href="/">Новый расчет</Link>
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Ошибка</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button asChild className="mt-4">
                <Link href="/">Вернуться к калькулятору</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : calculations.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Нет сохраненных расчетов</h2>
              <p className="text-muted-foreground">Сохраните расчет в калькуляторе, чтобы он появился здесь</p>
              <Button asChild className="mt-4">
                <Link href="/">Перейти к калькулятору</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calculations.map((calc) => (
            <Link href={`/calculations/${calc.id}`} key={calc.id}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-2 line-clamp-2">{calc.title}</h2>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(calc.createdAt).toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Layers className="h-4 w-4 mr-2" />
                    {calc.batchCount} {calc.batchCount === 1 ? "партия" : calc.batchCount < 5 ? "партии" : "партий"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
