import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import api from "../../service/api";
import { FiUser, FiMail, FiPackage, FiLogOut, FiEdit3, FiShield, FiCalendar, FiClock, FiPhone } from "react-icons/fi";

export default function PerfilTiendaPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ pedidos: 0, totalGastado: 0 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "" });

  useEffect(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) { setUser(null); return; }
    try { setUser(JSON.parse(raw)); } catch { setUser(null); }
  }, []);

  useEffect(() => {
    if (isEditOpen && user) {
      setForm({
        nombre: user.nombre ?? "",
        apellido: user.apellido ?? "",
        email: user.email ?? user.correo ?? ""
      });
      setEditError("");
    }
  }, [isEditOpen, user]);

  
  useEffect(() => {
    if (!user || (!user.id && !user.id_cliente && !user.idCliente)) return;

    async function loadStats() {
      setLoading(true);
      try {
        const res = await api.get("/apij/pedidos");
        const all = res?.data ?? [];
        const clienteId = user.id ?? user.id_cliente ?? user.idCliente;
        
       
        const misPedidos = all.filter((p) => {
          const idCliente = p.id_cliente ?? p.idCliente ?? p.cliente_id ?? p.cliente ?? null;
          return Number(idCliente) === Number(clienteId);
        });

        
        const totalGastado = misPedidos.reduce((sum, p) => {
          return sum + (Number(p.total ?? p.monto ?? 0) || 0);
        }, 0);

        setStats({
          pedidos: misPedidos.length,
          totalGastado: totalGastado
        });
      } catch (err) {
        console.error("Error cargar estadísticas:", err);
        setStats({ pedidos: 0, totalGastado: 0 });
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [user?.id, user?.id_cliente, user?.idCliente]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const formatCurrency = (v) =>
    v == null || v === "" ? "S/. 0.00" : `S/. ${Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Helpers modal
  const openEdit = () => setIsEditOpen(true);
  const closeEdit = () => {
    if (editLoading) return;
    setIsEditOpen(false);
    setEditError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).toLowerCase());

  const handleSave = async () => {
    setEditError("");
    const { nombre, apellido, email } = form;
    if (!nombre?.trim() || !apellido?.trim()) {
      setEditError("Nombre y apellido son obligatorios.");
      return;
    }
    if (!validateEmail(email)) {
      setEditError("Ingresa un correo válido.");
      return;
    }

    const clienteId = user.id ?? user.id_cliente ?? user.idCliente;
    if (!clienteId) {
      setEditError("No se pudo determinar el ID del usuario.");
      return;
    }

    setEditLoading(true);
    try {
      const payload = { nombre: nombre.trim(), apellido: apellido.trim(), email: email.trim() };
      const res = await api.put(`/apij/clientes/${clienteId}`, payload);

      let updated = null;
      if (res?.data?.success && res.data.data) {
        updated = res.data.data;
      } else if (res?.data && typeof res.data === "object") {
       
        updated = res.data;
      } else {
        updated = { ...user, ...payload };
      }
      updated = updated ?? { ...user, ...payload };

      try {
        if (localStorage.getItem("user")) {
          localStorage.setItem("user", JSON.stringify(updated));
        } else if (sessionStorage.getItem("user")) {
          sessionStorage.setItem("user", JSON.stringify(updated));
        } else {
          localStorage.setItem("user", JSON.stringify(updated));
        }
      } catch (err) {
        console.warn("No se pudo actualizar storage:", err);
      }

      setUser(updated);
      setForm({ nombre: updated.nombre ?? "", apellido: updated.apellido ?? "", email: updated.email ?? updated.correo ?? "" });
      setIsEditOpen(false);
    } catch (err) {
      console.error("Error actualizar usuario:", err);
      setEditError(err?.response?.data?.message ?? "Error al actualizar. Intenta nuevamente.");
    } finally {
      setEditLoading(false);
    }
  };

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

      {/* Modal edición — bonito y profesional */}
      {isEditOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-4 sm:px-6">
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            aria-hidden="true"
            onClick={closeEdit}
          />
          <div className="relative max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold">Editar perfil</h3>
              <button
                onClick={closeEdit}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-md focus:outline-none"
                aria-label="Cerrar diálogo"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Actualiza tu nombre y correo electrónico. Estos datos se usarán en tus pedidos y notificaciones.</p>

              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Apellido</label>
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Correo electrónico</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {editError && <div className="text-sm text-red-600">{editError}</div>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  disabled={editLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2"
                  disabled={editLoading}
                >
                  {editLoading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
