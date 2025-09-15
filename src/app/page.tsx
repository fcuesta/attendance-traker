"use client";
import * as React from "react";
import { Select } from "@/components/Select";
import { AttendanceTable } from "@/components/AttendanceTable";

type TeamDto = { name: string };

type DateDto = {
  label: string; // original header string
  iso: string; // normalized YYYY-MM-DD
};

type DatesResponse = {
  dates: DateDto[];
  defaultIso: string | null;
};

export default function Page() {
  const [teams, setTeams] = React.useState<TeamDto[]>([]);
  const [team, setTeam] = React.useState<string>("");

  const [dates, setDates] = React.useState<DateDto[]>([]);
  const [dateIso, setDateIso] = React.useState<string>("");

  const [loadingDates, setLoadingDates] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        setTeams(data.teams);
        const defaultTeam = localStorage.getItem("defaultTeam");
        if (defaultTeam && data.teams.find((t) => t.name === defaultTeam))
          setTeam(defaultTeam);
      });
  }, []);

  React.useEffect(() => {
    if (!team) return;
    setLoadingDates(true);
    setDates([]);
    setDateIso("");
    fetch(`/api/dates?team=${encodeURIComponent(team)}`)
      .then((r) => r.json())
      .then((data: DatesResponse) => {
        setDates(data.dates);
        setDateIso(data.defaultIso || "");
      })
      .finally(() => setLoadingDates(false));
  }, [team]);

  return (
    <main className="flex flex-col gap-4">
      <header className="flex flex-row gap-2 ">
        <img
          height="36"
          width="36"
          alt=""
          src="data:image/png;base64,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"
        ></img>
        <h1 className="text-2xl font-bold tracking-tight">UE Cornellà</h1>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Equipo"
          options={teams.map((t) => ({ label: t.name, value: t.name }))}
          value={team}
          onChange={(v) => {
            setTeam(v);
            localStorage.setItem("defaultTeam", v);
          }}
          placeholder={teams.length ? "Select a team…" : "Loading…"}
        />

        <Select
          label="Fecha"
          options={dates.map((d) => ({ label: d.label, value: d.iso }))}
          value={dateIso}
          onChange={setDateIso}
          disabled={!team || loadingDates}
          placeholder={
            loadingDates
              ? "Loading…"
              : team
              ? "Select a date…"
              : "Pick a team first…"
          }
        />
      </section>

      {team && dateIso && (
        <section>
          <AttendanceTable team={team} date={dateIso} />
        </section>
      )}
    </main>
  );
}
