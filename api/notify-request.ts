import { IncomingMessage, ServerResponse } from "http";
import nodemailer from "nodemailer";
import { checkRateLimit, validateNotifyRequest } from "./_lib/notifyRequest";

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

  if (!checkRateLimit(clientIp)) {
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

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure:
        process.env.SMTP_SECURE === "true" ||
        process.env.SMTP_SECURE === undefined,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM || '"Social-ASOF" <admin@asof.space>',
      to: process.env.ADMIN_EMAIL || "admin@asof.space",
      subject: "Nova solicitação de acesso - Social-ASOF",
      text: `Uma nova solicitação foi recebida:\n\nNome: ${name}\nE-mail: ${email}\nMatrícula: ${matricula}\n\nAcesse o painel para avaliar.`,
    });

    return json(res, 200, { success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return json(res, 500, { error: "Erro ao enviar email" });
  }
}
