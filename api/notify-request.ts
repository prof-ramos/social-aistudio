import { IncomingMessage, ServerResponse } from "http";
import { checkRateLimit, validateNotifyRequest, checkMemberRequest, sendNotifyRequestEmail } from "./_lib/notifyRequest";
import { getSupabaseServerClient } from "./_lib/supabaseServer";

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  // Only allow POST
  if (req.method !== "POST") {
    return json(res, 405, { error: "Método não permitido" });
  }

  // Rate limit by IP
  const forwarded = req.headers["x-forwarded-for"];
  const clientIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim()) ||
    req.socket.remoteAddress ||
    "unknown";

  if (!(await checkRateLimit(clientIp))) {
    return json(res, 429, {
      error: "Muitas requisições. Tente novamente em um minuto.",
    });
  }

  try {
    const body = await readBody(req);
    const result = validateNotifyRequest(body);
    if (!result.ok) {
      return json(res, 400, { error: result.error });
    }
    const { name, email, matricula } = result.fields;

    // Verify that a PENDING member request exists for this email
    const supabase = getSupabaseServerClient();
    const memberCheck = await checkMemberRequest(supabase, email);
    if (!memberCheck.ok) {
      return json(res, memberCheck.status, { error: memberCheck.error });
    }

    await sendNotifyRequestEmail({ name, email, matricula });

    return json(res, 200, { success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return json(res, 500, { error: "Erro ao enviar email" });
  }
}
