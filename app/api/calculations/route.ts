import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const data = await request.json()
    const calculationId = uuidv4()

    // Проверяем, существует ли столбец quotation_date в таблице calculations
    const { data: tableInfo, error: tableInfoError } = await supabase.from("calculations").select("*").limit(1)

    if (tableInfoError) {
      console.error("Error checking table structure:", tableInfoError)
    }

    // Определяем, какие поля можно сохранить
    const hasQuotationDate = tableInfo && tableInfo.length > 0 && "quotation_date" in tableInfo[0]
    const hasDollarRate = tableInfo && tableInfo.length > 0 && "dollar_rate" in tableInfo[0]

    // Создаем объект для вставки с обязательными полями
    const calculationData: any = {
      id: calculationId,
      title: data.title || `Расчет от ${new Date().toLocaleString()}`,
      lce_quotation: data.lceQuotation,
      created_at: new Date().toISOString(),
    }

    // Добавляем дополнительные поля, если они существуют в таблице
    if (hasQuotationDate && data.quotationDate) {
      calculationData.quotation_date = data.quotationDate
    }

    if (hasDollarRate && data.dollarRate) {
      calculationData.dollar_rate = data.dollarRate
    }

    // Сохраняем основную информацию о расчете
    const { error: calculationError } = await supabase.from("calculations").insert(calculationData)

    if (calculationError) {
      console.error("Error saving calculation:", calculationError)
      return NextResponse.json({ success: false, error: "Failed to save calculation" }, { status: 500 })
    }

    // Сохраняем партии
    for (const batch of data.batches) {
      const { error: batchError } = await supabase.from("batches").insert({
        id: batch.id,
        calculation_id: calculationId,
        year: batch.year,
        batch_code: batch.batchCode,
        weight: batch.weight,
        bales_count: batch.balesCount,
        samples_count: batch.samplesCount,
      })

      if (batchError) {
        console.error("Error saving batch:", batchError)
        return NextResponse.json({ success: false, error: "Failed to save batch" }, { status: 500 })
      }

      // Сохраняем пробы для каждой партии
      for (const sample of batch.samples) {
        const { error: sampleError } = await supabase.from("samples").insert({
          id: sample.id,
          batch_id: batch.id,
          quantity: sample.quantity,
          color_grade: sample.colorGrade,
          leaf_grade: sample.leafGrade,
          staple_length: sample.stapleLength,
          weight: sample.weight,
          premium_discount: sample.premiumDiscount,
          lce_quotation: sample.lceQuotation,
          sample_price: sample.samplePrice,
          sample_amount: sample.sampleAmount,
        })

        if (sampleError) {
          console.error("Error saving sample:", sampleError)
          return NextResponse.json({ success: false, error: "Failed to save sample" }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      success: true,
      calculationId,
      url: `/calculations/${calculationId}`,
    })
  } catch (error) {
    console.error("Error saving calculation:", error)
    return NextResponse.json({ success: false, error: "Failed to save calculation" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    // Проверяем, существует ли столбец quotation_date в таблице calculations
    const { data: tableInfo, error: tableInfoError } = await supabase.from("calculations").select("*").limit(1)

    if (tableInfoError) {
      console.error("Error checking table structure:", tableInfoError)
    }

    // Определяем, какие поля можно запросить
    const hasQuotationDate = tableInfo && tableInfo.length > 0 && "quotation_date" in tableInfo[0]
    const hasDollarRate = tableInfo && tableInfo.length > 0 && "dollar_rate" in tableInfo[0]

    // Формируем строку запроса с учетом существующих полей
    let selectQuery = "id, title, created_at"
    if (hasQuotationDate) selectQuery += ", quotation_date"
    if (hasDollarRate) selectQuery += ", dollar_rate"

    if (!id) {
      // Если ID не указан, возвращаем список всех расчетов
      const { data: calculations, error } = await supabase
        .from("calculations")
        .select(selectQuery)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching calculations:", error)
        return NextResponse.json({ success: false, error: "Failed to fetch calculations" }, { status: 500 })
      }

      // Получаем количество партий для каждого расчета
      const formattedCalculations = await Promise.all(
        calculations.map(async (calc) => {
          try {
            const { count, error: countError } = await supabase
              .from("batches")
              .select("*", { count: "exact", head: true })
              .eq("calculation_id", calc.id)

            if (countError) {
              console.error("Error counting batches:", countError)
              return {
                id: calc.id,
                title: calc.title,
                createdAt: calc.created_at,
                quotationDate: hasQuotationDate ? calc.quotation_date : null,
                dollarRate: hasDollarRate ? calc.dollar_rate : null,
                batchCount: 0,
              }
            }

            return {
              id: calc.id,
              title: calc.title,
              createdAt: calc.created_at,
              quotationDate: hasQuotationDate ? calc.quotation_date : null,
              dollarRate: hasDollarRate ? calc.dollar_rate : null,
              batchCount: count || 0,
            }
          } catch (err) {
            console.error("Error processing calculation:", err)
            return {
              id: calc.id,
              title: calc.title,
              createdAt: calc.created_at,
              quotationDate: hasQuotationDate ? calc.quotation_date : null,
              dollarRate: hasDollarRate ? calc.dollar_rate : null,
              batchCount: 0,
            }
          }
        }),
      )

      return NextResponse.json({ success: true, calculations: formattedCalculations })
    }

    // Если ID указан, возвращаем конкретный расчет
    const { data: calculation, error: calculationError } = await supabase
      .from("calculations")
      .select("*")
      .eq("id", id)
      .single()

    if (calculationError) {
      console.error("Error fetching calculation:", calculationError)
      return NextResponse.json({ success: false, error: "Calculation not found" }, { status: 404 })
    }

    // Получаем партии для этого расчета
    const { data: batches, error: batchesError } = await supabase
      .from("batches")
      .select("*")
      .eq("calculation_id", id)
      .order("year", { ascending: false })

    if (batchesError) {
      console.error("Error fetching batches:", batchesError)
      return NextResponse.json({ success: false, error: "Failed to fetch batches" }, { status: 500 })
    }

    // Для каждой партии получаем пробы
    const batchesWithSamples = await Promise.all(
      batches.map(async (batch) => {
        try {
          const { data: samples, error: samplesError } = await supabase
            .from("samples")
            .select("*")
            .eq("batch_id", batch.id)

          if (samplesError) {
            console.error("Error fetching samples:", samplesError)
            return { ...batch, samples: [] }
          }

          // Преобразуем данные проб в формат, ожидаемый клиентом
          const formattedSamples = samples.map((sample) => ({
            id: sample.id,
            batchId: sample.batch_id,
            quantity: sample.quantity,
            colorGrade: sample.color_grade,
            leafGrade: sample.leaf_grade,
            stapleLength: sample.staple_length,
            weight: sample.weight,
            premiumDiscount: sample.premium_discount,
            lceQuotation: sample.lce_quotation,
            samplePrice: sample.sample_price,
            sampleAmount: sample.sample_amount,
            isEditing: false,
          }))

          // Преобразуем данные партии в формат, ожидаемый клиентом
          return {
            id: batch.id,
            year: batch.year,
            batchCode: batch.batch_code,
            weight: batch.weight,
            balesCount: batch.bales_count,
            samplesCount: batch.samples_count,
            samples: formattedSamples,
            isOpen: true,
            isEditing: false,
          }
        } catch (err) {
          console.error("Error processing batch:", err)
          return {
            id: batch.id,
            year: batch.year,
            batchCode: batch.batch_code,
            weight: batch.weight,
            balesCount: batch.bales_count,
            samplesCount: batch.samples_count,
            samples: [],
            isOpen: true,
            isEditing: false,
          }
        }
      }),
    )

    // Формируем полный ответ
    const fullCalculation = {
      id: calculation.id,
      title: calculation.title,
      createdAt: calculation.created_at,
      lceQuotation: calculation.lce_quotation,
      quotationDate: hasQuotationDate ? calculation.quotation_date : null,
      dollarRate: hasDollarRate ? calculation.dollar_rate : null,
      batches: batchesWithSamples,
    }

    return NextResponse.json({ success: true, calculation: fullCalculation })
  } catch (error) {
    console.error("Error in GET calculations:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
