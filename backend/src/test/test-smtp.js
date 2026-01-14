// src/test/test-smtp.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS  
  }
});

async function run(){
  try{
    console.log("🔄 Verificando conexión SMTP...");
    await transporter.verify();
    console.log("✅ SMTP connect OK");
    
    const info = await transporter.sendMail({
      from: `"TecnicoJoel" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: "davidmesta09@gmail.com",
      subject: "✅ Prueba SMTP TecnicoJoel",
      html: `<h1>Conexión exitosa</h1><p>El SMTP está configurado correctamente.</p>`
    });
    console.log("✅ Email enviado:", info.messageId);
  }catch(e){
    console.error("❌ SMTP ERROR:", e.message);
    console.error("Código:", e.code);
    console.error("Response:", e.response);
  }
}
run();