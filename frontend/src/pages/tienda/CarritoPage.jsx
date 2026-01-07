import React, { useMemo, useState, useEffect } from "react";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import { useCart } from "../../context/CartContext";
import { resolveImageUrl } from "../../service/api";
import api from "../../service/api";
import { FiTrash2, FiPlus, FiMinus, FiShoppingCart, FiTag, FiPercent, FiCheck, FiX, FiAlertTriangle } from "react-icons/fi";
import { toast } from "react-hot-toast";

const STORE_URL = "https://tiendatecnicojoel.vercel.app/";
const DEFAULT_WHATSAPP_PHONE = "51984122549";

function shareStoreWhatsapp(customText, phone = DEFAULT_WHATSAPP_PHONE) {
  const baseText = (customText || `Visita la tienda TécnicoJoel: ${STORE_URL}`).trim();
  const fullText = `${baseText}\n\n${STORE_URL}`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(fullText)}`;
  window.open(url, "_blank");
}

export default function CarritoPage() {
  const cart = useCart();

  const [items, setItems] = useState(() => {
    try {
      return cart.items ?? (typeof cart.getItems === "function" ? cart.getItems() : JSON.parse(localStorage.getItem("cart") || "[]"));
    } catch {
      return [];
    }
  });

  const APPLIED_KEY = "applied_discount_tecnicojoel";

  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [discount, setDiscount] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(APPLIED_KEY) || "null"); } catch { return null; }
  });
  
  const [codeError, setCodeError] = useState("");
  const [codeSuccess, setCodeSuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastPedidoId, setLastPedidoId] = useState(null);

  
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);

  const appliedPercent = discount?.percent || 0;

  
  const hasPromoItems = useMemo(() => {
    return items.some(it => {
      const enPromo = it.en_promocion || it.en_oferta || it.promocion || it.oferta;
      return enPromo === 'si' || enPromo === true || enPromo === 1 || enPromo === '1';
    });
  }, [items]);

  async function applyDiscountCode() {
    setCodeError("");
    setCodeSuccess("");
    const code = (discountCodeInput || "").trim().toUpperCase();
    
    if (!code) { 
      setCodeError("Ingresa un código de descuento."); 
      return; 
    }
    
    if (discount) { 
      setCodeError("Ya tienes un descuento aplicado."); 
      return; 
    }

    if (hasPromoItems) {
      setCodeError("Códigos no válidos para productos en oferta.");
      return;
    }
    
    try {
      const res = await api.get(`/apij/codigos-descuento/validar/${code}`);
      const data = res?.data;
      
      if (!data.valid) {
        setCodeError(data.message || "Código inválido");
        return;
      }

      const newDiscount = { 
        code: data.codigo, 
        percent: Number(data.porcentaje) / 100, 
        label: `${data.porcentaje}%`, 
        appliedAt: Date.now() 
      };
      
      sessionStorage.setItem(APPLIED_KEY, JSON.stringify(newDiscount));
      setDiscount(newDiscount);
      setDiscountCodeInput("");
      setCodeSuccess(`¡Descuento del ${data.porcentaje}% aplicado! (${data.usos_disponibles} usos restantes)`);
      
      setTimeout(() => setCodeSuccess(""), 4000);
    } catch (err) {
      console.error("Error validando código:", err);
      const msg = err?.response?.data?.message || "Error al validar código";
      setCodeError(msg);
    }
  }

  function removeDiscount() {
    if (!discount) return;
    const code = discount.code;
    sessionStorage.removeItem(APPLIED_KEY);
    setDiscount(null);
    setCodeSuccess("");
    setCodeError("");
  }

  function refreshItems() {
    try {
      if (cart.items) {
        setItems(Array.isArray(cart.items) ? cart.items.slice() : []);
        return;
      }
      if (typeof cart.getItems === "function") {
        const got = cart.getItems();
        setItems(Array.isArray(got) ? got.slice() : []);
        return;
      }
      const ls = JSON.parse(localStorage.getItem("cart") || "[]");
      setItems(Array.isArray(ls) ? ls.slice() : []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    refreshItems();

    const onStorage = (e) => {
      if (e.key === "cart") {
        try { setItems(JSON.parse(e.newValue || "[]")); } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const getQty = (it) => it.quantity ?? it.cantidad ?? it.qty ?? 1;

  const total = useMemo(() => {
    return items.reduce((s, it) => {
      const precio = Number(it.precio_venta ?? it.price ?? it.precio ?? 0) || 0;
      return s + precio * getQty(it);
    }, 0);
  }, [items]);

  const discountedTotal = useMemo(() => {
    return Number((total * (1 - appliedPercent)).toFixed(2));
  }, [total, appliedPercent]);

  function persistLocal(updatedItems) {
    try {
      localStorage.setItem("cart", JSON.stringify(updatedItems));
    } catch (e) {
      console.error("Error guardando carrito en localStorage:", e);
    }
  }

  const increase = async (it) => {
    try {
      const id = it.id_producto || it.id;
      const stockDisponible = it.stock || 0;
      const currentQty = getQty(it);
      const newQty = currentQty + 1;

      // Validar contra el stock disponible
      if (newQty > stockDisponible) {
        toast.warning('⚠️ Stock insuficiente', {
          description: `Solo hay ${stockDisponible} unidades disponibles.`,
          duration: 4000,
        });
        return;
      }

      // Actualizar items
      const updated = items.map(x =>
        (x.id_producto || x.id) === id
          ? { ...x, quantity: newQty, cantidad: newQty }
          : x
      );
      setItems(updated);
      persistLocal(updated);

      // Sincronizar con el contexto si existe
      if (cart?.addToCart) {
        await cart.addToCart(it, 1);
      }
    } catch (error) {
      console.error('Error al incrementar:', error);
      toast.error('Error al actualizar cantidad', {
        description: 'Por favor intenta nuevamente.',
        duration: 3000,
      });
    }
  };

  const decrease = async (it) => {
    const id = it.id_producto ?? it.id ?? it._id;
    const currentQ = getQty(it);

    setItems((prev) => {
      let next;
      if (currentQ <= 1) {
        next = prev.filter((x) => (x.id_producto ?? x.id ?? x._id) !== id);
      } else {
        next = prev.map((x) => {
          const xId = x.id_producto ?? x.id ?? x._id;
          if (xId === id) {
            const q = Math.max(1, getQty(x) - 1);
            return { ...x, quantity: q, cantidad: q, qty: q };
          }
          return x;
        });
      }
      persistLocal(next);
      return next;
    });

    try {
      if (typeof cart.removeOne === "function") {
        await cart.removeOne(id);
      } else if (typeof cart.updateQuantity === "function") {
        const newQ = Math.max(1, currentQ - 1);
        await cart.updateQuantity(id, newQ);
      } else if (typeof cart.removeFromCart === "function" && currentQ <= 1) {
        await cart.removeFromCart(id);
      }
    } catch (e) {
      console.warn("decrease action failed:", e);
    } finally {
      setTimeout(refreshItems, 50);
    }
  };

  const removeItem = async (it) => {
    const id = it.id_producto ?? it.id ?? it._id;

    setItems((prev) => {
      const next = prev.filter((x) => (x.id_producto ?? x.id ?? x._id) !== id);
      persistLocal(next);
      return next;
    });

    try {
      if (typeof cart.removeFromCart === "function") {
        await cart.removeFromCart(id);
      } else {
        const curr = JSON.parse(localStorage.getItem("cart") || "[]").filter((x) => (x.id_producto ?? x.id ?? x._id) !== id);
        persistLocal(curr);
      }
    } catch (e) {
      console.warn("removeItem failed:", e);
    } finally {
      setTimeout(refreshItems, 50);
    }
  };

  const clearAll = async () => {
    setItems([]);
    persistLocal([]);
    try {
      if (typeof cart.clearCart === "function") {
        await cart.clearCart();
      } else if (typeof cart.setItems === "function") {
        await cart.setItems([]);
      } else {
        localStorage.removeItem("cart");
      }
    } catch (e) {
      console.warn("clearAll failed:", e);
    } finally {
      setTimeout(refreshItems, 50);
    }
  };


  function getUser() {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  const generarPedidoWhatsapp = async () => {
    if (!items || items.length === 0) return;

    const user = getUser();
    if (!user) {
      
      setShowLoginRequiredModal(true);
      return;
    }

    const clienteId = user.id ?? user.id_cliente ?? user.idCliente ?? null;
    if (!clienteId) {
      alert("No se pudo determinar tu identificador de usuario. Por favor inicia sesión nuevamente.");
      return;
    }

    const header = " *Nuevo Pedido - Tienda TécnicoJoel*\n\n";
    const lines = items.map((it, idx) => {
      const qty = it.quantity ?? it.cantidad ?? it.qty ?? 1;
      const precio = Number(it.precio_venta ?? it.price ?? it.precio ?? 0) || 0;
      const lineTotal = (precio * qty).toFixed(2);
      return `${idx + 1}. *${it.nombre_producto ?? it.nombre ?? it.title ?? "Producto"}*\n   Cantidad: ${qty} | Precio: S/. ${precio.toFixed(2)} | Subtotal: S/. ${lineTotal}`;
    });

    const summary = [
      header,
      ...lines,
      "",
      ` *Subtotal: S/. ${total.toFixed(2)}*`,
    ];

    if (discount) {
      summary.push(` Código: ${discount.code} |  Descuento: ${Math.round(discount.percent * 100)}%`);
      summary.push(` *Total con descuento: S/. ${discountedTotal.toFixed(2)}*`);
    } else {
      summary.push(` *Total: S/. ${total.toFixed(2)}*`);
    }

    summary.push("");
    summary.push(" *Envío:* Por coordinar");
    summary.push("");
    summary.push(" *Datos para coordinar:*");
    summary.push(" Nombre:");
    summary.push(" Dirección:");
    summary.push(" Teléfono:");

    const body = summary.join("\n");

    let codigoConsumido = false;
    if (discount && discount.code) {
      try {
        const resConsumo = await api.post("/apij/codigos-descuento/consumir", {
          codigo: discount.code
        });
        
        if (!resConsumo?.data?.success) {
          throw new Error(resConsumo?.data?.message || "No se pudo aplicar el código");
        }
        
        codigoConsumido = true;
      } catch (errCodigo) {
        console.error("Error consumiendo código:", errCodigo);
        const msg = errCodigo?.response?.data?.message || errCodigo.message || "El código de descuento ya no está disponible";
        alert(`❌ ${msg}\n\nSe creará el pedido sin descuento.`);
        
        // Limpiar descuento aplicado
        sessionStorage.removeItem(APPLIED_KEY);
        setDiscount(null);
      }
    }

  
    try {
      const payload = {
        id_cliente: clienteId,
        total: Number(codigoConsumido && discount ? discountedTotal : total) || 0,
        estado: "pendiente",
        codigo_descuento: codigoConsumido && discount ? discount.code : null,
        porcentaje_descuento: codigoConsumido && discount ? (discount.percent * 100) : null
      };

      const res = await api.post("/apij/pedidos", payload);
      const created = res?.data ?? {};
      const nuevoId = created.id_pedido ?? created.id ?? created.insertId ?? created.insert_id ?? null;

    
      if (nuevoId) {
        const detallePromises = items.map((it) => {
          const id_producto = it.id_producto ?? it.id ?? null;
          const cantidad = it.quantity ?? it.cantidad ?? it.qty ?? 1;
          const precio_unitario = Number(it.precio_venta ?? it.price ?? it.precio ?? 0) || 0;
          return api.post("/apij/detalle_pedidos", {
            id_pedido: nuevoId,
            id_producto,
            cantidad,
            precio_unitario,
          }).catch((e) => {
            console.warn("detalle_pedido create failed for product", id_producto, e?.response?.data || e.message || e);
            return null;
          });
        });
        await Promise.all(detallePromises);
      }

      
      const storeId = nuevoId ?? `local_${Date.now()}`;
      try { localStorage.setItem(`pedido_items_${storeId}`, JSON.stringify(items)); } catch (e) { /* ignore */ }

    
      setLastPedidoId(nuevoId);
      setShowSuccessModal(true);

    
      await clearAll();
      if (discount) {
        sessionStorage.removeItem(APPLIED_KEY);
        setDiscount(null);
      }

      setTimeout(() => {
        const telefono = "51984122549";
        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(body)}`;
        window.open(url, "_blank");
      }, 2000);

    } catch (err) {
      console.error("Error crear pedido:", err);
      const openAnyway = confirm("❌ No fue posible registrar el pedido en el servidor. ¿Deseas abrir WhatsApp para coordinar igualmente?");
      if (openAnyway) {
        const telefono = "51984122549";
        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(body)}`;
        window.open(url, "_blank");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <HeaderTienda />

      <main className="w-full mx-0 px-6 sm:px-8 lg:px-12 py-12">
        <div className="max-w-screen-2xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <FiShoppingCart className="w-10 h-10 text-blue-600" />
              Tu carrito de compras
            </h1>
            <p className="text-gray-600 text-lg">
              {items.length === 0 ? "Tu carrito está vacío" : `${items.length} ${items.length === 1 ? 'producto' : 'productos'} en tu carrito`}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
         
            <section className="flex-1 order-2 lg:order-1">
              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FiShoppingCart className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Tu carrito está vacío</h3>
                    <p className="text-gray-600 mb-6">Explora nuestros productos y agrega algunos a tu carrito.</p>
                    <button 
                      onClick={() => window.history.back()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Continuar comprando
                    </button>
                  </div>
                ) : (
                  items.map((it) => {
                    const precio = Number(it.precio_venta ?? it.price ?? it.precio ?? 0) || 0;
                    const qty = getQty(it);
                    const subtotal = precio * qty;
                    const enPromo = it.en_promocion === 'si' || it.en_promocion === true || it.en_promocion === 1;
                    
                    return (
                      <div
                        key={it.id_producto ?? it.id ?? it._id}
                        className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                          <div className="w-full sm:w-32 h-40 sm:h-32 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                            {enPromo && (
                              <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                                OFERTA
                              </div>
                            )}
                            {it.imagen_url ? (
                              <img
                                src={resolveImageUrl(it.imagen_url)}
                                alt={it.nombre_producto}
                                className="max-h-full max-w-full object-contain p-2"
                              />
                            ) : (
                              <div className="text-center">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                                <div className="text-xs text-gray-400">Sin imagen</div>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                                  {it.nombre_producto ?? it.nombre ?? it.title}
                                </h3>
                                {(it.descripcion || it.resumen) && (
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {it.descripcion || it.resumen}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => removeItem(it)}
                                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Eliminar producto"
                                aria-label="Eliminar producto"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => decrease(it)}
                                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                  aria-label="Disminuir cantidad"
                                >
                                  <FiMinus className="w-4 h-4" />
                                </button>

                                <div className="w-12 h-9 flex items-center justify-center bg-gray-50 rounded-lg font-semibold text-gray-900">
                                  {qty}
                                </div>

                                <button
                                  onClick={() => increase(it)}
                                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                  aria-label="Aumentar cantidad"
                                >
                                  <FiPlus className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="text-right">
                                <div className="text-sm text-gray-500 mb-1">S/. {precio.toFixed(2)} c/u</div>
                                <div className="text-lg sm:text-xl font-bold text-gray-900">S/. {subtotal.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            
            <aside className="order-2 lg:order-2 w-full lg:w-96 self-start">
              <div className="lg:sticky lg:top-6">
                <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FiTag className="w-5 h-5 text-blue-600" />
                    Resumen del pedido
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-gray-700">
                      <span>Subtotal ({items.length} {items.length === 1 ? 'producto' : 'productos'})</span>
                      <span className="font-semibold">S/. {total.toFixed(2)}</span>
                    </div>

                    {discount && (
                      <div className="flex items-center justify-between text-green-700 bg-green-50 p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                          <FiPercent className="w-4 h-4" />
                          <span>Descuento ({discount.code})</span>
                        </div>
                        <span className="font-semibold">- S/. {(total - discountedTotal).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                      <span>Envío</span>
                      <span>Por coordinar</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-3xl font-bold text-gray-900">
                        S/. {discount ? discountedTotal.toFixed(2) : total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Código de descuento mejorado */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                      <FiTag className="w-4 h-4" />
                      Código de descuento
                    </label>
                    
                    {hasPromoItems && !discount && (
                      <div className="mb-3 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                        <span className="text-lg">⚠️</span>
                        <span>Códigos no válidos para productos en oferta</span>
                      </div>
                    )}

                    {!discount ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            value={discountCodeInput}
                            onChange={(e) => setDiscountCodeInput(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder=""
                            disabled={hasPromoItems}
                          />
                          <button 
                            onClick={applyDiscountCode}
                            disabled={hasPromoItems}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-100 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <FiCheck className="w-4 h-4" />
                          <span className="font-medium">{discount.code} aplicado ({discount.label})</span>
                        </div>
                        <button 
                          onClick={removeDiscount} 
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {codeError && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        {codeError}
                      </div>
                    )}
                    
                    {codeSuccess && (
                      <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
                        {codeSuccess}
                      </div>
                    )}

                    
                  </div>

                  {items.length > 0 && (
                    <button
                      onClick={generarPedidoWhatsapp}
                      className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-xl transition-all text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                       Generar pedido
                    </button>
                  )}

                  {items.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="w-full mt-3 py-3 bg-transparent text-gray-600 hover:text-red-600 rounded-xl transition-colors font-medium"
                    >
                       Vaciar carrito
                    </button>
                  )}
                </div>

                <div className="mt-6 text-sm text-gray-500 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
                    <div>
                      <strong className="text-blue-800">Información importante:</strong>
                      <p className="mt-1">Todos los precios son referenciales. Al generar el pedido se abrirá WhatsApp con el resumen para coordinar datos de envío.</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <FooterTienda />

      
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
          
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full animate-slideUp">
            <div className="relative p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <FiCheck className="w-14 h-14 text-white" />
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                ¡Pedido Generado!
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Tu pedido <span className="font-bold text-blue-600">#{lastPedidoId}</span> se ha creado exitosamente
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Se abrirá WhatsApp para coordinar los detalles de envío
              </p>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Entendido
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="w-12 h-0.5 bg-gray-200 rounded"></div>
                <span>Gracias por tu compra</span>
                <div className="w-12 h-0.5 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {showLoginRequiredModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLoginRequiredModal(false)}></div>

          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full animate-slideUp">
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="w-12 h-12 text-yellow-800" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Necesitas iniciar sesión</h2>
              <p className="text-sm text-gray-600 mb-6">
                Para registrar un pedido debes tener una cuenta. ¿Deseas iniciar sesión o registrarte ahora?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLoginRequiredModal(false);
                    window.location.href = "/login";
                  }}
                  className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-xl transition-colors"
                >
                  Ir a login
                </button>

                <button
                  onClick={() => setShowLoginRequiredModal(false)}
                  className="flex-1 py-3 bg-transparent border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}