"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BarChart3, Save, Calendar, DollarSign, RefreshCw, AlertTriangle, Info } from "lucide-react"
import { BatchItem } from "./batch-item"
import { Input } from "@/components/ui/input"
import { TotalStats } from "./total-stats"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QRCode } from "./qr-code"

export type Batch = {
  id: string
  year: number
  batchCode: string
  weight: number
  balesCount: number
  samplesCount: number
  samples: Sample[]
  isOpen: boolean
  isEditing: boolean
}

export type Sample = {
  id: string
  batchId: string
  quantity: number
  colorGrade: "SM" | "MID" | "SLM"
  leafGrade: 1 | 2 | 3 | 4 | 5 | 6 | 7
  stapleLength: 32 | 33 | 34 | 35 | 36 | 37
  weight: number
  premiumDiscount: number
  lceQuotation: number
  samplePrice: number
  sampleAmount: number
  isEditing: boolean
  maxAvailable?: number // Добавляем новое свойство
}

export function CottonBatchManager() {
  const router = useRouter()
  const [batches, setBatches] = useState<Batch[]>([])
  const [lceQuotation, setLceQuotation] = useState<number>(80) // Значение котировки ЛХБ по умолчанию
  const [quotationDate, setQuotationDate] = useState<string>(formatDateForInput(new Date()))
  const [dollarRate, setDollarRate] = useState<number>(11.3) // Курс доллара по умолчанию
  const [showTotalStats, setShowTotalStats] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState(false)
  const [calculationTitle, setCalculationTitle] = useState("")
  const [savedCalculationId, setSavedCalculationId] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [calculationUrl, setCalculationUrl] = useState("")
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false)
  const [isLoadingRate, setIsLoadingRate] = useState(false)
  const [quotationError, setQuotationError] = useState<string | null>(null)
  const [rateError, setRateError] = useState<string | null>(null)
  const [quotationSource, setQuotationSource] = useState<string | null>(null)
  const [rateSource, setRateSource] = useState<string | null>(null)

  // Функция для форматирования даты в формат YYYY-MM-DD для input type="date"
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Получение котировки A Index с cotlook.com через API
  const fetchAIndex = async () => {
    setIsLoadingQuotation(true)
    setQuotationError(null)
    setQuotationSource(null)
    try {
      const response = await fetch("/api/cotton-index")
      const data = await response.json()

      if (data.success) {
        setLceQuotation(data.index)
        setQuotationSource(data.source)

        if (data.source === "fallback" && data.message) {
          setQuotationError(data.message)
        }
      } else {
        setQuotationError(data.error || "Не удалось получить котировку A Index")
        console.error("Error fetching A Index:", data.error)
      }
    } catch (error) {
      console.error("Error fetching A Index:", error)
      setQuotationError("Ошибка при получении котировки A Index")
    } finally {
      setIsLoadingQuotation(false)
    }
  }

  // Получение курса доллара с nbt.tj через API
  const fetchDollarRate = async () => {
    setIsLoadingRate(true)
    setRateError(null)
    setRateSource(null)
    try {
      const response = await fetch("/api/exchange-rate")
      const data = await response.json()

      if (data.success) {
        setDollarRate(data.rate)
        setRateSource(data.source)

        if (data.source === "fallback" && data.message) {
          setRateError(data.message)
        }
      } else {
        setRateError(data.error || "Не удалось получить курс доллара")
        console.error("Error fetching dollar rate:", data.error)
      }
    } catch (error) {
      console.error("Error fetching dollar rate:", error)
      setRateError("Ошибка при получении курса доллара")
    } finally {
      setIsLoadingRate(false)
    }
  }

  // Загружаем значения по умолчанию при первой загрузке компонента
  useEffect(() => {
    fetchAIndex()
    fetchDollarRate()
  }, [])

  const addBatch = () => {
    const newBatch: Batch = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      batchCode: "",
      weight: 0,
      balesCount: 0,
      samplesCount: 0,
      samples: [],
      isOpen: true,
      isEditing: true, // Новая партия сразу в режиме редактирования
    }
    setBatches([...batches, newBatch])
  }

  const updateBatch = (updatedBatch: Batch) => {
    const updatedBatches = batches.map((batch) => (batch.id === updatedBatch.id ? updatedBatch : batch))
    setBatches(updatedBatches)
  }

  const deleteBatch = (batchId: string) => {
    setBatches(batches.filter((b) => b.id !== batchId))
  }

  // Изменим функцию addSample, чтобы проверять, не превышает ли сумма количеств проб общее количество
  const addSample = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId)
    if (!batch) return

    // Подсчитываем текущую сумму количеств проб
    const currentSum = batch.samples.reduce((sum, sample) => sum + sample.quantity, 0)

    // Проверяем, есть ли еще место для новых проб
    if (currentSum >= batch.samplesCount) {
      alert("Общее количество проб уже достигнуто. Невозможно добавить новую пробу.")
      return
    }

    // Вычисляем максимально доступное количество для новой пробы
    const maxAvailable = batch.samplesCount - currentSum

    const newSample: Sample = {
      id: Date.now().toString(),
      batchId,
      quantity: 0,
      colorGrade: "SM",
      leafGrade: 1,
      stapleLength: 32,
      weight: 0,
      premiumDiscount: 0,
      lceQuotation,
      samplePrice: 0,
      sampleAmount: 0,
      isEditing: true,
      maxAvailable, // Добавляем максимально доступное количество
    }

    const updatedBatches = batches.map((b) => {
      if (b.id === batchId) {
        return {
          ...b,
          samples: [...b.samples, newSample],
        }
      }
      return b
    })

    setBatches(updatedBatches)
  }

  // Изменим функцию updateSample, чтобы проверять, не превышает ли сумма количеств проб общее количество
  const updateSample = (updatedSample: Sample) => {
    const batch = batches.find((b) => b.id === updatedSample.batchId)
    if (!batch) return

    // Если проба сохраняется (выходит из режима редактирования), проверяем сумму количеств
    if (!updatedSample.isEditing) {
      // Подсчитываем текущую сумму количеств проб, исключая редактируемую пробу
      const currentSum = batch.samples.reduce((sum, sample) => {
        if (sample.id === updatedSample.id) return sum
        return sum + sample.quantity
      }, 0)

      // Проверяем, не превышает ли новое количество доступное
      if (currentSum + updatedSample.quantity > batch.samplesCount) {
        alert(`Невозможно сохранить пробу. Доступное количество: ${batch.samplesCount - currentSum}`)
        return
      }

      // Исправленный расчет веса пробы
      // Вес пробы = (вес партии * количество пробы) / общее количество отобранных проб
      updatedSample.weight = (batch.weight * updatedSample.quantity) / batch.samplesCount

      // Получение надбавки/скидки из таблицы (разделенной на 100)
      updatedSample.premiumDiscount = getPremiumDiscount(
        updatedSample.colorGrade,
        updatedSample.leafGrade,
        updatedSample.stapleLength,
      )

      // Расчет цены пробы
      updatedSample.samplePrice =
        (lceQuotation + updatedSample.premiumDiscount) * 22.0462 -
        (lceQuotation + updatedSample.premiumDiscount) * 22.0462 * 0.035 -
        60

      // Расчет суммы пробы
      updatedSample.sampleAmount = (updatedSample.samplePrice * updatedSample.weight) / 1000
    }

    const updatedBatches = batches.map((b) => {
      if (b.id === updatedSample.batchId) {
        // Обновляем пробу
        const updatedSamples = b.samples.map((s) => {
          if (s.id === updatedSample.id) {
            return updatedSample
          }
          return s
        })

        // После обновления пробы, пересчитываем maxAvailable для всех проб в партии
        const totalUsed = updatedSamples.reduce((sum, s) => sum + (s.quantity || 0), 0)
        const remaining = b.samplesCount - totalUsed

        // Обновляем maxAvailable для всех проб в режиме редактирования
        const samplesWithUpdatedMax = updatedSamples.map((s) => {
          if (s.isEditing) {
            return {
              ...s,
              maxAvailable: remaining + (s.quantity || 0),
            }
          }
          return s
        })

        return {
          ...b,
          samples: samplesWithUpdatedMax,
        }
      }
      return b
    })

    setBatches(updatedBatches)
  }

  const deleteSample = (sampleId: string, batchId: string) => {
    const updatedBatches = batches.map((batch) => {
      if (batch.id === batchId) {
        return {
          ...batch,
          samples: batch.samples.filter((s) => s.id !== sampleId),
        }
      }
      return batch
    })
    setBatches(updatedBatches)
  }

  const toggleBatch = (batchId: string) => {
    const updatedBatches = batches.map((batch) => {
      if (batch.id === batchId) {
        return {
          ...batch,
          isOpen: !batch.isOpen,
        }
      }
      return batch
    })
    setBatches(updatedBatches)
  }

  // Функция для получения надбавки/скидки из таблицы (разделенной на 100)
  const getPremiumDiscount = (
    colorGrade: "SM" | "MID" | "SLM",
    leafGrade: 1 | 2 | 3 | 4 | 5 | 6 | 7,
    stapleLength: 32 | 33 | 34 | 35 | 36 | 37,
  ) => {
    const premiumDiscountTable: Record<string, Record<number, Record<number, number>>> = {
      SM: {
        1: { 32: 70, 33: 370, 34: 405, 35: 470, 36: 535, 37: 580 },
        2: { 32: 0, 33: 300, 34: 335, 35: 400, 36: 465, 37: 510 },
        3: { 32: -120, 33: 180, 34: 215, 35: 280, 36: 345, 37: 390 },
        4: { 32: -335, 33: -35, 34: 0, 35: 65, 36: 130, 37: 175 },
        5: { 32: -700, 33: -400, 34: -365, 35: -300, 36: -235, 37: -190 },
        6: { 32: -800, 33: -500, 34: -465, 35: -400, 36: -335, 37: -290 },
        7: { 32: -800, 33: -500, 34: -465, 35: -400, 36: -335, 37: -290 },
      },
      MID: {
        1: { 32: -30, 33: 270, 34: 305, 35: 370, 36: 435, 37: 480 },
        2: { 32: -180, 33: 120, 34: 155, 35: 220, 36: 285, 37: 330 },
        3: { 32: -400, 33: -100, 34: -65, 35: 0, 36: 65, 37: 110 },
        4: { 32: -420, 33: -120, 34: -85, 35: -20, 36: 45, 37: 90 },
        5: { 32: -730, 33: -430, 34: -395, 35: -330, 36: -265, 37: -220 },
        6: { 32: -850, 33: -550, 34: -515, 35: -450, 36: -385, 37: -340 },
        7: { 32: -850, 33: -550, 34: -515, 35: -450, 36: -385, 37: -340 },
      },
      SLM: {
        1: { 32: -320, 33: -20, 34: 15, 35: 80, 36: 145, 37: 190 },
        2: { 32: -340, 33: -40, 34: -5, 35: 60, 36: 125, 37: 170 },
        3: { 32: -360, 33: -60, 34: -25, 35: 40, 36: 105, 37: 150 },
        4: { 32: -400, 33: -100, 34: -65, 35: 0, 36: 65, 37: 110 },
        5: { 32: -700, 33: -400, 34: -365, 35: -300, 36: -235, 37: -190 },
        6: { 32: -950, 33: -650, 34: -615, 35: -550, 36: -485, 37: -440 },
        7: { 32: -950, 33: -650, 34: -615, 35: -550, 36: -485, 37: -440 },
      },
    }

    // Получаем значение из таблицы и делим на 100
    return premiumDiscountTable[colorGrade][leafGrade][stapleLength] / 100
  }

  // Функция для сохранения расчета в базе данных
  const saveCalculation = async () => {
    if (batches.length === 0) {
      alert("Нет данных для сохранения. Добавьте хотя бы одну партию.")
      return
    }

    // Проверяем, есть ли незаполненные партии
    const hasEditingBatches = batches.some((batch) => batch.isEditing)
    if (hasEditingBatches) {
      alert("Сохраните все редактируемые партии перед вычислением.")
      return
    }

    // Проверяем, есть ли незаполненные пробы
    const hasEditingSamples = batches.some((batch) => batch.samples.some((sample) => sample.isEditing))
    if (hasEditingSamples) {
      alert("Сохраните все редактируемые пробы перед вычислением.")
      return
    }

    // Проверяем, есть ли партии без проб
    const batchesWithoutSamples = batches.filter((batch) => batch.samples.length === 0)
    if (batchesWithoutSamples.length > 0) {
      const batchCodes = batchesWithoutSamples.map((b) => `${b.batchCode} (${b.year})`).join(", ")
      alert(`Следующие партии не содержат проб: ${batchCodes}. Пробы обязательны для всех партий.`)
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/calculations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batches,
          lceQuotation,
          quotationDate,
          dollarRate,
          title: calculationTitle || `Расчет от ${new Date().toLocaleString()}`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSavedCalculationId(data.calculationId)
        // Устанавливаем URL для QR-кода
        const calculationUrl =
          typeof window !== "undefined" ? `${window.location.origin}/calculations/${data.calculationId}` : ""
        setCalculationUrl(calculationUrl)
        setShowQRCode(true)
      } else {
        alert("Ошибка при сохранении расчета: " + (data.error || "Неизвестная ошибка"))
      }
    } catch (error) {
      console.error("Error saving calculation:", error)
      alert("Произошла ошибка при сохранении расчета")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Параметры расчета</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Дата</label>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    type="date"
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Котировка A Index (cotlook.com)</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAIndex}
                  disabled={isLoadingQuotation}
                  className="h-6 px-2"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingQuotation ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={lceQuotation}
                  onChange={(e) => setLceQuotation(Number(e.target.value))}
                  className="flex-1"
                  step="0.01"
                  disabled={isLoadingQuotation}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">центов за фунт</span>
              </div>
              {quotationSource && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Info className="h-3 w-3 mr-1" />
                  Источник: {quotationSource === "fallback" ? "значение по умолчанию" : quotationSource}
                </div>
              )}
              {quotationError && (
                <Alert variant="destructive" className="mt-2 py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs ml-2">{quotationError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Курс доллара</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchDollarRate}
                  disabled={isLoadingRate}
                  className="h-6 px-2"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingRate ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    type="number"
                    value={dollarRate}
                    onChange={(e) => setDollarRate(Number(e.target.value))}
                    className="pl-10"
                    step="0.01"
                    disabled={isLoadingRate}
                  />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">сомони</span>
              </div>
              {rateSource && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Info className="h-3 w-3 mr-1" />
                  Источник: {rateSource === "fallback" ? "значение по умолчанию" : rateSource}
                </div>
              )}
              {rateError && (
                <Alert variant="destructive" className="mt-2 py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs ml-2">{rateError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Общая статистика по всем партиям */}
      {batches.length > 0 && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Общая статистика</h2>
          <Button
            variant="outline"
            onClick={() => setShowTotalStats(!showTotalStats)}
            className={showTotalStats ? "bg-muted" : ""}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showTotalStats ? "Скрыть итоги" : "Показать итоги"}
          </Button>
        </div>
      )}

      {batches.length > 0 && showTotalStats && <TotalStats batches={batches} />}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Партии хлопка</h2>
        <div className="flex gap-2">
          <Button onClick={saveCalculation} disabled={isSaving || batches.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Сохранение..." : "Вычислить и сохранить"}
          </Button>
          <Button onClick={addBatch}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить партию
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {batches.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground">Нет добавленных партий</p>
            </CardContent>
          </Card>
        ) : (
          batches.map((batch) => (
            <BatchItem
              key={batch.id}
              batch={batch}
              onUpdate={updateBatch}
              onDelete={deleteBatch}
              onToggle={toggleBatch}
              onAddSample={addSample}
              onUpdateSample={updateSample}
              onDeleteSample={deleteSample}
            />
          ))
        )}
      </div>

      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Расчет сохранен</DialogTitle>
            <DialogDescription>
              Ваш расчет успешно сохранен. Вы можете получить доступ к нему по ссылке или QR-коду.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="calculation-title">Название расчета</Label>
              <Input
                id="calculation-title"
                value={calculationTitle}
                onChange={(e) => setCalculationTitle(e.target.value)}
                placeholder="Введите название для расчета"
                className="mt-1"
              />
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <QRCode value={calculationUrl} size={200} />
              <p className="mt-4 text-sm text-center text-muted-foreground break-all">{calculationUrl}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowQRCode(false)}>
                Закрыть
              </Button>
              <Button onClick={() => router.push(calculationUrl)}>Перейти к расчету</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
