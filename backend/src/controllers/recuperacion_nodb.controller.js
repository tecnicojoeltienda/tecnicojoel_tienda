import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import conexion from "../config/db.js";

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const CODE_TTL = Number(process.env.CODE_TTL_MS || 15 * 60 * 1000);
const COOLDOWN = Number(process.env.CODE_COOLDOWN_MS || 60 * 1000);
const MAX_ATT_EMAIL = Number(process.env.MAX_ATTEMPTS_PER_EMAIL || 5);
const MAX_ATT_IP = Number(process.env.MAX_ATTEMPTS_PER_IP || 30);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  connectionTimeout: 10000
});

// In-memory stores
const codes = new Map();
const ipCounts = new Map();

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cleanExpired() {
  const now = Date.now();
  for (const [email, rec] of codes) if (rec.expiresAt <= now) codes.delete(email);
  for (const [ip, rec] of ipCounts) if (rec.resetAt <= now) ipCounts.delete(ip);
}
setInterval(cleanExpired, 60_000);

// SendGrid fallback
async function sendWithSendGrid(to, subject, html) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!apiKey) throw new Error("SENDGRID_API_KEY no configurado");

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject,
    content: [{ type: "text/html", value: html }]
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    const e = new Error(`SendGrid error ${res.status}: ${text}`);
    e.status = res.status;
    e.body = text;
    throw e;
  }
  return true;
}

export async function solicitar(req, res) {
  try {
    const { email } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    
    console.log(`📥 Solicitud de recuperación desde IP: ${ip} para email: ${email}`);
    
    if (!email) return res.status(400).json({ error: "Email requerido" });

    // Verificar si el email existe en la BD
    const conn = await conexion;
    const [usuarios] = await conn.query("SELECT id_cliente FROM cliente WHERE email = ? LIMIT 1", [email]);
    if (!usuarios || usuarios.length === 0) {
      console.log(`⚠️ Email no encontrado en BD: ${email}`);
      return res.status(404).json({ error: "No existe una cuenta con ese correo" });
    }

    console.log(`✅ Email encontrado en BD: ${email}`);

    // IP rate limit
    const now = Date.now();
    const ipRec = ipCounts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
    if (ipRec.count >= MAX_ATT_IP && ipRec.resetAt > now) {
      console.log(`⚠️ Rate limit IP alcanzado para: ${ip}`);
      return res.status(429).json({ error: "Demasiadas solicitudes desde esta IP. Intenta más tarde." });
    }
    ipRec.count++; ipCounts.set(ip, ipRec);

    const rec = codes.get(email) || { attempts: 0, lastSentAt: 0 };
    if (rec.lastSentAt && now - rec.lastSentAt < COOLDOWN) {
      console.log(`⚠️ Cooldown activo para email: ${email}`);
      return res.status(429).json({ error: `Espera ${Math.ceil((COOLDOWN - (now - rec.lastSentAt))/1000)}s antes de reintentarlo.` });
    }
    if (rec.attempts >= MAX_ATT_EMAIL) {
      console.log(`⚠️ Máximo de intentos alcanzado para: ${email}`);
      return res.status(429).json({ error: "Demasiados intentos para este email. Contacta soporte." });
    }

    // generate and save
    const code = genCode();
    const expiresAt = now + CODE_TTL;
    codes.set(email, { code, expiresAt, lastSentAt: now, attempts: (rec.attempts || 0) + 1 });

    console.log(`📧 Código generado para ${email}: ${code}`);

    // send mail
    const html = `
      <div style="font-family:Arial, sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:8px">
        <div style="background:white;padding:30px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)">
          <h2 style="color:#1f2937;margin-top:0">🔐 Recuperación de contraseña</h2>
          <p style="color:#4b5563;font-size:16px">Hola,</p>
          <p style="color:#4b5563;font-size:16px">Recibimos una solicitud para recuperar tu contraseña. Tu código de verificación es:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#3b82f6;color:white;padding:20px;text-align:center;border-radius:8px;margin:20px 0">${code}</div>
          <p style="color:#6b7280;font-size:14px">Este código expira en ${Math.round(CODE_TTL/60000)} minutos.</p>
          <p style="color:#6b7280;font-size:14px">Si no solicitaste este código, ignora este mensaje.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
          <p style="color:#9ca3af;font-size:12px;text-align:center">TecnicoJoel - Tienda de Tecnología</p>
        </div>
      </div>`;
    
    console.log(`📤 Intentando enviar email a: ${email}`);
    
    try {
      // Intenta nodemailer primero
      try {
        const info = await transporter.sendMail({
          from: `"TecnicoJoel" <${process.env.SMTP_FROM || SMTP_USER}>`,
          to: email,
          subject: "🔐 Código de recuperación - TecnicoJoel",
          html
        });
        console.log(`✅ Email enviado (nodemailer). MessageId: ${info.messageId}`);
        return res.json({ message: "Código enviado", email });
      } catch (mailErr) {
        console.warn("⚠️ nodemailer falló:", mailErr?.code || mailErr?.message);
        // Fallback a SendGrid
        if (process.env.SENDGRID_API_KEY) {
          try {
            await sendWithSendGrid(email, "🔐 Código de recuperación - TecnicoJoel", html);
            console.log("✅ Email enviado via SendGrid API");
            return res.json({ message: "Código enviado", email });
          } catch (sgErr) {
            console.error("❌ SendGrid ERROR:", sgErr.message || sgErr);
            throw sgErr;
          }
        }
        throw mailErr;
      }
    } catch (mailError) {
      console.error("❌ ERROR enviando email:", mailError);
      codes.delete(email);
      ipRec.count--;
      return res.status(500).json({
        error: "Error enviando código. Verifica tu correo o intenta más tarde.",
        mailError: {
          message: mailError.message,
          code: mailError.code,
          response: mailError.response || mailError.body || null,
          responseCode: mailError.responseCode || mailError.status || null
        }
      });
    }
    
  } catch (err) {
    console.error("❌ ERROR rec.solicitar:", err);
    console.error("Stack trace:", err.stack);
    return res.status(500).json({ error: "Error procesando solicitud" });
  }
}

