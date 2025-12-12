import React, { useEffect, useMemo, useState } from "react";
import api from "../../service/api.js";
import { FiKey, FiPower, FiRefreshCw, FiEdit2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState("admin");
  const [error, setError] = useState(null);

  // UI filters
  const [roleFilter, setRoleFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/apij/admins");
      const data = res?.data ?? [];
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargar administradores:", err);
      setError("Error al obtener administradores");
    } finally {
      setLoading(false);
    }
  }

  const roles = useMemo(() => {
    const set = new Set();
    admins.forEach((a) => { if (a.rol) set.add(a.rol); });
    return Array.from(set);
  }, [admins]);

  const estados = useMemo(() => {
    const set = new Set();
    admins.forEach((a) => { if (a.estado) set.add(a.estado); });
    return Array.from(set);
  }, [admins]);

  const filtered = useMemo(() => {
    return admins.filter((a) => {
      if (roleFilter && String(a.rol) !== String(roleFilter)) return false;
      if (stateFilter && String(a.estado) !== String(stateFilter)) return false;
      return true;
    });
  }, [admins, roleFilter, stateFilter]);

  async function openChangePassword(admin) {
    setSelected(admin);
    setNewPassword("");
    setShowPassModal(true);
  }

  async function submitChangePassword() {
    if (!selected || !newPassword) return;
    try {
      const res = await fetch(`${API}/apij/admins/${selected.id_admin}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: newPassword }),
      });
      if (!res.ok) throw new Error("Error actualizando contraseña");
      setShowPassModal(false);
      setSelected(null);
      await loadAdmins();
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar la contraseña");
    }
  }

  async function openChangeRole(admin) {
    setSelected(admin);
    setNewRole(admin.rol || "admin");
    setShowRoleModal(true);
  }

  async function submitChangeRole() {
    if (!selected) return;
    try {
      const res = await fetch(`${API}/apij/admins/${selected.id_admin}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol: newRole }),
      });
      if (!res.ok) throw new Error("Error actualizando rol");
      setShowRoleModal(false);
      setSelected(null);
      await loadAdmins();
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el rol");
    }
  }

  async function toggleEstado(admin) {
    try {
      const nuevo = String(admin.estado) === "activo" ? "inactivo" : "activo";
      const res = await fetch(`${API}/apij/admins/${admin.id_admin}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo }),
      });
      if (!res.ok) throw new Error("Error actualizando estado");
      await loadAdmins();
    } catch (err) {
      console.error(err);
      alert("No se pudo cambiar el estado");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-screen-2xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-600 mt-1">Administra los usuarios del sistema</p>
        </div>

        {/* Single full-width tab (no Buscar) */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="flex items-center">
            <div className="flex-1 py-4 text-left px-6 bg-blue-50 border-b-4 border-blue-500 font-semibold text-blue-700">
              Listar Administradores
            </div>
          </div>
        </div>

        {/* Filters + Refresh button */}
        <div className="mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col lg:flex-row gap-4 items-start">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Rol</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white"
                >
                  <option value="">Todos los roles</option>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Estado</label>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white"
                >
                  <option value="">Todos los estados</option>
                  {estados.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="text-gray-700 font-semibold hidden lg:block">{filtered.length} usuarios encontrados</div>
              <button
                onClick={loadAdmins}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 flex items-center gap-3"
              >
                <FiRefreshCw /> Refrescar Lista
              </button>
            </div>
          </div>
        </div>

        {/* Table (wide, large) */}
        <div className="bg-white rounded-2xl shadow overflow-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-medium text-gray-700">NOMBRE</th>
                <th className="text-left px-6 py-4 font-medium text-gray-700">USUARIO</th>
                <th className="text-left px-6 py-4 font-medium text-gray-700">EMAIL</th>
                <th className="text-left px-6 py-4 font-medium text-gray-700">ROL</th>
                <th className="text-left px-6 py-4 font-medium text-gray-700">ESTADO</th>
                <th className="text-center px-6 py-4 font-medium text-gray-700">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Cargando...</td></tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No hay administradores</td></tr>
              )}

              {!loading && filtered.map((a) => (
                <tr key={a.id_admin || a.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{a.usuario}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{a.email || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      {a.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${String(a.estado) === "activo" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {a.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button title="Cambiar contraseña" onClick={() => openChangePassword(a)} className="p-2 rounded-lg hover:bg-gray-100">
                        <FiKey className="text-blue-600" />
                      </button>
                      <button title="Cambiar rol" onClick={() => openChangeRole(a)} className="p-2 rounded-lg hover:bg-gray-100">
                        <FiEdit2 className="text-amber-600" />
                      </button>
                      <button title={a.estado === "activo" ? "Inactivar" : "Activar"} onClick={() => toggleEstado(a)} className="p-2 rounded-lg hover:bg-gray-100">
                        <FiPower className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: cambiar contraseña */}
      {showPassModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPassModal(false)}></div>
          <div className="bg-white rounded-xl p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-bold mb-3">Cambiar contraseña — {selected.nombre}</h3>
            <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="Nueva contraseña" className="w-full px-4 py-3 border rounded-lg mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPassModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={submitChangePassword} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: cambiar rol */}
      {showRoleModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRoleModal(false)}></div>
          <div className="bg-white rounded-xl p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-bold mb-3">Cambiar rol — {selected.nombre}</h3>
            <select value={newRole} onChange={(e)=>setNewRole(e.target.value)} className="w-full px-4 py-3 border rounded-lg mb-4">
              <option value="admin">admin</option>
              <option value="super_admin">super_admin</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={submitChangeRole} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}