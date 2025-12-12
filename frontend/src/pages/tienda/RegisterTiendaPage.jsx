import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus, FiPhone, FiCheck } from "react-icons/fi";

export default function RegisterTiendaPage() {
  const [nombres, setNombres] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [clave, setClave] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  // validaciones
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]+$/u;
  const phoneRegex = /^\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errs = {};
    if (!nombres || !nameRegex.test(nombres.trim())) {
      errs.nombres = "Ingresa un nombre válido (solo letras).";
    }
    if (!apellido || !nameRegex.test(apellido.trim())) {
      errs.apellido = "Ingresa apellido válido (solo letras).";
    }
    if (!email || !emailRegex.test(email.trim())) {
      errs.email = "Ingresa un correo válido.";
    }
    if (!telefono || !phoneRegex.test(telefono.trim())) {
      errs.telefono = "Ingresa un teléfono válido de 9 dígitos.";
    }
    if (!clave || clave.length < 6) {
      errs.clave = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: nombres.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        clave,
      };
      const res = await api.post("/apij/clientes", payload);
      const token = res?.data?.token || res?.data?.accessToken || res?.data?.token_api;

      setShowSuccessModal(true);

      if (token) {
        sessionStorage.setItem("token", token);
      }

      setTimeout(() => {
        setShowSuccessModal(false);
        navigate("/login");
      }, 1300);
    } catch (err) {
      setError(err?.response?.data?.message || "Error al registrar. Verifica los datos.");
    } finally {
      setLoading(false);
    }
  }

  // filtro en tiempo real para evitar números en nombres/apellidos
  function handleNombresChange(e) {
    const cleaned = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'\-]/gu, "");
    setNombres(cleaned);
  }
  function handleApellidoChange(e) {
    const cleaned = e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'\-]/gu, "");
    setApellido(cleaned);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Panel */}
          <div className="hidden md:flex flex-col justify-center gap-8 p-12 bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Únete a nosotros</h1>
              <p className="text-lg text-gray-300 max-w-sm leading-relaxed">
                Tu TecnoTienda de confianza. Crea tu cuenta para acceder a ofertas exclusivas y seguimiento de pedidos.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Cuenta personalizada</h3>
                  <p className="text-gray-400 text-sm">Guarda favoritos y historial</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Ofertas exclusivas</h3>
                  <p className="text-gray-400 text-sm">Descuentos especiales para miembros</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Datos protegidos</h3>
                  <p className="text-gray-400 text-sm">Privacidad garantizada</p>
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</h2>
                <p className="text-gray-600">Solo necesitamos algunos datos para empezar</p>
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
                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombres
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FiUser className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={nombres}
                        onChange={handleNombresChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 transition-colors bg-gray-50 focus:bg-white"
                        placeholder="Juan Carlos"
                        autoComplete="given-name"
                      />
                    </div>
                    {fieldErrors.nombres && <div className="mt-1 text-xs text-red-600">{fieldErrors.nombres}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Apellido
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FiUser className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={apellido}
                        onChange={handleApellidoChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 transition-colors bg-gray-50 focus:bg-white"
                        placeholder="Pérez"
                        autoComplete="family-name"
                      />
                    </div>
                    {fieldErrors.apellido && <div className="mt-1 text-xs text-red-600">{fieldErrors.apellido}</div>}
                  </div>
                </div>

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
                      placeholder="tunombre@ejemplo.com"
                      autoComplete="email"
                    />
                  </div>
                  {fieldErrors.email && <div className="mt-1 text-xs text-red-600">{fieldErrors.email}</div>}
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiPhone className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                      maxLength={9}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="9 dígitos (ej: 987654321)"
                      inputMode="numeric"
                    />
                  </div>
                  {fieldErrors.telefono && <div className="mt-1 text-xs text-red-600">{fieldErrors.telefono}</div>}
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
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="Crea una contraseña segura"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.clave && <div className="mt-1 text-xs text-red-600">{fieldErrors.clave}</div>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-lg font-semibold transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <FiUserPlus className="w-5 h-5" />
                  {loading ? "Registrando..." : "Crear cuenta"}
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

              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  ¿Ya tienes cuenta?{" "}
                  <a 
                    href="/login" 
                    className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
                  >
                    Iniciar sesión
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
            <div className="text-lg font-semibold mb-1">Registro exitoso</div>
            <div className="text-sm text-gray-600">Tu cuenta se creó correctamente. Redirigiendo...</div>
          </div>
        </div>
      )}
    </div>
  );
}
