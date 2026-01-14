import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";
import { toast } from "sonner";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  async function send(e) {
    e.preventDefault();
    if (!email) { toast.error("Ingresa un correo válido."); return; }
    setSending(true);
    try {
      const res = await api.post("/apij/recuperacion/solicitar", { email });
      toast.success("Código enviado. Revisa tu correo.");
      sessionStorage.setItem("recovery_started", "1");
      sessionStorage.setItem("recovery_email", email);
      setTimeout(() => navigate(`/validar-codigo?email=${encodeURIComponent(email)}`), 1200);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Error enviando código";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={send} className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">Recuperar contraseña</h2>
        <p className="text-sm text-gray-600 mb-4">Ingresa tu correo y te enviaremos un código de 6 dígitos.</p>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="tucorreo@ejemplo.com"
          className="w-full p-3 border rounded mb-3"
          disabled={sending}
        />
        <button type="submit" disabled={sending} className={`w-full p-3 rounded ${sending ? "bg-gray-400" : "bg-blue-600 text-white"}`}>
          {sending ? "Enviando..." : "Enviar código"}
        </button>
      </form>
    </div>
  );
}