'use client'
import * as React from 'react'
import { Select } from './Select'
import { Badge } from './Badge'

export type AttendanceRow = { player: string; status: 'YES' | 'NO' | 'LATE' | '' }

const STATUS_OPTIONS = [
  { label: 'YES', value: 'YES' },
  { label: 'NO', value: 'NO' },
  { label: 'LATE', value: 'LATE' },
]

export function AttendanceTable({ team, date }: { team: string; date: string }) {
  const [rows, setRows] = React.useState<AttendanceRow[] | null>(null)
  const [saving, setSaving] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({})
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let ignore = false
    setRows(null)
    setError(null)
    fetch(`/api/attendance?team=${encodeURIComponent(team)}&date=${encodeURIComponent(date)}`)
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j))))
      .then((data) => {
        if (!ignore) setRows(data.rows as AttendanceRow[])
      })
      .catch((e) => {
        if (!ignore) setError(e?.error || 'Failed to load attendance')
      })
    return () => {
      ignore = true
    }
  }, [team, date])

  const updateRow = async (player: string, status: 'YES' | 'NO' | 'LATE') => {
    setSaving((s) => ({ ...s, [player]: 'saving' }))
    // Optimistic UI
    setRows((rows) => rows?.map((r) => (r.player === player ? { ...r, status } : r)) ?? null)

    const res = await fetch('/api/attendance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, date, player, status }),
    })

    if (res.ok) {
      setSaving((s) => ({ ...s, [player]: 'saved' }))
      setTimeout(() => setSaving((s) => ({ ...s, [player]: 'idle' })), 1000)
    } else {
      setSaving((s) => ({ ...s, [player]: 'error' }))
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
    )
  }
  if (!rows) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        Loading attendance...
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Player
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((row) => (
              <tr key={row.player}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.player}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Select
                      options={STATUS_OPTIONS}
                      value={row.status || ''}
                      onChange={(v) => updateRow(row.player, v as 'YES' | 'NO' | 'LATE')}
                      placeholder="Select..."
                    />
                    {saving[row.player] === 'saving' && <Badge>Saving…</Badge>}
                    {saving[row.player] === 'saved' && <Badge>Saved</Badge>}
                    {saving[row.player] === 'error' && (
                      <span className="text-xs text-red-600">Failed. Retry?</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
