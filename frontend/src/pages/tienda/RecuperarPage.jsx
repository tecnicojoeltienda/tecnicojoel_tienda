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
    if (!email || !email.includes("@")) {
      toast.error("Ingresa un correo válido.");
      return;
    }
    
    setSending(true);
    try {
      const res = await api.post("/apij/recuperacion/solicitar", { email });
      console.log("✅ Respuesta del backend:", res.data);
      
      toast.success("✅ Código enviado. Revisa tu correo.");
      sessionStorage.setItem("recovery_started", "1");
      sessionStorage.setItem("recovery_email", email);
      
      // Navegar después de mostrar el toast
      setTimeout(() => {
        navigate(`/validar-codigo?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      console.error("❌ Error en solicitar:", err);
      const msg = err?.response?.data?.error || err.message || "Error enviando código";
      toast.error(`❌ ${msg}`);
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form onSubmit={send} className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Recuperar contraseña</h2>
        <p className="text-sm text-gray-600 mb-6">Ingresa tu correo y te enviaremos un código de 6 dígitos.</p>
        
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="tucorreo@ejemplo.com"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        
        <button
          type="submit"
          disabled={sending}
          className={`w-full p-3 rounded-lg font-semibold transition-colors ${
            sending
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {sending ? "Enviando..." : "Enviar código"}
        </button>
      </form>
    </div>
  );
}