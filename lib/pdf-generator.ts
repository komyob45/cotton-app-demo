import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Batch } from "@/components/cotton-batch-manager"

// Функция для форматирования даты
const formatDate = (dateString: string): string => {
  if (!dateString) return "Не указана"
  const date = new Date(dateString)
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Функция для форматирования числа с разделителями тысяч
const formatNumber = (num: number, decimals = 2): string => {
  return num.toLocaleString("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// Функция для генерации PDF
export const generatePDF = async (
  title: string,
  createdAt: string,
  lceQuotation: number,
  batches: Batch[],
  quotationDate?: string | null,
  dollarRate?: number | null,
): Promise<void> => {
  // Создаем новый PDF документ с поддержкой кириллицы
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Добавляем шрифт с поддержкой кириллицы
  doc.addFont(
    "https://cdn.jsdelivr.net/npm/roboto-font@0.1.0/fonts/Roboto/roboto-regular-webfont.ttf",
    "Roboto",
    "normal",
  )
  doc.setFont("Roboto")

  // Добавляем заголовок
  doc.setFontSize(20)
  doc.text("Raschet partiy khlopka", 14, 22) // Используем транслитерацию

  // Добавляем информацию о расчете
  doc.setFontSize(12)
  doc.text(`Nazvanie: ${title}`, 14, 32)
  doc.text(`Data sozdaniya: ${formatDate(createdAt)}`, 14, 38)

  let yPos = 44

  if (quotationDate) {
    doc.text(`Data kotirovki: ${formatDate(quotationDate)}`, 14, yPos)
    yPos += 6
  }

  doc.text(`Kotirovka LKhB: ${lceQuotation} tsentov za funt`, 14, yPos)
  yPos += 6

  if (dollarRate) {
    doc.text(`Kurs dollara: ${dollarRate} somoni`, 14, yPos)
    yPos += 6
  }

  // Добавляем общую статистику
  doc.setFontSize(16)
  doc.text("Obshchaya statistika", 14, yPos + 4)

  // Рассчитываем общую статистику
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

  // Добавляем таблицу с общей статистикой
  autoTable(doc, {
    startY: yPos + 8,
    head: [["Pokazatel", "Znachenie"]],
    body: [
      ["Vsego partiy", totalBatches.toString()],
      ["Obshchiy ves", `${formatNumber(totalWeight)} kg`],
      ["Vsego kip", formatNumber(totalBales, 0)],
      ["Vsego prob", formatNumber(totalSamples, 0)],
      ["Obshchaya summa", formatNumber(totalAmount)],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  })

  // Для каждой партии добавляем информацию и таблицу с пробами
  yPos = (doc as any).lastAutoTable.finalY + 10

  batches.forEach((batch, batchIndex) => {
    // Проверяем, достаточно ли места на странице
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Добавляем информацию о партии
    doc.setFontSize(14)
    doc.text(`Partiya ${batch.batchCode} (${batch.year})`, 14, yPos)
    yPos += 6

    // Добавляем таблицу с информацией о партии
    autoTable(doc, {
      startY: yPos,
      head: [["Pokazatel", "Znachenie"]],
      body: [
        ["Ves", `${formatNumber(batch.weight)} kg`],
        ["Kolichestvo kip", formatNumber(batch.balesCount, 0)],
        ["Obshchee kolichestvo otobrannykh prob", formatNumber(batch.samplesCount, 0)],
      ],
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10

    // Проверяем, есть ли пробы
    if (batch.samples.length > 0) {
      // Проверяем, достаточно ли места на странице
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }

      // Добавляем заголовок для проб
      doc.setFontSize(12)
      doc.text("Proby", 14, yPos)
      yPos += 6

      // Подготавливаем данные для таблицы проб
      const samplesHead = [
        "№",
        "Kol-vo",
        "Sort po tsvetu",
        "Sort po listu",
        "Shtap. dlina",
        "Ves (kg)",
        "Nadbavka/skidka",
        "Tsena proby",
        "Summa proby",
      ]

      const samplesBody = batch.samples.map((sample, index) => [
        (index + 1).toString(),
        formatNumber(sample.quantity, 0),
        sample.colorGrade,
        sample.leafGrade.toString(),
        sample.stapleLength.toString(),
        formatNumber(sample.weight, 2),
        formatNumber(sample.premiumDiscount, 2),
        formatNumber(sample.samplePrice, 2),
        formatNumber(sample.sampleAmount, 2),
      ])

      // Добавляем таблицу с пробами
      autoTable(doc, {
        startY: yPos,
        head: [samplesHead],
        body: samplesBody,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 15 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 25 },
          7: { cellWidth: 20 },
          8: { cellWidth: 20 },
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 15
    } else {
      doc.setFontSize(10)
      doc.text("Net dobavlennykh prob", 14, yPos)
      yPos += 10
    }

    // Добавляем разделитель между партиями
    if (batchIndex < batches.length - 1) {
      doc.setDrawColor(200, 200, 200)
      doc.line(14, yPos, 196, yPos)
      yPos += 10
    }
  })

  // Добавляем нижний колонтитул
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(`Stranitsa ${i} iz ${pageCount}`, 196, 285, { align: "right" })
    doc.text(`Sgenerovano: ${formatDate(new Date().toISOString())}`, 14, 285)
  }

  // Сохраняем PDF
  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`)
}
