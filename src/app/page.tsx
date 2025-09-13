'use client'
import * as React from 'react'
import { Select } from '@/components/Select'
import { AttendanceTable } from '@/components/AttendanceTable'

type TeamDto = { name: string }

type DateDto = {
  label: string // original header string
  iso: string   // normalized YYYY-MM-DD
}

type DatesResponse = {
  dates: DateDto[]
  defaultIso: string | null
}

export default function Page() {
  const [teams, setTeams] = React.useState<TeamDto[]>([])
  const [team, setTeam] = React.useState<string>('')

  const [dates, setDates] = React.useState<DateDto[]>([])
  const [dateIso, setDateIso] = React.useState<string>('')

  const [loadingDates, setLoadingDates] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((data) => setTeams(data.teams))
  }, [])

  React.useEffect(() => {
    if (!team) return
    setLoadingDates(true)
    setDates([])
    setDateIso('')
    fetch(`/api/dates?team=${encodeURIComponent(team)}`)
      .then((r) => r.json())
      .then((data: DatesResponse) => {
        setDates(data.dates)
        setDateIso(data.defaultIso || '')
      })
      .finally(() => setLoadingDates(false))
  }, [team])

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Practice Attendance</h1>
        <p className="text-sm text-gray-600">
          Select a team and date to record attendance (YES / NO / LATE).
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Team"
          options={teams.map((t) => ({ label: t.name, value: t.name }))}
          value={team}
          onChange={setTeam}
          placeholder={teams.length ? 'Select a team…' : 'Loading…'}
        />

        <Select
          label="Date"
          options={dates.map((d) => ({ label: d.label, value: d.iso }))}
          value={dateIso}
          onChange={setDateIso}
          disabled={!team || loadingDates}
          placeholder={loadingDates ? 'Loading…' : team ? 'Select a date…' : 'Pick a team first…'}
        />
      </section>

      {team && dateIso && (
        <section className="mt-2">
          <AttendanceTable team={team} date={dateIso} />
        </section>
      )}
    </main>
  )
}
