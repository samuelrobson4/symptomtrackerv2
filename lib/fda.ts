const FDA_BASE = "https://api.fda.gov/drug";

export interface FdaDrugResult {
  sideEffects: string[];
  interactions: string[];
  raw: Record<string, unknown>;
}

export async function lookupDrug(drugName: string): Promise<FdaDrugResult> {
  try {
    const encoded = encodeURIComponent(`"${drugName}"`);
    const url = `${FDA_BASE}/label.json?search=openfda.brand_name:${encoded}+OR+openfda.generic_name:${encoded}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("FDA lookup failed");
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return { sideEffects: [], interactions: [], raw: {} };

    const sideEffects = extractTextList(result.adverse_reactions ?? result.warnings ?? []);
    const interactions = extractTextList(result.drug_interactions ?? []);

    return { sideEffects, interactions, raw: result };
  } catch {
    return { sideEffects: [], interactions: [], raw: {} };
  }
}

function extractTextList(field: string | string[]): string[] {
  const raw = Array.isArray(field) ? field.join(" ") : field ?? "";
  const sentences = raw
    .split(/[.\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 200);
  return [...new Set(sentences)].slice(0, 20);
}
