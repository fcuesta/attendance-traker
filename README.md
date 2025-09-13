# Attendance Tracker (Next.js + Tailwind + Google Sheets)

This app lists team sheets (tabs) as "Teams", lets you pick a date (from header row), and edit each player's attendance (YES/NO/LATE). Changes write back to the corresponding cell in Google Sheets.

## Google Sheets Setup
1. Create a Google Sheet. Each team = a separate **sheet/tab** named exactly as the team.
2. In each team tab:
   - A1 can be blank or say "Player".
   - B1..Z1 = dates (ISO `YYYY-MM-DD` preferred; `dd/MM/yyyy` or `MM/dd/yyyy` also supported).
   - A2..A = player names (one per row).
3. Create a **Service Account** in Google Cloud and download its JSON.
4. Share the Google Sheet with the **service account email** with **Editor** permission.

## Environment Variables
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (ensure newlines are preserved; in Vercel you can paste normally, or use `\\n`-escaped newlines)
- `SHEETS_SPREADSHEET_ID`

## Local Dev
```bash
pnpm i # or npm i / yarn
pnpm dev
```
Open http://localhost:3000

## Deploy to Vercel
1. Push this repo to GitHub.
2. Import to Vercel > Framework **Next.js**.
3. Add the three env vars in **Project Settings → Environment Variables**.
4. Deploy.

## Notes
- The dates API chooses **today** if present; otherwise the **closest previous** date in the header.
- Status is validated to `YES | NO | LATE`.
- API routes are in `/app/api/*` and use a server-side Google Sheets client.
- To support batch updates later, add a `POST /api/attendance` that takes `{ team, date, entries: [{player, status}] }` and uses `values.update` with a `data` array and `valueInputOption: 'RAW'` via `batchUpdate`.

npm install
npm run dev