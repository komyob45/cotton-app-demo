"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableCell, TableRow } from "@/components/ui/table"
import { AlertTriangle, Edit, Save, Trash2 } from "lucide-react"
import type { Sample } from "./cotton-batch-manager"
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

interface SampleItemProps {
  sample: Sample
  onUpdate: (sample: Sample) => void
  onDelete: (sampleId: string) => void
  readOnly?: boolean
}

interface ValidationErrors {
  quantity?: string
  colorGrade?: string
  leafGrade?: string
  stapleLength?: string
}

export function SampleItem({ sample, onUpdate, onDelete, readOnly = false }: SampleItemProps) {
  const [localSample, setLocalSample] = useState<Sample>(sample)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLocalSample({
      ...localSample,
      [name]: Number(value),
    })

    // Очищаем ошибку для этого поля при изменении
    if (errors[name as keyof ValidationErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setLocalSample({
      ...localSample,
      [name]: name === "colorGrade" ? value : Number(value),
    })

    // Очищаем ошибку для этого поля при изменении
    if (errors[name as keyof ValidationErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      })
    }
  }

  const validateSample = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Проверка количества
    if (!localSample.quantity) {
      newErrors.quantity = "Количество обязательно"
    } else if (localSample.quantity <= 0) {
      newErrors.quantity = "Количество должно быть больше 0"
    } else if (localSample.maxAvailable !== undefined && localSample.quantity > localSample.maxAvailable) {
      newErrors.quantity = `Максимальное доступное количество: ${localSample.maxAvailable}`
    }

    // Проверка сорта по цвету
    if (!localSample.colorGrade) {
      newErrors.colorGrade = "Сорт по цвету обязателен"
    }

    // Проверка сорта по листу
    if (!localSample.leafGrade) {
      newErrors.leafGrade = "Сорт по листу обязателен"
    }

    // Проверка штапельной длины
    if (!localSample.stapleLength) {
      newErrors.stapleLength = "Штапельная длина обязательна"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateSample()) {
      onUpdate({
        ...localSample,
        isEditing: false,
      })
    }
  }

  const handleEdit = () => {
    onUpdate({
      ...sample,
      isEditing: true,
    })
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    onDelete(sample.id)
    setShowDeleteDialog(false)
  }

  if (sample.isEditing && !readOnly) {
    return (
      <TableRow>
        <TableCell colSpan={readOnly ? 8 : 9}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Количество
                {localSample.maxAvailable !== undefined && (
                  <span className="text-xs text-muted-foreground ml-2">(макс: {localSample.maxAvailable})</span>
                )}
              </label>
              <Input
                name="quantity"
                type="number"
                value={localSample.quantity || ""}
                onChange={handleInputChange}
                required
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && (
                <div className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.quantity}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Сорт по цвету</label>
              <Select
                value={localSample.colorGrade}
                onValueChange={(value) => handleSelectChange("colorGrade", value)}
                required
              >
                <SelectTrigger className={errors.colorGrade ? "border-red-500" : ""}>
                  <SelectValue placeholder="Выберите сорт по цвету" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SM">SM</SelectItem>
                  <SelectItem value="MID">MID</SelectItem>
                  <SelectItem value="SLM">SLM</SelectItem>
                </SelectContent>
              </Select>
              {errors.colorGrade && (
                <div className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.colorGrade}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Сорт по листу</label>
              <Select
                value={String(localSample.leafGrade)}
                onValueChange={(value) => handleSelectChange("leafGrade", value)}
                required
              >
                <SelectTrigger className={errors.leafGrade ? "border-red-500" : ""}>
                  <SelectValue placeholder="Выберите сорт по листу" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((grade) => (
                    <SelectItem key={grade} value={String(grade)}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leafGrade && (
                <div className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.leafGrade}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Штапельная длина</label>
              <Select
                value={String(localSample.stapleLength)}
                onValueChange={(value) => handleSelectChange("stapleLength", value)}
                required
              >
                <SelectTrigger className={errors.stapleLength ? "border-red-500" : ""}>
                  <SelectValue placeholder="Выберите штапельную длину" />
                </SelectTrigger>
                <SelectContent>
                  {[32, 33, 34, 35, 36, 37].map((length) => (
                    <SelectItem key={length} value={String(length)}>
                      {length}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.stapleLength && (
                <div className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.stapleLength}
                </div>
              )}
            </div>
            <div className="col-span-full flex justify-end gap-2">
              <Button variant="default" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Сохранить
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Удалить
              </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      <TableRow>
        <TableCell>{sample.quantity}</TableCell>
        <TableCell>{sample.colorGrade}</TableCell>
        <TableCell>{sample.leafGrade}</TableCell>
        <TableCell>{sample.stapleLength}</TableCell>
        <TableCell>{sample.weight.toFixed(2)}</TableCell>
        <TableCell>{sample.premiumDiscount.toFixed(2)}</TableCell>
        <TableCell>{sample.samplePrice.toFixed(2)}</TableCell>
        <TableCell>{sample.sampleAmount.toFixed(2)}</TableCell>
        {!readOnly && (
          <TableCell>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Редактировать</span>
              </Button>
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Удалить</span>
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить пробу с количеством {sample.quantity}?
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
