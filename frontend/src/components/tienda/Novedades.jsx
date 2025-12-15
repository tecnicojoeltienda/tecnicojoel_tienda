import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { resolveImageUrl } from "../../service/api";
import { FiChevronLeft, FiChevronRight, FiShoppingCart, FiPackage,FiBox, FiStar, FiHeart } from "react-icons/fi";
import { useCart } from "../../context/CartContext";

const CATEGORY_KEYS = {
  ALL: "ALL",
  LAPTOPS: "LAPTOPS",
  COMPUTADORAS: "COMPUTADORAS",
  MONITORES: "MONITORES",
  IMPRESORAS: "IMPRESORAS",
  MOUSE: "MOUSE",
  ACCESORIOS: "ACCESORIOS",
};

const CATEGORY_API_SLUG = {
  [CATEGORY_KEYS.LAPTOPS]: "laptops",
  [CATEGORY_KEYS.COMPUTADORAS]: "pcs",
  [CATEGORY_KEYS.MONITORES]: "monitores",
  [CATEGORY_KEYS.IMPRESORAS]: "impresoras",
  [CATEGORY_KEYS.MOUSE]: "mouse",
  [CATEGORY_KEYS.ACCESORIOS]: "accesorios",
};

const CATEGORY_LABELS = {
  [CATEGORY_KEYS.ALL]: "Todos",
  [CATEGORY_KEYS.LAPTOPS]: "Laptops",
  [CATEGORY_KEYS.COMPUTADORAS]: "PCs",
  [CATEGORY_KEYS.MONITORES]: "Monitores",
  [CATEGORY_KEYS.IMPRESORAS]: "Impresoras",
  [CATEGORY_KEYS.MOUSE]: "Mouse",
  [CATEGORY_KEYS.ACCESORIOS]: "Accesorios",
};

