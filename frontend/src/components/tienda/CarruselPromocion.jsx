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

  const formatCurrency = (v) =>
    v == null || v === "" ? "Consultar" : `S/. ${Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className="w-full py-6">
      <div className="w-full mx-0 px-2 sm:px-4 lg:px-6">
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

                  let descuento = 0;
                  if (p.precio_lista && p.precio_venta && Number(p.precio_lista) > Number(p.precio_venta)) {
                    const lista = Number(p.precio_lista);
                    const venta = Number(p.precio_venta);
                    descuento = Math.round(((lista - venta) / lista) * 100);
                  }

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

                          {descuento > 0 && (
                            <span className="absolute right-3 top-3 bg-green-600 text-xs font-semibold px-2 py-1 rounded-md shadow">
                              -{descuento}%
                            </span>
                          )}
                        </div>

                        <div className="mt-3">
                          <div className="text-sm font-semibold leading-tight text-black truncate">{p.nombre_producto || p.nombre}</div>

                          <div className="mt-2 flex items-end justify-between gap-3">
                            <div>
                              <div className="text-lg font-extrabold text-black">{formatCurrency(p.precio_venta)}</div>
                              {p.precio_lista && Number(p.precio_lista) > Number(p.precio_venta) && (
                                <div className="mt-1 text-xs text-black/70 line-through">
                                  S/. {Number(p.precio_lista).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                            </div>

                            <div className="text-sm text-green-700 font-semibold">
                              {descuento > 0 ? `-${descuento}%` : ""}
                            </div>
                          </div>

                          <div className="mt-2 text-xs text-black/80">
                            {p.stock != null ? `Stock: ${p.stock}` : ""}
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