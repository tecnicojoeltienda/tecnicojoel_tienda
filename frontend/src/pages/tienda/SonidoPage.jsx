import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import FiltersPanel from "../../layouts/tienda/FiltersPanel";
import api, { resolveImageUrl } from "../../service/api";
import { useCart } from "../../context/CartContext";
import { toast } from 'sonner';
import ScrollToTop from "../../components/ScrollToTop";

export default function SonidoPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const [filters, setFilters] = useState({
    availability: "all",
    view: "grid",
    sort: "relevance",
    min: "",
    max: "",
  });

  const [page, setPage] = useState(1);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const res = await api.get("/apij/productos/categoria/nombre/sonido");
        const rows = Array.isArray(res.data) ? res.data : (res.data.rows || []);
        setProductos(shuffleArray(rows));
      } catch (err) {
        console.error("Error cargando sonido por categoría:", err);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters.availability, filters.view, filters.sort, filters.min, filters.max]);

  const isInStock = (p) => {
    const candidates = [p.stock, p.cantidad, p.cantidad_stock, p.stock_actual, p.stock_minimo];
    for (const c of candidates) {
      if (typeof c !== "undefined" && c !== null && c !== "") {
        const n = Number(c);
        if (!Number.isNaN(n)) return n > 0;
      }
    }
    return true;
  };

  const resetFilters = () => {
    setFilters({ availability: "all", view: "grid", sort: "relevance" });
  };

  const filteredProducts = useMemo(() => {
    let res = productos.slice();
    if (filters.availability === "in") res = res.filter(isInStock);
    if (filters.availability === "out") res = res.filter(p => !isInStock(p));

    if (filters.min || filters.max) {
      res = res.filter(p => {
        const precio = Number(p.precio_venta) || 0;
        const min = filters.min ? Number(filters.min) : 0;
        const max = filters.max ? Number(filters.max) : Infinity;
        return precio >= min && precio <= max;
      });
    }

    res.sort((a, b) => {
      if (filters.sort === "name_asc") return String(a.nombre_producto || "").localeCompare(String(b.nombre_producto || ""));
      if (filters.sort === "name_desc") return String(b.nombre_producto || "").localeCompare(String(a.nombre_producto || ""));
      if (filters.sort === "price_asc") return (Number(a.precio_venta) || 0) - (Number(b.precio_venta) || 0);
      if (filters.sort === "price_desc") return (Number(b.precio_venta) || 0) - (Number(a.precio_venta) || 0);
      if (filters.sort === "sales_desc") return (Number(b.ventas || b.sales || 0) || 0) - (Number(a.ventas || a.sales || 0) || 0);
      return 0;
    });

    return res;
  }, [productos, filters]);

  const getGridClasses = () => {
    switch (filters.view) {
      case "grid-large": return "grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-8";
      case "grid-medium": return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";
      case "list": return "flex flex-col space-y-6";
      default: return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
    }
  };

  const getCardStyles = () => {
    switch (filters.view) {
      case "grid-large":
        return { cardClass: "block rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white h-full", imageHeight: "h-80", contentClass: "p-4", titleClass: "text-sm font-semibold text-gray-900 mb-1", descClass: "text-sm text-gray-600 mb-2 line-clamp-2", priceClass: "text-base font-semibold text-black", oldPriceClass: "text-xs text-gray-500 line-through" };
      case "grid-medium":
        return { cardClass: "block rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white h-full", imageHeight: "h-56", contentClass: "p-3", titleClass: "text-sm font-medium text-gray-900 truncate", descClass: "text-sm text-gray-500 mt-1 line-clamp-1", priceClass: "text-sm font-semibold text-black", oldPriceClass: "text-xs text-gray-500 line-through" };
      default:
        return { cardClass: "block rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white h-full", imageHeight: "h-56", contentClass: "p-3", titleClass: "text-sm font-semibold text-gray-900 mb-1", descClass: "text-sm text-gray-600 mb-2 line-clamp-2", priceClass: "text-sm font-semibold text-black", oldPriceClass: "text-xs text-gray-500 line-through" };
    }
  };

  const slugify = (s = "") =>
    s
      .toString()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const isPromo = (p) => {
    const v = p.en_promocion ?? p.promocion ?? p.promo;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return ["si", "sí", "true", "1"].includes(v.toLowerCase());
    if (typeof v === "number") return v === 1;
    return false;
  };

  const isOnOffer = (p) => {
    if (p.oferta || p.en_oferta || p.descuento || p.porcentaje) return true;
    const precioOferta = Number(p.precio_oferta || p.precio_promocion || 0);
    const precioVenta = Number(p.precio_venta || 0);
    if (precioOferta && precioVenta && precioOferta < precioVenta) return true;
    return false;
  };

  const itemsPerPage = filters.view === "list" ? 6 : filters.view === "grid-large" ? 6 : filters.view === "grid-medium" ? 12 : 9;
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const renderProduct = (p) => {
    const imageUrl = resolveImageUrl(p.imagen_url);
    const category = (p.categoria || "sonido").toString().toLowerCase();
    const detailPath = `/${encodeURIComponent(category)}/${encodeURIComponent(slugify(p.nombre_producto || p.title || String(p.id_producto || p.id || "")))}`;
    const styles = getCardStyles();

    const promoBadge = <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">promocion</span>;
    const ofertaBadge = <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">OFERTA</span>;

    if (filters.view === "list") {
      return (
        <article
          key={p.id_producto || p.id || p.codigo}
          className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-6 rounded-xl hover:shadow-lg transition-all duration-200 bg-white"
        >
          <div className="w-full sm:w-40 h-52 sm:h-40 flex items-center justify-center bg-white-50 rounded-lg overflow-hidden flex-shrink-0">
            {imageUrl ? (
              <Link to={detailPath} className="block w-full h-full flex items-center justify-center" title={p.nombre_producto}>
                <img src={imageUrl} alt={p.nombre_producto} className="max-w-full max-h-full object-contain p-2" />
              </Link>
            ) : <div className="text-xs text-gray-400">Sin imagen</div>}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
              <Link to={detailPath} className="hover:underline">{p.nombre_producto}</Link>
            </h2>

            <p className="text-sm text-gray-600 mb-3 line-clamp-3">{p.descripcion || p.resumen || "Sin descripción disponible"}</p>

            <div className="flex items-center gap-2 mb-3">
              {isInStock(p) ? <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">En stock</span> : <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-bold">AGOTADO</span>}
              {isPromo(p) && promoBadge}
              {isOnOffer(p) && ofertaBadge}
            </div>

            <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-base sm:text-lg font-semibold text-gray-900">S/. {Number(p.precio_venta || 0).toFixed(2)}</div>

              <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
                <Link to={detailPath} onClick={(e) => e.stopPropagation()} className="flex-1 sm:inline-block px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 text-center">Ver detalles</Link>

                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p); }} className="flex-1 sm:inline-block px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors" aria-label={`Añadir ${p.nombre_producto} al carrito`}>Añadir</button>
              </div>
            </div>
          </div>
        </article>
      );
    }

    return (
      <article key={p.id_producto || p.id || p.codigo} className={styles.cardClass}>
        <div className={`w-full flex items-center justify-center bg-white-50 ${styles.imageHeight} relative overflow-hidden`}>
          {imageUrl ? (
            <Link to={detailPath} className="block w-full h-full flex items-center justify-center" title={p.nombre_producto}>
              <img src={imageUrl} alt={p.nombre_producto} className="max-w-full max-h-full object-contain p-2" />
            </Link>
          ) : <div className="text-xs text-gray-400">Sin imagen</div>}
        </div>

        <div className={styles.contentClass}>
          <h2 className={styles.titleClass}><Link to={detailPath} className="hover:underline">{p.nombre_producto}</Link></h2>
          <p className={styles.descClass}>{p.descripcion || p.resumen || "Sin descripción disponible"}</p>

          <div className="flex items-center gap-2 mt-2">
            {isInStock(p) ? <span className="text-xs text-green-600 font-medium">Stock</span> : <span className="text-xs text-red-600 font-bold">AGOTADO</span>}
            {isPromo(p) && promoBadge}
            {isOnOffer(p) && ofertaBadge}
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <div className={styles.priceClass}>S/. {Number(p.precio_venta || 0).toFixed(2)}</div>
              <div className={styles.oldPriceClass}>S/. {(Number(p.precio_venta || 0) * 1.2).toFixed(2)}</div>
            </div>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p); }} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors" aria-label={`Añadir ${p.nombre_producto} al carrito`}>Añadir</button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderTienda />
      <ScrollToTop key={page} behavior="smooth" />
      <main className="w-full mx-0 px-4 sm:px-4 lg:px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 order-1 ml-4 self-start">
            <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-auto">
              <FiltersPanel values={filters} onChange={(key, value) => setFilters(f => ({ ...f, [key]: value }))} onReset={resetFilters} productCount={filteredProducts.length} />
            </div>
          </aside>

          <section className="flex-1 order-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Sonidos</h1>
              <p className="text-gray-600">Encuentra sonido para tu setup</p>
            </div>

            {loading ? (
              <div className={getGridClasses()}>{[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-lg animate-pulse shadow-sm"><div className={`bg-gray-200 ${"h-46"}`}></div><div className="p-4 space-y-2"><div className="h-4 bg-gray-200 rounded"></div><div className="h-3 bg-gray-200 rounded w-2/3"></div></div></div>)}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm"><div className="text-6xl mb-4"></div><h3 className="text-lg font-medium text-gray-900 mb-2">No hay sonido disponibles</h3><p className="text-gray-600">No se encontraron productos que cumplan con los filtros seleccionados.</p><button onClick={resetFilters} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Limpiar filtros</button></div>
            ) : (
              <>
                <div className={getGridClasses()}>{paginatedProducts.map(renderProduct)}</div>

                <div className="flex items-center justify-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Anterior</button>
                  {Array.from({ length: pageCount }).map((_, idx) => {
                    const pNum = idx + 1;
                    return <button key={pNum} onClick={() => setPage(pNum)} className={`px-3 py-1 rounded ${pNum === page ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{pNum}</button>;
                  })}
                  <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Siguiente</button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      <FooterTienda />
    </div>
  );
}