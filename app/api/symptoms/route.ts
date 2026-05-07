import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const symptoms = await prisma.symptom.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(symptoms);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.symptom.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
