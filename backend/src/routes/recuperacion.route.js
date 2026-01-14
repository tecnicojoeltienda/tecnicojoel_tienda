import express from "express";
import * as ctrl from "../controllers/recuperacion_nodb.controller.js";
import net from "net";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/solicitar", ctrl.solicitar);
router.post("/validar", ctrl.validar);
router.post("/cambiar", ctrl.cambiar);
router.post("/limpiar", ctrl.limpiar);

// ENDPOINT TEMPORAL DE DIAGNÓSTICO SMTP
router.get("/check-smtp-conn", async (req, res) => {
  console.log("🔍 /check-smtp-conn called");
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const timeoutMs = 8000;

  // 1) TCP connect test
  const tcpResult = await new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      if (!settled) { settled = true; socket.destroy(); resolve({ ok: true }); }
    });

    socket.on("timeout", () => {
      if (!settled) { settled = true; socket.destroy(); resolve({ ok: false, error: "timeout" }); }
    });

    socket.on("error", (err) => {
      if (!settled) { settled = true; socket.destroy(); resolve({ ok: false, error: err.message }); }
    });

    socket.connect(port, host);
  });

  // 2) nodemailer verify (auth + handshake)
  let nm = { ok: false, error: null };
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000
    });
    await transporter.verify();
    nm.ok = true;
  } catch (e) {
    nm.error = { message: e.message, code: e.code, response: e.response };
  }

  res.json({
    tcp: { host, port, result: tcpResult },
    nodemailer: nm,
    env: {
      smtp_user: !!process.env.SMTP_USER,
      smtp_pass_len: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0
    }
  });
});

export default router;