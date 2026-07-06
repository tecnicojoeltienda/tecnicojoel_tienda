import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { resolveImageUrl } from "../../service/api";
import { FiChevronLeft, FiChevronRight, FiShoppingCart, FiBox, FiStar, FiHeart } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { toast } from 'sonner';

const CATEGORY_KEYS = { ALL: "ALL", LAPTOPS: "LAPTOPS", COMPUTADORAS: "COMPUTADORAS", MONITORES: "MONITORES", IMPRESORAS: "IMPRESORAS", MOUSE: "MOUSE", ACCESORIOS: "ACCESORIOS" };
const CATEGORY_API_SLUG = { [CATEGORY_KEYS.LAPTOPS]: "laptops", [CATEGORY_KEYS.COMPUTADORAS]: "pcs", [CATEGORY_KEYS.MONITORES]: "monitores", [CATEGORY_KEYS.IMPRESORAS]: "impresoras", [CATEGORY_KEYS.MOUSE]: "mouse", [CATEGORY_KEYS.ACCESORIOS]: "accesorios" };
const CATEGORY_LABELS = { [CATEGORY_KEYS.ALL]: "Todos", [CATEGORY_KEYS.LAPTOPS]: "Laptops", [CATEGORY_KEYS.COMPUTADORAS]: "PCs", [CATEGORY_KEYS.MONITORES]: "Monitores", [CATEGORY_KEYS.IMPRESORAS]: "Impresoras", [CATEGORY_KEYS.MOUSE]: "Mouse", [CATEGORY_KEYS.ACCESORIOS]: "Accesorios" };

export default function Novedades() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(CATEGORY_KEYS.ALL);
  
  const containerRef = useRef(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const slugify = (s = "") => s.toString().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

  const getCategorySlug = (prod = {}) => {
    const idToSlug = { 1: "pcs", 2: "laptops", 3: "monitores", 4: "mouse", 5: "accesorios", 6: "sonido", 7: "tintas", 8: "licencia", 9: "reacondicionados", 10: "redes", 11: "impresoras", 12: "componentes", 13: "estabilizadores" };
    const tryValues = [prod.categoria, prod.categoria_nombre, prod.categoria_slug, prod.category, prod.category_name, prod.categoriaName, prod.tipo, prod.categoria?.nombre, prod.categoria?.slug, prod.category?.name, prod.category?.slug];
    let catRaw = "";
    for (const v of tryValues) {
      if (v === 0 || v === "0") continue;
      if (v && typeof v === "string" && v.trim() !== "") { catRaw = v; break; }
      if (v && typeof v === "object") { catRaw = v.slug || v.nombre || v.name || v.title || ""; if (catRaw) break; }
    }
    catRaw = String(catRaw || "").trim();
    if (!catRaw || /^(productos?|producto)s?$/i.test(catRaw)) {
      const id = Number(prod.id_categoria ?? prod.idCategoria ?? prod.categoryId);
      if (!Number.isNaN(id) && idToSlug[id]) return idToSlug[id];
      return null;
    }
    return slugify(catRaw);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true); setError(null);
        let url = "/apij/productos";
        if (category !== CATEGORY_KEYS.ALL) {
          const slug = CATEGORY_API_SLUG[category];
          if (!slug) { setProducts([]); return; }
          url = `/apij/productos/categoria/nombre/${slug}`;
        }
        const res = await api.get(url);
        let data = Array.isArray(res.data) ? res.data : res.data.rows || [];
        data = data.filter((p) => getCategorySlug(p) !== null);
        data.sort((a, b) => (Number(a.precio_venta) || 0) - (Number(b.precio_venta) || 0));
        if (mounted) setProducts(data.slice(0, 12));
      } catch (err) {
        if (mounted) { setError("Error al cargar productos"); setProducts([]); }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
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
    navigate(`/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productSlug)}`);
  };

  if (error) return null;

  return (
    <section className="w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="w-full mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2"> 
              Productos Populares 
            </h2>
            <p className="text-slate-500 font-medium">
              Descubre las tendencias favoritas de nuestros clientes
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            {Object.keys(CATEGORY_KEYS).map((k) => {
              const active = category === CATEGORY_KEYS[k];
              return (
                <button
                  key={k}
                  onClick={() => setCategory(CATEGORY_KEYS[k])}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                    active
                      ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]"
                      : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/60"
                  }`}
                >
                  {CATEGORY_LABELS[CATEGORY_KEYS[k]]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative group/slider">
          <button onClick={() => scrollByWidth(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-20 w-12 h-12 rounded-full bg-white shadow-xl text-blue-600 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:scale-110 border border-slate-100 hidden md:flex">
            <FiChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => scrollByWidth(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-20 w-12 h-12 rounded-full bg-white shadow-xl text-blue-600 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:scale-110 border border-slate-100 hidden md:flex">
            <FiChevronRight className="w-6 h-6" />
          </button>

          <div 
            ref={containerRef}
            className="flex gap-6 overflow-x-auto pb-10 pt-2 px-2 custom-scrollbar snap-x snap-mandatory"
          >
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[280px] h-[380px] bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
              ))
            ) : products.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-16">
                <FiBox className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No hay productos en esta categoría</p>
              </div>
            ) : (
              products.map((p) => (
                <article
                  key={p.id_producto ?? p.id}
                  onClick={() => handleProductClick(p)}
                  className="group flex-shrink-0 w-[260px] sm:w-[280px] snap-start bg-white rounded-[1.5rem] border border-slate-200/60 p-4 cursor-pointer transition-all duration-300 hover:border-transparent hover:shadow-[0_15px_40px_-10px_rgba(37,99,235,0.15)] hover:-translate-y-1 flex flex-col"
                >
                  
                  <div className="relative w-full aspect-square rounded-2xl p-[3px] bg-gradient-to-br from-blue-600 via-red-500 to-slate-400 mb-5 transition-all duration-500 group-hover:shadow-[0_8px_25px_rgba(37,99,235,0.3)] group-hover:scale-[1.02]">
                    
                    <div className="relative w-full h-full bg-white rounded-[13px] flex items-center justify-center p-5 overflow-hidden">
                      
                      {p.categoria && (
                        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-md border border-slate-100 shadow-sm">
                          {p.categoria}
                        </div>
                      )}
                      
                      <button onClick={(e) => { e.stopPropagation(); }} className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-red-500 hover:scale-110 shadow-sm">
                        <FiHeart className="w-4 h-4" />
                      </button>
                      
                      <img 
                        src={resolveImageUrl(p.imagen_url)} 
                        alt={p.nombre_producto} 
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" 
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col flex-grow px-1">
                    <h3 className="text-[15px] font-semibold text-slate-900 line-clamp-2 leading-snug mb-3 group-hover:text-blue-600 transition-colors flex-grow">
                      {p.nombre_producto}
                    </h3>
                    <div className="flex items-center gap-1 mb-4">
                      <FiStar className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span className="text-xs font-medium text-slate-500">4.9</span>
                    </div>

                    <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                      <div>
                        {p.precio_lista && Number(p.precio_lista) > Number(p.precio_venta) && (
                          <div className="text-xs font-medium text-slate-400 line-through mb-0.5">
                            S/. {Number(p.precio_lista).toLocaleString()}
                          </div>
                        )}
                        <div className="text-lg font-extrabold text-blue-700">
                          {p.precio_venta != null ? `S/. ${Number(p.precio_venta).toLocaleString()}` : "Consultar"}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-blue-600 flex items-center justify-center transition-all duration-300 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/30 hover:scale-110"
                      >
                        <FiShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}