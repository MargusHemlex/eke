import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { logError, getProbableCause } from "@/lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────

const PROMPT_GRAMMAR = `Sa oled Eesti Keele Instituudi (EKI) ametlik õigekirjaekspert.

ROLL: Paranda eestikeelseid tekste vastavalt EKI ametlikele õigekirja põhireeglitele (63 reeglit).
Allikas: https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/

REEGLID:
1. Kasuta AINULT EKI ametlikke reegleid. ÄRA iial leiuta reegleid.
2. Viita konkreetsele reeglile (nt "Reegel 15: Algustähed kohanimedes").
3. Kõik väljundid EESTI KEELES.
4. Kontrolli: algustähed, kokku-lahkukirjutus, kirjavahemärgid, võõrsõnad, arvsõnad, lühendid.
5. ÄRA paranda stiili — ainult õigekirja ja kirjavahemärke.
6. Tagasta tulemus submit_analysis tööriista kaudu.`;

const PROMPT_SENTENCE = `Sa oled eesti keele lauseehituse ja stiili ekspert, kes juhendab gümnaasiumiõpilasi riigieksami kirjandiks ette valmistuma.

ROLL: Analüüsi teksti lauseehitust ja stiili. Viita EKI käsiraamatule ja riigieksami stiilinõuetele.

ANALÜÜSI JÄRGMIST:
1. **V2-reegel** — finiitverb peab olema jaatavas põimlauses TEISEL kohal. Vigane: "Täna mina läksin..." → Õige: "Täna läksin mina..."
2. **Lausepikkus ja vaheldus** — liiga pikad/lühikesed laused, monotoonne struktuur
3. **Aktiiv vs. passiiv** — liialt palju passiivi nõrgendab teksti; soovita aktiivi
4. **Sidendid** — et, kuna, sest, kuigi, ehkki, nii et — kas kasutatakse õigesti ja mitmekesiselt?
5. **Algus- ja lõpplaused** — kas lause algus on mitmekesine? Väldi "Mina arvan" korduvat algust.
6. **Kordused** — sama sõna/struktuuri liigne kordamine
7. **Lauseliikmete järjekord** — rõhk, loogilisus
8. Tagasta tulemus submit_analysis tööriista kaudu.`;

const PROMPT_CONTENT = `Sa oled eesti keele riigieksami arutleva kirjandi juhendaja ja hindaja.

ROLL: Analüüsi teksti sisu, ülesehitust ja argumentatsiooni vastavalt riigieksami nõuetele (400+ sõna, arutlev kirjand).

RIIGIEKSAMI NÕUDED:
- Sissejuhatus: teema tutvustus, probleemipüstitus, autor võtab seisukoha
- Arendus: vähemalt 2-3 argumenti, igal argumendil näide või tõestus
- Kokkuvõte: seisukoha kordamine, üldistus, laiem mõte
- Loogiline ülesehitus: mõtted seotud, selge punane joon
- Näited: konkreetsed, asjakohased (kirjandus, ajalugu, päriselu)
- Stiil: neutraalne, selge, ei kasuta slängi

HINDA:
1. Struktuur (sissejuhatus / arendus / kokkuvõte)
2. Argumentide tugevus ja loogika
3. Näidete kvaliteet ja asjakohasus
4. Punase joone olemasolu
5. Seisukoha selgus
6. Mida lisada / muuta / eemaldada
7. Tagasta tulemus submit_analysis tööriista kaudu.`;

// ─────────────────────────────────────────
// TOOL SCHEMA
// ─────────────────────────────────────────

const ANALYSIS_TOOL: Anthropic.Tool = {
  name: "submit_analysis",
  description: "Tagasta analüüsi tulemus struktureeritud formaadis.",
  input_schema: {
    type: "object" as const,
    properties: {
      correctedText: {
        type: "string",
        description: "Parandatud või täiustatud tekst. Tühi string kui ei rakendu (nt sisu režiimis).",
      },
      errors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string" },
            corrected: { type: "string" },
            rule: { type: "string" },
            ruleLink: { type: "string" },
            explanation: { type: "string" },
          },
          required: ["original", "corrected", "rule", "explanation"],
        },
      },
      sentenceSuggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string" },
            suggestion: { type: "string" },
            type: { type: "string" },
            explanation: { type: "string" },
          },
          required: ["original", "suggestion", "type", "explanation"],
        },
      },
      contentSuggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string" },
            priority: { type: "string", enum: ["kõrge", "keskmine", "madal"] },
            feedback: { type: "string" },
            suggestion: { type: "string" },
          },
          required: ["category", "priority", "feedback", "suggestion"],
        },
      },
    },
    required: ["correctedText", "errors", "sentenceSuggestions", "contentSuggestions"],
  },
};

const SYSTEM_PROMPTS = {
  grammar: PROMPT_GRAMMAR,
  sentence: PROMPT_SENTENCE,
  content: PROMPT_CONTENT,
} as const;

const USER_MESSAGES = {
  grammar: (text: string) =>
    `Paranda järgmine eestikeelne tekst ja leia kõik õigekirjavead EKI põhireeglite alusel:\n\n${text}`,
  sentence: (text: string) =>
    `Analüüsi järgmise teksti lauseehitust ja stiili ning anna konkreetsed soovitused parandamiseks:\n\n${text}`,
  content: (text: string) =>
    `Analüüsi järgmise arutleva teksti sisu, ülesehitust ja argumentatsiooni riigieksami nõuete alusel:\n\n${text}`,
};

// ─────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { text?: string; mode?: string } = {};
  try {
    body = await request.json();
    const { text, mode = "grammar" } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Tekst puudub" }, { status: 400 });
    }
    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Tekst on liiga pikk (max 5000 märki)" },
        { status: 400 }
      );
    }
    if (!["grammar", "sentence", "content"].includes(mode)) {
      return NextResponse.json({ error: "Tundmatu režiim" }, { status: 400 });
    }

    const validMode = mode as "grammar" | "sentence" | "content";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      temperature: 0,
      system: SYSTEM_PROMPTS[validMode],
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "submit_analysis" },
      messages: [{ role: "user", content: USER_MESSAGES[validMode](text) }],
    });

    const content = message.content[0];
    if (content.type !== "tool_use") throw new Error("Ootamatu vastuse formaat");

    // content.input is already a parsed object — no JSON.parse needed
    const result = content.input as {
      correctedText: string;
      errors: unknown[];
      sentenceSuggestions: unknown[];
      contentSuggestions: unknown[];
    };

    // Normalise — ensure all arrays exist
    result.errors ??= [];
    result.sentenceSuggestions ??= [];
    result.contentSuggestions ??= [];
    result.correctedText ??= "";

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[/api/correct] viga:", error);

    const message = error instanceof Error ? error.message : "Sisemine serveri viga";
    const status = (error as { status?: number })?.status ?? null;
    const text = typeof body?.text === "string" ? body.text : "";

    try {
      await logError({
        mode: body?.mode ?? "teadmata",
        error_type: error instanceof Error ? error.constructor.name : "UnknownError",
        error_message: message,
        http_status: status,
        text_preview: text.slice(0, 200),
        probable_cause: getProbableCause(status, message),
      });
    } catch (dbErr) {
      console.error("[/api/correct] logimise viga:", dbErr);
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
