import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../service/api";

export default function ValidarCodigoPage() {
  const q = new URLSearchParams(useLocation().search);
  const email = q.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.post("apij/recuperacion/validar", { email, code });
      sessionStorage.setItem("pw_reset_token", res.data.token);
      navigate("/cambiar-contrasena");
    } catch (err) {
      setError(err.response?.data?.error || "Código inválido");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">Validar código</h2>
        <p className="text-sm text-gray-600 mb-4">Ingresa el código que te enviamos a: <strong>{email}</strong></p>
        {error && <div className="mb-3 text-red-600">{error}</div>}
        <input value={code} onChange={e=>setCode(e.target.value)} required placeholder="123456" className="w-full p-3 border rounded mb-3" />
        <button className="w-full bg-blue-600 text-white p-3 rounded">Validar</button>
      </form>
    </div>
  );
}