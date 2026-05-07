import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSMS } from "@/lib/claude";
import { analyzeForConnections } from "@/lib/claude";
import { sendSMS } from "@/lib/twilio";
import { lookupDrug } from "@/lib/fda";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const body = formData.get("Body") as string;
  const from = formData.get("From") as string;

  if (!body || !from) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  await prisma.message.create({ data: { direction: "inbound", body, from } });

  const [symptoms, drugs, connections] = await Promise.all([
    prisma.symptom.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.drug.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.connection.findMany({ where: { dismissed: false }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const context = `
Current symptoms (last 20): ${symptoms.map((s) => `${s.description} (${s.createdAt.toLocaleDateString()})`).join(", ")}
Current medications: ${drugs.map((d) => `${d.name} ${d.dosage ?? ""}`).join(", ")}
  `.trim();

  const parsed = await parseSMS(body, context);
  console.log(`SMS from ${from}: "${body}" → parsed as: ${JSON.stringify(parsed)}`);

  let replyText = parsed.reply;

  if (parsed.type === "symptom" && parsed.symptom) {
    await prisma.symptom.create({
      data: {
        description: parsed.symptom.description,
        severity: parsed.symptom.severity ?? null,
        notes: parsed.symptom.notes ?? null,
        rawMessage: body,
      },
    });
  } else if (parsed.type === "drug" && parsed.drug) {
    const fdaData = await lookupDrug(parsed.drug.name);
    await prisma.drug.create({
      data: {
        name: parsed.drug.name,
        dosage: parsed.drug.dosage ?? null,
        frequency: parsed.drug.frequency ?? null,
        sideEffects: fdaData.sideEffects,
        interactions: fdaData.interactions,
        fdaData: fdaData.raw as object,
      },
    });
    if (fdaData.sideEffects.length > 0) {
      replyText = `${parsed.reply} Note: ${parsed.drug.name} has ${fdaData.sideEffects.length} known side effects now tracked.`;
    }
  }

  await prisma.message.create({ data: { direction: "outbound", body: replyText, to: from } });
  await sendSMS(from, replyText);

  // Run connection analysis in background (non-blocking)
  runConnectionAnalysis(from).catch(console.error);

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

async function runConnectionAnalysis(userPhone: string) {
  const [symptoms, drugs, existingConnections] = await Promise.all([
    prisma.symptom.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.drug.findMany(),
    prisma.connection.findMany({ where: { dismissed: false }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const analysis = await analyzeForConnections(symptoms, drugs, existingConnections);

  if (analysis.shouldCreate && analysis.connection) {
    await prisma.connection.create({ data: analysis.connection });

    if (analysis.proactiveMessage) {
      await sendSMS(userPhone, analysis.proactiveMessage);
      await prisma.message.create({
        data: { direction: "outbound", body: analysis.proactiveMessage, to: userPhone },
      });
    }
  }
}
