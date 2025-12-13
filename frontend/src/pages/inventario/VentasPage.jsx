import { useEffect, useState, useMemo } from "react";
import { FiEdit, FiEye } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleString();
}
function formatMoney(v) {
  return `S/. ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* Reusable Modal */
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative max-w-4xl w-full mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-green-100 hover:text-white text-xl font-bold">✕</button>
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
              ? "bg-green-600 text-white border-green-600"
              : "text-gray-700 bg-white border border-gray-300 hover:bg-green-50"
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

// cache simple para evitar múltiples requests por el mismo producto
const productNameCache = {};

async function fetchProductName(id) {
  if (!id) return null;
  if (productNameCache[id]) return productNameCache[id];
  try {
    const res = await fetch(`${API}/apij/productos/${id}`);
    const data = await res.json();
    const name = data?.nombre_producto || data?.nombre || data?.title || data?.name || null;
    productNameCache[id] = name;
    return name;
  } catch (e) {
    console.warn("No se pudo obtener nombre del producto", id, e);
    return null;
  }
}

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");
  const [metodoFilter, setMetodoFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // detalle modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [ventaPedidoItems, setVentaPedidoItems] = useState([]);

  // edit payment method modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState(null);
  const [editMetodoValue, setEditMetodoValue] = useState("efectivo");

  async function cargarVentas() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/ventas`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Error al cargar ventas");
      }
      const data = await res.json();
      setVentas(data || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las ventas");
      setVentas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarVentas(); }, []);

  const metodos = useMemo(() => {
    const s = new Set((ventas || []).map(v => (v.metodo_pago || "efectivo").toString()));
    return Array.from(s).sort();
  }, [ventas]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (ventas || []).filter(v => {
      if (metodoFilter && String(v.metodo_pago) !== String(metodoFilter)) return false;
      if (!term) return true;
      return String(v.id_venta || "").toLowerCase().includes(term)
        || String(v.id_pedido || "").toLowerCase().includes(term)
        || String(v.total || "").toLowerCase().includes(term)
        || (v.metodo_pago || "").toLowerCase().includes(term);
    });
  }, [ventas, q, metodoFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, metodoFilter]);

  // abrir modal de detalle para una venta
  async function openDetail(venta) {
    try {
      setSelectedVenta(venta);
      setVentaPedidoItems([]);
      setDetailOpen(true);

      // Determinar id de pedido asociado a la venta
      const pedidoId = venta?.id_pedido ?? venta?.id_pedido_fk ?? venta?.id_pedido_id ?? venta?.id;
      if (!pedidoId) return;

      const resp = await fetch(`${API}/apij/detalle_pedidos/pedido/${pedidoId}`);
      const data = await resp.json();
      const detalles = Array.isArray(data) ? data : (data?.results || data?.rows || []);

      const detallesConNombres = await Promise.all(detalles.map(async (d) => {
        const id_producto = d.id_producto ?? d.id_producto_fk ?? d.id_producto_id ?? d.id;
        const nombre = d.nombre_producto || d.nombre || await fetchProductName(id_producto);
        const precio_unitario = d.precio_unitario ?? d.precio ?? d.precio_venta ?? 0;
        const cantidad = d.cantidad ?? d.qty ?? d.quantity ?? 1;
        const subtotal = d.subtotal ?? (cantidad * (precio_unitario || 0));
        return {
          ...d,
          id_producto,
          nombre_producto: nombre,
          precio_unitario,
          cantidad,
          subtotal,
        };
      }));

      setVentaPedidoItems(detallesConNombres);
    } catch (err) {
      console.error("Error al cargar detalle de venta:", err);
      setVentaPedidoItems([]);
    }
  }

  // abrir modal de editar método de pago
  function openEditModal(venta) {
    setEditingVenta(venta);
    setEditMetodoValue(venta.metodo_pago ?? "efectivo");
    setEditOpen(true);
  }

  // enviar actualización de método de pago
  async function submitEditMetodo() {
    if (!editingVenta) return;
    const id = editingVenta.id_venta;
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await fetch(`${API}/apij/ventas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ metodo_pago: editMetodoValue })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Error actualizando venta");
      }
      await cargarVentas();
      setEditOpen(false);
      setEditingVenta(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el método de pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6 font-['Inter','system-ui',sans-serif]">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestión de Ventas</h1>
            <p className="text-lg text-gray-600">Registro completo de ventas realizadas con detalles de productos y métodos de pago.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={cargarVentas} className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              {loading ? "Cargando..." : " Actualizar"}
            </button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder=" Buscar por ID venta, pedido, total o método de pago..."
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg mb-4 lg:mb-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
            />
            <select value={metodoFilter} onChange={(e) => setMetodoFilter(e.target.value)} className="border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-w-48">
              <option value="">Todos los métodos</option>
              {metodos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="mb-6 p-4 text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                <tr>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Venta</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Pedido</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Fecha</th>
                  <th className="text-right px-6 py-5 text-white font-bold text-lg">Total</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Método</th>
                  <th className="text-center px-6 py-5 text-white font-bold text-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-lg text-gray-500 py-16">
                      {loading ? "⏳ Cargando ventas..." : "📭 No se encontraron ventas"}
                    </td>
                  </tr>
                )}

                {currentItems.map((v, index) => (
                  <tr key={v.id_venta} className={`hover:bg-green-25 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-25' : 'bg-white'}`}>
                    <td className="px-6 py-5 text-lg font-bold text-gray-900">#{v.id_venta}</td>
                    <td className="px-6 py-5 text-lg font-semibold text-blue-600">#{v.id_pedido ?? "-"}</td>
                    <td className="px-6 py-5 text-base text-gray-700">{formatDate(v.fecha_venta)}</td>
                    <td className="px-6 py-5 text-lg font-bold text-right text-green-600">{formatMoney(v.total)}</td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                        v.metodo_pago === "efectivo" ? "bg-green-100 text-green-800 border border-green-300" :
                        v.metodo_pago === "tarjeta" ? "bg-blue-100 text-blue-800 border border-blue-300" :
                        v.metodo_pago === "transferencia" ? "bg-purple-100 text-purple-800 border border-purple-300" :
                        "bg-gray-100 text-gray-800 border border-gray-300"
                      }`}>
                        {v.metodo_pago ?? "efectivo"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(v)} title="Ver detalles" aria-label="Ver detalles" className="p-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <FiEye className="w-5 h-5" />
                        </button>
                        <button onClick={() => openEditModal(v)} title="Editar método de pago" aria-label="Editar método de pago" className="p-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <FiEdit className="w-5 h-5" />
                        </button>
                      </div>
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
                  Mostrando <span className="font-bold text-green-600">{startIndex + 1}</span> a <span className="font-bold text-green-600">{Math.min(endIndex, filtered.length)}</span> de <span className="font-bold text-green-600">{filtered.length}</span> ventas
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

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedVenta(null); setVentaPedidoItems([]); }}
        title={` Detalle de Venta #${selectedVenta?.id_venta ?? ""}`}
        footer={<button onClick={() => { setDetailOpen(false); setSelectedVenta(null); setVentaPedidoItems([]); }} className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">Cerrar</button>}
      >
        {selectedVenta ? (
          <div className="space-y-6">
            <div className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div><strong className="text-green-600">Venta:</strong> #{selectedVenta.id_venta}</div>
                <div><strong className="text-green-600">Pedido:</strong> #{selectedVenta.id_pedido ?? "-"}</div>
                <div><strong className="text-green-600">Fecha:</strong> {formatDate(selectedVenta.fecha_venta)}</div>
                <div><strong className="text-green-600">Método:</strong> <span className="font-bold text-lg">{selectedVenta.metodo_pago ?? "efectivo"}</span></div>
                <div className="col-span-2"><strong className="text-green-600">Total:</strong> <span className="font-bold text-xl text-green-700">{formatMoney(selectedVenta.total)}</span></div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-xl font-bold mb-4 text-gray-800">Detalles del Pedido</h4>
              {ventaPedidoItems.length === 0 ? (
                <div className="text-base text-gray-500 text-center py-8">No hay items vinculados o no se encontraron.</div>
              ) : (
                <div className="space-y-3">
                  {ventaPedidoItems.map(it => (
                    <div key={it.id_detalle_pedido ?? `${it.id_producto}-${it.cantidad}`} className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200">
                      <div>
                        <div className="font-semibold text-lg text-gray-900">{it.nombre_producto ?? `Producto #${it.id_producto}`}</div>
                        <div className="text-base text-green-600 font-medium">Cantidad: {it.cantidad}</div>
                      </div>
                      <div className="text-lg font-bold text-green-600">{formatMoney(it.subtotal ?? (it.cantidad * (it.precio_unitario ?? 0)))}</div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-xl font-bold text-gray-900">Subtotal: <span className="text-green-600">{formatMoney(ventaPedidoItems.reduce((s, it) => s + (Number(it.subtotal || (it.cantidad * (it.precio_unitario ?? 0))) || 0), 0))}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-base text-gray-500 text-center py-8">Cargando...</div>
        )}
      </Modal>

      {/* Edit Metodo Modal */}
      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditingVenta(null); }}
        title={`Editar Método de Pago - Venta #${editingVenta?.id_venta ?? ""}`}
        footer={
          <>
            <button onClick={() => { setEditOpen(false); setEditingVenta(null); }} className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300">Cancelar</button>
            <button onClick={submitEditMetodo} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">Guardar</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-base text-gray-700">Selecciona el método de pago para esta venta:</div>
          <select value={editMetodoValue} onChange={(e) => setEditMetodoValue(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="otro">Otro</option>
          </select>
          <div className="text-sm text-indigo-600 bg-indigo-50 p-3 rounded-lg">
            💡 <strong>Info:</strong> Cambiar el método no modifica montos. Solo actualiza el registro de la venta.
          </div>
        </div>
      </Modal>
    </div>
  );
}