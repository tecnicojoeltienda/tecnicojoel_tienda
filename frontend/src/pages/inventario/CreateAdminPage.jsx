import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiMail, FiCheck } from "react-icons/fi";
import api from "../../service/api.js";

export default function CreateAdmin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    clave: "",
    email: "",
    rol: "admin",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function validateEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.usuario.trim() || !form.clave.trim() || !form.email.trim()) {
      setError("Nombre, usuario, contraseña y correo son obligatorios.");
      return;
    }
    if (!validateEmail(form.email.trim())) {
      setError("Ingresa un correo válido.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        usuario: form.usuario.trim(),
        clave: form.clave,
        email: form.email.trim(),
        rol: form.rol,
        estado: "activo",
      };

      const res = await api.post("/apij/admins", payload);
      const success = res?.data?.ok || res?.status === 200 || res?.status === 201;
      if (success) {
        navigate("/inventario/administradores", { replace: true });
        return;
      } else {
        const msg = res?.data?.error || "No fue posible crear el administrador";
        setError(msg);
      }
    } catch (err) {
      console.error("Error crear admin:", err);
      const msg = err?.response?.data?.error || err?.message || "Error al crear administrador";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-start justify-center py-12">
      <div className="w-full max-w-2xl mx-6">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-t-2xl p-8 text-center text-white shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <FiUser className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Registrar Nuevo Usuario</h2>
          <p className="mt-2 text-sm opacity-90">Complete el formulario para crear una nueva cuenta de administrador.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl p-8 shadow-lg -mt-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 text-red-700 px-4 py-3 border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Nombres y Apellidos</label>
              <div className="relative">
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  placeholder="Nombres y Apellidos completos"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                />
                <FiUser className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Usuario</label>
              <input
                name="usuario"
                value={form.usuario}
                onChange={onChange}
                placeholder="usuario administrativo"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  name="clave"
                  value={form.clave}
                  onChange={onChange}
                  type="password"
                  placeholder="Contraseña segura"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                />
                <FiLock className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Correo electrónico</label>
              <div className="relative">
                <input
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                  required
                />
                <FiMail className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Tipo de Participación</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`border rounded-xl p-4 cursor-pointer ${form.rol === "admin" ? "border-blue-600 bg-blue-50" : "bg-white"}`}>
                  <input
                    type="radio"
                    name="rol"
                    value="admin"
                    checked={form.rol === "admin"}
                    onChange={(e) => setForm((s) => ({ ...s, rol: e.target.value }))}
                    className="hidden"
                  />
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center">
                      <FiUser className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Administrador</div>
                      <div className="text-sm text-gray-600">Puede gestionar rendiciones y participantes.</div>
                    </div>
                  </div>
                </label>

                <label className={`border rounded-xl p-4 cursor-pointer ${form.rol === "super_admin" ? "border-blue-600 bg-blue-50" : "bg-white"}`}>
                  <input
                    type="radio"
                    name="rol"
                    value="super_admin"
                    checked={form.rol === "super_admin"}
                    onChange={(e) => setForm((s) => ({ ...s, rol: e.target.value }))}
                    className="hidden"
                  />
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center">
                      <FiCheck className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Super admin.</div>
                      <div className="text-sm text-gray-600">Tiene acceso completo a todas las funciones.</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 mt-2">
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Completar Registro"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}