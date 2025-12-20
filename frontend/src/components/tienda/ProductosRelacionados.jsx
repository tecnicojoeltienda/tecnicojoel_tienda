import React, { useState, useEffect } from "react";
import { FiLink, FiCheck, FiPackage, FiX } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ProductosRelacionados({ 
  productosSeleccionados = [], 
  onSelectionChange,
  productoActualId = null 
}) {
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar categorías al montar
  useEffect(() => {
    cargarCategorias();
  }, []);

  // Cargar productos cuando cambia la categoría seleccionada
  useEffect(() => {
    if (categoriaSeleccionada) {
      cargarProductos();
    } else {
      setProductos([]);
    }
  }, [categoriaSeleccionada]);

  async function cargarCategorias() {
    try {
      const res = await fetch(`${API}/apij/categorias`);
      if (res.ok) {
        const data = await res.json();
        setCategorias(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  }

  async function cargarProductos() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/apij/productos/categoria/${categoriaSeleccionada}`);
      if (res.ok) {
        const data = await res.json();
        const lista = Array.isArray(data) ? data : (data.rows || []);
        // Filtrar el producto actual si existe
        const filtrados = lista.filter(p => p.id_producto !== productoActualId);
        setProductos(filtrados);
      }
    } catch (err) {
      console.error("Error cargando productos de la categoría:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleProducto(id) {
    const nuevaSeleccion = productosSeleccionados.includes(id)
      ? productosSeleccionados.filter(pid => pid !== id)
      : [...productosSeleccionados, id];
    onSelectionChange(nuevaSeleccion);
  }

  function removerProducto(id) {
    const nuevaSeleccion = productosSeleccionados.filter(pid => pid !== id);
    onSelectionChange(nuevaSeleccion);
  }

  // Obtener información de productos seleccionados
  const [productosSeleccionadosInfo, setProductosSeleccionadosInfo] = useState([]);

  useEffect(() => {
    async function cargarInfoProductosSeleccionados() {
      if (productosSeleccionados.length === 0) {
        setProductosSeleccionadosInfo([]);
        return;
      }

      try {
        const res = await fetch(`${API}/apij/productos`);
        if (res.ok) {
          const allData = await res.json();
          const allProducts = Array.isArray(allData) ? allData : [];
          const seleccionados = allProducts.filter(p => 
            productosSeleccionados.includes(p.id_producto)
          );
          setProductosSeleccionadosInfo(seleccionados);
        }
      } catch (err) {
        console.error("Error cargando info de productos seleccionados:", err);
      }
    }

    cargarInfoProductosSeleccionados();
  }, [productosSeleccionados]);

  return (
    <div className="space-y-6">
      {/* Selector de Categoría */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <label className="block text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FiLink className="w-5 h-5 text-blue-600" />
          Seleccionar Categoría para Agregar Productos Relacionados
        </label>
        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          className="w-full border-2 border-blue-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="">-- Selecciona una categoría --</option>
          {categorias.map((cat) => (
            <option key={cat.id_categoria} value={cat.id_categoria}>
              {cat.nombre_categoria}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-600">
          💡 Selecciona diferentes categorías para agregar productos relacionados de cualquier categoría
        </p>
      </div>

      {/* Panel de productos de la categoría seleccionada */}
      {categoriaSeleccionada && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Productos disponibles en esta categoría
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-600">Cargando productos...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
              <FiPackage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No hay productos en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
              {productos.map((p) => {
                const isSelected = productosSeleccionados.includes(p.id_producto);
                const imgUrl = p.imagen_url?.startsWith('/') ? `${API}${p.imagen_url}` : p.imagen_url;

                return (
                  <div
                    key={p.id_producto}
                    onClick={() => toggleProducto(p.id_producto)}
                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                      isSelected ? "bg-green-600" : "bg-white border-2 border-gray-300"
                    }`}>
                      {isSelected && <FiCheck className="w-4 h-4 text-white" />}
                    </div>

                    {/* Imagen */}
                    <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {imgUrl ? (
                        <img src={imgUrl} alt={p.nombre_producto} className="w-full h-full object-contain" />
                      ) : (
                        <FiPackage className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    {/* Nombre */}
                    <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1">
                      {p.nombre_producto}
                    </h4>

                    {/* Precio */}
                    <p className="text-xs font-bold text-blue-600">
                      S/. {Number(p.precio_venta || 0).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Productos seleccionados */}
      {productosSeleccionados.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-green-600" />
            Productos Relacionados Seleccionados ({productosSeleccionados.length})
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Estos productos se mostrarán en el carrusel de "Productos relacionados"
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {productosSeleccionadosInfo.map((p) => {
              const imgUrl = p.imagen_url?.startsWith('/') ? `${API}${p.imagen_url}` : p.imagen_url;

              return (
                <div
                  key={p.id_producto}
                  className="relative bg-white border-2 border-green-400 rounded-lg p-2 shadow-sm"
                >
                  {/* Botón eliminar */}
                  <button
                    onClick={() => removerProducto(p.id_producto)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors z-10"
                    title="Quitar"
                  >
                    <FiX className="w-4 h-4" />
                  </button>

                  {/* Imagen */}
                  <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {imgUrl ? (
                      <img src={imgUrl} alt={p.nombre_producto} className="w-full h-full object-contain" />
                    ) : (
                      <FiPackage className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* Nombre */}
                  <h4 className="text-xs font-semibold text-gray-900 line-clamp-2">
                    {p.nombre_producto}
                  </h4>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {productosSeleccionados.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-yellow-800 text-sm">
            ⚠️ No has seleccionado ningún producto relacionado aún
          </p>
        </div>
      )}
    </div>
  );
}