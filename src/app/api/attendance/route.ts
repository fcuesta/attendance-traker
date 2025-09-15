import { NextResponse } from 'next/server'
import { getSheetsClient, getSheetMatrix, normalizeHeaderDate, SPREADSHEET_ID } from '@/lib/sheets'

type StatusType = 'SI' | 'NO' | 'TARDE' | '';
const ALLOWED: Array<StatusType> = ['SI', 'NO', 'TARDE']

function columnToA1(n: number) {
  // 1 -> A, 2 -> B, ...
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const team = searchParams.get('team')
  const iso = searchParams.get('date') // YYYY-MM-DD
  if (!team || !iso) return NextResponse.json({ error: 'Missing team or date' }, { status: 400 })

  try {
    const matrix = await getSheetMatrix(team)
    const header = matrix[0] || []
    const headerDates = header.map((c) => normalizeHeaderDate(c))

    // Find column index for the date (B=2 ...)
    let colIdx = -1
    for (let i = 1; i < headerDates.length; i++) {
      if (headerDates[i]?.iso === iso) {
        colIdx = i + 1 // because headerDates includes A1
        break
      }
    }
    if (colIdx === -1) return NextResponse.json({ error: 'Date not found in sheet header' }, { status: 404 })

    const rows = [] as { player: string; status: StatusType }[];
    for (let r = 1; r < matrix.length; r++) {
      const row = matrix[r];
      const player = (row?.[0] || "").trim();
      if (!player) continue;

      const getStatus = (col: number): StatusType => {
        const status = (row?.[col - 1] || "").trim().toUpperCase() as any;
        return ALLOWED.includes(status) ? status : "";
      };

      const last5Games = [] as StatusType[];
      for (let col = colIdx; col > 1 && last5Games.length < 5; col--) {
        last5Games.push(getStatus(col));
      }
      last5Games.reverse(); // so oldest is first
      const status = getStatus(colIdx);
      rows.push({ player, status, last5Games } as any);
    }

    return NextResponse.json({ rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const team = body.team as string
    const iso = body.date as string
    const player = (body.player as string)?.trim()
    const status = (body.status as string)?.toUpperCase()

    if (!team || !iso || !player || !status) {
      return NextResponse.json({ error: 'Missing team/date/player/status' }, { status: 400 })
    }
    if (!ALLOWED.includes(status as any)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Load sheet matrix once to locate row/col
    const matrix = await getSheetMatrix(team)
    const header = matrix[0] || []
    const headerDates = header.map((c) => normalizeHeaderDate(c))

    let colIdx = -1
    for (let i = 1; i < headerDates.length; i++) {
      if (headerDates[i]?.iso === iso) {
        colIdx = i + 1
        break
      }
    }
    if (colIdx === -1) return NextResponse.json({ error: 'Date not found' }, { status: 404 })

    let rowIdx = -1
    for (let r = 1; r < matrix.length; r++) {
      if ((matrix[r]?.[0] || '').trim() === player) {
        rowIdx = r + 1 // A1 = row 1
        break
      }
    }
    if (rowIdx === -1) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const range = `'${team}'!${columnToA1(colIdx)}${rowIdx}`
    const sheets = getSheetsClient()
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [[status]] },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update attendance' }, { status: 500 })
  }
}
