import { NextResponse } from "next/server";
import { listTeamSheets } from "@/lib/sheets";

export async function GET() {
  try {
    const sheets = await listTeamSheets();
    return NextResponse.json({ teams: sheets.map((name) => ({ name })) });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to list teams" },
      { status: 500 }
    );
  }
}
