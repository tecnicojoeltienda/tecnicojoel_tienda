import React, { useState, useEffect } from "react";
import { FiLink, FiCheck, FiPackage } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ProductosRelacionados({ 
  idCategoria, 
  productosSeleccionados = [], 
  onSelectionChange,
  productoActualId = null 
}) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (idCategoria) {
      cargarProductos();
    } else {
      setProductos([]);
    }
  }, [idCategoria]);

  async function cargarProductos() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/apij/productos/categoria/${idCategoria}`);
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

  if (!idCategoria) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
        <FiLink className="w-8 h-8 text-blue-400 mx-auto mb-2" />
        <p className="text-blue-700 font-medium">
          Selecciona una categoría primero para ver productos relacionados
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <FiPackage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">
          No hay otros productos en esta categoría
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiLink className="w-5 h-5 text-blue-600" />
          Productos Relacionados ({productosSeleccionados.length} seleccionados)
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Selecciona los productos que quieres mostrar como relacionados
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
        {productos.map((p) => {
          const isSelected = productosSeleccionados.includes(p.id_producto);
          const imgUrl = p.imagen_url?.startsWith('/') ? `${API}${p.imagen_url}` : p.imagen_url;

          return (
            <div
              key={p.id_producto}
              onClick={() => toggleProducto(p.id_producto)}
              className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              {/* Checkbox */}
              <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                isSelected ? "bg-blue-600" : "bg-white border-2 border-gray-300"
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
    </div>
  );
}