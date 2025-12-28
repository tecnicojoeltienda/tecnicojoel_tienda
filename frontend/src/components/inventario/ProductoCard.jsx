import React, { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { resolveImageUrl } from "../../service/api";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ProductoCard({ producto, onUpdated }) {
  const img = resolveImageUrl(producto?.imagen_url);

  const {
    id_producto,
    nombre_producto,
    descripcion,
    precio_venta,
    stock,
    en_promocion,
    estado,
  } = producto || {};

  const [form, setForm] = useState({
    nombre_producto: nombre_producto || "",
    precio_venta: precio_venta || 0,
    stock: stock || 0,
    en_promocion: en_promocion || "no",
    estado: estado || "disponible",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function eliminar() {
    if (!confirm(`¿Estás seguro de eliminar "${nombre_producto}"?`)) return;
    
    setDeleting(true);
    setMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/productos/${id_producto}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error al eliminar");
      }
      setMsg("Eliminado");
      if (onUpdated) onUpdated();
    } catch (err) {
      setMsg("Error al eliminar");
      console.error(err);
    } finally {
      setDeleting(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  const formatPrice = (p) => {
    if (p == null || p === "") return "-";
    const n = Number(p);
    if (Number.isNaN(n)) return "-";
    return n.toLocaleString("es-PE", { style: "currency", currency: "PEN" });
  };

  const estadoBadge = (st) => {
    const s = String(st || "").toLowerCase();
    if (s === "disponible") return "bg-green-50 text-green-700";
    if (s === "no disponible") return "bg-amber-50 text-amber-700";
    if (s === "agotado") return "bg-red-50 text-red-700";
    return "bg-gray-50 text-gray-700";
  };

  return (
    <article className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow relative">
      {/* Botón eliminar en la esquina superior derecha */}
      <button
        onClick={eliminar}
        disabled={deleting}
        className="absolute top-2 right-2 z-10 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        title="Eliminar producto"
      >
        <FiTrash2 className="w-4 h-4" />
      </button>

      <div className="w-full h-44 bg-gray-100 flex items-center justify-center p-3">
        {img ? (
          <img
            src={img}
            alt={producto?.nombre_producto || "producto"}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assets/placeholder.png"; }}
          />
        ) : (
          <div className="text-gray-400">Sin imagen</div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {producto?.nombre_producto}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-xl font-bold text-green-600">
            {formatPrice(precio_venta)}
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${estadoBadge(estado)}`}>
              {estado || "—"}
            </span>

            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${Number(stock) > 0 ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
              Stock: {typeof stock !== "undefined" && stock !== null ? stock : "0"}
            </span>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          {descripcion ? <span className="line-clamp-2">{descripcion}</span> : <span className="text-gray-400">Sin descripción</span>}
        </div>

        {msg && (
          <div className={`mt-2 text-xs font-semibold ${msg.includes("Error") ? "text-red-600" : "text-green-600"}`}>
            {msg}
          </div>
        )}
      </div>
    </article>
  );
}