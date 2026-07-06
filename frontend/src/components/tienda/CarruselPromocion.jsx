import { useEffect, useState, useRef } from "react";
import { FiChevronLeft, FiChevronRight, FiTag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api, { resolveImageUrl } from "../../service/api";

export default function CarruselPromocion() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(4);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function updateVisible() {
      const w = window.innerWidth;
      if (w >= 1280) setVisible(4);
      else if (w >= 1024) setVisible(3);
      else if (w >= 768) setVisible(2);
      else setVisible(1);
    }
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/apij/productos");
        const data = Array.isArray(res.data) ? res.data : (res.data.rows || []);
        if (!mounted) return;
        const promos = (data || []).filter(
          (p) =>
            p &&
            (String(p.en_promocion).toLowerCase() === "si" ||
              String(p.en_promocion).toLowerCase() === "true" ||
              p.en_promocion === true)
        );
        setItems(promos);
      } catch (err) {
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  const maxIndex = Math.max(0, (items.length || 0) - visible);
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [visible, maxIndex]);

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    setIndex((i) => Math.min(maxIndex, i + 1));
  }

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

  function goTo(product) {
    if (!product) return;
    const categorySlug = getCategorySlug(product);
    const productSlug = slugify(product.nombre_producto || product.nombre || product.title || String(product.id_producto || product.id || ""));
    if (categorySlug) {
      navigate(`/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productSlug)}`);
    } else {
      const id = product.id_producto || product.id;
      if (id) navigate(`/tienda/producto/${id}`);
    }
  }

  const toNumber = (v) => {
    if (v == null || v === "") return 0;
    const n = Number(String(v).replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const formatCurrency = (v) => {
    const n = toNumber(v);
    return n === 0 ? "Consultar" : `S/. ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="bg-slate-900 rounded-[2rem] p-6 md:p-10 lg:p-12 relative overflow-hidden shadow-2xl">
        
        {/* Fondo sutil profesional */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700 via-slate-900 to-slate-900 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FiTag className="text-blue-500 w-4 h-4" />
              <span className="text-blue-400 text-xs font-bold uppercase tracking-[0.2em]">
                Ofertas Exclusivas
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Precios Especiales
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              disabled={index === 0}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-md"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              disabled={index >= maxIndex}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-md"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="relative z-10 overflow-hidden">
          <div
            ref={containerRef}
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(-${(index * 100) / visible}%)` }}
          >
            {loading ? (
              Array.from({ length: visible }).map((_, i) => (
                <div key={i} className="flex-shrink-0 px-3" style={{ width: `${100 / visible}%` }}>
                  <div className="h-[400px] bg-white/5 rounded-[1.5rem] animate-pulse border border-white/10" />
                </div>
              ))
            ) : (
              items.map((p) => {
                const src = resolveImageUrl(p.imagen_url || p.imagen) || "/assets/placeholder.png";
                const precioOriginal = toNumber(p.precio_lista);
                const precioPromocion = toNumber(p.precio_venta);
                
                let descuento = 0;
                let ahorro = 0;

                if (precioOriginal > 0 && precioPromocion > 0 && precioOriginal > precioPromocion) {
                  ahorro = precioOriginal - precioPromocion;
                  descuento = Math.round((ahorro / precioOriginal) * 100);
                }

                return (
                  <div key={p.id_producto || p.id} className="flex-shrink-0 px-3" style={{ width: `${100 / visible}%` }}>
                    <div
                      className="group bg-white rounded-[1.5rem] p-5 flex flex-col h-full cursor-pointer transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-2 border border-slate-200"
                      onClick={() => goTo(p)}
                    >
                      <div className="relative w-full aspect-[4/3] bg-slate-50/50 rounded-xl mb-5 p-6 flex items-center justify-center overflow-hidden">
                        {descuento > 0 && (
                          <span className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md z-10 shadow-sm tracking-wider">
                            -{descuento}%
                          </span>
                        )}
                        <img 
                          src={src} 
                          alt={p.nombre_producto} 
                          className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110" 
                          loading="lazy" 
                        />
                      </div>

                      <div className="flex flex-col flex-grow px-1">
                        <div className="text-[15px] font-semibold leading-relaxed text-slate-900 line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">
                          {p.nombre_producto}
                        </div>

                        <div className="mt-auto flex items-end justify-between">
                          <div>
                            {precioOriginal > 0 && descuento > 0 && (
                              <div className="text-xs font-medium text-slate-400 line-through mb-1">
                                S/. {precioOriginal.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            )}
                            <div className="text-xl font-extrabold text-slate-900">
                              {formatCurrency(precioPromocion)}
                            </div>
                          </div>
                          
                          {ahorro > 0 && (
                            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                              Ahorras S/. {ahorro.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}