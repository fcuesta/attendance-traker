import { NextResponse } from "next/server";
import {
  getSheetMatrix,
  normalizeHeaderDate,
  pickDefaultDateIso,
} from "@/lib/sheets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team");
  if (!team)
    return NextResponse.json({ error: "Missing team" }, { status: 400 });
  try {
    const matrix = await getSheetMatrix(team);
    const header = matrix[0] || []; // row 1
    const headerDates = header.slice(1).map((c) => normalizeHeaderDate(c)); // B1 onwards
    const defaultIso = pickDefaultDateIso(headerDates);
    return NextResponse.json({
      dates: headerDates
        .filter((d) => d.iso)
        .map((d) => ({ label: d.label, iso: d.iso! })),
      defaultIso,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to fetch dates" },
      { status: 500 }
    );
  }
}
