import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { resolveImageUrl } from "../../service/api";
import { FiChevronLeft, FiChevronRight, FiShoppingCart, FiCpu, FiMonitor } from "react-icons/fi";
import { useCart } from "../../context/CartContext";

function useViewportVisible(defaultVisible = 2) {
  const [visible, setVisible] = useState(defaultVisible);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1280) setVisible(2); // Ajustado para 2 cards dentro del grid de la mitad
      else if (w >= 1024) setVisible(2);
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

  const visible = useViewportVisible(2);
  const navigate = useNavigate();

  const containerLeft = useRef(null);
  const containerRight = useRef(null);

  const [canLeftPrev, setCanLeftPrev] = useState(false);
  const [canLeftNext, setCanLeftNext] = useState(false);
  const [canRightPrev, setCanRightPrev] = useState(false);
  const [canRightNext, setCanRightNext] = useState(false);

  const { addToCart } = useCart();

  const slugify = (s = "") => s.toString().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

  const getCategorySlug = (prod = {}) => {
    // ... Misma lógica que los anteriores para optimizar espacio en lectura
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
        setLoading(true);
        const res1 = await api.get("/apij/productos/categoria/nombre/accesorios");
        const res2 = await api.get("/apij/productos/categoria/nombre/componentes");
        let data1 = Array.isArray(res1.data) ? res1.data : res1.data.rows || [];
        let data2 = Array.isArray(res2.data) ? res2.data : res2.data.rows || [];
        data1 = data1.filter((p) => getCategorySlug(p) !== null).sort((a, b) => (Number(a.precio_venta) || 0) - (Number(b.precio_venta) || 0));
        data2 = data2.filter((p) => getCategorySlug(p) !== null).sort((a, b) => (Number(a.precio_venta) || 0) - (Number(b.precio_venta) || 0));
        if (mounted) { setAccesorios(data1); setComponentes(data2); }
      } catch (err) {
        if (mounted) { setAccesorios([]); setComponentes([]); }
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
    const left = containerLeft.current; const right = containerRight.current;
    if (left) updateControls(containerLeft, setCanLeftPrev, setCanLeftNext);
    if (right) updateControls(containerRight, setCanRightPrev, setCanRightNext);
    const onScrollLeft = () => updateControls(containerLeft, setCanLeftPrev, setCanLeftNext);
    const onScrollRight = () => updateControls(containerRight, setCanRightPrev, setCanRightNext);
    left?.addEventListener("scroll", onScrollLeft); right?.addEventListener("scroll", onScrollRight);
    return () => { left?.removeEventListener("scroll", onScrollLeft); right?.removeEventListener("scroll", onScrollRight); };
  }, [accesorios, componentes, visible]);

  const scrollOne = (ref, direction = 1) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: amount * direction, behavior: "smooth" });
  };

  const handleProductClick = (p) => {
    const categorySlug = getCategorySlug(p);
    if (!categorySlug) return;
    const productSlug = slugify(p.nombre_producto || p.title || String(p.id_producto || p.id || ""));
    navigate(`/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productSlug)}`);
  };

  const renderProductCard = (p) => {
    const img = resolveImageUrl(p.imagen_url);
    return (
      <article
        key={p.id_producto ?? p.id}
        onClick={() => handleProductClick(p)}
        className="group flex-shrink-0 snap-start bg-white rounded-[1.5rem] border border-slate-200/60 p-4 cursor-pointer transition-all duration-300 hover:border-transparent hover:shadow-[0_15px_40px_-10px_rgba(37,99,235,0.15)] hover:-translate-y-1 flex flex-col w-[240px] sm:w-[260px]"
      >
        {/* MARCO LLAMATIVO: Degradado Azul -> Rojo -> Gris */}
        <div className="relative w-full aspect-square rounded-2xl p-[3px] bg-gradient-to-br from-blue-600 via-red-500 to-slate-400 mb-4 transition-all duration-500 group-hover:shadow-[0_8px_25px_rgba(37,99,235,0.3)] group-hover:scale-[1.02]">
          
          {/* Fondo interno de la imagen */}
          <div className="relative w-full h-full bg-white rounded-[13px] flex items-center justify-center p-4 overflow-hidden">
            <img 
              src={img} 
              alt={p.nombre_producto} 
              className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" 
              loading="lazy" 
            />
          </div>
        </div>

        <div className="flex flex-col flex-grow px-1">
          <h4 className="text-[14px] sm:text-[15px] font-semibold text-slate-900 line-clamp-2 leading-snug mb-3 group-hover:text-blue-600 transition-colors flex-grow">
            {p.nombre_producto}
          </h4>
          <div className="flex items-end justify-between pt-3 border-t border-slate-100">
            <div className="text-lg font-extrabold text-blue-700 tracking-tight">
              {p.precio_venta != null ? `S/. ${Number(p.precio_venta).toLocaleString()}` : "Consultar"}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); addToCart(p); }}
              className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 text-blue-600 flex items-center justify-center transition-all duration-300 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/30 hover:scale-110"
            >
              <FiShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Box Accesorios */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <FiMonitor className="text-blue-600" /> Accesorios
              </h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scrollOne(containerLeft, -1)} className="w-9 h-9 rounded-full bg-white border border-slate-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-all">
                <FiChevronLeft />
              </button>
              <button onClick={() => scrollOne(containerLeft, 1)} className="w-9 h-9 rounded-full bg-white border border-slate-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-all">
                <FiChevronRight />
              </button>
            </div>
          </div>
          <div ref={containerLeft} className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 snap-x snap-mandatory">
            {loading ? [...Array(3)].map((_, i) => <div key={i} className="w-[240px] h-[300px] bg-slate-50 animate-pulse rounded-2xl flex-shrink-0" />) : accesorios.map(renderProductCard)}
          </div>
        </div>

        {/* Box Componentes */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <FiCpu className="text-blue-600" /> Componentes
              </h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scrollOne(containerRight, -1)} className="w-9 h-9 rounded-full bg-white border border-slate-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-all">
                <FiChevronLeft />
              </button>
              <button onClick={() => scrollOne(containerRight, 1)} className="w-9 h-9 rounded-full bg-white border border-slate-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-all">
                <FiChevronRight />
              </button>
            </div>
          </div>
          <div ref={containerRight} className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 snap-x snap-mandatory">
            {loading ? [...Array(3)].map((_, i) => <div key={i} className="w-[240px] h-[300px] bg-slate-50 animate-pulse rounded-2xl flex-shrink-0" />) : componentes.map(renderProductCard)}
          </div>
        </div>

      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </section>
  );
}