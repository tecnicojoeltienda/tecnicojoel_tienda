import { useEffect, useState, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
      if (w >= 1280) setVisible(5);
      else if (w >= 1024) setVisible(4);
      else if (w >= 768) setVisible(3);
      else if (w >= 640) setVisible(2);
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

  function goTo(product) {
    if (!product) return;
    const id = product.id_producto || product.id;
    navigate(`/tienda/producto/${id}`);
  }

  const formatCurrency = (v) =>
    v == null || v === "" ? "Consultar" : `S/. ${Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className="w-full py-6">
      {/* estira el contenedor a los costados: menos margen lateral */}
      <div className="w-full mx-0 px-2 sm:px-4 lg:px-6">
        {/* contenedor blanco / degradado más ancho, shadow más notorio y font-family forzada */}
        <div
          className="rounded-2xl bg-gradient-to-r from-black via-gray-800 to-black/90 text-white overflow-hidden"
          style={{
            boxShadow: "0 34px 90px rgba(2,6,23,0.28)",
            fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            padding: "20px",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold">Ofertas en promoción</h3>
              <p className="mt-1 text-sm text-white/80">Solo productos que están en promoción — encuentra descuentos destacados.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                disabled={index === 0}
                aria-label="Anterior promociones"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                disabled={index >= maxIndex}
                aria-label="Siguiente promociones"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-6 relative">
            <div
              ref={containerRef}
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${(index * 100) / visible}%)` }}
            >
              {loading ? (
                Array.from({ length: visible }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2">
                    <div className="h-44 bg-white/6 rounded-lg animate-pulse" />
                  </div>
                ))
              ) : items.length === 0 ? (
                <div className="text-center text-white/80 py-12 w-full">No hay promociones en este momento.</div>
              ) : (
                items.map((p) => {
                  const key = p.id_producto || p.id || JSON.stringify(p);
                  const src = resolveImageUrl(p.imagen_url || p.imagen) || "/assets/placeholder.png";
                  return (
                    <div
                      key={key}
                      className="flex-shrink-0 px-2"
                      style={{ width: `${100 / visible}%` }}
                    >
                      <div
                        className="h-56 rounded-xl bg-white p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => goTo(p)}
                        role="button"
                      >
                        <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-white">
                          <img
                            src={src}
                            alt={p.nombre_producto || p.nombre || "Producto"}
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                          />
                          <span className="absolute left-3 top-3 bg-red-600 text-xs font-semibold px-2 py-1 rounded-md shadow">
                            PROMO
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="text-sm font-semibold leading-tight text-gray-900 truncate">{p.nombre_producto || p.nombre}</div>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-lg font-bold text-gray-900">{formatCurrency(p.precio_venta)}</div>
                            <div className="text-xs text-gray-600">{p.stock != null ? `Stock: ${p.stock}` : ""}</div>
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
      </div>
    </section>
  );
}