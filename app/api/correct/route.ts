import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

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

VÄLJUND — AINULT see JSON (ilma markdown-ita):
{
  "correctedText": "Täielik parandatud tekst.",
  "errors": [
    {
      "original": "vigane kirjakuju",
      "corrected": "õige kirjakuju",
      "rule": "Reegel X: Reegli nimi",
      "ruleLink": "https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/",
      "explanation": "Miks vale ja kuidas õigesti (1-2 lauset)."
    }
  ],
  "sentenceSuggestions": [],
  "contentSuggestions": []
}`;

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

VÄLJUND — AINULT see JSON (ilma markdown-ita):
{
  "correctedText": "Täielik tekst koos laususeehituse parandustega.",
  "errors": [],
  "sentenceSuggestions": [
    {
      "original": "originaalne lause või fraas tekstist",
      "suggestion": "parem variant",
      "type": "V2|lausepikkus|aktiiv-passiiv|sidend|kordus|lausealgus|järjekord",
      "explanation": "Miks muuta ja mida paranes (1-2 lauset, viide reeglile)."
    }
  ],
  "contentSuggestions": []
}`;

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

VÄLJUND — AINULT see JSON (ilma markdown-ita):
{
  "correctedText": "",
  "errors": [],
  "sentenceSuggestions": [],
  "contentSuggestions": [
    {
      "category": "struktuur|argument|näide|seiskoht|punane-joon|kokkuvõte|sissejuhatus",
      "priority": "kõrge|keskmine|madal",
      "feedback": "Konkreetne tagasiside mis on praegu (1-2 lauset).",
      "suggestion": "Konkreetne soovitus mida teha (1-3 lauset)."
    }
  ]
}`;

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
  try {
    const body = await request.json();
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
      messages: [{ role: "user", content: USER_MESSAGES[validMode](text) }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Ootamatu vastuse formaat");

    const jsonStr = content.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Vastuse parsimise viga. Proovi lühema tekstiga." },
        { status: 500 }
      );
    }

    // Normalise — ensure all arrays exist
    result.errors ??= [];
    result.sentenceSuggestions ??= [];
    result.contentSuggestions ??= [];
    result.correctedText ??= "";

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[/api/correct] viga:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sisemine serveri viga" },
      { status: 500 }
    );
  }
}
