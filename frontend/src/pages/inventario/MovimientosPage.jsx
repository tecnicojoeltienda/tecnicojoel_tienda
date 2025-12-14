import { useEffect, useState, useMemo } from "react";
import { FiEye } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL;
//|| "http://localhost:4000";

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleString();
}
function formatNumber(v) {
  return Number(v || 0);
}

/* Modal Component (responsive) */
function Modal({ open, onClose, title, children, footer, maxW = "max-w-4xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className={`relative w-full ${maxW} mx-2 bg-white rounded-xl shadow-2xl overflow-hidden`}>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold text-sm md:text-lg truncate">{title}</h3>
          <button onClick={onClose} className="text-purple-100 hover:text-white text-lg md:text-xl font-bold">✕</button>
        </div>
        <div className="p-4 md:p-6">{children}</div>
        {footer && <div className="px-4 md:px-6 py-3 bg-gray-50 flex flex-col sm:flex-row sm:justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

/* Pagination Component (slightly compact) */
function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center flex-wrap gap-2 mt-4 md:mt-8">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm text-gray-500 bg-white border rounded-lg disabled:opacity-50"
      >
        Anterior
      </button>

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm rounded-lg ${page === currentPage ? 'bg-purple-600 text-white' : 'bg-white border'}`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm text-gray-500 bg-white border rounded-lg disabled:opacity-50"
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
      setMovimientos(Array.isArray(data) ? data : []);
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
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [q, tipoFilter]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-4 md:p-6 font-['Inter','system-ui',sans-serif]">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 truncate">Movimientos de Stock</h1>
            <p className="text-sm md:text-lg text-gray-600">Registro detallado de entradas y salidas de inventario. Las ventas generan salidas automáticas.</p>
          </div>

          <div className="w-full md:w-auto flex gap-3">
            <button onClick={cargar} className="w-full md:w-auto px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm md:text-lg font-semibold rounded-xl shadow hover:shadow-xl transition-all duration-200">
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por ID, producto o descripción..."
              className="w-full md:flex-1 border-2 border-gray-200 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm md:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="w-full md:w-64 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm md:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos los tipos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="mb-6 p-3 text-sm md:text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>}

        {/* MOBILE: cards list */}
        <div className="space-y-3 md:hidden">
          {loading && <div className="text-center py-6 text-gray-500">Cargando movimientos...</div>}
          {!loading && currentItems.length === 0 && <div className="text-center py-6 text-gray-500">No se encontraron movimientos</div>}

          {!loading && currentItems.map(m => (
            <div key={m.id_movimiento} className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-gray-900">#{m.id_movimiento}</div>
                    <div className="text-xs text-gray-500">{formatDate(m.fecha_movimiento)}</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-gray-700">Producto: <span className="font-semibold text-blue-600">#{m.id_producto ?? "-"}</span></div>
                    <div className="text-sm text-gray-600 mt-1 truncate">{m.descripcion ?? "-"}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-base font-bold text-purple-600">{formatNumber(m.cantidad)}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    m.tipo === "entrada" ? "bg-green-100 text-green-800" :
                    m.tipo === "salida" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>{m.tipo || "-"}</span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={() => openDetail(m)} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg shadow text-sm">
                  <FiEye /> Ver
                </button>
              </div>
            </div>
          ))}

          {filtered.length > 0 && (
            <div className="pt-3">
              <div className="text-sm text-gray-600 text-center mb-2">Mostrando {startIndex + 1} - {Math.min(endIndex, filtered.length)} de {filtered.length}</div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>

        {/* DESKTOP: table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden">
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
                  <tr key={m.id_movimiento} className={`transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-5 text-lg font-bold text-gray-900">#{m.id_movimiento}</td>
                    <td className="px-6 py-5 text-lg font-semibold text-blue-600">#{m.id_producto ?? "-"}</td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                        m.tipo === "entrada" ? "bg-green-100 text-green-800 border border-green-300" :
                        m.tipo === "salida" ? "bg-red-100 text-red-800 border border-red-300" :
                        "bg-gray-100 text-gray-800 border border-gray-300"
                      }`}>{m.tipo || "-"}</span>
                    </td>
                    <td className="px-6 py-5 text-lg font-bold text-right text-purple-600">{formatNumber(m.cantidad)}</td>
                    <td className="px-6 py-5 text-base text-gray-700">{m.descripcion ?? "-"}</td>
                    <td className="px-6 py-5 text-base text-gray-700">{formatDate(m.fecha_movimiento)}</td>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => openDetail(m)} title="Ver detalles" aria-label="Ver detalles" className="p-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
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
        title={`Detalle del Movimiento #${selected?.id_movimiento ?? ""}`}
        footer={<button onClick={() => { setDetailOpen(false); setSelected(null); setProductoInfo(null); }} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg">Cerrar</button>}
        maxW="max-w-lg"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="text-base text-gray-700 bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><strong className="text-purple-600">ID Movimiento:</strong> #{selected.id_movimiento}</div>
                <div><strong className="text-purple-600">Producto ID:</strong> #{selected.id_producto ?? "-"}</div>
                <div><strong className="text-purple-600">Tipo:</strong> <span className="font-bold text-lg">{selected.tipo}</span></div>
                <div><strong className="text-purple-600">Cantidad:</strong> <span className="font-bold text-lg">{selected.cantidad}</span></div>
                <div className="col-span-2"><strong className="text-purple-600">Descripción:</strong> {selected.descripcion ?? "-"}</div>
                <div className="col-span-2"><strong className="text-purple-600">Fecha:</strong> {formatDate(selected.fecha_movimiento)}</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-lg font-bold mb-3 text-gray-800">Información del Producto</h4>
              {productoInfo ? (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="space-y-2">
                    <div><strong className="text-purple-600">Nombre:</strong> <span className="text-lg font-semibold">{productoInfo.nombre_producto || productoInfo.nombre || "-"}</span></div>
                    <div><strong className="text-purple-600">Stock actual:</strong> <span className="text-lg font-bold text-purple-700">{productoInfo.stock ?? "-"}</span></div>
                    {productoInfo.precio && <div><strong className="text-purple-600">Precio:</strong> <span className="text-lg font-semibold">S/. {Number(productoInfo.precio).toFixed(2)}</span></div>}
                    {productoInfo.categoria && <div><strong className="text-purple-600">Categoría:</strong> <span className="text-base">{productoInfo.categoria}</span></div>}
                  </div>
                </div>
              ) : (
                <div className="text-base text-gray-500 text-center py-4">No hay información del producto disponible o el producto no existe.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-base text-gray-500 text-center py-4">Cargando detalles...</div>
        )}
      </Modal>
    </div>
  );
}