export default function Novedades() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(CATEGORY_KEYS.ALL);
  
  const containerRef = useRef(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Helper para generar slug
  const slugify = (s = "") =>
    s
      .toString()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  // Función para obtener categoría y slug del producto (misma lógica que TwoCarrusel y HeaderTienda)
  const getCategorySlug = (prod = {}) => {
    const idToSlug = {
      1: "pcs",
      2: "laptops",
      3: "monitores",
      4: "mouse",
      5: "accesorios",
      6: "sonido",
      7: "tintas",
      8: "licencia",
      9: "reacondicionados",
      10: "redes",
      11: "impresoras",
      12: "componentes",
      13: "estabilizadores"
    };

    const tryValues = [
      prod.categoria,
      prod.categoria_nombre,
      prod.categoria_slug,
      prod.category,
      prod.category_name,
      prod.categoriaName,
      prod.tipo,
      prod.categoria?.nombre,
      prod.categoria?.slug,
      prod.category?.name,
      prod.category?.slug
    ];

    let catRaw = "";
    for (const v of tryValues) {
      if (v === 0 || v === "0") continue;
      if (v && typeof v === "string" && v.trim() !== "") {
        catRaw = v;
        break;
      }
      if (v && typeof v === "object") {
        catRaw = v.slug || v.nombre || v.name || v.title || "";
        if (catRaw) break;
      }
    }

    catRaw = String(catRaw || "").trim();

    if (!catRaw || /^(productos?|producto)s?$/i.test(catRaw)) {
      const id = Number(prod.id_categoria ?? prod.idCategoria ?? prod.categoryId);
      if (!Number.isNaN(id) && idToSlug[id]) return idToSlug[id];
      return null;
    }

    return slugify(catRaw);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Carga productos y filtra solo los que tengan categoría válida
  useEffect(() => {
    let mounted = true;
    async function loadForCategory() {
      setLoading(true);
      setError(null);
      try {
        let url;
        if (category === CATEGORY_KEYS.ALL) {
          url = "/apij/productos/";
        } else {
          const slug = CATEGORY_API_SLUG[category];
          url = `/apij/productos/categoria/nombre/${encodeURIComponent(slug)}`;
        }
        const res = await api.get(url);
        const rows = Array.isArray(res.data) ? res.data : (res.data.rows || []);
        
        // Filtrar solo productos con categoría válida
        const validProducts = rows.filter(p => {
          try {
            return !!getCategorySlug(p);
          } catch {
            return false;
          }
        });

        if (mounted) {
          setProducts(validProducts.slice(0, 12));
          if (containerRef.current) containerRef.current.scrollLeft = 0;
        }
      } catch (e) {
        if (mounted) {
          setError("No se pudieron cargar los productos");
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadForCategory();
    return () => (mounted = false);
  }, [category]);

  const scrollByWidth = (direction = 1) => {
    const el = containerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.75);
    el.scrollBy({ left: amount * direction, behavior: "smooth" });
  };

  const handleProductClick = (p) => {
    const categorySlug = getCategorySlug(p);
    if (!categorySlug) return;
    const productSlug = slugify(p.nombre_producto || p.title || String(p.id_producto || p.id || ""));
    const detailPath = `/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productSlug)}`;
    navigate(detailPath);
  };

  if (loading) {
    return (
      <section className="w-full py-8">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 w-24 bg-gray-200 rounded-full"></div>
                ))}
              </div>
            </div>
            <div className="flex gap-6 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-72 flex-shrink-0">
                  <div className="h-56 bg-gray-200 rounded-2xl mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-8">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-8 md:py-12">
      {/* Cambiado a w-full con padding más pequeño para que ocupe más ancho */}
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {/* Contenedor con border-radius y box-shadow */}
        <div 
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            boxShadow: "0 18px 40px rgba(2,6,23,0.22)"
          }}
        >
          <div className="p-6 md:p-8 lg:p-10">
          
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
               
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3"> 
                    <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"> 
                      <path d="M3 7l9-4 9 4v10a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/> 
                      <path d="M3 7l9 4 9-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/> 
                    </svg> 
                    Productos Populares 
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">
                    Descubre los productos más populares entre nuestros clientes
                  </p>
                </div>

                {/* Filtros de categoría - responsive */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                  {Object.keys(CATEGORY_KEYS).map((k) => {
                    const active = category === CATEGORY_KEYS[k];
                    return (
                      <button
                        key={k}
                        onClick={() => setCategory(CATEGORY_KEYS[k])}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                          active
                            ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg scale-105"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-blue-300 hover:shadow-md"
                        }`}
                      >
                        {CATEGORY_LABELS[CATEGORY_KEYS[k]]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Carrusel de productos */}
            <div className="relative">
              {/* Botones de navegación - solo desktop */}
              <button
                onClick={() => scrollByWidth(-1)}
                aria-label="Anterior"
                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-20 w-14 h-14 rounded-full bg-white shadow-2xl items-center justify-center hover:bg-blue-50 hover:scale-110 transition-all duration-200 border-2 border-gray-100"
              >
                <FiChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              <button
                onClick={() => scrollByWidth(1)}
                aria-label="Siguiente"
                className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 w-14 h-14 rounded-full bg-white shadow-2xl items-center justify-center hover:bg-blue-50 hover:scale-110 transition-all duration-200 border-2 border-gray-100"
              >
                <FiChevronRight className="w-6 h-6 text-gray-700" />
              </button>

              {/* Gradientes de fade en los bordes */}
              <div className="absolute left-0 top-0 w-12 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none hidden lg:block"></div>
              <div className="absolute right-0 top-0 w-12 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none hidden lg:block"></div>

              {/* Contenedor del carrusel con scrollbar delgado */}
              <div 
                ref={containerRef}
                className="flex gap-6 overflow-x-auto py-4 px-2 custom-scrollbar"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9',
                }}
              >
                {products.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FiBox className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-xl font-semibold mb-2">No hay productos disponibles</p>
                    <p className="text-gray-400 text-sm">Intenta seleccionar otra categoría</p>
                  </div>
                ) : (
                  products.map((p) => {
                    const categorySlug = getCategorySlug(p);
                    if (!categorySlug) return null;

                    const img = resolveImageUrl(p.imagen_url);

                    return (
                      <article
                        key={p.id_producto ?? p.id}
                        onClick={() => handleProductClick(p)}
                        className="group flex-shrink-0 w-72 sm:w-80 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                      >
                        {/* Imagen del producto */}
                        <div className="relative w-full h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                          {/* Badge de categoría */}
                          {p.categoria && (
                            <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-lg">
                              {p.categoria}
                            </div>
                          )}

                          {/* Botón favoritos */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); }}
                            className="absolute top-3 right-3 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
                          >
                            <FiHeart className="w-5 h-5 text-gray-600 hover:text-red-500" />
                          </button>

                          {/* Imagen o placeholder */}
                          {img ? (
                            <img 
                              src={img} 
                              alt={p.nombre_producto} 
                              className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-300" 
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-blue-600">
                                  {getInitials(p.nombre_producto)}
                                </span>
                              </div>
                              <span className="text-sm font-medium">Sin imagen</span>
                            </div>
                          )}

                          {/* Overlay al hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm font-bold text-gray-800 shadow-xl">
                              <FiPackage className="w-5 h-5 text-blue-600" />
                              Ver detalles
                            </div>
                          </div>
                        </div>

                        {/* Información del producto */}
                        <div className="p-5">
                          {/* Título */}
                          <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-3 min-h-[3rem] leading-tight group-hover:text-blue-600 transition-colors">
                            {p.nombre_producto}
                          </h3>

                          {/* Descripción */}
                          {p.descripcion && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                              {p.descripcion}
                            </p>
                          )}

                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-4">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <FiStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500 ml-1.5 font-medium">(0)</span>
                          </div>

                          {/* Precio y acción */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex flex-col">
                              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                {p.precio_venta != null ? `S/. ${Number(p.precio_venta).toLocaleString()}` : "Consultar"}
                              </div>
                              {p.precio_lista && Number(p.precio_lista) > Number(p.precio_venta) && (
                                <div className="text-sm text-gray-400 line-through">
                                  S/. {Number(p.precio_lista).toLocaleString()}
                                </div>
                              )}
                            </div>

                            {/* Botón agregar al carrito */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p);
                              }}
                              aria-label={`Añadir ${p.nombre_producto} al carrito`}
                              className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-center hover:scale-110 hover:shadow-xl transition-all duration-200"
                            >
                              <FiShoppingCart className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Stock indicator */}
                          <div className="flex items-center gap-2 mt-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${p.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-medium text-gray-600">
                              {p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {/* Indicadores de scroll (puntos) */}
              {products.length > 3 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {[...Array(Math.min(5, Math.ceil(products.length / 3)))].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-2.5 h-2.5 rounded-full bg-gray-300 hover:bg-blue-600 transition-all cursor-pointer hover:scale-125"
                      onClick={() => {
                        const el = containerRef.current;
                        if (el) {
                          el.scrollTo({ left: i * el.clientWidth * 0.8, behavior: 'smooth' });
                        }
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estilos para scrollbar personalizado */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
