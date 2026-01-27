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
      toast.error("Correo inválido", {
        description: "Por favor ingresa un correo electrónico válido con formato correcto."
      });
      return;
    }
    
    setSending(true);
    try {
      const res = await api.post("/apij/recuperacion/solicitar", { email });
      console.log("✅ Respuesta del backend:", res.data);
      
      toast.success("Código enviado exitosamente", {
        description: `Revisa tu bandeja de entrada en ${email}. El código expira en 15 minutos.`
      });
      
      sessionStorage.setItem("recovery_started", "1");
      sessionStorage.setItem("recovery_email", email);
      
      // Navegar después de mostrar el toast
      setTimeout(() => {
        navigate(`/validar-codigo?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      console.error("❌ Error en solicitar:", err);
      
      // Extraer información detallada del error
      const statusCode = err?.response?.status;
      const errorData = err?.response?.data;
      const errorMessage = errorData?.error || "Error al enviar código";
      const errorDetails = errorData?.details || "";
      const technicalError = errorData?.technicalError || "";
      
      // Mensajes específicos según el código de estado
      switch (statusCode) {
        case 400:
          toast.error(errorMessage, {
            description: errorDetails || "Verifica que el correo sea correcto."
          });
          break;
        case 404:
          toast.error("Correo no registrado", {
            description: "Este correo no está asociado a ninguna cuenta. Verifica que sea el correo correcto o regístrate primero."
          });
          break;
        case 429:
          toast.error("Demasiados intentos", {
            description: errorDetails || "Has intentado enviar códigos múltiples veces. Espera unos minutos antes de intentar nuevamente."
          });
          break;
        case 500:
          toast.error("Error del servidor", {
            description: errorDetails || technicalError || "Ocurrió un problema al procesar tu solicitud. Intenta nuevamente en unos momentos."
          });
          break;
        case 503:
          toast.error("Servicio de correo no disponible", {
            description: "El servicio de envío de correos está temporalmente fuera de línea. Por favor intenta más tarde."
          });
          break;
        default:
          if (err.code === "ERR_NETWORK") {
            toast.error("Error de conexión", {
              description: "No se pudo conectar con el servidor. Verifica tu conexión a internet."
            });
          } else if (err.code === "ECONNABORTED") {
            toast.error("Tiempo de espera agotado", {
              description: "La solicitud tardó demasiado. Verifica tu conexión e intenta nuevamente."
            });
          } else {
            toast.error(errorMessage, {
              description: errorDetails || technicalError || "Ocurrió un error inesperado. Por favor intenta nuevamente."
            });
          }
      }
      
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
        
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full mt-3 p-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Volver al inicio de sesión
        </button>
      </form>
    </div>
  );
}