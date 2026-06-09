import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

// Simple in-memory rate limiter per IP
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;

function evictExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  // Periodic cleanup: evict stale entries every ~100 calls
  if (rateLimitStore.size > 100 && Math.random() < 0.1) {
    evictExpiredEntries(now);
  }
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count += 1;
  return true;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for email notifications
  app.post("/api/admin/notify-request", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({ error: 'Muitas requisições. Tente novamente em um minuto.' });
      return;
    }

    try {
      const { name, email, matricula } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Nome é obrigatório.' });
        return;
      }
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ error: 'E-mail inválido.' });
        return;
      }
      if (!matricula || typeof matricula !== 'string' || matricula.trim().length === 0) {
        res.status(400).json({ error: 'Matrícula é obrigatória.' });
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
        text: `Uma nova solicitação foi recebida:\n\nNome: ${name.trim()}\nE-mail: ${email.trim()}\nMatrícula: ${matricula.trim()}\n\nAcesse o painel para avaliar.`,
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
