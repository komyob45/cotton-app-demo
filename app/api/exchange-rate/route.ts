import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function GET() {
  try {
    // Используем фиксированное значение как запасной вариант
    const fallbackRate = 11.3

    // Попробуем несколько URL для получения курса доллара
    const urls = [
      "https://nbt.tj/ru/kurs/kurs.php",
      "https://nbt.tj/ru/",
      "https://nbt.tj/ru/kurs/",
      "https://www.nbt.tj/ru/kurs/kurs.php",
    ]

    let dollarRate = null
    let sourceUrl = ""
    let htmlSnippet = ""

    // Пробуем каждый URL по очереди
    for (const url of urls) {
      try {
        console.log(`Trying to fetch exchange rate from: ${url}`)

        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          cache: "no-store",
        })

        if (!response.ok) {
          console.log(`Failed to fetch from ${url}: ${response.status} ${response.statusText}`)
          continue
        }

        const html = await response.text()
        htmlSnippet = html.substring(0, 1000)
        console.log(`HTML snippet from ${url}:`, htmlSnippet)

        const $ = cheerio.load(html)

        // Логируем все таблицы на странице для отладки
        console.log(`Found ${$("table").length} tables on the page`)

        // Метод 1: Поиск в таблицах
        $("table").each((i, table) => {
          console.log(`Checking table ${i}`)
          const tableHtml = $(table).html()
          console.log(`Table ${i} HTML snippet:`, tableHtml ? tableHtml.substring(0, 200) : "empty")

          $(table)
            .find("tr")
            .each((j, row) => {
              const rowText = $(row).text().trim()
              console.log(`Row ${j} text:`, rowText)

              if (rowText.includes("USD") || rowText.includes("Доллар") || rowText.includes("доллар")) {
                console.log(`Found dollar mention in row: ${rowText}`)

                // Ищем числовое значение в строке
                const match = rowText.match(/(\d+[.,]\d+)/)
                if (match) {
                  dollarRate = Number.parseFloat(match[1].replace(",", "."))
                  sourceUrl = url
                  console.log(`Found dollar rate: ${dollarRate}`)
                  return false // Прерываем цикл
                }

                // Если не нашли в тексте строки, проверяем ячейки
                $(row)
                  .find("td")
                  .each((k, cell) => {
                    const cellText = $(cell).text().trim()
                    console.log(`Cell ${k} text:`, cellText)

                    const match = cellText.match(/(\d+[.,]\d+)/)
                    if (match) {
                      dollarRate = Number.parseFloat(match[1].replace(",", "."))
                      sourceUrl = url
                      console.log(`Found dollar rate in cell: ${dollarRate}`)
                      return false // Прерываем цикл
                    }
                  })
              }
            })

          if (dollarRate) return false // Прерываем цикл, если нашли значение
        })

        // Метод 2: Поиск в блоках с классами, связанными с курсами валют
        if (!dollarRate) {
          console.log("Trying to find dollar rate in currency blocks")
          $(".currency, .exchange-rate, .kurs, .course, .valute").each((i, block) => {
            const blockText = $(block).text().trim()
            console.log(`Currency block ${i} text:`, blockText)

            if (blockText.includes("USD") || blockText.includes("Доллар") || blockText.includes("доллар")) {
              const match = blockText.match(/(\d+[.,]\d+)/)
              if (match) {
                dollarRate = Number.parseFloat(match[1].replace(",", "."))
                sourceUrl = url
                console.log(`Found dollar rate in currency block: ${dollarRate}`)
                return false // Прерываем цикл
              }
            }
          })
        }

        // Метод 3: Поиск в тексте всей страницы
        if (!dollarRate) {
          console.log("Trying to find dollar rate in page text")
          const pageText = $("body").text()

          // Ищем различные варианты упоминания доллара
          const dollarMatches =
            pageText.match(/USD[:\s]*(\d+[.,]\d+)/i) ||
            pageText.match(/Доллар США[:\s]*(\d+[.,]\d+)/i) ||
            pageText.match(/доллар[:\s]*(\d+[.,]\d+)/i) ||
            pageText.match(/\$[:\s]*(\d+[.,]\d+)/i)

          if (dollarMatches && dollarMatches[1]) {
            dollarRate = Number.parseFloat(dollarMatches[1].replace(",", "."))
            sourceUrl = url
            console.log(`Found dollar rate in page text: ${dollarRate}`)
          }
        }

        if (dollarRate) break // Если нашли значение, прерываем цикл по URL
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error)
      }
    }

    // Если не удалось найти курс доллара, используем альтернативный источник - Национальный банк Казахстана
    if (!dollarRate) {
      try {
        console.log("Trying alternative source: National Bank of Kazakhstan")
        const kzResponse = await fetch(
          "https://nationalbank.kz/ru/exchangerates/ezhednevnye-oficialnye-rynochnye-kursy-valyut",
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          },
        )

        if (kzResponse.ok) {
          const kzHtml = await kzResponse.text()
          const kz$ = cheerio.load(kzHtml)

          kz$("table").each((i, table) => {
            kz$(table)
              .find("tr")
              .each((j, row) => {
                const rowText = kz$(row).text().trim()
                if (rowText.includes("USD") || rowText.includes("Доллар США")) {
                  const cells = kz$(row).find("td")
                  cells.each((k, cell) => {
                    const cellText = kz$(cell).text().trim()
                    const match = cellText.match(/(\d+[.,]\d+)/)
                    if (match) {
                      dollarRate = Number.parseFloat(match[1].replace(",", "."))
                      sourceUrl = "nationalbank.kz"
                      console.log(`Found dollar rate from Kazakhstan National Bank: ${dollarRate}`)
                      return false
                    }
                  })
                }
              })
          })
        }
      } catch (kzError) {
        console.error("Error fetching from Kazakhstan National Bank:", kzError)
      }
    }

    // Если все еще не нашли курс, используем фиксированное значение
    if (!dollarRate) {
      console.log("Using fallback dollar rate:", fallbackRate)
      return NextResponse.json({
        success: true,
        rate: fallbackRate,
        source: "fallback",
        message: "Could not fetch real-time data, using fallback value",
        debug: {
          htmlSnippet,
          attemptedUrls: urls,
        },
      })
    }

    return NextResponse.json({
      success: true,
      rate: dollarRate,
      source: sourceUrl || "nbt.tj",
    })
  } catch (error) {
    console.error("Error fetching exchange rate:", error)
    // В случае ошибки возвращаем фиксированное значение
    return NextResponse.json({
      success: true,
      rate: 11.3,
      source: "fallback",
      message: "Error occurred, using fallback value",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
