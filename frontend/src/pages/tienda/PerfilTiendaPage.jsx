import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import api from "../../service/api";
import { FiUser, FiMail, FiPackage, FiHome, FiCalendar, FiPhone } from "react-icons/fi";

export default function PerfilTiendaPage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) { setUser(null); return; }
    try { setUser(JSON.parse(raw)); } catch { setUser(null); }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <HeaderTienda />
        <main className="w-full max-w-4xl mx-auto px-6 py-24">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiUser className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Debes iniciar sesión</h1>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Inicia sesión o crea una cuenta para acceder a tu perfil y gestionar tu información personal.
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => navigate("/login")} 
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Iniciar sesión
              </button>
              <button 
                onClick={() => navigate("/registro")} 
                className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Crear cuenta
              </button>
            </div>
          </div>
        </main>
        <FooterTienda />
      </div>
    );
  }

  const fullName = `${user.nombre ?? ""} ${user.apellido ?? ""}`.trim() || "Usuario";
  const userId = user.id_cliente || user.id || "N/A";
  const fechaRegistro = user.fecha_registro ? new Date(user.fecha_registro) : 
                       user.created_at ? new Date(user.created_at) : 
                       user.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <HeaderTienda />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header del perfil - Solo móvil */}
        <div className="mb-8 text-center lg:hidden">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-4xl font-bold shadow-lg mb-4">
            {fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Hola, {user.nombre || "Usuario"}!
          </h1>
          <p className="text-gray-600 text-sm">ID de Cliente: {userId}</p>
          {fechaRegistro && (
            <p className="text-gray-500 text-sm mt-1">
              Miembro desde {fechaRegistro.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Card de información - Móvil y desktop */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Header desktop */}
          <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                {fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">¡Hola, {user.nombre || "Usuario"}!</h1>
                <p className="text-blue-100">ID de Cliente: {userId}</p>
                {fechaRegistro && (
                  <p className="text-blue-100 text-sm mt-1">
                    Miembro desde {fechaRegistro.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información de la cuenta */}
          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FiUser className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                Información de la cuenta
              </h2>
            </div>

            <div className="space-y-6">
              {/* ID de cliente - Solo desktop */}
              <div className="hidden lg:block">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID de cliente
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                  #{userId}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Nombre
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                  {user.nombre || "No especificado"}
                </div>
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Apellido
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                  {user.apellido || "No especificado"}
                </div>
              </div>

              {/* Correo electrónico */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Correo electrónico
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium flex items-center gap-2">
                  <FiMail className="w-4 h-4 text-gray-500" />
                  {user.email || "No especificado"}
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Teléfono
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium flex items-center gap-2">
                  <FiPhone className="w-4 h-4 text-gray-500" />
                  {user.telefono || "No especificado"}
                </div>
              </div>

              {/* Fecha de registro - Solo desktop */}
              {fechaRegistro && (
                <div className="hidden lg:block">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Miembro desde
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium flex items-center gap-2">
                    <FiCalendar className="w-4 h-4 text-gray-500" />
                    {fechaRegistro.toLocaleDateString("es-PE", { 
                      day: "2-digit", 
                      month: "2-digit", 
                      year: "numeric" 
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("/pedidos")}
            className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiPackage className="w-5 h-5" />
            Ver mis pedidos
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <FiHome className="w-5 h-5" />
            Volver a la tienda
          </button>
        </div>
      </main>

      <FooterTienda />
    </div>
  );
}
