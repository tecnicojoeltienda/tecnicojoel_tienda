import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSave, FiArrowLeft, FiEdit3, FiPackage, FiCamera } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL 
//|| "http://localhost:4000";

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [originalTypes, setOriginalTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/apij/productos/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("No se pudo cargar");
        const data = await res.json();
        const p = Array.isArray(data) ? data[0] : (data.rows ? data.rows[0] : data);

        const types = {};
        const formObj = {};
        Object.entries(p || {}).forEach(([k, v]) => {
          if (v === null || typeof v === "undefined") {
            types[k] = "null";
            formObj[k] = "";
          } else if (Array.isArray(v)) {
            types[k] = "array";
            formObj[k] = v.every(i => typeof i === "string" || typeof i === "number") ? v.join("\n") : JSON.stringify(v, null, 2);
          } else if (typeof v === "object") {
            types[k] = "object";
            formObj[k] = JSON.stringify(v, null, 2);
          } else {
            types[k] = typeof v;
            formObj[k] = String(v);
          }
        });

        if (mounted) {
          setOriginalTypes(types);
          setForm(formObj);
          setPreviewUrl(formObj.imagen_url || null);
        }
      } catch (err) {
        setError("No se pudo cargar el producto");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      // revoke previous blob if any
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(url);
      // keep imagen_url string intact in form (we won't send it if selectedFile exists)
    } else {
      setSelectedFile(null);
      setPreviewUrl(form?.imagen_url || null);
    }
  }

  function removeSelectedImage() {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(form?.imagen_url || null);
   
  }

  function buildPayload() {
    const payload = {};
    if (!form) return payload;
    for (const key of Object.keys(form || {})) {
      const valStr = form[key];
      const type = originalTypes[key] || "string";

      if (type === "number") {
        const n = Number(valStr);
        payload[key] = Number.isNaN(n) ? null : n;
      } else if (type === "boolean") {
        const v = String(valStr).toLowerCase();
        payload[key] = v === "true" || v === "1" || v === "si" || v === "sí";
      } else if (type === "array") {
        try {
          const parsed = JSON.parse(valStr);
          payload[key] = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          payload[key] = valStr.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        }
      } else if (type === "object") {
        try {
          payload[key] = JSON.parse(valStr);
        } catch {
          const obj = {};
          valStr.split(/\r?\n/).map(s => s.trim()).filter(Boolean).forEach(line => {
            const parts = line.split(/:\s*/);
            if (parts.length >= 2) obj[parts[0].trim()] = parts.slice(1).join(": ").trim();
            else obj[line] = line;
          });
          payload[key] = obj;
        }
      } else {
        payload[key] = valStr === "" ? null : valStr;
      }
    }
    return payload;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);

    try {
      const payload = buildPayload();

      // If a file is selected, send multipart/form-data with field name 'imagen'
      if (selectedFile) {
        const fd = new FormData();
        // Append all payload keys as strings (skip null/undefined)
        Object.entries(payload).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          // If it's an object or array, stringify
          if (typeof v === "object") fd.append(k, JSON.stringify(v));
          else fd.append(k, String(v));
        });
        fd.append("imagen", selectedFile);

        const res = await fetch(`${API}/apij/productos/${encodeURIComponent(id)}`, {
          method: "PUT",
          body: fd,
        });

        if (!res.ok) {
          const tryJson = await res.json().catch(() => null);
          throw new Error(tryJson?.error || tryJson?.message || (await res.text()));
        }
      } else {
        // No file: send JSON (keeps imagen_url as URL or null)
        const res = await fetch(`${API}/apij/productos/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Error guardando");
        }
      }

      navigate("/inventario/dashboard");
    } catch (err) {
      console.error("Error guardando producto:", err);
      setError("Error guardando producto: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPackage className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <p className="text-lg text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg">{error || "Producto no encontrado"}</div>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const excludeKeys = new Set(["id", "id_producto", "id_categoria"]);
  const labelFor = (k) => {
    const map = {
      nombre_producto: "Nombre del producto",
      descripcion: "Descripción",
      precio_venta: "Precio de venta (S/.)",
      imagen_url: "Imagen del producto",
      stock: "Stock disponible",
      stock_minimo: "Stock mínimo",
      en_promocion: "En promoción",
      estado: "Estado",
      caracteristicas: "Características",
      especificaciones: "Especificaciones técnicas"
    };
    return map[k] || k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };
  const keysToRender = Object.keys(form).sort().filter(k => !excludeKeys.has(k));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 font-['Inter','system-ui',sans-serif]">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <FiEdit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">Editar Producto</h1>
                  <p className="text-blue-100 text-lg">ID: {id} • Modifica los campos necesarios</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-all duration-300"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  Volver
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300 disabled:opacity-50"
                >
                  <FiSave className="w-5 h-5" />
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {keysToRender.map((key) => {
                  const rawValue = form[key] ?? "";
                  const type = originalTypes[key] || "string";
                  const isBig = type === "object" || type === "array" || key === "descripcion" || key === "caracteristicas" || key === "especificaciones";
                  const colSpanClass = isBig ? "lg:col-span-2" : "";

                  // Special handling for imagen_url -> file upload + preview
                  if (key === "imagen_url") {
                    const displayUrl = previewUrl || (rawValue && rawValue.startsWith('/') ? `${API}${rawValue}` : rawValue);
                    
                    return (
                      <div key={key} className="lg:col-span-2">
                        <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <FiCamera className="w-5 h-5 text-blue-600" />
                          {labelFor(key)}
                        </label>
                        
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200">
                          <div className="flex flex-col lg:flex-row items-start gap-6">
                            {/* Vista previa de la imagen */}
                            <div className="w-full lg:w-64 h-64 bg-white rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-300 shadow-lg">
                              {displayUrl ? (
                                <img
                                  src={displayUrl}
                                  alt="Preview"
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex-col items-center justify-center text-gray-400 ${displayUrl ? 'hidden' : 'flex'}`}>
                                <FiCamera className="w-12 h-12 mb-2" />
                                <div className="text-sm font-medium">Sin imagen</div>
                              </div>
                            </div>

                            {/* Controles */}
                            <div className="flex-1 space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Seleccionar archivo</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
                                />
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                                >
                                  Usar URL actual
                                </button>
                                <button
                                  type="button"
                                  onClick={removeSelectedImage}
                                  className="px-4 py-2 bg-red-50 rounded-lg text-red-600 border-2 border-red-200 hover:bg-red-100 transition-colors font-medium text-sm"
                                >
                                  Quitar selección
                                </button>
                              </div>

                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800 flex items-start gap-2">
                                  <span className="text-blue-600 font-bold">💡</span>
                                  <span>Puedes subir una nueva imagen para reemplazar la actual. El archivo se guardará con el nombre del producto.</span>
                                </p>
                              </div>

                              {/* Campo URL opcional */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">URL de imagen (opcional)</label>
                                <input
                                  name="imagen_url"
                                  value={rawValue}
                                  onChange={onChange}
                                  type="text"
                                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300"
                                  placeholder="https://... o /uploads/archivo.jpg"
                                />
                                <p className="mt-1 text-xs text-gray-500">Si no subes archivo, se usará esta URL</p>
                              </div>

                              {/* Mostrar URL actual */}
                              {rawValue && !previewUrl && (
                                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <strong>URL actual:</strong> {rawValue}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Special handling for en_promocion
                  if (key === "en_promocion") {
                    return (
                      <div key={key} className={colSpanClass}>
                        <label className="block text-lg font-bold text-gray-800 mb-2">
                          {labelFor(key)}
                        </label>
                        <select
                          name={key}
                          value={String(rawValue ?? "")}
                          onChange={onChange}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300"
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="no"> No</option>
                          <option value="si"> Sí</option>
                        </select>
                        <p className="mt-1 text-sm text-gray-600">
                          💡 Marque "Sí" si este producto está en promoción
                        </p>
                      </div>
                    );
                  }

                  // Special handling for estado
                  if (key === "estado") {
                    return (
                      <div key={key} className={colSpanClass}>
                        <label className="block text-lg font-bold text-gray-800 mb-2">
                          {labelFor(key)}
                        </label>
                        <select
                          name={key}
                          value={String(rawValue ?? "")}
                          onChange={onChange}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300"
                        >
                          <option value="disponible"> Disponible</option>
                          <option value="no disponible"> No disponible</option>
                          <option value="agotado"> Agotado</option>
                        </select>
                      </div>
                    );
                  }

                  // Special handling for especificaciones
                  if (key === "especificaciones") {
                    let specValue = rawValue;
                    try {
                      const parsed = typeof rawValue === "string" && rawValue.trim() ? JSON.parse(rawValue) : null;
                      if (parsed && typeof parsed === "object") specValue = JSON.stringify(parsed, null, 2);
                    } catch {
                      // keep original string if not JSON
                    }
                    return (
                      <div key={key} className={colSpanClass}>
                        <label className="block text-lg font-bold text-gray-800 mb-2">
                          {labelFor(key)}
                        </label>
                        <textarea
                          name={key}
                          value={specValue}
                          onChange={onChange}
                          rows={8}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300"
                        />
                        <p className="mt-2 text-sm text-gray-600">
                          💡 Puede ser JSON o líneas 'Clave: Valor'. Ej: <code className="bg-gray-100 px-2 py-1 rounded">Tamaño: 24 pulgadas</code>
                        </p>
                      </div>
                    );
                  }

                  if (isBig) {
                    return (
                      <div key={key} className={colSpanClass}>
                        <label className="block text-lg font-bold text-gray-800 mb-2">
                          {labelFor(key)}
                        </label>
                        <textarea
                          name={key}
                          value={rawValue}
                          onChange={onChange}
                          rows={key === "descripcion" ? 4 : 8}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300"
                        />
                        <p className="mt-2 text-sm text-gray-600">
                          {key === "caracteristicas" ? "💡 Una característica por línea" : "💡 Información detallada"}
                        </p>
                      </div>
                    );
                  }

                  if (type === "number") {
                    return (
                      <div key={key}>
                        <label className="block text-lg font-bold text-gray-800 mb-2">
                          {labelFor(key)}
                        </label>
                        <input
                          name={key}
                          value={rawValue}
                          onChange={onChange}
                          type="number"
                          step={key === "precio_venta" ? "0.01" : "1"}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300"
                        />
                      </div>
                    );
                  }

                  if (type === "boolean") {
                    return (
                      <div key={key}>
                        <label className="block text-lg font-bold text-gray-800 mb-2">
                          {labelFor(key)}
                        </label>
                        <select
                          name={key}
                          value={String(rawValue)}
                          onChange={onChange}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300"
                        >
                          <option value="true"> true</option>
                          <option value="false"> false</option>
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div key={key}>
                      <label className="block text-lg font-bold text-gray-800 mb-2">
                        {labelFor(key)}
                      </label>
                      <input
                        name={key}
                        value={rawValue}
                        onChange={onChange}
                        type="text"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 text-2xl">💡</div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-900 mb-2">Consejos para editar</h3>
                    <ul className="space-y-1 text-blue-800">
                      <li>• Revisa el nombre y precio antes de guardar</li>
                      <li>• Los campos grandes aceptan JSON o formato línea por línea</li>
                      <li>• Las características se separan automáticamente por líneas</li>
                      <li>• Las especificaciones pueden ser JSON estructurado</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-8 py-3 border-2 border-gray-300 rounded-xl text-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    "Guardando..."
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}