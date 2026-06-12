import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { checkRateLimit, validateNotifyRequest, checkMemberRequest } from "./api/_lib/notifyRequest";
import { getSupabaseServerClient } from "./api/_lib/supabaseServer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for email notifications
  app.post("/api/admin/notify-request", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!(await checkRateLimit(clientIp))) {
      res.status(429).json({ error: 'Muitas requisições. Tente novamente em um minuto.' });
      return;
    }

    try {
      const result = validateNotifyRequest(req.body);
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      const { name, email, matricula } = result.fields;

      // Verify that a PENDING member request exists for this email
      const supabase = getSupabaseServerClient();
      const memberCheck = await checkMemberRequest(supabase, email);
      if (!memberCheck.ok) {
        res.status(memberCheck.status).json({ error: memberCheck.error });
        return;
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === undefined,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Social-ASOF" <admin@asof.space>',
        to: process.env.ADMIN_EMAIL || 'admin@asof.space',
        subject: "Nova solicitação de acesso - Social-ASOF",
        text: `Uma nova solicitação foi recebida:\n\nNome: ${name}\nE-mail: ${email}\nMatrícula: ${matricula}\n\nAcesse o painel para avaliar.`,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Erro ao enviar email' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
