import { useEffect, useState, useMemo } from "react";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL 
//|| "http://localhost:4000";

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleString();
}
function formatMoney(v) {
  return `S/. ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* Small reusable Modal component */
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative max-w-4xl w-full mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-blue-100 hover:text-white text-xl font-bold">✕</button>
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
              ? "bg-blue-600 text-white border-blue-600"
              : "text-gray-700 bg-white border border-gray-300 hover:bg-blue-50"
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

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [changeStateValue, setChangeStateValue] = useState("");

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/pedidos/con-clientes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Error al cargar pedidos");
      }
      const data = await res.json();
      setPedidos(data || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los pedidos");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  const estados = useMemo(() => {
    const s = new Set((pedidos || []).map(p => (p.estado || "pendiente").toString()));
    return Array.from(s).sort();
  }, [pedidos]);

  const filtered = useMemo(() => {
    return (pedidos || []).filter(p => {
      const term = q.trim().toLowerCase();
      if (estadoFilter && String(p.estado) !== String(estadoFilter)) return false;
      if (!term) return true;
      const cliente = `${p.cliente_nombre || ""} ${p.cliente_email || ""} ${p.cliente_telefono || ""}`.toLowerCase();
      return String(p.id_pedido || p.id || "").toLowerCase().includes(term)
        || (cliente.includes(term))
        || String(p.total || p.total_calc || "").toLowerCase().includes(term);
    });
  }, [pedidos, q, estadoFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, estadoFilter]);

  // Fetch detalle_pedido for an order and open detail modal
  async function openDetailModal(order) {
    try {
      setSelectedOrder(order);
      setOrderDetails([]);
      setDetailModalOpen(true);

      const pedidoId = order?.id_pedido ?? order?.id;
      if (!pedidoId) return;

      const resp = await fetch(`${API}/apij/detalle_pedidos/pedido/${pedidoId}`);
      const data = await resp.json();
      const detalles = Array.isArray(data) ? data : (data?.results || data?.rows || []);

      // Resolver nombres de producto (con caché)
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

      setOrderDetails(detallesConNombres);
    } catch (err) {
      console.error("Error al cargar detalle de pedido:", err);
      setOrderDetails([]);
    }
  }

  // Open change-state modal
  function openChangeModal(order) {
    setSelectedOrder(order);
    // normalize to enum values
    const current = (order.estado || "pendiente").toString();
    setChangeStateValue(current);
    setChangeModalOpen(true);
  }

  // Submit change state
  async function submitChangeState() {
    if (!selectedOrder) return;
    const id = selectedOrder.id_pedido ?? selectedOrder.id;
    let nuevo = (changeStateValue || "").toLowerCase().trim();
    if (nuevo === "finalizar" || nuevo === "finalizado") nuevo = "completado";

    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await fetch(`${API}/apij/pedidos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ estado: nuevo })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Error actualizando estado");
      }
      // optionally read response JSON if controller returns ventaId etc.
      await cargar();
      setChangeModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el estado");
    } finally {
      setLoading(false);
    }
  }

  // Open delete confirm modal
  function openDeleteModal(order) {
    setSelectedOrder(order);
    setDeleteModalOpen(true);
  }

  // Confirm delete
  async function confirmDelete() {
    if (!selectedOrder) return;
    const id = selectedOrder.id_pedido ?? selectedOrder.id;
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await fetch(`${API}/apij/pedidos/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Error eliminando pedido");
      }
      await cargar();
      setDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el pedido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 font-['Inter','system-ui',sans-serif]">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestión de Pedidos</h1>
            <p className="text-lg text-gray-600">Lista de pedidos con información del cliente y estado actual.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={cargar} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              {loading ? "Cargando..." : " Actualizar"}
            </button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder=" Buscar por ID, cliente, email o total..."
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg mb-4 lg:mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48">
              <option value="">Todos los estados</option>
              {estados.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="mb-6 p-4 text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                <tr>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Pedido</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Fecha</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Cliente</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Items</th>
                  <th className="text-right px-6 py-5 text-white font-bold text-lg">Total</th>
                  <th className="text-left px-6 py-5 text-white font-bold text-lg">Estado</th>
                  <th className="text-center px-6 py-5 text-white font-bold text-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-lg text-gray-500 py-16">
                      {loading ? "⏳ Cargando pedidos..." : "📭 No se encontraron pedidos"}
                    </td>
                  </tr>
                )}

                {currentItems.map((p, index) => (
                  <tr key={p.id_pedido || p.id} className={`hover:bg-blue-25 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-25' : 'bg-white'}`}>
                    <td className="px-6 py-5 text-lg font-bold text-gray-900">#{p.id_pedido ?? p.id}</td>
                    <td className="px-6 py-5 text-base text-gray-700">{formatDate(p.fecha_pedido || p.created_at || p.fecha)}</td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-lg text-gray-900">{p.cliente_nombre || "Cliente anónimo"}</div>
                      <div className="text-sm text-gray-500 mt-1">{p.cliente_email || p.cliente_telefono || ""}</div>
                    </td>
                    <td className="px-6 py-5 text-lg font-semibold text-blue-600">{p.items ?? "-"}</td>
                    <td className="px-6 py-5 text-lg font-bold text-right text-green-600">{formatMoney(p.total_calc ?? p.total)}</td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                        String(p.estado).includes("en") || String(p.estado).includes("pendiente") ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                        String(p.estado).includes("complet") || String(p.estado).includes("entregado") ? "bg-green-100 text-green-800 border border-green-300" :
                        "bg-red-100 text-red-800 border border-red-300"
                      }`}>
                        {p.estado || "pendiente"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openChangeModal(p)} title="Cambiar estado" aria-label="Cambiar estado" className="p-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <FiEdit className="w-5 h-5" />
                        </button>
                        <button onClick={() => openDeleteModal(p)} title="Eliminar pedido" aria-label="Eliminar pedido" className="p-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => openDetailModal(p)} title="Ver detalles" aria-label="Ver detalles" className="p-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <FiEye className="w-5 h-5" />
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
                  Mostrando <span className="font-bold text-blue-600">{startIndex + 1}</span> a <span className="font-bold text-blue-600">{Math.min(endIndex, filtered.length)}</span> de <span className="font-bold text-blue-600">{filtered.length}</span> pedidos
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
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setOrderDetails([]); setSelectedOrder(null); }}
        title={`📋 Detalle del Pedido #${selectedOrder?.id_pedido ?? selectedOrder?.id ?? ""}`}
        footer={<button onClick={() => { setDetailModalOpen(false); setOrderDetails([]); setSelectedOrder(null); }} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">Cerrar</button>}
      >
        <div className="space-y-6">
          {selectedOrder && (
            <div className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div><strong className="text-blue-600">Cliente:</strong> {selectedOrder.cliente_nombre || "Cliente anónimo"}</div>
                <div><strong className="text-blue-600">Contacto:</strong> {selectedOrder.cliente_email || selectedOrder.cliente_telefono || "-"}</div>
                <div><strong className="text-blue-600">Fecha:</strong> {formatDate(selectedOrder.fecha_pedido)}</div>
                <div><strong className="text-blue-600">Estado:</strong> <span className="font-bold text-lg">{selectedOrder.estado}</span></div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="text-xl font-bold mb-4 text-gray-800">Artículos del Pedido</h4>
            {orderDetails.length === 0 ? (
              <div className="text-base text-gray-500 text-center py-8">No hay artículos (o cargando)...</div>
            ) : (
              <div className="space-y-3">
                {orderDetails.map(d => (
                  <div key={d.id_detalle_pedido || `${d.id_producto}-${d.cantidad}`} className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div>
                      <div className="font-semibold text-lg text-gray-900">{d.nombre_producto ?? `Producto #${d.id_producto}` ?? "Producto"}</div>
                      <div className="text-base text-blue-600 font-medium">Cantidad: {d.cantidad}</div>
                    </div>
                    <div className="text-lg font-bold text-green-600">{formatMoney(d.subtotal ?? (d.cantidad * (d.precio_unitario ?? 0)))}</div>
                  </div>
                ))}
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-xl font-bold text-gray-900">Total: <span className="text-green-600">{formatMoney(selectedOrder?.total_calc ?? selectedOrder?.total)}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Mostrar código de descuento si existe */}
          {selectedOrder?.codigo_descuento && (
            <div className="col-span-2 border-t pt-3 mt-2">
              <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-200">
                <span className="text-2xl">🎁</span>
                <div className="flex-1">
                  <strong className="text-green-700">Código de descuento aplicado:</strong>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-green-600 text-white font-bold text-sm rounded-lg">
                      {selectedOrder?.codigo_descuento}
                    </span>
                    <span className="text-green-700 font-semibold">
                      {selectedOrder?.porcentaje_descuento}% de descuento
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Change State Modal */}
      <Modal
        open={changeModalOpen}
        onClose={() => { setChangeModalOpen(false); setSelectedOrder(null); }}
        title={`Cambiar Estado - Pedido #${selectedOrder?.id_pedido ?? selectedOrder?.id ?? ""}`}
        footer={
          <>
            <button onClick={() => { setChangeModalOpen(false); setSelectedOrder(null); }} className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300">Cancelar</button>
            <button onClick={submitChangeState} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"> Guardar</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-base text-gray-700">Selecciona el nuevo estado para este pedido:</div>
          <select value={changeStateValue} onChange={(e) => setChangeStateValue(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="pendiente"> Pendiente</option>
            <option value="enviado">Enviado</option>
            <option value="cancelado"> Cancelado</option>
            <option value="completado"> Completado</option>
          </select>
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            💡 <strong>Tip:</strong> Al marcar como "completado" se creará automáticamente una venta y se ajustará el inventario.
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedOrder(null); }}
        title={` Eliminar Pedido #${selectedOrder?.id_pedido ?? selectedOrder?.id ?? ""}`}
        footer={
          <>
            <button onClick={() => { setDeleteModalOpen(false); setSelectedOrder(null); }} className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300">Cancelar</button>
            <button onClick={confirmDelete} className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"> Eliminar</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-base text-gray-700">¿Estás seguro que deseas eliminar este pedido? Esta acción no se puede deshacer.</div>
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            ⚠️ <strong>Advertencia:</strong> Pedido #{selectedOrder?.id_pedido ?? selectedOrder?.id} será eliminado permanentemente.
          </div>
        </div>
      </Modal>
    </div>
  );
}