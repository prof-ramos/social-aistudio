import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for email notifications
  app.post("/api/admin/notify-request", async (req, res) => {
    try {
      const { name, email, matricula } = req.body;
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === undefined,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Verify connection (in production you might not do this on every request)
      // await transporter.verify();

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
