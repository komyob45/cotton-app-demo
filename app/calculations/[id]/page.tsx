"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, FileText, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"
import { BatchItem } from "@/components/batch-item"
import { TotalStats } from "@/components/total-stats"
import QRCode from "qrcode.react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { generatePDF } from "@/lib/pdf-generator"
import { TextExport } from "@/components/text-export"

export default function CalculationPage() {
  const params = useParams()
  const id = params.id as string

  const [calculation, setCalculation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [calculationUrl, setCalculationUrl] = useState("")

  useEffect(() => {
    // Устанавливаем URL для QR-кода
    if (typeof window !== "undefined") {
      setCalculationUrl(window.location.href)
    }

    const fetchCalculation = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/calculations?id=${id}`)

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
            setError(data.error || "Не удалось загрузить данные расчета")
            setLoading(false)
            return
          }

          setCalculation(data.calculation)
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError)
          setError("Ошибка при обработке ответа сервера")
        }
      } catch (err) {
        console.error("Error fetching calculation:", err)
        setError("Произошла ошибка при загрузке данных")
      } finally {
        setLoading(false)
      }
    }

    fetchCalculation()
  }, [id])

  const handleExportPDF = () => {
    if (!calculation) return

    try {
      setExportingPDF(true)
      generatePDF(
        calculation.title,
        calculation.createdAt,
        calculation.lceQuotation,
        calculation.batches,
        calculation.quotationDate,
        calculation.dollarRate,
      )
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Произошла ошибка при генерации PDF")
    } finally {
      setExportingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error || !calculation) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Ошибка</h2>
              <p className="text-muted-foreground">{error || "Расчет не найден"}</p>
              <Button asChild className="mt-4">
                <Link href="/calculations">Вернуться к списку расчетов</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { batches, lceQuotation, title, createdAt, quotationDate, dollarRate } = calculation

  // Форматирование даты для отображения
  const formatDate = (dateString: string) => {
    if (!dateString) return "Не указана"
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{title || "Сохраненный расчет"}</h1>
          <p className="text-muted-foreground">Создан: {new Date(createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowQRCode(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            QR-код
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={exportingPDF}>
            <FileText className="h-4 w-4 mr-2" />
            {exportingPDF ? "Экспорт..." : "Экспорт в PDF"}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Параметры расчета</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quotationDate && (
              <div className="space-y-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Дата котировки</p>
                </div>
                <p className="font-medium">{formatDate(quotationDate)}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Котировка A Index</p>
              <p className="font-medium">{lceQuotation} центов за фунт</p>
            </div>

            {dollarRate && (
              <div className="space-y-1">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Курс доллара</p>
                </div>
                <p className="font-medium">{dollarRate} сомони</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Общая статистика</h2>
        <TotalStats batches={batches} />
      </div>

      <h2 className="text-xl font-semibold mb-4">Партии хлопка</h2>

      <div className="space-y-4">
        {batches.map((batch: any) => (
          <BatchItem
            key={batch.id}
            batch={{ ...batch, isOpen: true }}
            onUpdate={() => {}}
            onDelete={() => {}}
            onToggle={() => {}}
            onAddSample={() => {}}
            onUpdateSample={() => {}}
            onDeleteSample={() => {}}
            readOnly={true}
          />
        ))}
      </div>

      <TextExport
        title={title}
        createdAt={createdAt}
        lceQuotation={lceQuotation}
        batches={batches}
        quotationDate={quotationDate}
        dollarRate={dollarRate}
      />

      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR-код для доступа к расчету</DialogTitle>
            <DialogDescription>Отсканируйте этот QR-код для быстрого доступа к данному расчету</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            <QRCode value={calculationUrl} size={200} />
            <p className="mt-4 text-sm text-center text-muted-foreground break-all">{calculationUrl}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
