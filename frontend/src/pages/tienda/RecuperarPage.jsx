import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function send(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("apij/recuperacion/solicitar", { email });
      setOk(true);
      sessionStorage.setItem("recovery_started", "1");
      sessionStorage.setItem("recovery_email", email); // opcional
      setTimeout(() => navigate(`/validar-codigo?email=${encodeURIComponent(email)}`), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Error enviando código");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={send} className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">Recuperar contraseña</h2>
        <p className="text-sm text-gray-600 mb-4">Ingresa tu correo y te enviaremos un código de 6 dígitos.</p>
        {error && <div className="mb-3 text-red-600">{error}</div>}
        {ok && <div className="mb-3 text-green-600">Código enviado. Revisa tu correo.</div>}
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tucorreo@ejemplo.com" className="w-full p-3 border rounded mb-3" />
        <button className="w-full bg-blue-600 text-white p-3 rounded">Enviar código</button>
      </form>
    </div>
  );
}