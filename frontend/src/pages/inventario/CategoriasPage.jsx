import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api.js";
import { FiRefreshCw, FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL;

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [formEdit, setFormEdit] = useState({ nombre_categoria: "", descripcion: "" });
  const navigate = useNavigate();

  useEffect(() => {
    loadCategorias();
  }, []);

  async function loadCategorias() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/apij/categorias");
      const data = res?.data ?? [];
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargar categorías:", err);
      setError("Error al obtener categorías");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/categorias/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      await loadCategorias();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar la categoría");
    }
  }

  function openEditModal(cat) {
    setSelectedCategoria(cat);
    setFormEdit({
      nombre_categoria: cat.nombre_categoria || "",
      descripcion: cat.descripcion || ""
    });
    setEditModal(true);
  }

  async function handleUpdate() {
    if (!selectedCategoria) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/categorias/${selectedCategoria.id_categoria}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formEdit),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      setEditModal(false);
      setSelectedCategoria(null);
      await loadCategorias();
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar la categoría");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Gestión de Categorías</h1>
          <p className="text-sm text-gray-600 mt-1">Administra las categorías de productos</p>
        </div>

        {/* Title bar */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 sm:px-6 gap-3">
            <div className="text-sm sm:text-base font-semibold text-blue-700">Listar Categorías</div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-gray-700 font-semibold">{categorias.length} categorías</div>
              <button
                onClick={loadCategorias}
                className="px-3 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 flex items-center gap-2 text-sm sm:px-4"
              >
                <FiRefreshCw /> Refrescar
              </button>
              <button
                onClick={() => navigate("/inventario/categorias/nuevo")}
                className="px-3 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 flex items-center gap-2 text-sm sm:px-4"
              >
                <FiPlus /> Crear
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Desktop table */}
        <div className="bg-white rounded-2xl shadow overflow-auto hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-700">ID</th>
                <th className="text-left px-6 py-3 font-medium text-gray-700">NOMBRE</th>
                <th className="text-left px-6 py-3 font-medium text-gray-700">DESCRIPCIÓN</th>
                <th className="text-center px-6 py-3 font-medium text-gray-700">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              )}

              {!loading && categorias.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No hay categorías
                  </td>
                </tr>
              )}

              {!loading &&
                categorias.map((cat) => (
                  <tr key={cat.id_categoria} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{cat.id_categoria}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.nombre_categoria}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{cat.descripcion || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          title="Editar"
                          onClick={() => openEditModal(cat)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <FiEdit2 className="text-blue-600" />
                        </button>
                        <button
                          title="Eliminar"
                          onClick={() => handleDelete(cat.id_categoria, cat.nombre_categoria)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <FiTrash2 className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list (cards) */}
        <div className="md:hidden space-y-3">
          {loading && <div className="p-6 bg-white rounded-xl text-center text-gray-500">Cargando...</div>}

          {!loading && categorias.length === 0 && (
            <div className="p-6 bg-white rounded-xl text-center text-gray-500">No hay categorías</div>
          )}

          {!loading &&
            categorias.map((cat) => (
              <div key={cat.id_categoria} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{cat.nombre_categoria}</div>
                    <div className="mt-1 text-xs text-gray-600">{cat.descripcion || "Sin descripción"}</div>
                    <div className="mt-1 text-xs text-gray-500">ID: {cat.id_categoria}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 bg-blue-50 rounded-lg text-blue-600"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id_categoria, cat.nombre_categoria)}
                      className="p-2 bg-red-50 rounded-lg text-red-600"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Modal: Editar categoría */}
      {editModal && selectedCategoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditModal(false)}></div>
          <div className="bg-white rounded-xl p-4 z-10 w-full max-w-md mx-4 sm:p-6">
            <h3 className="text-lg font-bold mb-3">Editar Categoría</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formEdit.nombre_categoria}
                  onChange={(e) => setFormEdit({ ...formEdit, nombre_categoria: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formEdit.descripcion}
                  onChange={(e) => setFormEdit({ ...formEdit, descripcion: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <button onClick={() => setEditModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}