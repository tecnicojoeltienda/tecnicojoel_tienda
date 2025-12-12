import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";

export default function LoginTiendaPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [targetPath, setTargetPath] = useState("/");
  const [mode, setMode] = useState("cliente");
  const navigate = useNavigate();
  const { login, logout, setNamespace } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Por favor ingresa correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      if (setNamespace) {
        await setNamespace(mode === "administrador" ? "inventario" : "tienda");
      }

      const creds = { email, password, clave: password };
      const result = await login(creds);

      if (!result.ok) {
        const err = result.error;
        const message = err?.message || err?.error || (typeof err === "string" ? err : null) || "Credenciales incorrectas o error de conexión.";
        setError(message);
        setLoading(false);
        return;
      }

      const user = result.data || {};
      const role = (user.role || user.rol || "").toString().toLowerCase();

      let destino = "/";
      if (mode === "administrador") {
        if (["admin", "super_admin", "superadmin", "super-admin"].some(r => role.includes(r.replace(/[^a-z]/g, "")) || role === r)) {
          destino = "/inventario/dashboard";
        } else {
          await logout();
          setError("No tienes permisos de administrador.");
          setLoading(false);
          return;
        }
      } else {
        destino = "/";
      }

      setSuccessMessage("Inicio de sesión exitoso. Redirigiendo...");
      setTargetPath(destino);
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        navigate(destino, { replace: true });
      }, 1100);
    } catch (err) {
      setError("Error al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Panel */}
          <div className="hidden md:flex flex-col justify-center gap-8 p-12 bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Bienvenido de nuevo</h1>
              <p className="text-lg text-gray-300 max-w-sm leading-relaxed">
                Inicia sesión para acceder a ofertas exclusivas o al panel administrativo.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Seguridad garantizada</h3>
                  <p className="text-gray-400 text-sm">Tus datos están protegidos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M3 13h8V3H3v10zM13 21h8V11h-8v10z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Panel administrativo</h3>
                  <p className="text-gray-400 text-sm">Gestión completa del inventario</p>
                </div>
              </div>
            </div>

            <div className="mt-auto text-sm text-gray-400">
              © {new Date().getFullYear()} Tecnico Joel. Todos los derechos reservados.
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-white p-8 md:p-12">
            <div className="max-w-md mx-auto">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img src="/assets/logo.png" alt="Logo Tecnico Joel" className="w-20 h-20 object-contain" />
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Iniciar sesión</h2>
                <p className="text-gray-600">Selecciona tu tipo de acceso</p>
              </div>

              {/* Mode Selection */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <button
                  type="button"
                  onClick={() => setMode("cliente")}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    mode === "cliente" 
                      ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setMode("administrador")}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    mode === "administrador" 
                      ? "bg-red-500 text-white shadow-lg transform scale-105" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Administrador
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiMail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="tucorreo@ejemplo.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiLock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <a 
                    href="/recuperar" 
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-lg font-semibold transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                    mode === "administrador"
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  }`}
                >
                  <FiLogIn className="w-5 h-5" />
                  {loading 
                    ? "Ingresando..." 
                    : mode === "administrador" 
                      ? "Ingresar como administrador" 
                      : "Ingresar como cliente"
                  }
                </button>

                {/* Volver a la tienda (dentro del formulario) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full py-3 rounded-md bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Volver a la tienda
                  </button>
                </div>
              </form>

              {/* Register Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  ¿Aún no tienes cuenta?{" "}
                  <a 
                    href="/registro" 
                    className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
                  >
                    Crear cuenta
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal - circular with check icon */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="mx-auto mb-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                <FiCheck className="text-white" size={36} />
              </div>
            </div>
            <div className="text-lg font-semibold mb-1">¡Éxito!</div>
            <div className="text-sm text-gray-600">{successMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}