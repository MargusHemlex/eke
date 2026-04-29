/**
 * Sisendi heuristiline eelvalideerimine — kasutusel ainult "Paranda õigekeelsus" režiimis.
 *
 * Eesmärk: tabada juhuslikud tähekombinatsioonid ja tühjad/lühikesed sisendid
 * enne Claude API-kutset, et säästa API-kulu ja anda kasutajale kohene tagasiside.
 *
 * Heuristika ei püüa olla absoluutselt täpne — backend (PROMPT_GRAMMAR + submit_analysis)
 * teeb teise valideerimise kihi.
 */

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: "empty" | "too_short" | "gibberish"; message: string };

export function validateEstonianInput(text: string): ValidationResult {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return {
      ok: false,
      reason: "empty",
      message:
        "Kirjuta esmalt midagi kasti! Näiteks lause, mille õigsust soovid kontrollida.",
    };
  }

  if (trimmed.length < 10) {
    return {
      ok: false,
      reason: "too_short",
      message:
        "Kirjuta vähemalt üks terve lause — siis saan sind paremini aidata.",
    };
  }

  // Tõmba sõnad välja
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);

  // Sõna peab sisaldama vähemalt ühte vokaali (eesti keele tunnus — iga eesti sõna sisaldab vokaali)
  const wordsWithVowels = words.filter((w) => /[aeiouõäöü]/i.test(w));

  // Sõna ei tohi sisaldada üle 30% kirjavahemärke
  const cleanWords = words.filter((w) => {
    const punctCount = (w.match(/[.,;:\-_/\\!?'"()]/g) || []).length;
    return w.length > 0 && punctCount / w.length < 0.3;
  });

  const validRatio = Math.min(
    wordsWithVowels.length / Math.max(words.length, 1),
    cleanWords.length / Math.max(words.length, 1),
  );

  if (validRatio < 0.6) {
    return {
      ok: false,
      reason: "gibberish",
      message:
        "See ei tundu olevat eesti keelne tekst. Proovi kirjutada üks terve lause.",
    };
  }

  return { ok: true };
}
