import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildExcelBuffer } from "@/lib/excel";

export async function GET() {
  const [symptoms, drugs, connections] = await Promise.all([
    prisma.symptom.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.drug.findMany({ orderBy: { startDate: "asc" } }),
    prisma.connection.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const buffer = buildExcelBuffer({ symptoms, drugs, connections });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="symptom-tracker-${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}
