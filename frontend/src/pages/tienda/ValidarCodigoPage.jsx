import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../service/api";
import { toast } from "sonner";

export default function ValidarCodigoPage() {
  const q = new URLSearchParams(useLocation().search);
  const email = q.get("email") || "";
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast.error("Ingresa un código de 6 dígitos");
      return;
    }
    
    setValidating(true);
    try {
      const res = await api.post("/apij/recuperacion/validar", { email, code });
      console.log("✅ Código validado:", res.data);
      
      sessionStorage.setItem("pw_reset_token", res.data.token);
      toast.success("✅ Código válido. Ahora cambia tu contraseña.");
      
      setTimeout(() => {
        navigate("/cambiar-contrasena");
      }, 1000);
    } catch (err) {
      console.error("❌ Error validando código:", err);
      const msg = err?.response?.data?.error || "Código inválido o expirado";
      toast.error(`❌ ${msg}`);
      setValidating(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Validar código</h2>
        <p className="text-sm text-gray-600 mb-6">
          Ingresa el código que te enviamos a: <strong className="text-blue-600">{email}</strong>
        </p>
        
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          placeholder="123456"
          maxLength={6}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={validating}
        />
        
        <button
          type="submit"
          disabled={validating}
          className={`w-full p-3 rounded-lg font-semibold transition-colors ${
            validating
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {validating ? "Validando..." : "Validar código"}
        </button>
        
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full mt-3 p-2 text-sm text-gray-600 hover:text-gray-800"
        >
          ← Volver atrás
        </button>
      </form>
    </div>
  );
}