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
      toast.error("Correo inválido");
      return;
    }
    
    setSending(true);
    try {
      const res = await api.post("/apij/recuperacion/solicitar", { email });
      console.log("✅ Respuesta:", res.data);
      
      toast.success("Código enviado", {
        description: `Revisa ${email}`
      });
      
      sessionStorage.setItem("recovery_started", "1");
      sessionStorage.setItem("recovery_email", email);
      
      setTimeout(() => {
        navigate(`/validar-codigo?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      console.error("❌ Error:", err);
      setSending(false);
      
      const status = err?.response?.status;
      const data = err?.response?.data;
      const error = data?.error || "Error al enviar";
      const details = data?.details || "";
      
      switch (status) {
        case 404:
          toast.error("Correo no registrado");
          break;
        case 429:
          toast.error("Espera unos minutos");
          break;
        case 500:
          toast.error(error, { description: details });
          break;
        default:
          if (err.code === "ERR_NETWORK") {
            toast.error("Sin conexión");
          } else {
            toast.error(error, { description: details || "Intenta de nuevo" });
          }
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form onSubmit={send} className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Recuperar contraseña</h2>
        <p className="text-sm text-gray-600 mb-6">Te enviaremos un código de 6 dígitos</p>
        
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
        
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full mt-3 p-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Volver al inicio
        </button>
      </form>
    </div>
  );
}