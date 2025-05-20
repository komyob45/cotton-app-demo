"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, ChevronDown, ChevronUp, Plus, Edit, Save, AlertTriangle, BarChart3 } from "lucide-react"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SampleItem } from "./sample-item"
import type { Batch, Sample } from "./cotton-batch-manager"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface BatchItemProps {
  batch: Batch
  onUpdate: (batch: Batch) => void
  onDelete: (batchId: string) => void
  onToggle: (batchId: string) => void
  onAddSample: (batchId: string) => void
  onUpdateSample: (sample: Sample) => void
  onDeleteSample: (sampleId: string, batchId: string) => void
  readOnly?: boolean
}

interface ValidationErrors {
  year?: string
  batchCode?: string
  weight?: string
  balesCount?: string
  samplesCount?: string
}

export function BatchItem({
  batch,
  onUpdate,
  onDelete,
  onToggle,
  onAddSample,
  onUpdateSample,
  onDeleteSample,
  readOnly = false,
}: BatchItemProps) {
  const [localBatch, setLocalBatch] = useState<Batch>(batch)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStats, setShowStats] = useState(readOnly || false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLocalBatch({
      ...localBatch,
      [name]: name === "batchCode" ? value : Number(value),
    })

    // Очищаем ошибку для этого поля при изменении
    if (errors[name as keyof ValidationErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      })
    }
  }

  const validateBatch = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Проверка года
    if (!localBatch.year) {
      newErrors.year = "Год обязателен"
    } else if (localBatch.year < 1900 || localBatch.year > new Date().getFullYear()) {
      newErrors.year = "Укажите корректный год"
    }

    // Проверка кода партии
    if (!localBatch.batchCode) {
      newErrors.batchCode = "Код партии обязателен"
    } else if (!/^\d{3}\/\d{2}$/.test(localBatch.batchCode)) {
      newErrors.batchCode = "Формат: 000/00"
    }

    // Проверка веса
    if (!localBatch.weight) {
      newErrors.weight = "Вес обязателен"
    } else if (localBatch.weight <= 0) {
      newErrors.weight = "Вес должен быть больше 0"
    }

    // Проверка количества кип
    if (!localBatch.balesCount) {
      newErrors.balesCount = "Количество кип обязательно"
    } else if (localBatch.balesCount <= 0) {
      newErrors.balesCount = "Количество кип должно быть больше 0"
    }

    // Проверка количества проб
    if (!localBatch.samplesCount) {
      newErrors.samplesCount = "Количество проб обязательно"
    } else if (localBatch.samplesCount <= 0) {
      newErrors.samplesCount = "Количество проб должно быть больше 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateBatch()) {
      onUpdate({
        ...localBatch,
        isEditing: false,
      })
    }
  }

  const handleEdit = () => {
    onUpdate({
      ...batch,
      isEditing: true,
    })
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    onDelete(batch.id)
    setShowDeleteDialog(false)
  }

  // Расчет итоговой статистики для партии
  const calculateBatchStats = () => {
    if (batch.samples.length === 0) {
      return {
        totalSamples: 0,
        totalWeight: 0,
        totalAmount: 0,
        avgPremiumDiscount: 0,
        avgPrice: 0,
      }
    }

    const totalSamples = batch.samples.reduce((sum, sample) => sum + sample.quantity, 0)
    const totalWeight = batch.samples.reduce((sum, sample) => sum + sample.weight, 0)
    const totalAmount = batch.samples.reduce((sum, sample) => sum + sample.sampleAmount, 0)

    // Средняя надбавка/скидка (взвешенная по количеству)
    const avgPremiumDiscount =
      batch.samples.reduce((sum, sample) => sum + sample.premiumDiscount * sample.quantity, 0) / totalSamples

    // Средняя цена пробы (взвешенная по весу)
    const avgPrice = batch.samples.reduce((sum, sample) => sum + sample.samplePrice * sample.weight, 0) / totalWeight

    return {
      totalSamples,
      totalWeight,
      totalAmount,
      avgPremiumDiscount,
      avgPrice,
    }
  }

  const batchStats = calculateBatchStats()

  return (
    <>
      <Card>
        <div
          className={`flex items-center justify-between p-4 cursor-pointer ${
            batch.isEditing ? "bg-muted" : "bg-muted/50 hover:bg-muted"
          }`}
          onClick={() => !batch.isEditing && !readOnly && onToggle(batch.id)}
        >
          <div className="flex items-center gap-2">
            {!batch.isEditing &&
              !readOnly &&
              (batch.isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />)}
            <h3 className="text-lg font-medium">
              {batch.isEditing ? (
                "Новая партия"
              ) : (
                <>
                  Партия {batch.batchCode} ({batch.year})
                </>
              )}
            </h3>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {batch.isEditing ? (
                <Button variant="default" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Сохранить
                </Button>
              ) : (
                <>
                  {(() => {
                    // Подсчитываем текущую сумму количеств проб
                    const currentSum = batch.samples.reduce((sum, sample) => sum + sample.quantity, 0)
                    const isComplete = currentSum >= batch.samplesCount

                    return (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowStats(!showStats)}
                          className={showStats ? "bg-muted" : ""}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          {showStats ? "Скрыть итоги" : "Показать итоги"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddSample(batch.id)}
                          disabled={isComplete}
                          title={isComplete ? "Все пробы уже заполнены" : "Добавить пробу"}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Добавить пробу
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleEdit}>
                          <Edit className="h-4 w-4 mr-1" />
                          Редактировать
                        </Button>
                      </>
                    )
                  })()}
                </>
              )}
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Удалить партию</span>
              </Button>
            </div>
          )}
        </div>

        {(batch.isOpen || batch.isEditing || readOnly) && (
          <CardContent className="pt-4">
            {batch.isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Урожай (год)</label>
                  <Input
                    name="year"
                    type="number"
                    value={localBatch.year}
                    onChange={handleInputChange}
                    required
                    className={errors.year ? "border-red-500" : ""}
                  />
                  {errors.year && (
                    <div className="text-red-500 text-xs flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.year}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Партия (код)</label>
                  <Input
                    name="batchCode"
                    placeholder="000/00"
                    value={localBatch.batchCode}
                    onChange={handleInputChange}
                    required
                    className={errors.batchCode ? "border-red-500" : ""}
                  />
                  {errors.batchCode && (
                    <div className="text-red-500 text-xs flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.batchCode}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Вес (кг)</label>
                  <Input
                    name="weight"
                    type="number"
                    step="0.01"
                    value={localBatch.weight || ""}
                    onChange={handleInputChange}
                    required
                    className={errors.weight ? "border-red-500" : ""}
                  />
                  {errors.weight && (
                    <div className="text-red-500 text-xs flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.weight}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Количество кип (шт)</label>
                  <Input
                    name="balesCount"
                    type="number"
                    value={localBatch.balesCount || ""}
                    onChange={handleInputChange}
                    required
                    className={errors.balesCount ? "border-red-500" : ""}
                  />
                  {errors.balesCount && (
                    <div className="text-red-500 text-xs flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.balesCount}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Общее количество отобранных проб (шт)</label>
                  <Input
                    name="samplesCount"
                    type="number"
                    value={localBatch.samplesCount || ""}
                    onChange={handleInputChange}
                    required
                    className={errors.samplesCount ? "border-red-500" : ""}
                  />
                  {errors.samplesCount && (
                    <div className="text-red-500 text-xs flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.samplesCount}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Урожай (год)</p>
                    <p className="font-medium">{batch.year}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Вес (кг)</p>
                    <p className="font-medium">{batch.weight.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Количество кип</p>
                    <p className="font-medium">{batch.balesCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Общее количество отобранных проб</p>
                    <p className="font-medium">{batch.samplesCount}</p>
                  </div>
                </div>

                {/* Добавляем индикатор прогресса заполнения проб */}
                <div className="mb-4">
                  {(() => {
                    // Подсчитываем текущую сумму количеств проб
                    const currentSum = batch.samples.reduce((sum, sample) => sum + sample.quantity, 0)
                    const remaining = batch.samplesCount - currentSum
                    const percentComplete = (currentSum / batch.samplesCount) * 100

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            Заполнено проб: {currentSum} из {batch.samplesCount}
                          </span>
                          <span className={remaining > 0 ? "text-red-600" : "text-green-600"}>
                            {remaining > 0 ? `Осталось: ${remaining}` : "Все пробы заполнены"}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${remaining > 0 ? "bg-red-500" : "bg-green-500"}`}
                            style={{ width: `${percentComplete}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Итоговая статистика по партии */}
                {showStats && batch.samples.length > 0 && (
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
                    <h4 className="text-md font-semibold mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Итоги по партии
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-3 rounded-md shadow-sm">
                        <p className="text-sm text-muted-foreground">Общий вес проб</p>
                        <p className="text-lg font-semibold">{batchStats.totalWeight.toFixed(2)} кг</p>
                      </div>
                      <div className="bg-white p-3 rounded-md shadow-sm">
                        <p className="text-sm text-muted-foreground">Средняя надбавка/скидка</p>
                        <p className="text-lg font-semibold">{batchStats.avgPremiumDiscount.toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-md shadow-sm">
                        <p className="text-sm text-muted-foreground">Средняя цена пробы</p>
                        <p className="text-lg font-semibold">{batchStats.avgPrice.toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-md shadow-sm md:col-span-3">
                        <p className="text-sm text-muted-foreground">Общая сумма</p>
                        <p className="text-xl font-bold text-green-600">{batchStats.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {batch.samples.length > 0 ? (
                  <div className="overflow-x-auto mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Количество</TableHead>
                          <TableHead>Сорт по цвету</TableHead>
                          <TableHead>Сорт по листу</TableHead>
                          <TableHead>Штапельная длина</TableHead>
                          <TableHead>Вес (кг)</TableHead>
                          <TableHead>Надбавка/скидка</TableHead>
                          <TableHead>Цена пробы</TableHead>
                          <TableHead>Сумма пробы</TableHead>
                          {!readOnly && <TableHead>Действия</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batch.samples.map((sample) => (
                          <SampleItem
                            key={sample.id}
                            sample={sample}
                            onUpdate={onUpdateSample}
                            onDelete={(sampleId) => onDeleteSample(sampleId, batch.id)}
                            readOnly={readOnly}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <p className="text-sm font-medium">
                        Внимание! Нет добавленных проб. Пробы обязательны для всех партий.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить партию {batch.batchCode} ({batch.year})?
              {batch.samples.length > 0 && (
                <span className="block mt-2 font-semibold text-red-500">
                  Внимание! Будут удалены все пробы ({batch.samples.length}) этой партии.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
