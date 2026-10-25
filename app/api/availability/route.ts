import { NextResponse, type NextRequest } from "next/server";
import { getBusyTables } from "@/lib/reservations";

// Obsazené stoly pro zvolený termín - volá ho rezervační formulář.
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const time = request.nextUrl.searchParams.get("time") ?? "";

  const result = await getBusyTables(date, time);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true, busy: result.data });
}
