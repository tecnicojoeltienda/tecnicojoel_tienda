import { FiX } from "react-icons/fi";
import { resolveImageUrl } from "../../service/api";

export default function ProductImageModal({ product, isOpen, onClose }) {
  if (!isOpen || !product) return null;

  const imgSrc = resolveImageUrl(product.imagen_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {product.nombre_producto}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image */}
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 min-h-[300px]">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={product.nombre_producto}
                  className="max-w-full max-h-96 object-contain"
                  onError={(e) => { e.currentTarget.src = ""; e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  Sin imagen disponible
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {product.nombre_producto}
                </h3>
                <div className="text-2xl font-bold text-red-500">
                  {product.precio_venta != null ? `S/. ${Number(product.precio_venta).toLocaleString()}` : "Precio no disponible"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <span className="font-semibold">{product.stock ?? "No disponible"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Referencia:</span>
                  <span className="font-semibold">{product.referencia ?? product.id_producto ?? "—"}</span>
                </div>
                {product.descripcion && (
                  <div>
                    <span className="text-gray-600 block mb-1">Descripción:</span>
                    <p className="text-gray-800">{product.descripcion}</p>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Añadir al carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}