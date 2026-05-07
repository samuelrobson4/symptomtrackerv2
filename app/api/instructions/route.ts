import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const instructions = await prisma.instruction.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(instructions);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.instruction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
