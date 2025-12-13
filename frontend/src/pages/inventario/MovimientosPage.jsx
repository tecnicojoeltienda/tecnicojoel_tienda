import { useEffect, useState, useMemo } from "react";
import { FiEye } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleString();
}
function formatNumber(v) {
  return Number(v || 0);
}

/* Modal Component */
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative max-w-4xl w-full mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-purple-100 hover:text-white text-xl font-bold">✕</button>
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
              ? "bg-purple-600 text-white border-purple-600"
              : "text-gray-700 bg-white border border-gray-300 hover:bg-purple-50"
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

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [productoInfo, setProductoInfo] = useState(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/movimientos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Error al cargar movimientos");
      }
      const data = await res.json();
      setMovimientos(data || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los movimientos");
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  const tipos = useMemo(() => {
    const s = new Set((movimientos || []).map(m => (m.tipo || "").toString()));
    return Array.from(s).sort();
  }, [movimientos]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (movimientos || []).filter(m => {
      if (tipoFilter && String(m.tipo) !== String(tipoFilter)) return false;
      if (!term) return true;
      return String(m.id_movimiento || "").toLowerCase().includes(term)
        || String(m.id_producto || "").toLowerCase().includes(term)
        || (m.descripcion || "").toLowerCase().includes(term);
    });
  }, [movimientos, q, tipoFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, tipoFilter]);

  async function openDetail(m) {
    setSelected(null);
    setProductoInfo(null);
    setDetailOpen(true);
    try {
      setSelected(m);
      if (m.id_producto) {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/apij/productos/${m.id_producto}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const prod = await res.json();
          setProductoInfo(prod);
        } else {
          setProductoInfo(null);
        }
      }
    } catch (err) {
      console.error("Error cargando producto del movimiento:", err);
      setProductoInfo(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6 font-['Inter','system-ui',sans-serif]">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Movimientos de Stock</h1>
            <p className="text-lg text-gray-600">Registro detallado de entradas y salidas de inventario. Las ventas generan salidas automáticas.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={cargar} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              {loading ? "Cargando..." : " Actualizar"}
            </button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder=" Buscar por ID, producto o descripción..."
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg mb-4 lg:mb-0 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-48">
              <option value="">Todos los tipos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="mb-6 p-4 text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                <tr>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Movimiento</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Producto</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Tipo</th>
                  <th className="text-right px-6 py-5 text-white font-bold text-lg">Cantidad</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Descripción</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Fecha</th>
                  <th className="text-center px-6 py-5 text-white font-bold text-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-lg text-gray-500 py-16">
                      {loading ? "⏳ Cargando movimientos..." : "📭 No se encontraron movimientos"}
                    </td>
                  </tr>
                )}

                {currentItems.map((m, index) => (
                  <tr key={m.id_movimiento} className={`hover:bg-purple-25 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-25' : 'bg-white'}`}>
                    <td className="px-6 py-5 text-lg font-bold text-gray-900">#{m.id_movimiento}</td>
                    <td className="px-6 py-5 text-lg font-semibold text-blue-600">#{m.id_producto ?? "-"}</td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                        m.tipo === "entrada" ? "bg-green-100 text-green-800 border border-green-300" :
                        m.tipo === "salida" ? "bg-red-100 text-red-800 border border-red-300" :
                        "bg-gray-100 text-gray-800 border border-gray-300"
                      }`}>
                        {m.tipo === "entrada" ? " " + m.tipo : m.tipo === "salida" ? " " + m.tipo : m.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-lg font-bold text-right text-purple-600">{formatNumber(m.cantidad)}</td>
                    <td className="px-6 py-5 text-base text-gray-700">{m.descripcion ?? "-"}</td>
                    <td className="px-6 py-5 text-base text-gray-700">{formatDate(m.fecha_movimiento)}</td>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => openDetail(m)} title="Ver detalles" aria-label="Ver detalles" className="p-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <FiEye className="w-5 h-5" />
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
                  Mostrando <span className="font-bold text-purple-600">{startIndex + 1}</span> a <span className="font-bold text-purple-600">{Math.min(endIndex, filtered.length)}</span> de <span className="font-bold text-purple-600">{filtered.length}</span> movimientos
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
      </div>

      <Modal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelected(null); setProductoInfo(null); }}
        title={` Detalle del Movimiento #${selected?.id_movimiento ?? ""}`}
        footer={<button onClick={() => { setDetailOpen(false); setSelected(null); setProductoInfo(null); }} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">Cerrar</button>}
      >
        {selected ? (
          <div className="space-y-6">
            <div className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div><strong className="text-purple-600">ID Movimiento:</strong> #{selected.id_movimiento}</div>
                <div><strong className="text-purple-600">Producto ID:</strong> #{selected.id_producto ?? "-"}</div>
                <div><strong className="text-purple-600">Tipo:</strong> <span className="font-bold text-lg">{selected.tipo}</span></div>
                <div><strong className="text-purple-600">Cantidad:</strong> <span className="font-bold text-lg">{selected.cantidad}</span></div>
                <div className="col-span-2"><strong className="text-purple-600">Descripción:</strong> {selected.descripcion ?? "-"}</div>
                <div className="col-span-2"><strong className="text-purple-600">Fecha:</strong> {formatDate(selected.fecha_movimiento)}</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-xl font-bold mb-4 text-gray-800">Información del Producto</h4>
              {productoInfo ? (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="space-y-3">
                    <div><strong className="text-purple-600">Nombre:</strong> <span className="text-lg font-semibold">{productoInfo.nombre_producto}</span></div>
                    <div><strong className="text-purple-600">Stock actual:</strong> <span className="text-lg font-bold text-purple-700">{productoInfo.stock}</span></div>
                    {productoInfo.precio && <div><strong className="text-purple-600">Precio:</strong> <span className="text-lg font-semibold">S/. {Number(productoInfo.precio).toFixed(2)}</span></div>}
                    {productoInfo.categoria && <div><strong className="text-purple-600">Categoría:</strong> <span className="text-base">{productoInfo.categoria}</span></div>}
                  </div>
                </div>
              ) : (
                <div className="text-base text-gray-500 text-center py-8">No hay información del producto disponible o el producto no existe.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-base text-gray-500 text-center py-8">Cargando detalles...</div>
        )}
      </Modal>
    </div>
  );
}