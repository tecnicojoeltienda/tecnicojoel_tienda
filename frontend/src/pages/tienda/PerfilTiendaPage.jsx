import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import api from "../../service/api";
import { FiUser, FiMail, FiPackage, FiLogOut, FiEdit3, FiShield, FiCalendar, FiClock } from "react-icons/fi";

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
  const fechaRegistro = user.fecha_registro ? new Date(user.fecha_registro) : 
                       user.created_at ? new Date(user.created_at) : 
                       user.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <HeaderTienda />
      <main className="w-full max-w-4xl mx-auto px-6 py-12">
        {/* Header del perfil */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <FiUser className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">¡Hola, {user.nombre ?? "Usuario"}!</h1>
              <p className="text-blue-100 text-lg">Bienvenido a tu perfil personal</p>
              {fechaRegistro && (
                <p className="text-blue-200 text-sm mt-1 flex items-center gap-2">
                  <FiClock className="w-4 h-4" />
                  Miembro desde {fechaRegistro.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <button
              onClick={openEdit}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium hover:bg-white/30 transition-colors inline-flex items-center gap-2"
              aria-haspopup="dialog"
            >
              <FiEdit3 className="w-4 h-4" />
              Editar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información personal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-blue-600" />
                </div>
                Información personal
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Nombre completo</label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-lg font-semibold text-gray-900">{fullName}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Nombre</label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-lg font-medium text-gray-900">{user.nombre ?? "-"}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Apellido</label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-lg font-medium text-gray-900">{user.apellido ?? "-"}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Correo electrónico</label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <FiMail className="w-4 h-4 text-gray-500" />
                      {user.email ?? user.correo ?? "-"}
                    </div>
                  </div>
                </div>

                {/* Mostrar DNI y teléfono si existen */}
                {user.dni && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">DNI</label>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-lg font-medium text-gray-900">{user.dni}</div>
                    </div>
                  </div>
                )}

                {user.telefono && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Teléfono</label>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-lg font-medium text-gray-900">{user.telefono}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Información adicional */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <FiShield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Información de la cuenta</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700">ID de cliente:</span>
                    <span className="font-medium text-blue-900">#{user.id ?? user.id_cliente ?? "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-700">Miembro desde:</span>
                    <span className="font-medium text-blue-900">
                      {fechaRegistro ? fechaRegistro.toLocaleDateString('es-PE', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      }) : "No disponible"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de acciones */}
          <div className="space-y-6">
            {/* Acciones rápidas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones rápidas</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate("/pedidos")} 
                  className="w-full p-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 shadow-sm"
                >
                  <FiPackage className="w-5 h-5" />
                  Ver mis pedidos
                </button>
                
                <button 
                  onClick={() => navigate("/carrito")} 
                  className="w-full p-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-3"
                >
                  <FiPackage className="w-5 h-5" />
                  Ir al carrito
                </button>
              </div>
            </div>

            {/* Estadísticas actualizadas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de actividad</h3>
              {loading ? (
                <div className="space-y-4">
                  <div className="animate-pulse p-3 bg-gray-100 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="animate-pulse p-3 bg-gray-100 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">Pedidos realizados</span>
                    <span className="text-2xl font-bold text-green-800">{stats.pedidos}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700 font-medium">Total gastado</span>
                    <span className="text-2xl font-bold text-blue-800">{formatCurrency(stats.totalGastado)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cerrar sesión */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sesión</h3>
              <button 
                onClick={handleLogout} 
                className="w-full p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-3"
              >
                <FiLogOut className="w-5 h-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
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
