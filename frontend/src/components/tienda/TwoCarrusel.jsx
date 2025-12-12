import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../../service/api";
import { FiChevronLeft, FiChevronRight, FiStar, FiShoppingCart, FiPackage, FiHeart } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ProductCardSimple({ p, onClick }) {
  const img = resolveImageUrl(p.imagen_url);
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div
      onClick={onClick}
      className="group w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      role="button"
      title={p.nombre_producto}
    >
      {/* Imagen del producto */}
      <div className="relative w-full h-48 bg-gradient-to-br from-white-50 to-white-100 flex items-center justify-center overflow-hidden">
        {/* Badge de categoría */}
        {p.categoria && (
          <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg">
            {p.categoria}
          </div>
        )}
        
        {/* Botón favoritos */}
        <button className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <FiHeart className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>

        {/* Imagen o placeholder */}
        {img ? (
          <img 
            src={img} 
            alt={p.nombre_producto} 
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center mb-2">
              <span className="text-lg font-bold text-indigo-600">
                {getInitials(p.nombre_producto)}
              </span>
            </div>
            <span className="text-xs">Sin imagen</span>
          </div>
        )}

        {/* Overlay al hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-800">
            <FiPackage className="w-4 h-4" />
            Ver producto
          </div>
        </div>
      </div>

      {/* Información del producto */}
      <div className="p-4">
        {/* Título */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem] leading-tight">
          {p.nombre_producto}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <FiStar key={i} className="w-3 h-3 text-yellow-400 fill-current" />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">(0)</span>
        </div>

        {/* Precio y stock */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-lg font-bold text-indigo-600">
              {p.precio_venta != null ? `S/. ${Number(p.precio_venta).toLocaleString()}` : "Consultar"}
            </div>
            {p.precio_lista && Number(p.precio_lista) > Number(p.precio_venta) && (
              <div className="text-xs text-gray-400 line-through">
                S/. {Number(p.precio_lista).toLocaleString()}
              </div>
            )}
          </div>

          {/* Stock indicator */}
          <div className="flex items-center">
            {p.stock > 0 ? (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            )}
          </div>
        </div>

        {/* Botón de acción al hover */}
        <button className="w-full mt-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-700 flex items-center justify-center gap-2">
          <FiShoppingCart className="w-4 h-4" />
          Ver detalles
        </button>
      </div>
    </div>
  );
}

export default function TwoCarrusel({ currentProductId = null }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const contRefs = [useRef(null), useRef(null)];

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/apij/productos`);
        if (!res.ok) throw new Error("fetch error");
        const data = await res.json();
        if (!mounted) return;
        setProductos(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("TwoCarrusel load:", e);
        setProductos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // helper para generar slug igual que en ProductDetail/Pages
  const slugify = (s = "") =>
    s
      .toString()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  // obtiene el slug de la categoría soportando varios formatos
  const getCategorySlug = (prod = {}) => {
    // Mapa id_categoria -> slug según tu dump SQL
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

    // intentos directos solo sobre campos que representen la categoría explícita
    const tryValues = [
      prod.categoria,
      prod.categoria_nombre,
      prod.categoria_slug,
      prod.category,
      prod.category_name,
      prod.categoriaName,
      prod.categoriaTitle,
      prod.cat,
      prod.tipo,
      prod.tipo_categoria,
      prod.categoria_text,
      prod.categoria_texto,
      prod.categoria?.nombre,
      prod.categoria?.slug,
      prod.categoria_nombre?.nombre,
      prod.categoria_nombre?.slug,
      prod.categoria?.title,
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

    // Si no hay categoría explícita en texto, intentar mapear por id_categoria
    if (!catRaw || /^(productos?|producto)s?$/i.test(catRaw)) {
      const id = Number(prod.id_categoria ?? prod.idCategoria ?? prod.categoryId ?? prod.id_categoria);
      if (!Number.isNaN(id) && idToSlug[id]) return idToSlug[id];
      // Si no se puede determinar explícitamente, devolvemos null para indicar ausencia de categoría
      return null;
    }

    return slugify(catRaw);
  };

  // Excluir el producto actual y aquellos sin categoría explícita
  const pool = productos
    .filter(p => String(p.id_producto) !== String(currentProductId))
    .filter(p => {
      try {
        return !!getCategorySlug(p);
      } catch {
        return false;
      }
    });

  const listA = shuffle(pool).slice(0, Math.min(10, pool.length));
  const remainingPool = pool.filter(p => !listA.some(a => a.id_producto === p.id_producto));
  const listB = shuffle(remainingPool.length ? remainingPool : pool).slice(0, Math.min(10, pool.length));

  function scroll(ref, dir = 1) {
    const el = ref.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="mt-12 space-y-8">
        {[0, 1].map(idx => (
          <section key={idx} className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="flex gap-6 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-64 flex-shrink-0">
                  <div className="h-48 bg-gray-200 rounded-2xl mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  const carousels = [
    { title: "Productos recomendados", subtitle: "Especialmente seleccionados para ti", items: listA, ref: contRefs[0] },
    { title: "También te puede gustar", subtitle: "Descubre más productos increíbles", items: listB, ref: contRefs[1] }
  ];

  return (
    <div className="mt-12 space-y-12">
      {carousels.map((group, idx) => (
        <section key={idx} className="relative">
          {/* Header del carrusel */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{group.title}</h3>
              <p className="text-gray-600">{group.subtitle}</p>
            </div>
            
            {/* Controles de navegación */}
            <div className="flex items-center gap-2">
              <button 
                aria-label="Anterior" 
                onClick={() => scroll(group.ref, -1)} 
                className="group w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <FiChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
              </button>
              <button 
                aria-label="Siguiente" 
                onClick={() => scroll(group.ref, 1)} 
                className="group w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <FiChevronRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
              </button>
            </div>
          </div>

          {/* Carrusel de productos */}
          <div className="relative">
            {/* Gradientes de fade en los bordes */}
            <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
            
            <div 
              ref={group.ref} 
              className="flex gap-6 overflow-x-auto scrollbar-hide py-2 px-2"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' }
              }}
            >
              {group.items.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FiPackage className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">No hay productos disponibles</p>
                  <p className="text-gray-400 text-sm mt-1">Intenta recargar la página</p>
                </div>
              ) : (
                group.items.map(p => {
                  const categorySlug = getCategorySlug(p);
                  if (!categorySlug) return null; // seguridad: ya filtrado, pero guardia extra
                  const detailSlug = slugify(p.nombre_producto || p.title || String(p.id_producto || p.id || ""));
                  const detailPath = `/${encodeURIComponent(categorySlug)}/${encodeURIComponent(detailSlug)}`;
                  return (
                    <ProductCardSimple
                      key={p.id_producto || p.id}
                      p={p}
                      onClick={() => nav(detailPath)}
                    />
                  );
                })
               )}
             </div>
           </div>

          {/* Indicador de scroll (puntos) */}
          {group.items.length > 4 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {[...Array(Math.ceil(group.items.length / 4))].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-2 rounded-full bg-gray-300 hover:bg-indigo-600 transition-colors cursor-pointer"
                  onClick={() => {
                    const el = group.ref.current;
                    if (el) {
                      el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
                    }
                  }}
                ></div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}