import { useEffect, useState, useMemo } from "react";
import { FiEdit, FiEye, FiTrash } from "react-icons/fi";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_BASE_URL;

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleString();
}
function formatMoney(v) {
  return `S/. ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}




function Modal({ open, onClose, title, children, footer, maxW = "max-w-4xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className={`relative w-full ${maxW} mx-2 bg-white rounded-xl shadow-2xl overflow-hidden`}>
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold text-sm md:text-lg truncate">{title}</h3>
          <button onClick={onClose} className="text-green-100 hover:text-white text-lg md:text-xl font-bold">✕</button>
        </div>
        <div className="p-4 md:p-6">{children}</div>
        {footer && <div className="px-4 md:px-6 py-3 bg-gray-50 flex flex-col sm:flex-row sm:justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

/* Pagination */
function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);
  for (let i = startPage; i <= endPage; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center flex-wrap gap-2 mt-4 md:mt-8">
      <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
        className="px-3 py-2 text-sm text-gray-500 bg-white border rounded-lg disabled:opacity-50">Anterior</button>
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`px-3 py-2 text-sm rounded-lg ${p === currentPage ? 'bg-green-600 text-white' : 'bg-white border'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm text-gray-500 bg-white border rounded-lg disabled:opacity-50">Siguiente</button>
    </div>
  );
}

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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [ventaPedidoItems, setVentaPedidoItems] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState(null);
  const [editMetodoValue, setEditMetodoValue] = useState("efectivo");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingVenta, setDeletingVenta] = useState(null);

  async function cargarVentas() {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/ventas`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Error al cargar ventas");
      }
      const data = await res.json();
      setVentas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las ventas");
      setVentas([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { cargarVentas(); }, []);

  const metodos = useMemo(() => Array.from(new Set((ventas || []).map(v => v.metodo_pago || "efectivo"))).sort(), [ventas]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);
  useEffect(() => setCurrentPage(1), [q, metodoFilter]);

  async function openDetail(venta) {
    try {
      setSelectedVenta(venta);
      setVentaPedidoItems([]);
      setDetailOpen(true);
      const pedidoId = venta?.id_pedido ?? venta?.id_pedido_fk ?? venta?.id;
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
        return { ...d, id_producto, nombre_producto: nombre, precio_unitario, cantidad, subtotal };
      }));
      setVentaPedidoItems(detallesConNombres);
    } catch (err) {
      console.error("Error al cargar detalle de venta:", err);
      setVentaPedidoItems([]);
    }
  }

  function openEditModal(venta) {
    setEditingVenta(venta);
    setEditMetodoValue(venta.metodo_pago ?? "efectivo");
    setEditOpen(true);
  }

  async function submitEditMetodo() {
    if (!editingVenta) return;
    const id = editingVenta.id_venta;
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await fetch(`${API}/apij/ventas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ metodo_pago: editMetodoValue })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Error actualizando venta");
      }
      await cargarVentas();
      setEditOpen(false); setEditingVenta(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el método de pago");
    } finally { setLoading(false); }
  }

  const openDeleteModal = (venta) => {
    setDeletingVenta(venta);
    setDeleteOpen(true);
  };

  const submitDelete = async () => {
    if (!deletingVenta) return;
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      if (!token) { toast.error("No estás autorizado"); return; }

      const response = await fetch(`${API}/ventas/${deletingVenta.id_venta}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Error al eliminar venta");
      }

      toast.success("Venta eliminada correctamente");
      setDeleteOpen(false);
      setDeletingVenta(null);
      cargarVentas();
    } catch (err) {
      toast.error(err.message || "Error al eliminar venta");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 md:p-6 font-['Inter','system-ui',sans-serif]">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 truncate">Gestión de Ventas</h1>
            <p className="text-sm md:text-lg text-gray-600">Registro completo de ventas realizadas con detalles de productos y métodos de pago.</p>
          </div>
          <div className="w-full md:w-auto flex gap-3">
            <button onClick={cargarVentas} className="w-full md:w-auto px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl shadow hover:shadow-lg">
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por ID venta, pedido, total o método..."
              className="w-full md:flex-1 border-2 border-gray-200 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm md:text-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
            <select value={metodoFilter} onChange={(e) => setMetodoFilter(e.target.value)}
              className="w-full md:w-64 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm md:text-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Todos los métodos</option>
              {metodos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="mb-6 p-3 text-sm md:text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl">{error}</div>}

        {/* MOBILE: cards */}
        <div className="space-y-3 md:hidden">
          {loading && <div className="text-center py-6 text-gray-500">Cargando ventas...</div>}
          {!loading && currentItems.length === 0 && <div className="text-center py-6 text-gray-500">No se encontraron ventas</div>}
          {!loading && currentItems.map(v => (
            <div key={v.id_venta} className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-gray-900">#{v.id_venta}</div>
                    <div className="text-xs text-gray-500">{formatDate(v.fecha_venta)}</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-gray-700">Pedido: <span className="font-semibold text-blue-600">#{v.id_pedido ?? "-"}</span></div>
                    <div className="text-sm text-green-700 font-bold mt-1">{formatMoney(v.total)}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    v.metodo_pago === "efectivo" ? "bg-green-100 text-green-800" :
                    v.metodo_pago === "tarjeta" ? "bg-blue-100 text-blue-800" :
                    v.metodo_pago === "transferencia" ? "bg-purple-100 text-purple-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>{v.metodo_pago ?? "efectivo"}</span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={() => openDetail(v)} className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                  <FiEye /> Ver
                </button>
                <button onClick={() => openEditModal(v)} className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                  <FiEdit /> Editar
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
                  <tr><td colSpan="6" className="text-center py-12 text-gray-500">{loading ? "⏳ Cargando ventas..." : "📭 No se encontraron ventas"}</td></tr>
                )}
                {currentItems.map((v, idx) => (
                  <tr key={v.id_venta} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-5 text-lg font-bold text-gray-900">#{v.id_venta}</td>
                    <td className="px-6 py-5 text-lg font-semibold text-blue-600">#{v.id_pedido ?? "-"}</td>
                    <td className="px-6 py-5 text-base text-gray-700">{formatDate(v.fecha_venta)}</td>
                    <td className="px-6 py-5 text-lg font-bold text-right text-green-600">{formatMoney(v.total)}</td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                        v.metodo_pago === "efectivo" ? "bg-green-100 text-green-800" :
                        v.metodo_pago === "tarjeta" ? "bg-blue-100 text-blue-800" :
                        v.metodo_pago === "transferencia" ? "bg-purple-100 text-purple-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>{v.metodo_pago ?? "efectivo"}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openDetail(v)} className="p-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md"><FiEye /></button>
                        <button onClick={() => openEditModal(v)} className="p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md"><FiEdit /></button>
                        <button onClick={() => openDeleteModal(v)} className="p-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"><FiTrash /></button>
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
                <div className="text-lg text-gray-600">Mostrando <span className="font-bold text-green-600">{startIndex + 1}</span> a <span className="font-bold text-green-600">{Math.min(endIndex, filtered.length)}</span> de <span className="font-bold text-green-600">{filtered.length}</span> ventas</div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedVenta(null); setVentaPedidoItems([]); }} title={`Detalle de Venta #${selectedVenta?.id_venta ?? ""}`} maxW="max-w-lg"
        footer={<button onClick={() => { setDetailOpen(false); setSelectedVenta(null); setVentaPedidoItems([]); }} className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg">Cerrar</button>}>
        {selectedVenta ? (
          <div className="space-y-4">
            <div className="text-base text-gray-700 bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><strong className="text-green-600">Venta:</strong> #{selectedVenta.id_venta}</div>
                <div><strong className="text-green-600">Pedido:</strong> #{selectedVenta.id_pedido ?? "-"}</div>
                <div><strong className="text-green-600">Fecha:</strong> {formatDate(selectedVenta.fecha_venta)}</div>
                <div><strong className="text-green-600">Método:</strong> <span className="font-bold">{selectedVenta.metodo_pago ?? "efectivo"}</span></div>
                <div className="col-span-2"><strong className="text-green-600">Total:</strong> <span className="font-bold text-green-700">{formatMoney(selectedVenta.total)}</span></div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-3 text-gray-800">Detalles del Pedido</h4>
              {ventaPedidoItems.length === 0 ? (
                <div className="text-base text-gray-500 text-center py-4">No hay items vinculados o no se encontraron.</div>
              ) : (
                <div className="space-y-3">
                  {ventaPedidoItems.map(it => (
                    <div key={it.id_detalle_pedido ?? `${it.id_producto}-${it.cantidad}`} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                      <div>
                        <div className="font-semibold text-base text-gray-900">{it.nombre_producto ?? `Producto #${it.id_producto}`}</div>
                        <div className="text-sm text-green-600">Cantidad: {it.cantidad}</div>
                      </div>
                      <div className="text-base font-bold text-green-600">{formatMoney(it.subtotal ?? (it.cantidad * (it.precio_unitario ?? 0)))}</div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-3 border-t">
                    <div className="text-lg font-bold text-gray-900">Subtotal: <span className="text-green-600">{formatMoney(ventaPedidoItems.reduce((s, it) => s + (Number(it.subtotal || (it.cantidad * (it.precio_unitario ?? 0))) || 0), 0))}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : <div className="text-base text-gray-500 text-center py-6">Cargando...</div>}
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditingVenta(null); }} title={`Editar Método - Venta #${editingVenta?.id_venta ?? ""}`} maxW="max-w-lg"
        footer={
          <>
            <button onClick={() => { setEditOpen(false); setEditingVenta(null); }} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
            <button onClick={submitEditMetodo} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg">Guardar</button>
          </>
        }>
        <div className="space-y-3">
          <div className="text-base text-gray-700">Selecciona el método de pago:</div>
          <select value={editMetodoValue} onChange={(e) => setEditMetodoValue(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="otro">Otro</option>
          </select>
          <div className="text-sm text-indigo-600 bg-indigo-50 p-3 rounded-lg">💡 Cambiar el método no modifica montos.</div>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={`Eliminar Venta #${deletingVenta?.id_venta}`} maxW="max-w-sm"
        footer={
          <>
            <button onClick={() => setDeleteOpen(false)} className="w-full px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
            <button onClick={submitDelete} className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg">Eliminar</button>
          </>
        }>
        <div className="text-base text-gray-700">
          ¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer.
        </div>
      </Modal>
    </div>
  );
}