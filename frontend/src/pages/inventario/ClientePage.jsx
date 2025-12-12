import { useEffect, useState, useMemo } from "react";
import { FiUser, FiMail, FiPhone, FiEdit } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleString();
}

/* Simple Modal */
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative max-w-2xl w-full mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-cyan-100 hover:text-white text-xl font-bold">✕</button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

/* Pagination Component */
function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            page === currentPage
              ? "bg-cyan-600 text-white border-cyan-600"
              : "text-gray-700 bg-white border border-gray-300 hover:bg-cyan-50"
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente
      </button>
    </div>
  );
}

export default function ClientePage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("fecha_desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: "", apellido: "", email: "", telefono: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  async function cargarClientes() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/clientes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || "Error al cargar clientes");
      const data = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : json?.data || []);
      setClientes(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los clientes");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarClientes(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = (clientes || []).filter(c => {
      if (!term) return true;
      return (
        String(c.nombre || "").toLowerCase().includes(term) ||
        String(c.apellido || "").toLowerCase().includes(term) ||
        String(c.email || "").toLowerCase().includes(term) ||
        String(c.dni || "").toLowerCase().includes(term) ||
        String(c.telefono || "").toLowerCase().includes(term)
      );
    });

    if (sortBy === "nombre_asc") list.sort((a,b) => (String(a.nombre||"")+" "+(a.apellido||"")).localeCompare(String(b.nombre||"")+" "+(b.apellido||"")));
    else if (sortBy === "nombre_desc") list.sort((a,b) => (String(b.nombre||"")+" "+(b.apellido||"")).localeCompare(String(a.nombre||"")+" "+(a.apellido||"")));
    else if (sortBy === "fecha_asc") list.sort((a,b) => new Date(a.fecha_registro||a.created_at||0) - new Date(b.fecha_registro||b.created_at||0));
    else list.sort((a,b) => new Date(b.fecha_registro||b.created_at||0) - new Date(a.fecha_registro||a.created_at||0));

    return list;
  }, [clientes, q, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, sortBy]);

  function openEditModal(client) {
    setEditingClient(client);
    setEditForm({
      nombre: client.nombre ?? "",
      apellido: client.apellido ?? "",
      email: client.email ?? "",
      telefono: client.telefono ?? ""
    });
    setEditError(null);
    setEditOpen(true);
  }

  function onEditChange(e) {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  }

  async function submitEdit() {
    if (!editingClient) return;
    setSaving(true);
    setEditError(null);
    try {
      const id = editingClient.id_cliente ?? editingClient.id;
      // Send only the allowed fields: nombre, apellido, email, telefono
      const payload = {
        nombre: editForm.nombre,
        apellido: editForm.apellido,
        email: editForm.email,
        telefono: editForm.telefono
      };
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/clientes/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Error actualizando cliente");
      }
      await cargarClientes();
      setEditOpen(false);
      setEditingClient(null);
    } catch (err) {
      console.error(err);
      setEditError(err.message || "No se pudo actualizar el cliente");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50 p-6 font-['Inter','system-ui',sans-serif]">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestión de Clientes</h1>
            <p className="text-lg text-gray-600">Base de datos completa de clientes registrados con información de contacto.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cargarClientes}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {loading ? "Cargando..." : " Actualizar"}
            </button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder=" Buscar por nombre, apellido, email, DNI o teléfono..."
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg mb-4 lg:mb-0 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-48"
            >
              <option value="fecha_desc"> Últimos registrados</option>
              <option value="fecha_asc"> Más antiguos</option>
              <option value="nombre_asc"> Nombre A → Z</option>
              <option value="nombre_desc"> Nombre Z → A</option>
            </select>
          </div>
        </div>

        {error && <div className="mb-6 p-4 text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                <tr>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Cliente</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Información</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Email</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Teléfono</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Documento</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Registro</th>
                  <th className="text-center px-6 py-5 text-white font-bold text-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-lg text-gray-500 py-16">
                      {loading ? "⏳ Cargando clientes..." : "📭 No se encontraron clientes"}
                    </td>
                  </tr>
                )}

                {currentItems.map((c, index) => (
                  <tr key={c.id_cliente ?? c.id} className={`hover:bg-cyan-25 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-25' : 'bg-white'}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                          <FiUser className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">#{c.id_cliente ?? c.id}</div>
                          <div className="text-sm text-gray-500">Cliente ID</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="font-semibold text-lg text-gray-900">{(c.nombre || "") + " " + (c.apellido || "")}</div>
                      <div className="text-base text-gray-600">Nombre completo</div>
                    </td>

                    <td className="px-6 py-5">
                      {c.email ? (
                        <div className="flex items-center gap-2">
                          <FiMail className="w-4 h-4 text-cyan-600" />
                          <span className="text-base text-cyan-600">{c.email}</span>
                        </div>
                      ) : <span className="text-base text-gray-400">-</span>}
                    </td>

                    <td className="px-6 py-5">
                      {c.telefono ? (
                        <div className="flex items-center gap-2">
                          <FiPhone className="w-4 h-4 text-green-600" />
                          <span className="text-base text-gray-700">{c.telefono}</span>
                        </div>
                      ) : <span className="text-base text-gray-400">-</span>}
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-lg font-semibold text-gray-700">{c.dni || "-"}</div>
                      <div className="text-sm text-gray-500">DNI</div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-base text-gray-700">{formatDate(c.fecha_registro || c.created_at)}</div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => openEditModal(c)}
                        title="Editar cliente"
                        className="p-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
                      >
                        <FiEdit className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filtered.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-lg text-gray-600">
                  Mostrando <span className="font-bold text-cyan-600">{startIndex + 1}</span> a <span className="font-bold text-cyan-600">{Math.min(endIndex, filtered.length)}</span> de <span className="font-bold text-cyan-600">{filtered.length}</span> clientes
                </div>
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 bg-white rounded-xl p-4 shadow">
          © {new Date().getFullYear()} Tecnico Joel • Gestión de clientes • Total registros: {clientes.length}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditingClient(null); setEditError(null); }}
        title={`Editar Cliente #${editingClient?.id_cliente ?? editingClient?.id ?? ""}`}
        footer={
          <>
            <button onClick={() => { setEditOpen(false); setEditingClient(null); }} className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300">Cancelar</button>
            <button onClick={submitEdit} disabled={saving} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {editError && <div className="text-sm text-red-700 bg-red-50 p-3 rounded">{editError}</div>}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
            <input name="nombre" value={editForm.nombre} onChange={onEditChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido</label>
            <input name="apellido" value={editForm.apellido} onChange={onEditChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input name="email" value={editForm.email} onChange={onEditChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
            <input name="telefono" value={editForm.telefono} onChange={onEditChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="text-xs text-gray-500">
            Solo se actualizarán Nombre, Apellido, Email y Teléfono.
          </div>
        </div>
      </Modal>
    </div>
  );
}