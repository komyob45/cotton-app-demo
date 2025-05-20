"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy } from "lucide-react"
import type { Batch } from "./cotton-batch-manager"

interface TextExportProps {
  title: string
  createdAt: string
  lceQuotation: number
  batches: Batch[]
  quotationDate?: string | null
  dollarRate?: number | null
}

export function TextExport({ title, createdAt, lceQuotation, batches, quotationDate, dollarRate }: TextExportProps) {
  const [copied, setCopied] = useState(false)

  const generateTextReport = (): string => {
    let report = `РАСЧЕТ ПАРТИЙ ХЛОПКА\n`
    report += `===================\n\n`
    report += `Название: ${title}\n`
    report += `Дата создания: ${new Date(createdAt).toLocaleString()}\n`

    if (quotationDate) {
      report += `Дата котировки: ${new Date(quotationDate).toLocaleDateString()}\n`
    }

    report += `Котировка ЛХБ: ${lceQuotation} центов за фунт\n`

    if (dollarRate) {
      report += `Курс доллара: ${dollarRate} сомони\n`
    }

    report += `\n`

    // Общая статистика
    const totalBatches = batches.length
    const totalWeight = batches.reduce((sum, batch) => sum + batch.weight, 0)
    const totalBales = batches.reduce((sum, batch) => sum + batch.balesCount, 0)
    const totalSamples = batches.reduce(
      (sum, batch) => sum + batch.samples.reduce((s, sample) => s + sample.quantity, 0),
      0,
    )
    const totalAmount = batches.reduce(
      (sum, batch) => sum + batch.samples.reduce((s, sample) => s + sample.sampleAmount, 0),
      0,
    )

    report += `ОБЩАЯ СТАТИСТИКА\n`
    report += `-----------------\n`
    report += `Всего партий: ${totalBatches}\n`
    report += `Общий вес: ${totalWeight.toLocaleString()} кг\n`
    report += `Всего кип: ${totalBales.toLocaleString()}\n`
    report += `Всего проб: ${totalSamples.toLocaleString()}\n`
    report += `Общая сумма: ${totalAmount.toFixed(2)}\n\n`

    // Информация по партиям
    batches.forEach((batch, index) => {
      report += `ПАРТИЯ ${batch.batchCode} (${batch.year})\n`
      report += `-----------------\n`
      report += `Вес: ${batch.weight.toLocaleString()} кг\n`
      report += `Количество кип: ${batch.balesCount}\n`
      report += `Общее количество отобранных проб: ${batch.samplesCount}\n\n`

      if (batch.samples.length > 0) {
        report += `Пробы:\n`
        report += `Кол-во | Сорт по цвету | Сорт по листу | Штап. длина | Вес (кг) | Надбавка/скидка | Цена пробы | Сумма пробы\n`
        report += `-------+---------------+--------------+-------------+----------+-----------------+------------+------------\n`

        batch.samples.forEach((sample) => {
          report += `${sample.quantity.toString().padEnd(7)} | `
          report += `${sample.colorGrade.padEnd(15)} | `
          report += `${sample.leafGrade.toString().padEnd(14)} | `
          report += `${sample.stapleLength.toString().padEnd(13)} | `
          report += `${sample.weight.toFixed(2).padEnd(10)} | `
          report += `${sample.premiumDiscount.toFixed(2).padEnd(17)} | `
          report += `${sample.samplePrice.toFixed(2).padEnd(12)} | `
          report += `${sample.sampleAmount.toFixed(2)}\n`
        })

        // Итоги по партии
        const totalWeight = batch.samples.reduce((sum, sample) => sum + sample.weight, 0)
        const totalAmount = batch.samples.reduce((sum, sample) => sum + sample.sampleAmount, 0)
        const avgPremiumDiscount =
          batch.samples.reduce((sum, sample) => sum + sample.premiumDiscount * sample.quantity, 0) /
          batch.samples.reduce((sum, sample) => sum + sample.quantity, 0)
        const avgPrice =
          batch.samples.reduce((sum, sample) => sum + sample.samplePrice * sample.weight, 0) /
          batch.samples.reduce((sum, sample) => sum + sample.weight, 0)

        report += `\nИтоги по партии:\n`
        report += `Общий вес проб: ${totalWeight.toFixed(2)} кг\n`
        report += `Средняя надбавка/скидка: ${avgPremiumDiscount.toFixed(2)}\n`
        report += `Средняя цена пробы: ${avgPrice.toFixed(2)}\n`
        report += `Общая сумма: ${totalAmount.toFixed(2)}\n`
      } else {
        report += `Нет добавленных проб\n`
      }

      if (index < batches.length - 1) {
        report += `\n${"=".repeat(80)}\n\n`
      }
    })

    return report
  }

  const textReport = generateTextReport()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(textReport)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Текстовый отчет</h2>
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Скопировано!" : "Копировать"}
          </Button>
        </div>
        <div className="bg-muted p-4 rounded-md overflow-x-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono">{textReport}</pre>
        </div>
      </CardContent>
    </Card>
  )
}
