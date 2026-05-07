import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const connections = await prisma.connection.findMany({
    where: { dismissed: false },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(connections);
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  await prisma.connection.update({ where: { id }, data: { dismissed: true } });
  return NextResponse.json({ ok: true });
}
