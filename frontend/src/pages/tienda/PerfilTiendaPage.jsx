import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import api from "../../service/api";
import { FiUser, FiMail, FiPackage, FiHome, FiCalendar, FiPhone, FiEdit3, FiLock, FiCamera, FiEye, FiEyeOff } from "react-icons/fi";

export default function PerfilTiendaPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ pedidos: 0, totalGastado: 0 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [form, setForm] = useState({ 
    nombre: "", 
    apellido: "", 
    email: "", 
    telefono: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

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
        email: user.email ?? user.correo ?? "",
        telefono: user.telefono ?? "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPhotoPreview(null);
      setPhotoFile(null);
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

  const formatCurrency = (v) =>
    v == null || v === "" ? "S/. 0.00" : `S/. ${Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const openEdit = () => setIsEditOpen(true);
  const closeEdit = () => {
    if (editLoading) return;
    setIsEditOpen(false);
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Archivo inválido. Selecciona una imagen.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 5MB.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result); // Base64 preview
    };
    reader.readAsDataURL(file);
  };

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).toLowerCase());

  const handleSave = async () => {
    const { nombre, apellido, email, telefono, currentPassword, newPassword, confirmPassword } = form;
    
    if (!nombre?.trim() || !apellido?.trim()) {
      toast.error('Nombre y apellido son obligatorios.');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Ingresa un correo válido.');
      return;
    }

    // Validar cambio de contraseña
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        toast.error('Ingresa tu contraseña actual para cambiarla.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Las contraseñas nuevas no coinciden.');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }

    const clienteId = user.id ?? user.id_cliente ?? user.idCliente;
    if (!clienteId) {
      toast.error('No se pudo determinar el ID del usuario.');
      return;
    }

    setEditLoading(true);
    try {
      const payload = { 
        nombre: nombre.trim(), 
        apellido: apellido.trim(), 
        email: email.trim(),
        telefono: telefono?.trim() || null
      };

      // Si hay cambio de contraseña
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      // Si hay foto nueva, enviarla como Base64
      if (photoPreview && photoPreview.startsWith('data:image')) {
        payload.foto_perfil = photoPreview; // Base64 string
      }

      // Enviar todo como JSON (no FormData)
      const res = await api.put(`/apij/clientes/${clienteId}`, payload);
      
      let updated = res?.data?.data || res?.data || { ...user, ...payload };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);

      toast.success('Perfil actualizado correctamente.');
      setIsEditOpen(false);
      setPhotoPreview(null);
      setPhotoFile(null);
    } catch (err) {
      console.error("Error actualizar usuario:", err);
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error || "Error al actualizar. Intenta nuevamente.";
      toast.error(errorMsg);
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

  const userPhoto = user.foto_perfil || photoPreview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <HeaderTienda />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header del perfil - Solo móvil */}
        <div className="mb-8 text-center lg:hidden">
          <div className="relative inline-block mb-4">
            {userPhoto ? (
              <img
                src={userPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName) + '&size=200&background=3B82F6&color=fff'}
                alt="Foto de perfil"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName) + '&size=200&background=3B82F6&color=fff';
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-4xl font-bold shadow-lg flex items-center justify-center">
                {fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Hola, {user.nombre || "Usuario"}!
          </h1>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt="Foto de perfil" 
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                    {fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold mb-1">¡Hola, {user.nombre || "Usuario"}!</h1>
                  {fechaRegistro && (
                    <p className="text-blue-100 text-sm mt-1">
                      Miembro desde {fechaRegistro.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={openEdit}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white font-semibold hover:bg-white/30 transition-colors inline-flex items-center gap-2"
              >
                <FiEdit3 className="w-5 h-5" />
                Editar perfil
              </button>
            </div>
          </div>

          {/* Información de la cuenta */}
          <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Información de la cuenta
                </h2>
              </div>
              {/* Botón editar móvil */}
              <button
                onClick={openEdit}
                className="lg:hidden p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiEdit3 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
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

        {/* Resumen de pedidos */}
        <div className="mt-6 bg-white rounded-3xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiPackage className="w-5 h-5 text-blue-600" />
            Resumen de pedidos
          </h3>
          {loading ? (
            <div className="flex gap-4">
              <div className="flex-1 animate-pulse p-4 bg-gray-100 rounded-xl">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="flex-1 animate-pulse p-4 bg-gray-100 rounded-xl">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-sm text-green-700 font-medium mb-1">Pedidos realizados</p>
                <p className="text-3xl font-bold text-green-800">{stats.pedidos}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-700 font-medium mb-1">Total gastado</p>
                <p className="text-3xl font-bold text-blue-800">{formatCurrency(stats.totalGastado)}</p>
              </div>
            </div>
          )}
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

      {/* Modal edición */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 bg-black/40">
          <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h3 className="text-xl font-bold">Editar perfil</h3>
              <button
                onClick={closeEdit}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {photoPreview || userPhoto ? (
                    <img 
                      src={photoPreview || userPhoto} 
                      alt="Preview" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-4xl font-bold flex items-center justify-center">
                      {fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <label 
                    htmlFor="photo-upload" 
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <FiCamera className="w-5 h-5" />
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Click en la cámara para cambiar foto</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase">Nombre</label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase">Apellido</label>
                  <input
                    name="apellido"
                    value={form.apellido}
                    onChange={handleChange}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 uppercase">Correo electrónico</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  type="email"
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 uppercase">Teléfono</label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  type="tel"
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiLock className="w-5 h-5 text-gray-600" />
                  Cambiar contraseña (opcional)
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Contraseña actual</label>
                    <div className="relative">
                      <input
                        name="currentPassword"
                        value={form.currentPassword}
                        onChange={handleChange}
                        type={form.showCurrentPassword ? "text" : "password"}
                        className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((s) => ({ ...s, showCurrentPassword: !s.showCurrentPassword }))}
                        className="absolute right-3 top-3 text-gray-500"
                      >
                        {form.showCurrentPassword ? (
                          <FiEyeOff className="w-5 h-5" />
                        ) : (
                          <FiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Nueva contraseña</label>
                    <div className="relative">
                      <input
                        name="newPassword"
                        value={form.newPassword}
                        onChange={handleChange}
                        type={form.showNewPassword ? "text" : "password"}
                        className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((s) => ({ ...s, showNewPassword: !s.showNewPassword }))}
                        className="absolute right-3 top-3 text-gray-500"
                      >
                        {form.showNewPassword ? (
                          <FiEyeOff className="w-5 h-5" />
                        ) : (
                          <FiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Confirmar nueva contraseña</label>
                    <div className="relative">
                      <input
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        type={form.showConfirmPassword ? "text" : "password"}
                        className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirma tu nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((s) => ({ ...s, showConfirmPassword: !s.showConfirmPassword }))}
                        className="absolute right-3 top-3 text-gray-500"
                      >
                        {form.showConfirmPassword ? (
                          <FiEyeOff className="w-5 h-5" />
                        ) : (
                          <FiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={closeEdit}
                  className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                  disabled={editLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
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
