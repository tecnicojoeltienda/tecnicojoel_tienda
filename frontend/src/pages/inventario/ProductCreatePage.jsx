import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiUpload, FiX, FiImage, FiSave, FiArrowLeft, FiLink } from "react-icons/fi";
import ProductosRelacionados from "../../components/tienda/ProductosRelacionados";

const API = import.meta.env.VITE_API_BASE_URL 
//|| "http://localhost:4000";

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    nombre_producto: "",
    descripcion: "",
    id_categoria: "",
    precio_venta: "",
    imagen_url: "",
    stock: 0,
    stock_minimo: 0,
    en_promocion: "no",
    estado: "disponible",
    caracteristicas: "",
    especificaciones: ""
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [touched, setTouched] = useState({});
  const [productosRelacionados, setProductosRelacionados] = useState([]);

  useEffect(() => {
    async function cargarCategorias() {
      try {
        const res = await fetch(`${API}/apij/categorias`);
        if (!res.ok) return;
        const data = await res.json();
        setCategorias(data || []);
      } catch (err) {
        // ignore
      }
    }
    cargarCategorias();
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function onBlur(e) {
    setTouched(t => ({ ...t, [e.target.name]: true }));
  }

  function onFileChange(e) {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  }

  function handleFile(file) {
    setImagenFile(file);
    if (!file) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImagenFile(null);
    setPreview(null);
    setForm((s) => ({ ...s, imagen_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    const file = e.dataTransfer.files?.[0] || null;
    handleFile(file);
  }

  const validate = () => {
    const errors = {};
    if (!form.nombre_producto || form.nombre_producto.trim().length < 3) errors.nombre_producto = "Ingrese un nombre (mín. 3 caracteres).";
    if (!form.precio_venta || Number.isNaN(Number(form.precio_venta)) || Number(form.precio_venta) < 0) errors.precio_venta = "Precio inválido.";
    return errors;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const errors = validate();
    setTouched({
      nombre_producto: true,
      precio_venta: true,
      descripcion: true
    });
    if (Object.keys(errors).length > 0) {
      setError("Por favor corrija los campos en rojo.");
      return;
    }

    setLoading(true);

    try {
      const featuresList = (form.caracteristicas || "")
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);

      let specsObj = {};
      const rawSpecs = (form.especificaciones || "").trim();
      if (rawSpecs) {
        try {
          const parsed = JSON.parse(rawSpecs);
          if (typeof parsed === "object") specsObj = parsed;
        } catch {
          const obj = {};
          rawSpecs.split(/\r?\n/).map(s => s.trim()).filter(Boolean).forEach(line => {
            const parts = line.split(/:\s*/);
            if (parts.length >= 2) obj[parts[0].trim()] = parts.slice(1).join(": ").trim();
            else obj[line] = line;
          });
          specsObj = obj;
        }
      }

      // USAR FORMDATA PARA ENVIAR ARCHIVO
      const formData = new FormData();
      formData.append("nombre_producto", form.nombre_producto);
      formData.append("descripcion", form.descripcion);
      formData.append("id_categoria", form.id_categoria || "");
      formData.append("precio_venta", parseFloat(form.precio_venta) || 0);
      formData.append("stock", parseInt(form.stock, 10) || 0);
      formData.append("stock_minimo", parseInt(form.stock_minimo, 10) || 0);
      formData.append("en_promocion", form.en_promocion);
      formData.append("estado", form.estado);
      formData.append("caracteristicas", JSON.stringify(featuresList));
      formData.append("especificaciones", JSON.stringify(specsObj));

      // Añadir productos relacionados (IDs) para que el backend los guarde en BD
      const relacionadosToSend = Array.isArray(productosRelacionados)
        ? productosRelacionados.map(id => Number(id)).filter(Boolean)
        : [];
      formData.append("productos_relacionados", JSON.stringify(relacionadosToSend));

      // AGREGAR EL ARCHIVO DE IMAGEN
      if (imagenFile) {
        formData.append("imagen", imagenFile);
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/productos`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Error creando producto");

      alert("Producto creado correctamente");

      const nuevoProductoId = data?.id;

      navigate("/inventario/productos");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al crear producto");
    } finally {
      setLoading(false);
    }
  }

  const caracteristicasValue =
    Array.isArray(form.caracteristicas) ? form.caracteristicas.join("\n") :
    (typeof form.caracteristicas === "string" ? form.caracteristicas : JSON.stringify(form.caracteristicas || "", null, 2));

  const especificacionesValue =
    typeof form.especificaciones === "string" ? form.especificaciones :
    (form.especificaciones ? JSON.stringify(form.especificaciones, null, 2) : "");

  const especificacionesPlaceholder = `Ej (líneas):
Tamaño: 24 pulgadas
Peso: 3.5 kg

O JSON: {"Tamaño":"24 pulgadas","Peso":"3.5 kg"}`;

  const errors = validate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 font-['Inter','system-ui',sans-serif]">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Crear Nuevo Producto</h1>
                <p className="text-blue-100 text-lg">Completa la información básica del producto</p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-all duration-300"
              >
                <FiArrowLeft className="w-5 h-5" />
                Volver
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="p-4 text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre_producto" className="block text-lg font-bold text-gray-800 mb-2">
                  Nombre del producto <span className="text-red-600">*</span>
                </label>
                <input
                  id="nombre_producto"
                  name="nombre_producto"
                  value={form.nombre_producto}
                  onChange={onChange}
                  onBlur={onBlur}
                  className={`w-full rounded-xl px-4 py-4 text-lg border-2 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    touched.nombre_producto && errors.nombre_producto 
                      ? "border-red-300 focus:ring-red-200" 
                      : "border-gray-200 focus:ring-blue-200 focus:border-blue-300"
                  }`}
                  required
                  placeholder="Ej.: Laptop Lenovo Ideapad 15"
                />
                {touched.nombre_producto && errors.nombre_producto && (
                  <p className="mt-2 text-sm text-red-600">{errors.nombre_producto}</p>
                )}
              </div>

              <div>
                <label htmlFor="precio_venta" className="block text-lg font-bold text-gray-800 mb-2">
                  Precio de venta (S/.) <span className="text-red-600">*</span>
                </label>
                <input
                  id="precio_venta"
                  name="precio_venta"
                  value={form.precio_venta}
                  onChange={onChange}
                  onBlur={onBlur}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full rounded-xl px-4 py-4 text-lg border-2 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    touched.precio_venta && errors.precio_venta 
                      ? "border-red-300 focus:ring-red-200" 
                      : "border-gray-200 focus:ring-blue-200 focus:border-blue-300"
                  }`}
                />
                {touched.precio_venta && errors.precio_venta && (
                  <p className="mt-2 text-sm text-red-600">{errors.precio_venta}</p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label htmlFor="descripcion" className="block text-lg font-bold text-gray-800 mb-2">
                  Descripción del producto
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={onChange}
                  onBlur={onBlur}
                  rows={4}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all duration-300"
                  placeholder="Describe las características principales del producto..."
                />
                <p className="mt-2 text-sm text-gray-600">💡 Incluye detalles importantes como modelo, condición, y características clave.</p>
              </div>

              <div>
                <label htmlFor="id_categoria" className="block text-lg font-bold text-gray-800 mb-2">
                  Categoría
                </label>
                <select
                  id="id_categoria"
                  name="id_categoria"
                  value={form.id_categoria}
                  onChange={onChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria || c.id} value={c.id_categoria || c.id}>
                      {c.nombre_categoria || c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="estado" className="block text-lg font-bold text-gray-800 mb-2">
                  Estado del producto
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={form.estado}
                  onChange={onChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                >
                  <option value="disponible"> Disponible</option>
                  <option value="no disponible"> No disponible</option>
                  <option value="agotado"> Agotado</option>
                </select>
              </div>

              <div>
                <label htmlFor="stock" className="block text-lg font-bold text-gray-800 mb-2">
                  Cantidad en stock
                </label>
                <input
                  id="stock"
                  name="stock"
                  value={form.stock}
                  onChange={onChange}
                  type="number"
                  placeholder="0"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                />
              </div>

              <div>
                <label htmlFor="stock_minimo" className="block text-lg font-bold text-gray-800 mb-2">
                  Stock mínimo
                </label>
                <input
                  id="stock_minimo"
                  name="stock_minimo"
                  value={form.stock_minimo}
                  onChange={onChange}
                  type="number"
                  placeholder="0"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                />
              </div>

              <div>
                <label htmlFor="en_promocion" className="block text-lg font-bold text-gray-800 mb-2">
                  En promoción
                </label>
                <select
                  id="en_promocion"
                  name="en_promocion"
                  value={form.en_promocion}
                  onChange={onChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                >
                  <option value="no"> No</option>
                  <option value="si"> Sí</option>
                </select>
              </div>
            </div>

            {/* Imagen Section */}
            <div>
              <label className="block text-lg font-bold text-gray-800 mb-4">Imagen del producto</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="relative rounded-2xl border-3 border-dashed border-blue-200 bg-blue-25 p-8 flex flex-col items-center justify-center transition-all duration-300 hover:border-blue-300"
                style={{ minHeight: 280 }}
              >
                {!preview ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiImage className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-lg font-semibold text-gray-700 mb-3">Arrastra la imagen aquí</div>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <FiUpload className="w-5 h-5" />
                        Seleccionar imagen
                      </button>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">JPG, PNG, WEBP • Recomendado 800×800px • Máximo 5MB</p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300"
                    >
                      <FiX className="w-4 h-4" />
                      Eliminar
                    </button>

                    <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-inner">
                      <img src={preview} alt="Preview del producto" className="max-h-64 object-contain" />
                    </div>

                    <div className="absolute bottom-4 right-4 z-20 text-sm text-gray-600 bg-white px-3 py-1 rounded-lg shadow">
                      {imagenFile?.name}
                    </div>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="sr-only"
                />
              </div>
            </div>

            {/* Características y Especificaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div>
                <label htmlFor="especificaciones" className="block text-lg font-bold text-gray-800 mb-2">
                  Especificaciones técnicas
                </label>
                <textarea
                  id="especificaciones"
                  name="especificaciones"
                  value={especificacionesValue}
                  onChange={onChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-base focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                  rows={6}
                  placeholder={especificacionesPlaceholder}
                />
              </div>
            </div>

            {/* Productos Relacionados */}
            <div className="lg:col-span-2">
              <ProductosRelacionados
                productosSeleccionados={productosRelacionados}
                onSelectionChange={setProductosRelacionados}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Creando..."
                ) : (
                  <>
                    <FiSave className="w-5 h-5" />
                    Crear producto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}