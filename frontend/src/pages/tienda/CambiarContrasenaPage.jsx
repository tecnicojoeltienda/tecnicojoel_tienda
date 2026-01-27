import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";
import { toast } from "sonner";

export default function CambiarContrasenaPage() {
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [changing, setChanging] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    
    if (pass.length < 6) {
      toast.error("❌ Contraseña muy corta", {
        description: "La contraseña debe tener al menos 6 caracteres",
        duration: 4000
      });
      return;
    }
    
    if (pass !== confirmPass) {
      toast.error("❌ Las contraseñas no coinciden", {
        description: "Verifica que ambas contraseñas sean iguales",
        duration: 4000
      });
      return;
    }
    
    setChanging(true);
    try {
      const token = sessionStorage.getItem("pw_reset_token");
      
      if (!token) {
        toast.error("❌ Sesión expirada", {
          description: "Vuelve a solicitar el código de recuperación",
          duration: 4000
        });
        setTimeout(() => navigate("/recuperar"), 2000);
        return;
      }
      
      await api.post("/apij/recuperacion/cambiar", { token, nuevaContrasena: pass });
      console.log("✅ Contraseña cambiada exitosamente");
      
      // Limpiar sessionStorage
      sessionStorage.removeItem("pw_reset_token");
      sessionStorage.removeItem("recovery_started");
      sessionStorage.removeItem("recovery_email");
      
      toast.success("✅ Contraseña actualizada exitosamente", {
        description: "Redirigiendo al login...",
        duration: 3000
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("❌ Error cambiando contraseña:", error);
      
      const errorData = error?.response?.data;
      const errorMsg = errorData?.error || "Error al cambiar la contraseña";
      const errorDetails = errorData?.details || "Intenta nuevamente o solicita un nuevo código";
      
      toast.error(`❌ ${errorMsg}`, {
        description: errorDetails,
        duration: 5000
      });
      
      setChanging(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Nueva contraseña</h2>
        <p className="text-sm text-gray-600 mb-6">Ingresa tu nueva contraseña segura</p>
        
        <input
          type="password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          required
          minLength={6}
          placeholder="Nueva contraseña (mínimo 6 caracteres)"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={changing}
        />
        
        <input
          type="password"
          value={confirmPass}
          onChange={e => setConfirmPass(e.target.value)}
          required
          minLength={6}
          placeholder="Confirmar contraseña"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={changing}
        />
        
        <button
          type="submit"
          disabled={changing}
          className={`w-full p-3 rounded-lg font-semibold transition-colors ${
            changing
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {changing ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}