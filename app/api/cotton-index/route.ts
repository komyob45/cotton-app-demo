import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function GET() {
  try {
    // Пробуем получить данные с Cotton Outlook
    const response = await fetch("https://www.cotlook.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Логируем часть HTML для отладки
    console.log("HTML snippet:", html.substring(0, 1000))

    // Ищем A Index на странице
    let aIndex = null

    // Пытаемся найти A Index на главной странице
    $(".cotlook-index, .index-value, .a-index, .cotton-price").each((i, elem) => {
      const text = $(elem).text().trim()
      if (text.includes("A Index") || text.includes("Cotlook A Index")) {
        const match = text.match(/(\d+\.\d+)/)
        if (match && match[1]) {
          aIndex = Number.parseFloat(match[1])
        }
      }
    })

    // Если не нашли по селекторам, пробуем искать в тексте страницы
    if (!aIndex) {
      const pageText = $("body").text()
      const match = pageText.match(/A Index[:\s]*(\d+\.\d+)/i) || pageText.match(/Cotlook A Index[:\s]*(\d+\.\d+)/i)
      if (match && match[1]) {
        aIndex = Number.parseFloat(match[1])
      }
    }

    // Если не удалось найти A Index, пробуем альтернативные источники
    if (!aIndex) {
      // Пробуем Cotton Outlook
      try {
        const altResponse = await fetch("https://www.cottonoutlook.com/", {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })

        if (altResponse.ok) {
          const altHtml = await altResponse.text()
          const alt$ = cheerio.load(altHtml)

          alt$(".market-data, .cotton-price, .index-value").each((i, elem) => {
            const text = alt$(elem).text().trim()
            if (text.includes("A Index") || text.includes("Cotton A Index")) {
              const match = text.match(/(\d+\.\d+)/)
              if (match && match[1]) {
                aIndex = Number.parseFloat(match[1])
              }
            }
          })

          // Если не нашли по селекторам, пробуем искать в тексте страницы
          if (!aIndex) {
            const pageText = alt$("body").text()
            const match =
              pageText.match(/A Index[:\s]*(\d+\.\d+)/i) || pageText.match(/Cotton A Index[:\s]*(\d+\.\d+)/i)
            if (match && match[1]) {
              aIndex = Number.parseFloat(match[1])
            }
          }
        }
      } catch (altError) {
        console.error("Error fetching from alternative source:", altError)
      }
    }

    // Если все еще не нашли A Index, используем фиксированное значение
    if (!aIndex) {
      // Используем фиксированное значение как запасной вариант
      aIndex = 80.0
      console.log("Using fallback A Index value:", aIndex)
      return NextResponse.json({
        success: true,
        index: aIndex,
        source: "fallback",
        message: "Could not fetch real-time data, using fallback value",
      })
    }

    return NextResponse.json({
      success: true,
      index: aIndex,
      source: "cotlook.com",
    })
  } catch (error) {
    console.error("Error fetching cotton index:", error)
    // В случае ошибки возвращаем фиксированное значение
    return NextResponse.json({
      success: true,
      index: 80.0,
      source: "fallback",
      message: "Error occurred, using fallback value",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
