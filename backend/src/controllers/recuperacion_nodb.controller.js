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
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

// In-memory stores (production: use Redis for persistence / horizontal scaling)
const codes = new Map(); // email -> { code, expiresAt, lastSentAt, attempts }
const ipCounts = new Map(); // ip -> { count, resetAt }

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cleanExpired() {
  const now = Date.now();
  for (const [email, rec] of codes) if (rec.expiresAt <= now) codes.delete(email);
  for (const [ip, rec] of ipCounts) if (rec.resetAt <= now) ipCounts.delete(ip);
}
setInterval(cleanExpired, 60_000);

export async function solicitar(req, res) {
  try {
    const { email } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    if (!email) return res.status(400).json({ error: "Email requerido" });

    // Verificar si el email existe en la BD
    const conn = await conexion;
    const [usuarios] = await conn.query("SELECT id_cliente FROM cliente WHERE email = ? LIMIT 1", [email]);
    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({ error: "No existe una cuenta con ese correo" });
    }

    // IP rate limit
    const now = Date.now();
    const ipRec = ipCounts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
    if (ipRec.count >= MAX_ATT_IP && ipRec.resetAt > now) {
      return res.status(429).json({ error: "Demasiadas solicitudes desde esta IP. Intenta más tarde." });
    }
    ipRec.count++; ipCounts.set(ip, ipRec);

    const rec = codes.get(email) || { attempts: 0, lastSentAt: 0 };
    if (rec.lastSentAt && now - rec.lastSentAt < COOLDOWN) {
      return res.status(429).json({ error: `Espera ${Math.ceil((COOLDOWN - (now - rec.lastSentAt))/1000)}s antes de reintentarlo.` });
    }
    if (rec.attempts >= MAX_ATT_EMAIL) {
      return res.status(429).json({ error: "Demasiados intentos para este email. Contacta soporte." });
    }

    // generate and save
    const code = genCode();
    const expiresAt = now + CODE_TTL;
    codes.set(email, { code, expiresAt, lastSentAt: now, attempts: (rec.attempts || 0) + 1 });

    console.log(`📧 Código generado para ${email}: ${code}`); // LOG PARA VER EL CÓDIGO EN CONSOLA

    // send mail
    const html = `
      <div style="font-family:Arial, sans-serif;max-width:600px">
        <h2>Recuperación de contraseña</h2>
        <p>Tu código de verificación es:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f3f4f6;padding:12px;text-align:center">${code}</div>
        <p>Expira en ${Math.round(CODE_TTL/60000)} minutos.</p>
      </div>`;
    
    await transporter.sendMail({ from: SMTP_FROM, to: email, subject: "Código de recuperación - TecnicoJoel", html });

    return res.json({ message: "Código enviado", email }); // Retornar también el email
  } catch (err) {
    console.error("❌ ERROR rec.solicitar:", err);
    return res.status(500).json({ error: "Error enviando código" });
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
    // issue one-time token (short JWT)
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: Math.floor(CODE_TTL/1000) }); // same TTL
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
    // Verify code still exists (optional)
    const rec = codes.get(email);
    if (!rec) return res.status(400).json({ error: "Código consumido o expirado" });

    // Hash password and update cliente table (DB required to persist password)
    const hashed = await bcrypt.hash(nuevaContrasena, 10);
    const conn = await conexion;
    const [result] = await conn.query("UPDATE cliente SET clave = ? WHERE email = ?", [hashed, email]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "No existe cuenta con ese email" });

    // consume code
    codes.delete(email);
    return res.json({ message: "Contraseña actualizada" });
  } catch (err) {
    console.error("rec.cambiar:", err);
    return res.status(500).json({ error: "Error cambiando contraseña" });
  }

  
}

// SOLO PARA DESARROLLO - Limpiar contadores
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