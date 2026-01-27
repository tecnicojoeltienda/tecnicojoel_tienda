import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import conexion from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const CODE_TTL = 15 * 60 * 1000; // 15 minutos

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

// Resend Email Service
async function sendWithResend(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no está configurado en las variables de entorno");
  }

  const payload = {
    from,
    to: [to],
    subject,
    html
  };

  console.log(`📤 Enviando email via Resend a: ${to}`);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await res.text();
  console.log(`📨 Resend response status: ${res.status}`);
  console.log(`📨 Resend response body: ${responseText}`);

  if (!res.ok) {
    const e = new Error(`Error de Resend (${res.status}): ${responseText}`);
    e.status = res.status;
    e.body = responseText;
    throw e;
  }

  const data = JSON.parse(responseText);
  console.log(`✅ Email enviado exitosamente. ID: ${data.id}`);
  return data;
}

export async function solicitar(req, res) {
  try {
    const { email } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    
    console.log(`📥 Solicitud de recuperación desde IP: ${ip} para email: ${email}`);
    
    if (!email) {
      return res.status(400).json({ 
        error: "Email es obligatorio",
        details: "Debes proporcionar un correo electrónico válido"
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Formato de email inválido",
        details: "El correo electrónico proporcionado no tiene un formato válido"
      });
    }

    // Verificar configuración de Resend
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ ERROR: RESEND_API_KEY no configurado");
      return res.status(500).json({ 
        error: "Servicio de correo no configurado",
        details: "El servidor no tiene configurado el servicio de envío de emails. Contacta al administrador."
      });
    }

    // Verificar si el email existe en la BD
    const conn = await conexion;
    const [usuarios] = await conn.query("SELECT id_cliente FROM cliente WHERE email = ? LIMIT 1", [email]);
    
    if (!usuarios || usuarios.length === 0) {
      console.log(`⚠️ Email no encontrado en BD: ${email}`);
      return res.status(404).json({ 
        error: "Correo no encontrado",
        details: "No existe una cuenta registrada con este correo electrónico"
      });
    }

    console.log(`✅ Email encontrado en BD: ${email}`);

    // Generar y guardar código
    const code = genCode();
    const now = Date.now();
    const expiresAt = now + CODE_TTL;
    codes.set(email, { code, expiresAt });

    console.log(`📧 Código generado para ${email}: ${code}`);

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
              Recibimos una solicitud para recuperar tu contraseña. Tu código de verificación es:
            </p>
            <div style="background:#3b82f6;color:white;font-size:36px;font-weight:700;letter-spacing:12px;padding:24px;text-align:center;border-radius:12px;margin:24px 0;">
              ${code}
            </div>
            <p style="color:#6b7280;font-size:14px;margin-top:20px;">
              <strong>Este código expira en 15 minutos.</strong>
            </p>
            <p style="color:#6b7280;font-size:14px;">
              Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
              TecnicoJoel - Tienda de Tecnología
            </p>
          </div>
        </div>
      </body>
      </html>`;
    
    console.log(`📤 Intentando enviar email a: ${email}`);
    
    try {
      const result = await sendWithResend(
        email,
        "🔐 Código de recuperación - TecnicoJoel",
        html
      );
      
      console.log(`✅ Email enviado exitosamente via Resend`);
      return res.json({ 
        message: "Código enviado exitosamente",
        email,
        emailId: result.id
      });
      
    } catch (mailError) {
      console.error("❌ ERROR enviando email:", mailError);
      
      codes.delete(email); // Limpiar código si falla el envío
      
      let errorMessage = "Error al enviar el correo electrónico";
      let errorDetails = mailError.message;
      
      if (mailError.status === 401) {
        errorMessage = "Error de autenticación con el servicio de correo";
        errorDetails = "La API key de Resend no es válida o ha expirado";
      } else if (mailError.status === 422) {
        errorMessage = "Error en los datos del correo";
        errorDetails = "El formato del correo electrónico o los datos son inválidos";
      } else if (mailError.status === 429) {
        errorMessage = "Límite de envíos alcanzado";
        errorDetails = "Se ha excedido el límite de correos por hora. Intenta más tarde.";
      }
      
      return res.status(500).json({
        error: errorMessage,
        details: errorDetails,
        technicalError: {
          message: mailError.message,
          status: mailError.status,
          body: mailError.body
        }
      });
    }
    
  } catch (err) {
    console.error("❌ ERROR rec.solicitar:", err);
    console.error("Stack trace:", err.stack);
    return res.status(500).json({ 
      error: "Error interno del servidor",
      details: "Ocurrió un error inesperado. Por favor, intenta nuevamente.",
      technicalError: err.message
    });
  }
}

export async function validar(req, res) {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        error: "Datos incompletos",
        details: "Email y código son requeridos"
      });
    }
    
    const rec = codes.get(email);
    const now = Date.now();
    
    if (!rec) {
      return res.status(400).json({ 
        error: "Código no encontrado",
        details: "No existe un código activo para este correo. Solicita uno nuevo."
      });
    }
    
    if (rec.expiresAt <= now) {
      codes.delete(email);
      return res.status(400).json({ 
        error: "Código expirado",
        details: "El código ha expirado. Por favor, solicita uno nuevo."
      });
    }
    
    if (rec.code !== String(code)) {
      return res.status(400).json({ 
        error: "Código incorrecto",
        details: "El código ingresado no es válido. Verifica e intenta nuevamente."
      });
    }
    
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: Math.floor(CODE_TTL/1000) });
    console.log(`✅ Código validado para: ${email}`);
    
    return res.json({ 
      token, 
      expiresIn: Math.floor((rec.expiresAt - now)/1000),
      message: "Código validado correctamente"
    });
  } catch (err) {
    console.error("rec.validar:", err);
    return res.status(500).json({ 
      error: "Error al validar el código",
      details: "Ocurrió un error al procesar tu solicitud. Intenta nuevamente.",
      technicalError: err.message
    });
  }
}

export async function cambiar(req, res) {
  try {
    const { token, nuevaContrasena } = req.body;
    
    if (!token || !nuevaContrasena) {
      return res.status(400).json({ 
        error: "Datos incompletos",
        details: "Token y nueva contraseña son requeridos"
      });
    }
    
    if (nuevaContrasena.length < 6) {
      return res.status(400).json({ 
        error: "Contraseña muy corta",
        details: "La contraseña debe tener al menos 6 caracteres"
      });
    }
    
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(400).json({ 
        error: "Token inválido o expirado",
        details: "El token de recuperación ha expirado o no es válido. Solicita un nuevo código."
      });
    }
    
    const email = payload.email;
    const rec = codes.get(email);
    
    if (!rec) {
      return res.status(400).json({ 
        error: "Sesión expirada",
        details: "La sesión de recuperación ha expirado. Solicita un nuevo código."
      });
    }

    const hashed = await bcrypt.hash(nuevaContrasena, 10);
    const conn = await conexion;
    const [result] = await conn.query("UPDATE cliente SET clave = ? WHERE email = ?", [hashed, email]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: "Usuario no encontrado",
        details: "No se encontró una cuenta con este correo electrónico"
      });
    }

    codes.delete(email);
    console.log(`✅ Contraseña cambiada para: ${email}`);
    
    return res.json({ 
      message: "Contraseña actualizada exitosamente"
    });
  } catch (err) {
    console.error("rec.cambiar:", err);
    return res.status(500).json({ 
      error: "Error al cambiar la contraseña",
      details: "Ocurrió un error al actualizar tu contraseña. Intenta nuevamente.",
      technicalError: err.message
    });
  }
}

export async function limpiar(req, res) {
  try {
    codes.clear();
    console.log("🧹 Contadores limpiados");
    return res.json({ message: "Contadores limpiados exitosamente" });
  } catch (err) {
    console.error("rec.limpiar:", err);
    return res.status(500).json({ 
      error: "Error al limpiar contadores",
      details: err.message
    });
  }
}