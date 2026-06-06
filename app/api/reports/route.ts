import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { buildLibraryReport, reportToCsv } from "@/lib/reports";

// GET /api/reports — relatórios gerenciais (somente staff: admin/bibliotecário).
// ?format=csv devolve o relatório como arquivo CSV para download.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const report = await buildLibraryReport();

  const format = new URL(req.url).searchParams.get("format");
  if (format === "csv") {
    const csv = reportToCsv(report);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-biblioteca-${stamp}.csv"`,
      },
    });
  }

  return NextResponse.json({ report });
}
