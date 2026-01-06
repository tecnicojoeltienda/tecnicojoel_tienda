// test-smtp.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",          // o smtp-relay.brevo.com si usas Brevo
  port: 587,
  secure: false,
  auth: {
    user: "nellfuep@gmail.com",    // o tu SMTP_USER de Brevo
    pass: "saatpwuaqzmjazgc"
  }
});

async function run(){
  try{
    await transporter.verify();
    console.log("SMTP connect OK");
    const info = await transporter.sendMail({
      from: '"TecnicoJoel" <nellfuep@gmail.com>',
      to: "davidmesta09@gmail.com",
      subject: "Prueba SMTP",
      text: "Prueba desde nodemailer"
    });
    console.log("Sent:", info);
  }catch(e){
    console.error("SMTP ERROR:", e);
  }
}
run();