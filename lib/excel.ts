import * as XLSX from "xlsx";

interface ExportData {
  symptoms: Array<{
    id: string;
    description: string;
    severity: number | null;
    notes: string | null;
    createdAt: Date;
  }>;
  drugs: Array<{
    id: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    startDate: Date;
    sideEffects: unknown;
  }>;
  connections: Array<{
    id: string;
    title: string;
    description: string;
    confidence: string;
    createdAt: Date;
  }>;
}

export function buildExcelBuffer(data: ExportData): Buffer {
  const wb = XLSX.utils.book_new();

  const symptomRows = data.symptoms.map((s) => ({
    Date: s.createdAt.toLocaleString(),
    Symptom: s.description,
    Severity: s.severity ?? "",
    Notes: s.notes ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(symptomRows), "Symptoms");

  const drugRows = data.drugs.map((d) => ({
    "Start Date": d.startDate.toLocaleDateString(),
    Drug: d.name,
    Dosage: d.dosage ?? "",
    Frequency: d.frequency ?? "",
    "Known Side Effects": Array.isArray(d.sideEffects)
      ? (d.sideEffects as string[]).join("; ")
      : "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(drugRows), "Medications");

  const connectionRows = data.connections.map((c) => ({
    Date: c.createdAt.toLocaleDateString(),
    Title: c.title,
    Description: c.description,
    Confidence: c.confidence,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(connectionRows), "AI Connections");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
