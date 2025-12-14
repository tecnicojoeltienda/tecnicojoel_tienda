import React, { useEffect, useState } from "react";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import api from "../../service/api";
import { useNavigate } from "react-router-dom";
import { FiPackage, FiClock, FiEye, FiShoppingCart, FiX, FiCalendar, FiCreditCard } from "react-icons/fi";

export default function HistorialPedidoPage() {
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // modal / detalles de pedido
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [detalleItems, setDetalleItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);

  // leer usuario una vez (evita crear objeto nuevo cada render)
  useEffect(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) { setUser(null); return; }
    try { setUser(JSON.parse(raw)); } catch { setUser(null); }
  }, []);

  async function openDetalles(id, pedidoData) {
    setSelectedId(id);
    setSelectedPedido(pedidoData);
    setModalOpen(true);
    setModalLoading(true);
    setDetalleItems([]);
    setError("");
    try {
      // obtener detalles con información del producto
      const res = await api.get(`/apij/detalle_pedidos/pedido/${id}`);
      const detalles = res?.data ?? [];
      
      // enriquecer cada detalle con información del producto
      const detallesConProducto = await Promise.all(
        detalles.map(async (detalle) => {
          try {
            const prodRes = await api.get(`/apij/productos/${detalle.id_producto}`);
            const producto = prodRes?.data ?? {};
            return {
              ...detalle,
              nombre_producto: producto.nombre_producto ?? producto.nombre ?? producto.title ?? `Producto #${detalle.id_producto}`,
              descripcion_producto: producto.descripcion ?? producto.description ?? "",
              imagen_url: producto.imagen_url ?? producto.imagen ?? null
            };
          } catch (err) {
            // si no se puede obtener info del producto, usar datos básicos
            console.warn(`No se pudo obtener info del producto ${detalle.id_producto}:`, err);
            return {
              ...detalle,
              nombre_producto: `Producto #${detalle.id_producto}`,
              descripcion_producto: "",
              imagen_url: null
            };
          }
        })
      );
      
      setDetalleItems(detallesConProducto);
    } catch (err) {
      console.error("Error cargar detalle de pedido (modal):", err);
      setError("No se pudo cargar los detalles del pedido.");
      setDetalleItems([]);
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setDetalleItems([]);
    setSelectedId(null);
    setSelectedPedido(null);
    setModalLoading(false);
  }

  useEffect(() => {
    if (!user || !user.id && !user.id_cliente && !user.idCliente) return;

    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/apij/pedidos");
        if (!mounted) return;
        const all = res?.data ?? [];
        const mine = all.filter((p) => {
          const idCliente = p.id_cliente ?? p.idCliente ?? p.cliente_id ?? p.cliente ?? null;
          return Number(idCliente) === Number(user.id || user.id_cliente || user.idCliente);
        });

        // adjuntar items guardados en localStorage si existen
        const withItems = mine.map((p) => {
          const id = p.id_pedido ?? p.id ?? null;
          if (!id) return p;
          try {
            const raw = localStorage.getItem(`pedido_items_${id}`);
            if (raw) return { ...p, items: JSON.parse(raw) };
          } catch {}
          return p;
        });

        withItems.sort((a, b) => {
          const ta = new Date(a.fecha_pedido || a.created_at || a.fecha || 0).getTime();
          const tb = new Date(b.fecha_pedido || b.created_at || b.fecha || 0).getTime();
          return tb - ta;
        });

        setPedidos(withItems);
      } catch (err) {
        console.error("Error cargar pedidos:", err);
        setError(err?.response?.data?.message || "Error al obtener pedidos");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [user?.id, user?.id_cliente, user?.idCliente]); // depender solo de ids evita reruns constantes

  const formatCurrency = (v) =>
    v == null || v === "" ? "S/. 0.00" : `S/. ${Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getEstadoBadge = (estado) => {
    const styles = {
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      procesando: "bg-blue-100 text-blue-800 border-blue-200",
      completado: "bg-green-100 text-green-800 border-green-200",
      cancelado: "bg-red-100 text-red-800 border-red-200"
    };
    return styles[estado] || styles.pendiente;
  };

  // función para generar iniciales
  const getInitials = (name) => {
    if (!name || name.startsWith('Producto #')) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  useEffect(() => {
    // Evita que la apertura del modal haga desaparecer la scrollbar y mueva el layout
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <HeaderTienda />
        <main className="w-full max-w-4xl mx-auto px-6 py-24">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiPackage className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Necesitas una cuenta para ver tus pedidos</h1>
            <p className="text-gray-600 text-lg mb-8 max-w-lg mx-auto">
              Crea una cuenta o inicia sesión para ver el historial completo de pedidos que generas desde el carrito.
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <HeaderTienda />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mis pedidos</h1>
          <p className="text-gray-600 text-lg">Revisa todos tus pedidos realizados</p>
        </div>

        <div className="space-y-6">
          {loading && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <div className="animate-pulse flex justify-center items-center">
                <FiClock className="w-6 h-6 text-gray-400 mr-2" />
                <span className="text-gray-600">Cargando pedidos...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-100 text-red-700 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-red-600 text-sm">⚠</span>
                </div>
                {error}
              </div>
            </div>
          )}

          {!loading && pedidos.length === 0 && !error && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiPackage className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-800 mb-2">Aún no tienes pedidos</p>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Genera un pedido desde el carrito y aquí aparecerá tu historial completo con todos los detalles.
              </p>
              <button 
                onClick={() => navigate("/carrito")} 
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg inline-flex items-center"
              >
                <FiShoppingCart className="w-5 h-5 mr-2" />
                Ir al carrito
              </button>
            </div>
          )}

          {pedidos.map((p) => {
            const fecha = p.fecha_pedido ?? p.created_at ?? p.fecha ?? null;
            const estado = p.estado ?? p.status ?? "pendiente";
            const total = p.total ?? p.monto ?? 0;
            const id = p.id_pedido ?? p.id;
            
            return (
              <article key={id ?? Math.random()} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FiPackage className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Pedido #{id}</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getEstadoBadge(estado)}`}>
                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                      </span>
                      {fecha && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          {new Date(fecha).toLocaleDateString('es-PE', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>

                    {p.items && Array.isArray(p.items) && p.items.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Productos en este pedido:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {p.items.slice(0, 4).map((it, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {it.nombre_producto ?? it.nombre ?? it.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Cantidad: {it.cantidad ?? it.qty ?? it.quantity ?? 1}
                                </div>
                              </div>
                            </div>
                          ))}
                          {p.items.length > 4 && (
                            <div className="flex items-center justify-center text-sm text-gray-500 bg-gray-100 rounded-lg p-3">
                              +{p.items.length - 4} productos más
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <button
                      onClick={() => openDetalles(id, p)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center"
                    >
                      <FiEye className="w-4 h-4 mr-2" />
                      Ver detalles
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Modal mejorado */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiPackage className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Detalle del pedido #{selectedId}</h3>
                  {selectedPedido && (
                    <p className="text-sm text-gray-600">
                      Total: {formatCurrency(selectedPedido.total)} • Estado: {selectedPedido.estado}
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
              {modalLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse flex items-center">
                    <FiClock className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Cargando detalles...</span>
                  </div>
                </div>
              )}
              
              {!modalLoading && detalleItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiPackage className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No hay items registrados para este pedido.</p>
                </div>
              )}
              
              {!modalLoading && detalleItems.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Productos ordenados:</h4>
                  {detalleItems.map((d) => (
                    <div key={d.id_detalle_pedido ?? d.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          {d.imagen_url ? (
                            <img 
                              src={d.imagen_url} 
                              alt={d.nombre_producto}
                              className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-100 rounded-lg border-2 border-gray-200 flex items-center justify-center ${d.imagen_url ? 'hidden' : 'flex'}`}>
                            <span className="text-sm font-bold text-blue-700">
                              {getInitials(d.nombre_producto)}
                            </span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 text-lg">
                              {d.nombre_producto}
                            </h5>
                            {d.descripcion_producto && (
                              <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                {d.descripcion_producto}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center">
                                <FiCreditCard className="w-4 h-4 mr-1" />
                                Precio: S/. {Number(d.precio_unitario ?? d.precio ?? 0).toFixed(2)}
                              </span>
                              <span>Cantidad: {d.cantidad ?? d.qty ?? 1}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            S/. {(Number(d.precio_unitario ?? d.precio ?? 0) * Number(d.cantidad ?? 1)).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">Subtotal</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total del pedido */}
                  {selectedPedido && (
                    <div className="border-t pt-4 mt-6">
                      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl">
                        <span className="text-lg font-semibold text-gray-900">Total del pedido:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(selectedPedido.total)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <FooterTienda />
    </div>
  );
}
