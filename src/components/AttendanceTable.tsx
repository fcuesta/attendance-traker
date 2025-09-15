'use client'
import * as React from 'react'
import { SelectStatus } from './SelectStatus'
import { Badge } from './Badge'

export type StatusType = 'YES' | 'NO' | 'LATE' | ''
export type AttendanceRow = { player: string; status: StatusType; last5Games: StatusType[] }

const STATUS_OPTIONS = [
  { label: 'YES', value: 'YES', color: 'bg-green-500' },
  { label: 'NO', value: 'NO', color: 'bg-red-500' },
  { label: 'LATE', value: 'LATE', color: 'bg-yellow-500' },
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
    setRows((rows) => rows?.map((r) => (r.player === player ? { ...r, status, last5Games: [...r.last5Games.slice(1), status] } : r)) ?? null)

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
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-400 dark:bg-red-950 dark:text-red-200">{error}</div>
    )
  }
  if (!rows) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        Loading attendance...
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="rounded-2xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Player</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last 5 games</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr key={row.player} className="bg-white dark:bg-gray-900">
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{row.player}</td>
                <td className="w-[200px] max-w-[200px] px-4 py-2 ">
                  <div className="flex items-center gap-2">
                    <SelectStatus
                      options={STATUS_OPTIONS}
                      value={row.status || ''}
                      onChange={(v) => updateRow(row.player, v as 'YES' | 'NO' | 'LATE')}
                      placeholder="Select..."
                    />
                    {saving[row.player] === 'saving' && <Badge>Saving…</Badge>}
                    {saving[row.player] === 'saved' && <Badge>Saved</Badge>}
                    {saving[row.player] === 'error' && (
                      <span className="text-xs text-red-600">Failed. Refresh?</span>
                    )}
                  </div> 
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {row.last5Games.map((game, index) => (
                      <div key={index} className={`${STATUS_OPTIONS.find(opt => opt.value === game)?.color ?? 'bg-gray-600'} p-2 rounded-full`}>
                        &nbsp;
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  )
}
