import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../service/api";

export default function CambiarContrasenaPage() {
  const q = new URLSearchParams(useLocation().search);
  const email = q.get("email") || "";
  const code = q.get("code") || "";
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("pw_reset_token");
      await api.post("/recuperacion/cambiar", { token, nuevaContrasena: pass });
      sessionStorage.removeItem("pw_reset_token");
      sessionStorage.removeItem("recovery_started");
      sessionStorage.removeItem("recovery_email");
      sessionStorage.removeItem("recovery_token");
      setOk("Contraseña actualizada. Ya puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 1400);
    } catch (error) {
      setErr(error.response?.data?.error || "Error cambiando contraseña");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">Cambiar contraseña</h2>
        <p className="text-sm text-gray-600 mb-4">Cuenta: <strong>{email}</strong></p>
        {err && <div className="mb-3 text-red-600">{err}</div>}
        {ok && <div className="mb-3 text-green-600">{ok}</div>}
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} required placeholder="Nueva contraseña" className="w-full p-3 border rounded mb-3" />
        <button className="w-full bg-blue-600 text-white p-3 rounded">Cambiar contraseña</button>
      </form>
    </div>
  );
}