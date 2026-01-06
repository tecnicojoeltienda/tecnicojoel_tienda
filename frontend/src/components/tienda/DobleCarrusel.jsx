import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { resolveImageUrl } from "../../service/api";
import { FiChevronLeft, FiChevronRight, FiShoppingCart, FiPackage, FiStar, FiHeart } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { toast } from 'sonner';

function useViewportVisible(defaultVisible = 3) {
  const [visible, setVisible] = useState(defaultVisible);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1280) setVisible(4);
      else if (w >= 1024) setVisible(3);
      else if (w >= 768) setVisible(2);
      else setVisible(1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return visible;
}

export default function DobleCarrusel() {
  const [accesorios, setAccesorios] = useState([]);
  const [componentes, setComponentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const visible = useViewportVisible(3);
  const navigate = useNavigate();

  const containerLeft = useRef(null);
  const containerRight = useRef(null);

  const [canLeftPrev, setCanLeftPrev] = useState(false);
  const [canLeftNext, setCanLeftNext] = useState(false);
  const [canRightPrev, setCanRightPrev] = useState(false);
  const [canRightNext, setCanRightNext] = useState(false);

  const { addToCart } = useCart();

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

  // Función para obtener categoría slug (misma lógica que los otros componentes)
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

  // Cargar productos y filtrar por categoría válida
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res1 = await api.get("/apij/productos/categoria/nombre/accesorios");
        const res2 = await api.get("/apij/productos/categoria/nombre/componentes");
        
        let data1 = Array.isArray(res1.data) ? res1.data : res1.data.rows || [];
        let data2 = Array.isArray(res2.data) ? res2.data : res2.data.rows || [];

        // Filtrar productos con categoría válida
        data1 = data1.filter((p) => {
          const catSlug = getCategorySlug(p);
          return catSlug && catSlug !== null;
        });

        data2 = data2.filter((p) => {
          const catSlug = getCategorySlug(p);
          return catSlug && catSlug !== null;
        });

        // Ordenar de menor a mayor precio
        data1.sort((a, b) => {
          const precioA = Number(a.precio_venta) || 0;
          const precioB = Number(b.precio_venta) || 0;
          return precioA - precioB;
        });

        data2.sort((a, b) => {
          const precioA = Number(a.precio_venta) || 0;
          const precioB = Number(b.precio_venta) || 0;
          return precioA - precioB;
        });

        if (mounted) {
          setAccesorios(data1);
          setComponentes(data2);
        }
      } catch (err) {
        console.error("Error cargando productos:", err);
        if (mounted) {
          setAccesorios([]);
          setComponentes([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const updateControls = (ref, setPrev, setNext) => {
    const el = ref.current;
    if (!el) return;
    setPrev(el.scrollLeft > 5);
    setNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    const left = containerLeft.current;
    const right = containerRight.current;
    if (left) updateControls(containerLeft, setCanLeftPrev, setCanLeftNext);
    if (right) updateControls(containerRight, setCanRightPrev, setCanRightNext);

    const onScrollLeft = () => updateControls(containerLeft, setCanLeftPrev, setCanLeftNext);
    const onScrollRight = () => updateControls(containerRight, setCanRightPrev, setCanRightNext);

    left && left.addEventListener("scroll", onScrollLeft);
    right && right.addEventListener("scroll", onScrollRight);
    window.addEventListener("resize", onScrollLeft);
    window.addEventListener("resize", onScrollRight);

    return () => {
      left && left.removeEventListener("scroll", onScrollLeft);
      right && right.removeEventListener("scroll", onScrollRight);
      window.removeEventListener("resize", onScrollLeft);
      window.removeEventListener("resize", onScrollRight);
    };
  }, [accesorios, componentes, visible]);

  const scrollOne = (ref, direction = 1) => {
    const el = ref.current;
    if (!el) return;
    const first = el.querySelector("article");
    const gap = 24;
    const cardWidth = first ? first.offsetWidth + gap : Math.round(el.clientWidth / visible);
    el.scrollBy({ left: cardWidth * direction, behavior: "smooth" });
  };

  const handleProductClick = (p) => {
    const categorySlug = getCategorySlug(p);
    if (!categorySlug) return;
    const productSlug = slugify(p.nombre_producto || p.title || String(p.id_producto || p.id || ""));
    const detailPath = `/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productSlug)}`;
    navigate(detailPath);
  };

  const renderProductCard = (p) => {
    const categorySlug = getCategorySlug(p);
    if (!categorySlug) return null;

    const img = resolveImageUrl(p.imagen_url);

    return (
      <article
        key={p.id_producto ?? p.id ?? p._id}
        onClick={() => handleProductClick(p)}
        className="group flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-xl scroll-pl-6 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        style={{ 
          width: 280, 
          minWidth: 280, 
          scrollSnapAlign: "start", 
          borderRadius: 16 
        }}
      >
        {/* Imagen del producto */}
        <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
          {/* Badge de categoría */}
          {p.categoria && (
            <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md">
              {p.categoria}
            </div>
          )}

          {/* Botón favoritos */}
          <button 
            onClick={(e) => { e.stopPropagation(); }}
            className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
          >
            <FiHeart className="w-4 h-4 text-gray-600 hover:text-red-500" />
          </button>

          {/* Imagen o placeholder */}
          {img ? (
            <img
              src={img}
              alt={p.nombre_producto}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-2">
                <span className="text-lg font-bold text-blue-600">
                  {getInitials(p.nombre_producto)}
                </span>
              </div>
              <span className="text-xs font-medium">Sin imagen</span>
            </div>
          )}

          {/* Overlay al hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-gray-800 shadow-lg">
              <FiPackage className="w-4 h-4 text-blue-600" />
              Ver detalles
            </div>
          </div>
        </div>

        {/* Información del producto */}
        <div className="p-4">
          {/* Título */}
          <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem] leading-tight group-hover:text-blue-600 transition-colors">
            {p.nombre_producto}
          </h4>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className="w-3 h-3 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">(0)</span>
          </div>

          {/* Precio y acción */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex flex-col">
              <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
                {p.precio_venta != null ? `S/. ${Number(p.precio_venta).toLocaleString()}` : "Consultar"}
              </div>
              {p.precio_lista && Number(p.precio_lista) > Number(p.precio_venta) && (
                <div className="text-xs text-gray-400 line-through">
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
              className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-600 text-white flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
            >
              <FiShoppingCart className="w-4 h-4" />
            </button>
          </div>

          {/* Stock indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${p.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-600 font-medium">
              {p.stock > 0 ? 'Disponible' : 'Agotado'}
            </span>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section
      className="w-full py-6 md:py-8"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      {/* Cambiado a w-full con padding más pequeño para que ocupe más ancho */}
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left - Accesorios */}
          <div
            className="bg-white rounded-2xl p-4 sm:p-6"
            style={{
              boxShadow: "0 28px 60px rgba(2,6,23,0.18)",
              minHeight: 320,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  <FiPackage className="w-6 h-6 text-blue-600" />
                  Accesorios
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Complementa tu setup</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollOne(containerLeft, -1)}
                  disabled={!canLeftPrev}
                  className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center disabled:opacity-30 hover:bg-blue-50 hover:scale-110 transition-all duration-200 disabled:hover:scale-100 disabled:hover:bg-white border border-gray-100"
                  aria-label="Anterior accesorios"
                >
                  <FiChevronLeft className="w-5 h-5 text-blue-600" />
                </button>
                <button
                  onClick={() => scrollOne(containerLeft, 1)}
                  disabled={!canLeftNext}
                  className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center disabled:opacity-30 hover:bg-blue-50 hover:scale-110 transition-all duration-200 disabled:hover:scale-100 disabled:hover:bg-white border border-gray-100"
                  aria-label="Siguiente accesorios"
                >
                  <FiChevronRight className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden">
              <div
                ref={containerLeft}
                className="flex gap-4 sm:gap-6 overflow-x-auto custom-scrollbar py-2"
                style={{
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: 6,
                }}
              >
                {loading ? (
                  Array.from({ length: visible }).map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-shrink-0 rounded-xl bg-gray-100 animate-pulse" 
                      style={{ width: 280, minWidth: 280, height: 340 }} 
                    />
                  ))
                ) : accesorios.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <FiPackage className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No hay accesorios disponibles</p>
                  </div>
                ) : (
                  accesorios.map((p) => renderProductCard(p))
                )}
              </div>
            </div>
          </div>

          {/* Right - Componentes */}
          <div
            className="bg-white rounded-2xl p-4 sm:p-6"
            style={{
              boxShadow: "0 28px 60px rgba(2,6,23,0.18)",
              minHeight: 320,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  <FiPackage className="w-6 h-6 text-blue-600" />
                  Componentes
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Potencia tu equipo</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollOne(containerRight, -1)}
                  disabled={!canRightPrev}
                  className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center disabled:opacity-30 hover:bg-blue-50 hover:scale-110 transition-all duration-200 disabled:hover:scale-100 disabled:hover:bg-white border border-gray-100"
                  aria-label="Anterior componentes"
                >
                  <FiChevronLeft className="w-5 h-5 text-blue-600" />
                </button>
                <button
                  onClick={() => scrollOne(containerRight, 1)}
                  disabled={!canRightNext}
                  className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center disabled:opacity-30 hover:bg-blue-50 hover:scale-110 transition-all duration-200 disabled:hover:scale-100 disabled:hover:bg-white border border-gray-100"
                  aria-label="Siguiente componentes"
                >
                  <FiChevronRight className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden">
              <div
                ref={containerRight}
                className="flex gap-4 sm:gap-6 overflow-x-auto custom-scrollbar py-2"
                style={{
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: 6,
                }}
              >
                {loading ? (
                  Array.from({ length: visible }).map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-shrink-0 rounded-xl bg-gray-100 animate-pulse" 
                      style={{ width: 280, minWidth: 280, height: 340 }} 
                    />
                  ))
                ) : componentes.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <FiPackage className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No hay componentes disponibles</p>
                  </div>
                ) : (
                  componentes.map((p) => renderProductCard(p))
                )}
              </div>
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