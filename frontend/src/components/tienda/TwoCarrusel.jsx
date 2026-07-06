import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../../service/api";
import { FiChevronLeft, FiChevronRight, FiStar, FiShoppingCart, FiPackage, FiHeart } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

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
    <article
      onClick={onClick}
      className="group flex-shrink-0 snap-start bg-white rounded-[1.5rem] border border-slate-200/60 p-4 cursor-pointer transition-all duration-300 hover:border-transparent hover:shadow-[0_15px_40px_-10px_rgba(37,99,235,0.15)] hover:-translate-y-1 flex flex-col w-[240px] sm:w-[260px]"
      title={p.nombre_producto}
    >
      {/* MARCO LLAMATIVO: Degradado Azul -> Rojo -> Gris */}
      <div className="relative w-full aspect-square rounded-2xl p-[3px] bg-gradient-to-br from-blue-600 via-red-500 to-slate-400 mb-4 transition-all duration-500 group-hover:shadow-[0_8px_25px_rgba(37,99,235,0.3)] group-hover:scale-[1.02]">
        
        {/* Fondo interno de la imagen */}
        <div className="relative w-full h-full bg-white rounded-[13px] flex items-center justify-center p-4 overflow-hidden">
          
          {/* Badge de categoría */}
          {p.categoria && (
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-md border border-slate-100 shadow-sm">
              {p.categoria}
            </div>
          )}
          
          {/* Botón favoritos */}
          <button 
            onClick={(e) => e.stopPropagation()} 
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-red-500 hover:scale-110 shadow-sm"
          >
            <FiHeart className="w-4 h-4" />
          </button>

          {/* Imagen o placeholder */}
          {img ? (
            <img 
              src={img} 
              alt={p.nombre_producto} 
              className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" 
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mb-2">
                <span className="text-lg font-bold text-blue-600">
                  {getInitials(p.nombre_producto)}
                </span>
              </div>
              <span className="text-xs font-medium">Sin imagen</span>
            </div>
          )}
        </div>
      </div>

      {/* Información del producto */}
      <div className="flex flex-col flex-grow px-1">
        <h4 className="text-[14px] sm:text-[15px] font-semibold text-slate-900 line-clamp-2 leading-snug mb-3 group-hover:text-blue-600 transition-colors flex-grow">
          {p.nombre_producto}
        </h4>
        
        {/* Rating sutil */}
        <div className="flex items-center gap-1 mb-3">
          <FiStar className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span className="text-xs font-medium text-slate-500">4.9</span>
          
          {/* Stock indicator pequeño */}
          <div className="ml-auto flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {p.stock > 0 ? 'Disp.' : 'Agot.'}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-slate-100">
          <div>
            {p.precio_lista && Number(p.precio_lista) > Number(p.precio_venta) && (
              <div className="text-xs font-medium text-slate-400 line-through mb-0.5">
                S/. {Number(p.precio_lista).toLocaleString()}
              </div>
            )}
            <div className="text-lg font-extrabold text-blue-700 tracking-tight">
              {p.precio_venta != null ? `S/. ${Number(p.precio_venta).toLocaleString()}` : "Consultar"}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              // Lógica addToCart si la tienes importada, o onClick wrapper
            }}
            className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 text-blue-600 flex items-center justify-center transition-all duration-300 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/30 hover:scale-110 group-hover:bg-blue-50"
          >
            <FiShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
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

  const slugify = (s = "") =>
    s
      .toString()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const getCategorySlug = (prod = {}) => {
    const idToSlug = { 1: "pcs", 2: "laptops", 3: "monitores", 4: "mouse", 5: "accesorios", 6: "sonido", 7: "tintas", 8: "licencia", 9: "reacondicionados", 10: "redes", 11: "impresoras", 12: "componentes", 13: "estabilizadores" };
    const tryValues = [prod.categoria, prod.categoria_nombre, prod.categoria_slug, prod.category, prod.category_name, prod.categoriaName, prod.categoriaTitle, prod.cat, prod.tipo, prod.tipo_categoria, prod.categoria_text, prod.categoria_texto, prod.categoria?.nombre, prod.categoria?.slug, prod.categoria_nombre?.nombre, prod.categoria_nombre?.slug, prod.categoria?.title, prod.category?.name, prod.category?.slug];
    let catRaw = "";
    for (const v of tryValues) {
      if (v === 0 || v === "0") continue;
      if (v && typeof v === "string" && v.trim() !== "") { catRaw = v; break; }
      if (v && typeof v === "object") { catRaw = v.slug || v.nombre || v.name || v.title || ""; if (catRaw) break; }
    }
    catRaw = String(catRaw || "").trim();

    if (!catRaw || /^(productos?|producto)s?$/i.test(catRaw)) {
      const id = Number(prod.id_categoria ?? prod.idCategoria ?? prod.categoryId ?? prod.id_categoria);
      if (!Number.isNaN(id) && idToSlug[id]) return idToSlug[id];
      return null;
    }
    return slugify(catRaw);
  };

  const pool = productos
    .filter(p => String(p.id_producto) !== String(currentProductId))
    .filter(p => {
      try { return !!getCategorySlug(p); } 
      catch { return false; }
    });

  const listA = shuffle(pool).slice(0, Math.min(10, pool.length));
  const remainingPool = pool.filter(p => !listA.some(a => a.id_producto === p.id_producto));
  const listB = shuffle(remainingPool.length ? remainingPool : pool).slice(0, Math.min(10, pool.length));

  function scroll(ref, dir = 1) {
    const el = ref.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="w-full mt-12 space-y-12">
        {[0, 1].map(idx => (
          <section key={idx} className="animate-pulse bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="h-8 bg-slate-100 rounded-lg w-64"></div>
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
              </div>
            </div>
            <div className="flex gap-6 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-[240px] flex-shrink-0">
                  <div className="h-[240px] bg-slate-100 rounded-2xl mb-4"></div>
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
    <div className="w-full mt-12 space-y-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {carousels.map((group, idx) => {
        if (group.items.length === 0) return null;

        return (
          <section key={idx} className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            {/* Header del carrusel */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <FiPackage className="text-blue-600" /> {group.title}
                </h3>
                <p className="text-slate-500 font-medium mt-1">{group.subtitle}</p>
              </div>
              
              {/* Controles de navegación */}
              <div className="flex gap-2">
                <button 
                  aria-label="Anterior" 
                  onClick={() => scroll(group.ref, -1)} 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  aria-label="Siguiente" 
                  onClick={() => scroll(group.ref, 1)} 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Carrusel de productos */}
            <div className="relative">
              {/* Sombras difusas a los lados para indicar scroll */}
              <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
              
              <div 
                ref={group.ref} 
                className="flex gap-4 sm:gap-6 overflow-x-auto custom-scrollbar pb-6 pt-2 snap-x snap-mandatory"
              >
                {group.items.map(p => {
                  const categorySlug = getCategorySlug(p);
                  if (!categorySlug) return null;
                  const detailSlug = slugify(p.nombre_producto || p.title || String(p.id_producto || p.id || ""));
                  const detailPath = `/${encodeURIComponent(categorySlug)}/${encodeURIComponent(detailSlug)}`;
                  
                  return (
                    <ProductCardSimple
                      key={p.id_producto || p.id}
                      p={p}
                      onClick={() => nav(detailPath)}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}