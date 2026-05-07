import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const drugs = await prisma.drug.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(drugs);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.drug.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
