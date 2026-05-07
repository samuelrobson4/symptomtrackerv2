import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSMS, analyzeForConnections } from "@/lib/claude";
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

  const [symptoms, drugs, connections, instructionRows] = await Promise.all([
    prisma.symptom.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.drug.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.connection.findMany({ where: { dismissed: false }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.instruction.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  const instructions = instructionRows.map((i) => i.content);

  const context = `
Current symptoms (last 20): ${symptoms.map((s) => `${s.description} (${s.createdAt.toLocaleDateString()})`).join(", ")}
Current medications: ${drugs.map((d) => `${d.name} ${d.dosage ?? ""}`).join(", ")}
  `.trim();

  const parsed = await parseSMS(body, context, instructions);
  console.log(`SMS from ${from}: "${body.slice(0, 80)}..." → ${parsed.symptoms.length} symptoms, ${parsed.drugs.length} drugs, instruction: ${parsed.isInstruction}`);

  if (parsed.isInstruction && parsed.instructionContent) {
    await prisma.instruction.create({ data: { content: parsed.instructionContent } });
  }

  // Store all symptoms
  for (const symptom of parsed.symptoms) {
    await prisma.symptom.create({
      data: {
        description: symptom.description,
        severity: symptom.severity ?? null,
        notes: symptom.notes ?? null,
        rawMessage: body,
      },
    });
  }

  // Store all drugs with FDA lookup, or log a dose if drug already exists
  for (const drug of parsed.drugs) {
    const existingDrug = await prisma.drug.findFirst({
      where: { name: { equals: drug.name, mode: "insensitive" } },
    });

    if (!drug.isNewDrug && existingDrug) {
      // Log a dose against the existing drug record
      await prisma.dose.create({
        data: {
          drugId: existingDrug.id,
          dosage: drug.dosage ?? existingDrug.dosage ?? null,
          rawMessage: body,
        },
      });
    } else if (!existingDrug) {
      // New drug — create it and log the first dose
      const fdaData = await lookupDrug(drug.name);
      const newDrug = await prisma.drug.create({
        data: {
          name: drug.name,
          dosage: drug.dosage ?? null,
          frequency: drug.frequency ?? null,
          sideEffects: fdaData.sideEffects,
          interactions: fdaData.interactions,
          fdaData: fdaData.raw as object,
          rawMessage: body,
        },
      });
      await prisma.dose.create({
        data: {
          drugId: newDrug.id,
          dosage: drug.dosage ?? null,
          rawMessage: body,
        },
      });
    }
  }

  await prisma.message.create({ data: { direction: "outbound", body: parsed.reply, to: from } });

  try {
    await sendSMS(from, parsed.reply);
  } catch (err) {
    console.error("SMS send failed (likely pending verification):", err);
  }

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
      try {
        await sendSMS(userPhone, analysis.proactiveMessage);
        await prisma.message.create({
          data: { direction: "outbound", body: analysis.proactiveMessage, to: userPhone },
        });
      } catch (err) {
        console.error("Proactive SMS failed:", err);
      }
    }
  }
}
