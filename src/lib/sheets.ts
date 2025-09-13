import { google, sheets_v4 } from 'googleapis'
import { parse, isValid } from 'date-fns'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

function getJwt() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!clientEmail || !privateKeyRaw) {
    throw new Error('Missing Google service account env vars')
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n')
  return new google.auth.JWT({ email: clientEmail, key: privateKey, scopes: SCOPES })
}

export function getSheetsClient(): sheets_v4.Sheets {
  const auth = getJwt()
  return google.sheets({ version: 'v4', auth })
}

export const SPREADSHEET_ID = process.env.SHEETS_SPREADSHEET_ID as string
if (!SPREADSHEET_ID) {
  // Allow local type checking; runtime will throw if used.
}

export async function listTeamSheets(): Promise<string[]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const tabs = res.data.sheets?.map((s) => s.properties?.title || '').filter(Boolean) || []
  return tabs
}

export type Matrix = string[][]

export async function getSheetMatrix(team: string): Promise<Matrix> {
  const sheets = getSheetsClient()
  const range = `'${team}'!A1:ZZ1000`
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range })
  const values = (res.data.values as string[][]) || []
  return values
}

export function normalizeHeaderDate(cell: string): { iso: string | null; label: string } {
  const label = cell
  // Try several common formats: ISO, dd/MM/yyyy, MM/dd/yyyy
  const candidates = [
    { fmt: "yyyy-MM-dd", re: /^(\d{4})-(\d{2})-(\d{2})$/ },
    { fmt: "dd/MM/yyyy", re: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/ },
    { fmt: "MM/dd/yyyy", re: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/ },
  ]
  for (const c of candidates) {
    try {
      const d = parse(cell, c.fmt as any, new Date())
      if (isValid(d)) {
        const iso = d.toISOString().slice(0, 10)
        return { iso, label }
      }
    } catch {}
  }
  // Last resort: Date.parse
  const d = new Date(cell)
  if (!isNaN(d.getTime())) return { iso: d.toISOString().slice(0, 10), label }
  return { iso: null, label }
}

export function pickDefaultDateIso(headers: { iso: string | null; label: string }[]): string | null {
  const todayIso = new Date().toISOString().slice(0, 10)
  const valid = headers.filter((h) => !!h.iso) as { iso: string; label: string }[]
  if (!valid.length) return null
  if (valid.some((h) => h.iso === todayIso)) return todayIso
  // pick the closest previous date
  const today = new Date(todayIso)
  const past = valid
    .map((h) => ({ iso: h.iso, t: new Date(h.iso).getTime() }))
    .filter((x) => x.t <= today.getTime())
    .sort((a, b) => b.t - a.t)
  return past[0]?.iso || valid.sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime())[0].iso
}
