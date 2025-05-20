"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Package, Scale, DollarSign, Layers } from "lucide-react"
import type { Batch } from "./cotton-batch-manager"

interface TotalStatsProps {
  batches: Batch[]
}

export function TotalStats({ batches }: TotalStatsProps) {
  // Расчет общей статистики
  const calculateTotalStats = () => {
    const totalBatches = batches.length
    const totalWeight = batches.reduce((sum, batch) => sum + batch.weight, 0)
    const totalBales = batches.reduce((sum, batch) => sum + batch.balesCount, 0)

    // Общее количество проб (по полю quantity в samples)
    const totalSamples = batches.reduce(
      (sum, batch) => sum + batch.samples.reduce((s, sample) => s + sample.quantity, 0),
      0,
    )

    // Общая сумма всех проб
    const totalAmount = batches.reduce(
      (sum, batch) => sum + batch.samples.reduce((s, sample) => s + sample.sampleAmount, 0),
      0,
    )

    // Средняя цена пробы (взвешенная по весу)
    const totalSampleWeight = batches.reduce(
      (sum, batch) => sum + batch.samples.reduce((s, sample) => s + sample.weight, 0),
      0,
    )

    const weightedPriceSum = batches.reduce(
      (sum, batch) => sum + batch.samples.reduce((s, sample) => s + sample.samplePrice * sample.weight, 0),
      0,
    )

    const avgPrice = totalSampleWeight > 0 ? weightedPriceSum / totalSampleWeight : 0

    return {
      totalBatches,
      totalWeight,
      totalBales,
      totalSamples,
      totalAmount,
      avgPrice,
    }
  }

  const stats = calculateTotalStats()

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-muted/30 p-4 rounded-lg flex flex-col">
            <div className="flex items-center mb-2">
              <Layers className="h-5 w-5 mr-2 text-blue-500" />
              <span className="text-sm text-muted-foreground">Всего партий</span>
            </div>
            <span className="text-2xl font-bold">{stats.totalBatches}</span>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg flex flex-col">
            <div className="flex items-center mb-2">
              <Scale className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-sm text-muted-foreground">Общий вес</span>
            </div>
            <span className="text-2xl font-bold">{stats.totalWeight.toLocaleString()} кг</span>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg flex flex-col">
            <div className="flex items-center mb-2">
              <Package className="h-5 w-5 mr-2 text-amber-500" />
              <span className="text-sm text-muted-foreground">Всего кип</span>
            </div>
            <span className="text-2xl font-bold">{stats.totalBales.toLocaleString()}</span>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg flex flex-col">
            <div className="flex items-center mb-2">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
              <span className="text-sm text-muted-foreground">Всего проб</span>
            </div>
            <span className="text-2xl font-bold">{stats.totalSamples.toLocaleString()}</span>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg flex flex-col">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 mr-2 text-red-500" />
              <span className="text-sm text-muted-foreground">Общая сумма</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{stats.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
