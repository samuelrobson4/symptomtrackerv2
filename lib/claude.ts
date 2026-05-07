import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ParsedSMS {
  type: "symptom" | "drug" | "question" | "unknown";
  symptom?: {
    description: string;
    severity?: number;
    notes?: string;
  };
  drug?: {
    name: string;
    dosage?: string;
    frequency?: string;
  };
  reply: string;
}

export async function parseSMS(message: string, context: string): Promise<ParsedSMS> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are a personal health assistant that helps track symptoms and medications via SMS.

Context about the user's current tracked data:
${context}

Parse the incoming SMS and respond with a JSON object with this structure:
{
  "type": "symptom" | "drug" | "question" | "unknown",
  "symptom": { "description": string, "severity": number (1-10, optional), "notes": string (optional) },
  "drug": { "name": string, "dosage": string (optional), "frequency": string (optional) },
  "reply": string (short friendly SMS reply, max 160 chars)
}

Rules:
- If they describe how they feel, it's a symptom
- If they mention taking or starting a medication, it's a drug
- Be concise in replies
- For symptoms, extract severity if mentioned (e.g. "bad headache" = 7, "mild nausea" = 3)
- Reply only with the JSON, no other text`,
    messages: [{ role: "user", content: message }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { type: "unknown", reply: "Got it, noted!" };
  } catch {
    return { type: "unknown", reply: "Got it, noted!" };
  }
}

export interface ConnectionAnalysis {
  shouldCreate: boolean;
  connection?: {
    title: string;
    description: string;
    symptomIds: string[];
    drugIds: string[];
    confidence: "low" | "medium" | "high";
  };
  proactiveMessage?: string;
}

export async function analyzeForConnections(
  symptoms: Array<{ id: string; description: string; severity?: number | null; createdAt: Date }>,
  drugs: Array<{ id: string; name: string; dosage?: string | null; sideEffects: unknown }>,
  existingConnections: Array<{ title: string; description: string }>
): Promise<ConnectionAnalysis> {
  if (symptoms.length < 2) return { shouldCreate: false };

  const symptomSummary = symptoms
    .slice(-20)
    .map((s) => `[${s.id.slice(-6)}] ${s.description}${s.severity ? ` (severity ${s.severity})` : ""} on ${s.createdAt.toLocaleDateString()}`)
    .join("\n");

  const drugSummary = drugs
    .map((d) => `[${d.id.slice(-6)}] ${d.name}${d.dosage ? ` ${d.dosage}` : ""} - known side effects: ${JSON.stringify(d.sideEffects).slice(0, 200)}`)
    .join("\n");

  const existingSummary = existingConnections.map((c) => c.title).join(", ");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are a medical pattern analyst. You look at symptom logs and medication lists to find potential connections — but ONLY flag something if there is a genuine, non-obvious pattern worth the user's attention. Most of the time you should return shouldCreate: false. Only create a connection if:
1. A symptom pattern temporally correlates with starting a drug AND matches known side effects
2. Multiple symptoms cluster together in a way suggesting a single cause
3. There's a clear worsening trend worth flagging

Do NOT create a connection for every symptom. Be selective. Also do NOT duplicate already noted connections.

Already noted connections: ${existingSummary || "none"}

Respond with JSON only:
{
  "shouldCreate": boolean,
  "connection": {
    "title": string,
    "description": string (2-3 sentences, be specific about the evidence),
    "symptomIds": string[],
    "drugIds": string[],
    "confidence": "low" | "medium" | "high"
  },
  "proactiveMessage": string (optional SMS to send user, max 160 chars, only if high confidence)
}`,
    messages: [
      {
        role: "user",
        content: `Symptoms:\n${symptomSummary}\n\nMedications:\n${drugSummary || "none"}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { shouldCreate: false };
  } catch {
    return { shouldCreate: false };
  }
}
