import { neon } from "@neondatabase/serverless";

function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL puudub");
  return neon(process.env.DATABASE_URL);
}

export async function initErrorLogsTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS error_logs (
      id        SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      mode      VARCHAR(20),
      error_type VARCHAR(100),
      error_message TEXT,
      http_status INTEGER,
      text_preview VARCHAR(200),
      probable_cause TEXT
    )
  `;
}

export async function logError(entry: {
  mode: string;
  error_type: string;
  error_message: string;
  http_status: number | null;
  text_preview: string;
  probable_cause: string;
}) {
  const sql = getDb();
  await initErrorLogsTable();
  await sql`
    INSERT INTO error_logs (mode, error_type, error_message, http_status, text_preview, probable_cause)
    VALUES (
      ${entry.mode},
      ${entry.error_type},
      ${entry.error_message},
      ${entry.http_status},
      ${entry.text_preview},
      ${entry.probable_cause}
    )
  `;
}

function getProbableCause(status: number | null, message: string): string {
  if (status === 504 || message.includes("timeout") || message.includes("10s")) {
    return "Vercel hobby timeout — Claude API vastus võttis üle 10 sekundi";
  }
  if (status === 429) {
    return "Anthropic API rate limit ületatud — liiga palju päringuid korraga";
  }
  if (status === 401 || status === 403) {
    return "Anthropic API võti on vigane või aegunud";
  }
  if (status === 500) {
    return "Serveri sisemine viga — Claude API tagastas ootamatu vastuse";
  }
  if (message.includes("fetch") || message.includes("network") || message.includes("ECONNRESET")) {
    return "Võrguühenduse viga serveri ja Anthropic API vahel";
  }
  return "Teadmata põhjus — vaata error_message välja";
}

export { getProbableCause };
