import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import conexion from "../config/db.js";
import { Resend } from "resend";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const CODE_TTL = 15 * 60 * 1000; // 15 minutos

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory stores
const codes = new Map();

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cleanExpired() {
  const now = Date.now();
  for (const [email, rec] of codes) {
    if (rec.expiresAt <= now) codes.delete(email);
  }
}
setInterval(cleanExpired, 60_000);

// Enviar email con Resend
async function sendWithResend(to, subject, html) {
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  
  console.log(`📤 Enviando email desde: ${from} hacia: ${to}`);

  try {
    const data = await resend.emails.send({
      from,
      to: [to],
      subject,
      html
    });

    console.log(`✅ Email enviado. ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error("❌ Error Resend:", error);
    throw error;
  }
}

export async function solicitar(req, res) {
  try {
    const { email } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    
    console.log(`📥 Solicitud desde IP: ${ip} para: ${email}`);
    
    if (!email) {
      return res.status(400).json({ 
        error: "Email requerido",
        details: "Ingresa un correo válido"
      });
    }

    // Validar formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Formato inválido",
        details: "El correo no tiene un formato válido"
      });
    }

    // Verificar API Key
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY no configurado");
      return res.status(500).json({ 
        error: "Servicio no configurado",
        details: "Contacta al administrador"
      });
    }

    // Verificar si existe en BD
    const conn = await conexion;
    const [usuarios] = await conn.query("SELECT id_cliente FROM cliente WHERE email = ? LIMIT 1", [email]);
    
    if (!usuarios || usuarios.length === 0) {
      console.log(`⚠️ Email no encontrado: ${email}`);
      return res.status(404).json({ 
        error: "Correo no registrado",
        details: "Este correo no existe en el sistema"
      });
    }

    console.log(`✅ Email encontrado: ${email}`);

    // Generar código
    const code = genCode();
    const now = Date.now();
    const expiresAt = now + CODE_TTL;
    codes.set(email, { code, expiresAt });

    console.log(`🔑 Código generado: ${code}`);

    // HTML del email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:white;padding:40px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color:#1f2937;margin-top:0;font-size:24px;">🔐 Recuperación de contraseña</h2>
            <p style="color:#4b5563;font-size:16px;line-height:1.5;">Hola,</p>
            <p style="color:#4b5563;font-size:16px;line-height:1.5;">
              Tu código de verificación es:
            </p>
            <div style="background:#3b82f6;color:white;font-size:36px;font-weight:700;letter-spacing:8px;padding:24px;text-align:center;border-radius:12px;margin:24px 0;">
              ${code}
            </div>
            <p style="color:#6b7280;font-size:14px;margin-top:20px;">
              <strong>Este código expira en 15 minutos.</strong>
            </p>
            <p style="color:#6b7280;font-size:14px;">
              Si no solicitaste este código, ignora este mensaje.
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
              TecnicoJoel - Tienda de Tecnología
            </p>
          </div>
        </div>
      </body>
      </html>`;
    
    console.log(`📤 Enviando email...`);
    
    try {
      const result = await sendWithResend(
        email,
        "🔐 Código de recuperación - TecnicoJoel",
        html
      );
      
      console.log(`✅ Email enviado exitosamente`);
      return res.json({ 
        message: "Código enviado",
        email
      });
      
    } catch (mailError) {
      console.error("❌ Error al enviar:", mailError);
      
      codes.delete(email);
      
      let errorMsg = "Error al enviar correo";
      let details = "";
      
      if (mailError.statusCode === 403) {
        errorMsg = "Correo no verificado";
        details = "El remitente debe estar verificado en Resend";
      } else if (mailError.statusCode === 422) {
        errorMsg = "Datos inválidos";
        details = "Revisa la configuración";
      } else if (mailError.statusCode === 429) {
        errorMsg = "Límite excedido";
        details = "Espera un momento";
      } else {
        details = mailError.message || "Intenta nuevamente";
      }
      
      return res.status(500).json({
        error: errorMsg,
        details
      });
    }
    
  } catch (err) {
    console.error("❌ ERROR:", err);
    return res.status(500).json({ 
      error: "Error del servidor",
      details: "Intenta nuevamente"
    });
  }
}

export async function validar(req, res) {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        error: "Datos incompletos",
        details: "Email y código requeridos"
      });
    }

    const rec = codes.get(email);
    if (!rec) {
      return res.status(400).json({ 
        error: "Código no encontrado",
        details: "Solicita uno nuevo"
      });
    }

    if (Date.now() > rec.expiresAt) {
      codes.delete(email);
      return res.status(400).json({ 
        error: "Código expirado",
        details: "Solicita uno nuevo"
      });
    }

    if (rec.code !== code) {
      return res.status(400).json({ 
        error: "Código incorrecto",
        details: "Verifica el código"
      });
    }

    codes.delete(email);

    const token = jwt.sign({ email, purpose: "reset_pwd" }, JWT_SECRET, { expiresIn: "15m" });
    
    return res.json({ 
      message: "Código válido",
      token 
    });
  } catch (err) {
    console.error("❌ ERROR validar:", err);
    return res.status(500).json({ 
      error: "Error del servidor",
      details: "Intenta nuevamente"
    });
  }
}

export async function cambiar(req, res) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: "Datos incompletos",
        details: "Token y contraseña requeridos"
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        error: "Token inválido",
        details: "Solicita un nuevo código"
      });
    }

    if (decoded.purpose !== "reset_pwd") {
      return res.status(401).json({ 
        error: "Token inválido",
        details: "Tipo de token incorrecto"
      });
    }

    const { email } = decoded;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const conn = await conexion;
    const [result] = await conn.query(
      "UPDATE cliente SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: "Usuario no encontrado",
        details: "El correo no existe"
      });
    }

    console.log(`✅ Contraseña actualizada para: ${email}`);
    return res.json({ message: "Contraseña actualizada" });
    
  } catch (err) {
    console.error("❌ ERROR cambiar:", err);
    return res.status(500).json({ 
      error: "Error del servidor",
      details: "Intenta nuevamente"
    });
  }
}

export async function limpiar(req, res) {
  codes.clear();
  return res.json({ message: "Códigos limpiados" });
}