import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sa oled Eesti Keele Instituudi (EKI) ametlik õigekirjaekspert ja keelenõustaja.

SINU ROLL:
Parandad eestikeelseid tekste vastavalt EKI ametlikele õigekirja põhireeglitele (63 reeglit).
Allikas: https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/
PDF: https://eki.ee/wp-content/uploads/2025/08/Eesti-keele-oigekirja-pohireeglid.pdf

REEGLID MIDA JÄRGID:
1. Kasuta AINULT EKI ametlikke õigekirjareegleid. ÄRA IIAL leiuta reegleid.
2. Viita alati konkreetsele reeglile (nt "Reegel 15: Algustähed kohanimedes").
3. Kõik väljundid peavad olema EESTI KEELES.
4. Kontrolli: algustähed, kokku-lahkukirjutus, kirjavahemärgid, võõrsõnad, arvsõnad, lühendid.
5. Kui reegel on ebaselge, vali konservatiivsem variant ja märgi see.
6. ÄRA paranda stiili, ainult õigekirja ja kirjavahemärke.

VÄLJUND — vasta AINULT järgmise JSON-struktuuriga (ilma markdown koodiplokita, ilma selgitusteta väljaspool JSON-i):
{
  "correctedText": "Kogu parandatud tekst täies mahus. Säilita originaali struktuur ja lõigud.",
  "errors": [
    {
      "original": "vigane sõna või fraas originaaltekstis",
      "corrected": "õige kirjakuju",
      "rule": "Reegel X: Reegli täpne nimi EKI järgi",
      "ruleLink": "https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/",
      "explanation": "Täpne selgitus miks see vale on ja kuidas õigesti kirjutada (1-2 konkreetset lauset, viide reeglile)."
    }
  ]
}

Kui tekst on vigadeta, tagasta errors tühja massiivina [].
correctedText peab alati sisaldama täielikku teksti (parandatud või originaal, kui vigu pole).`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Tekst puudub" }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Tekst on liiga pikk (max 5000 märki)" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Paranda järgmine eestikeelne tekst ja leia kõik õigekirjavead EKI põhireeglite alusel:\n\n${text}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Ootamatu vastuse formaat");
    }

    // Strip markdown code fences if model adds them
    const raw = content.text.trim();
    const jsonStr = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      // Fallback: return original text with parsing error note
      return NextResponse.json(
        { error: "Vastuse parsimise viga. Proovi lühema tekstiga." },
        { status: 500 }
      );
    }

    // Validate shape
    if (
      typeof result.correctedText !== "string" ||
      !Array.isArray(result.errors)
    ) {
      return NextResponse.json(
        { error: "Vigane vastuse struktuur" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[/api/correct] viga:", error);
    const message =
      error instanceof Error ? error.message : "Sisemine serveri viga";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
