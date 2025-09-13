import { NextResponse } from 'next/server'
import { getSheetsClient, getSheetMatrix, normalizeHeaderDate, SPREADSHEET_ID } from '@/lib/sheets'

const ALLOWED = ['YES', 'NO', 'LATE']

function columnToA1(n: number) {
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export async function POST(req: Request) {
  try {
    const { team, date, entries } = await req.json()
    if (!team || !date || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Missing team/date/entries' }, { status: 400 })
    }
    const matrix = await getSheetMatrix(team)
    const header = matrix[0] || []
    const headerDates = header.map((c) => normalizeHeaderDate(c))

    let colIdx = -1
    for (let i = 1; i < headerDates.length; i++) if (headerDates[i]?.iso === date) colIdx = i + 1
    if (colIdx === -1) return NextResponse.json({ error: 'Date not found' }, { status: 404 })

    const playerRowMap = new Map<string, number>()
    for (let r = 1; r < matrix.length; r++) {
      const name = (matrix[r]?.[0] || '').trim()
      if (name) playerRowMap.set(name, r + 1)
    }

    const data: Array<{ range: string; values: string[][] }> = []
    for (const { player, status } of entries) {
      if (!ALLOWED.includes(String(status).toUpperCase())) continue
      const rowIdx = playerRowMap.get(player)
      if (!rowIdx) continue
      const range = `'${team}'!${columnToA1(colIdx)}${rowIdx}`
      data.push({ range, values: [[String(status).toUpperCase()]] })
    }

    if (!data.length) return NextResponse.json({ ok: true, updated: 0 })

    const sheets = getSheetsClient()
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data },
    })

    return NextResponse.json({ ok: true, updated: data.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Batch update failed' }, { status: 500 })
  }
}
