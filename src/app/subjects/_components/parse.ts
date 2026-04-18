export type ParsedSubject = {
  name: string;
  examBoard: string;
  level: "A-Level" | "GCSE" | "Other";
  units: {
    code: string;
    title: string;
    topics: { code: string; title: string }[];
  }[];
};

type JsonObj = Record<string, unknown>;
type JsonValue = JsonObj | unknown;

function isObject(v: unknown): v is JsonObj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function extractMeta(text: string): {
  name: string;
  board: string;
  level: "A-Level" | "GCSE" | "Other";
} {
  const board =
    text.match(/Edexcel|AQA|OCR|WJEC|Pearson|Cambridge/i)?.[0] ?? "Unknown";
  const level = text.match(/A-Level|A Level|Advanced GCE|GCE/i)
    ? ("A-Level" as const)
    : text.match(/GCSE/i)
      ? ("GCSE" as const)
      : ("Other" as const);
  let name = text
    .replace(/^Pearson\s+/i, "")
    .replace(/Edexcel\s+/i, "")
    .replace(/Level\s+\d+\s+(Advanced\s+)?/i, "")
    .replace(/(GCE|GCSE)\s+in\s+/i, "")
    .replace(/AQA\s+(A-Level|GCSE)\s+/i, "")
    .trim();
  if (name.length > 60) name = name.slice(0, 60);
  return { name, board, level };
}

export function tryParseJson(raw: string): ParsedSubject | null {
  try {
    const parsed = JSON.parse(raw) as JsonValue;
    if (!isObject(parsed)) return null;
    const spec = isObject(parsed.specification) ? parsed.specification : parsed;
    if (!isObject(spec)) return null;

    if (Array.isArray(spec.themes)) {
      const meta = extractMeta(str(spec.title));
      const units: ParsedSubject["units"] = [];
      for (const theme of spec.themes as JsonValue[]) {
        if (!isObject(theme)) continue;
        const sections = Array.isArray(theme.sections)
          ? (theme.sections as JsonValue[])
          : [];
        for (const section of sections) {
          if (!isObject(section)) continue;
          const subs = Array.isArray(section.subsections)
            ? (section.subsections as JsonValue[])
            : [];
          const topics = subs.filter(isObject).map((sub) => ({
            code: str(sub.id),
            title: str(sub.title),
          }));
          units.push({
            code: str(section.id),
            title: str(section.name),
            topics,
          });
        }
      }
      return {
        name: meta.name,
        examBoard: meta.board,
        level: meta.level,
        units,
      };
    }

    if (isObject(spec.topics)) {
      const qual = str(spec.qualification) || str(spec.title);
      const meta = extractMeta(qual);
      const units: ParsedSubject["units"] = [];
      for (const [unitCode, unitData] of Object.entries(spec.topics)) {
        if (!isObject(unitData)) continue;
        const topics: { code: string; title: string }[] = [];
        if (isObject(unitData.subtopics)) {
          for (const [code, td] of Object.entries(unitData.subtopics)) {
            if (isObject(td)) topics.push({ code, title: str(td.title) });
          }
        }
        units.push({
          code: unitCode,
          title: str(unitData.title),
          topics,
        });
      }
      return {
        name: meta.name,
        examBoard: meta.board,
        level: meta.level,
        units,
      };
    }

    if (Array.isArray(spec.units)) {
      const level: ParsedSubject["level"] =
        spec.level === "A-Level" || spec.level === "GCSE" ? spec.level : "Other";
      return {
        name: str(spec.name),
        examBoard: str(spec.examBoard),
        level,
        units: spec.units as ParsedSubject["units"],
      };
    }
  } catch {
    /* invalid JSON */
  }
  return null;
}

export async function parseWithAi(
  text: string,
  apiKey: string,
  model: string,
): Promise<ParsedSubject> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `Extract exam specification structure. Return ONLY valid JSON: {"name":"","examBoard":"","level":"A-Level"|"GCSE"|"Other","units":[{"code":"1.1","title":"Major Topic","topics":[{"code":"1.1.1","title":"Minor Topic"}]}]}. Use EXACT codes and titles from the spec. Two levels only: major topics (units) and minor topics. No descriptions, no content arrays, just code+title.`,
          },
          {
            role: "user",
            content: `Extract the topic structure:\n\n${text.slice(0, 80000)}`,
          },
        ],
        temperature: 0,
        max_tokens: 16000,
      }),
    },
  );
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return valid JSON.");
  const parsed = JSON.parse(match[0]) as ParsedSubject;
  if (!parsed.units?.length) throw new Error("No units extracted.");
  return parsed;
}

export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".md") || name.endsWith(".txt")) return await file.text();
  if (name.endsWith(".json")) {
    const t = await file.text();
    try {
      return JSON.stringify(JSON.parse(t), null, 2);
    } catch {
      return t;
    }
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let text = "";
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if ((c >= 32 && c <= 126) || c === 10 || c === 13) {
      text += String.fromCharCode(c);
    }
  }
  return text.replace(/\s+/g, " ").replace(/[^\x20-\x7E\n]/g, "");
}
