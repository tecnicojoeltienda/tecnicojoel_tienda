import React, { useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../../service/api";
import { FiPlus, FiMinus, FiArrowLeft, FiShoppingCart, FiPackage, FiStar, FiInfo, FiSettings } from "react-icons/fi";

export default function ProductDetail({
  product = {},
  onAdd = () => {},
  className = "",
  showQuantityControl = true
}) {
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const img = resolveImageUrl(product.imagen_url);

  const inc = () => setQty(q => Math.min(99, q + 1));
  const dec = () => setQty(q => Math.max(1, q - 1));
  const handleAdd = () => {
    onAdd(product, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const imgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState("50% 50%");

  const onImgEnter = () => setZoom(2.5);
  const onImgLeave = () => {
    setZoom(1);
    setOrigin("50% 50%");
  };
  const onImgMove = (e) => {
    const el = imgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    const py = Math.max(0, Math.min(100, Math.round((y / rect.height) * 100)));
    setOrigin(`${px}% ${py}%`);
  };

  const featuresList = useMemo(() => {
    const raw = product.caracteristicas || product.features || product.caracteristicas_list || null;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === "object") return Object.entries(raw).map(([k, v]) => `${k}: ${v}`);
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
        if (typeof parsed === "object") return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`);
      } catch {}
      return raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [product]);

  const specsNormalized = useMemo(() => {
    const raw = product.especificaciones || product.specs || product.specifications || null;
    if (!raw) return null;
    if (typeof raw === "object") return raw; 
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return parsed;
      } catch {
        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const asObj = {};
        let anyKV = false;
        lines.forEach(line => {
          const parts = line.split(/:\s*/);
          if (parts.length >= 2) {
            anyKV = true;
            asObj[parts[0].trim()] = parts.slice(1).join(": ").trim();
          }
        });
        if (anyKV) return asObj;
        return raw;
      }
    }
    return String(raw);
  }, [product]);

  const slugify = (s = "") =>
    s.toString().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

  const getStockColor = (stock) => {
    if (!stock || stock <= 0) return "text-red-600 bg-red-50";
    if (stock <= 5) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  const getStockText = (stock) => {
    if (!stock || stock <= 0) return "Sin stock";
    if (stock <= 5) return `Solo ${stock} disponibles`;
    return "En stock";
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Imagen del producto */}
        <div className="relative bg-gradient-to-br from-white-50 to-white-100 lg:h-[600px]">
          {/* Botón Volver mejorado */}
          <button
            onClick={() => {
              const catRaw = String(product.categoria || product.categoria_nombre || product.categoria_slug || product.categoria || "");
              if (catRaw && catRaw.trim() !== "") {
                const catSlug = slugify(catRaw);
                navigate(`/${encodeURIComponent(catSlug)}`);
              } else {
                navigate(-1);
              }
            }}
            className="absolute left-4 top-4 z-20 bg-white/95 backdrop-blur-sm hover:bg-white rounded-xl p-3 shadow-lg border border-gray-200 transition-all hover:shadow-xl"
            title="Volver a la categoría"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="absolute right-4 top-4 z-20 bg-black/70 text-white px-3 py-2 rounded-lg text-xs font-medium">
            Pasa el mouse para hacer zoom
          </div>

          <div
            className="w-full h-full flex items-center justify-center p-8 overflow-hidden cursor-zoom-in"
            onMouseEnter={onImgEnter}
            onMouseMove={onImgMove}
            onMouseLeave={onImgLeave}
            ref={imgRef}
          >
            {img ? (
              <img
                src={img}
                alt={product.nombre_producto}
                className="max-w-full max-h-full object-contain transform-gpu"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: origin,
                  transition: "transform 0.3s ease-out"
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <FiPackage className="w-20 h-20 mb-4" />
                <span className="text-lg font-medium">Sin imagen disponible</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 flex flex-col">
          {/* Header del producto */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                {product.categoria || "Producto"}
              </span>
              {product.estado === "nuevo" && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Nuevo
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.nombre_producto}</h1>
            
            {product.subtitulo && (
              <p className="text-gray-600 text-lg">{product.subtitulo}</p>
            )}

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-500">(0 reseñas)</span>
            </div>
          </div>

          {/* Precio */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
            <div className="flex items-baseline gap-4">
              <div className="text-4xl font-extrabold text-indigo-600">
                {product.precio_venta != null ? `S/. ${Number(product.precio_venta).toLocaleString()}` : "Consultar"}
              </div>
              {product.precio_lista && Number(product.precio_lista) > Number(product.precio_venta) && (
                <div className="text-lg text-gray-400 line-through">S/. {Number(product.precio_lista).toLocaleString()}</div>
              )}
            </div>
            
            {product.precio_lista && Number(product.precio_lista) > Number(product.precio_venta) && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                Ahorras S/. {(Number(product.precio_lista) - Number(product.precio_venta)).toLocaleString()}
              </div>
            )}
          </div>

          {/* Stock y estado */}
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stock</div>
                <div className={`text-sm font-bold px-3 py-1 rounded-full ${getStockColor(product.stock)}`}>
                  {getStockText(product.stock)}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Estado</div>
                <div className="text-sm font-bold text-gray-800">
                  {product.estado || "Nuevo"}
                </div>
              </div>
            </div>
          </div>

          {/* Controles de cantidad y compra */}
          <div className="mb-8">
            {showQuantityControl && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Cantidad</label>
                <div className="inline-flex items-center bg-gray-50 rounded-xl p-1">
                  <button 
                    onClick={dec} 
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors"
                    aria-label="Disminuir cantidad"
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                  <div className="w-16 h-12 flex items-center justify-center font-bold text-lg">{qty}</div>
                  <button 
                    onClick={inc} 
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors"
                    aria-label="Aumentar cantidad"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 ${
                addedToCart 
                  ? "bg-green-600 text-white" 
                  : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
              }`}
            >
              {addedToCart ? (
                <>
                  <FiPackage className="w-5 h-5" />
                  ¡Agregado al carrito!
                </>
              ) : (
                <>
                  <FiShoppingCart className="w-5 h-5" />
                  AGREGAR AL CARRITO
                </>
              )}
            </button>
          </div>

          {/* Descripción */}
          {product.descripcion && (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FiInfo className="w-5 h-5 text-indigo-600" />
                Descripción
              </h3>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.descripcion || product.detalle || "No hay descripción disponible."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Especificaciones expandibles */}
      {(featuresList.length > 0 || specsNormalized) && (
        <div className="border-t border-gray-100 p-8">
          {specsNormalized && (
            <details className="group bg-gray-50 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <FiSettings className="w-5 h-5 text-indigo-600" />
                  <span className="text-lg font-bold text-gray-900">Especificaciones técnicas</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Mostrar detalles</span>
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center group-open:rotate-180 transition-transform">
                    <FiPlus className="w-3 h-3 text-indigo-600" />
                  </div>
                </div>
              </summary>

              <div className="px-6 pb-6">
                {typeof specsNormalized === "string" ? (
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <pre className="text-gray-800 whitespace-pre-line font-mono text-sm">{specsNormalized}</pre>
                  </div>
                ) : Array.isArray(specsNormalized) ? (
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <ul className="space-y-2">
                      {specsNormalized.map((s, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-800">{String(s)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {Object.entries(specsNormalized).map(([k, v], i) => (
                      <div
                        key={k}
                        className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} px-6 py-4 flex items-start gap-6 border-b last:border-b-0`}
                      >
                        <div className="w-48 text-sm font-semibold text-gray-700 flex-shrink-0">{k}</div>
                        <div className="flex-1 text-gray-900">{String(v)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
