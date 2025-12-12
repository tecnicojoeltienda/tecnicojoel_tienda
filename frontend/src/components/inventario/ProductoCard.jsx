import React, { useState } from "react";
import { resolveImageUrl } from "../../service/api"; // <-- usar la utilidad central

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    nombre_producto: nombre_producto || "",
    precio_venta: precio_venta || 0,
    stock: stock || 0,
    en_promocion: en_promocion || "no",
    estado: estado || "disponible",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function guardar() {
    setSaving(true);
    setMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/productos/${id_producto}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error al guardar");
      }
      setMsg("Guardado");
      setEditMode(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      setMsg("Error al guardar");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  return (
    <article className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
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
        <div className="mt-2 text-sm text-gray-600">
          {descripcion ? <span className="line-clamp-2">{descripcion}</span> : <span className="text-gray-400">Sin descripción</span>}
        </div>

        {!editMode ? (
          <>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-gray-500">Precio</div>
                <div className="text-2xl font-bold text-rose-600">S/. {Number(precio_venta ?? 0).toFixed(2)}</div>
              </div>

              <div className="text-xs text-right">
                <div className={`px-2 py-1 rounded text-xs font-medium ${stock > 0 ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"}`}>
                  {stock > 0 ? `${stock} en stock` : "Agotado"}
                </div>
                <div className="mt-1 text-xs text-gray-500">{estado}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setEditMode(true)} className="flex-1 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md shadow hover:from-blue-700 hover:to-blue-800 transition">
                Editar
              </button>
              <button onClick={() => navigator.clipboard?.writeText(String(id_producto || ""))} className="py-2 px-3 text-sm border rounded-md text-gray-700">
                Copiar ID
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              name="nombre_producto"
              value={form.nombre_producto}
              onChange={onChange}
              className="w-full border border-gray-200 px-2 py-2 rounded text-sm"
            />
            <div className="mt-2 flex gap-2">
              <input
                name="precio_venta"
                value={form.precio_venta}
                onChange={onChange}
                type="number"
                step="0.01"
                className="flex-1 border border-gray-200 px-2 py-2 rounded text-sm"
                placeholder="Precio"
              />
              <input
                name="stock"
                value={form.stock}
                onChange={onChange}
                type="number"
                className="w-24 border border-gray-200 px-2 py-2 rounded text-sm"
                placeholder="Stock"
              />
            </div>

            <div className="mt-2 flex gap-2 items-center">
              <select name="en_promocion" value={form.en_promocion} onChange={onChange} className="border border-gray-200 px-2 py-1 rounded text-sm">
                <option value="no">No promoción</option>
                <option value="si">En promoción</option>
              </select>
              <select name="estado" value={form.estado} onChange={onChange} className="border border-gray-200 px-2 py-1 rounded text-sm">
                <option value="disponible">Disponible</option>
                <option value="no disponible">No disponible</option>
                <option value="agotado">Agotado</option>
              </select>
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={guardar} disabled={saving} className="flex-1 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md shadow">
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => setEditMode(false)} className="py-2 px-3 text-sm border rounded text-blue-600">Cancelar</button>
            </div>

            {msg && <div className="mt-2 text-xs text-gray-600">{msg}</div>}
          </>
        )}
      </div>
    </article>
  );
}