export async function validar(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email y código requeridos" });
    const rec = codes.get(email);
    const now = Date.now();
    if (!rec || rec.code !== String(code) || rec.expiresAt <= now) {
      return res.status(400).json({ error: "Código inválido o expirado" });
    }
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: Math.floor(CODE_TTL/1000) });
    return res.json({ token, expiresIn: Math.floor((rec.expiresAt - now)/1000) });
  } catch (err) {
    console.error("rec.validar:", err);
    return res.status(500).json({ error: "Error validando código" });
  }
}

export async function cambiar(req, res) {
  try {
    const { token, nuevaContrasena } = req.body;
    if (!token || !nuevaContrasena) return res.status(400).json({ error: "Token y nueva contraseña requeridos" });
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(400).json({ error: "Token inválido o expirado" }); }
    const email = payload.email;
    const rec = codes.get(email);
    if (!rec) return res.status(400).json({ error: "Código consumido o expirado" });

    const hashed = await bcrypt.hash(nuevaContrasena, 10);
    const conn = await conexion;
    const [result] = await conn.query("UPDATE cliente SET clave = ? WHERE email = ?", [hashed, email]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "No existe cuenta con ese email" });

    codes.delete(email);
    return res.json({ message: "Contraseña actualizada" });
  } catch (err) {
    console.error("rec.cambiar:", err);
    return res.status(500).json({ error: "Error cambiando contraseña" });
  }
}

export async function limpiar(req, res) {
  try {
    codes.clear();
    ipCounts.clear();
    console.log("🧹 Contadores limpiados");
    return res.json({ message: "Contadores limpiados exitosamente" });
  } catch (err) {
    console.error("rec.limpiar:", err);
    return res.status(500).json({ error: "Error limpiando contadores" });
  }
}