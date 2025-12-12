// ...existing code...
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import FiltersPanel from "../../layouts/tienda/FiltersPanel";
import api, { resolveImageUrl } from "../../service/api";
import { useCart } from "../../context/CartContext";

export default function CategoriaPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [filters, setFilters] = useState({ availability: "all", view: "grid", sort: "relevance" });

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const res = await api.get("/apij/productos/categoria/nombre/CATEGORY_SLUG");
        const rows = Array.isArray(res.data) ? res.data : (res.data.rows || []);
        setProductos(rows);
      } catch (err) {
        console.error("Error cargando CATEGORY_SLUG por categoría:", err);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

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

  const resetFilters = () => setFilters({ availability: "all", view: "grid", sort: "relevance" });

  const filteredProducts = useMemo(() => {
    let res = productos.slice();
    if (filters.availability === "in") res = res.filter(isInStock);
    if (filters.availability === "out") res = res.filter(p => !isInStock(p));
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

  const slugify = (s = "") =>
    s.toString().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

  const renderProduct = (p) => {
    const imageUrl = resolveImageUrl(p.imagen_url);
    const category = (p.categoria || "CATEGORY_SLUG").toString().toLowerCase();
    const detailPath = `/${encodeURIComponent(category)}/${encodeURIComponent(slugify(p.nombre_producto || p.title || String(p.id_producto || p.id || "")))}`;
    const styles = {
      cardClass: "block rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white h-full",
      imageHeight: "h-56",
      contentClass: "p-3",
      titleClass: "text-sm font-semibold text-gray-900 mb-1",
      descClass: "text-sm text-gray-600 mb-2 line-clamp-2",
      priceClass: "text-sm font-semibold text-black",
      oldPriceClass: "text-xs text-gray-500 line-through"
    };

    return (
      <article key={p.id_producto || p.id || p.codigo} className={styles.cardClass}>
        <div className={`w-full flex items-center justify-center bg-gray-50 ${styles.imageHeight}`}>{imageUrl ? <Link to={detailPath}><img src={imageUrl} alt={p.nombre_producto} className="max-h-full max-w-full object-contain p-2" /></Link> : <div className="text-xs text-gray-400">Sin imagen</div>}</div>
        <div className={styles.contentClass}>
          <h2 className={styles.titleClass}><Link to={detailPath} className="hover:underline">{p.nombre_producto}</Link></h2>
          <p className={styles.descClass}>{p.descripcion || p.resumen || "Sin descripción disponible"}</p>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <div className={styles.priceClass}>S/. {Number(p.precio_venta || 0).toFixed(2)}</div>
              <div className={styles.oldPriceClass}>S/. {(Number(p.precio_venta || 0) * 1.2).toFixed(2)}</div>
            </div>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p); }} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Añadir</button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderTienda />
      <main className="w-full mx-0 px-4 sm:px-4 lg:px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 order-1 ml-4 self-start">
            <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-auto">
              <FiltersPanel values={filters} onChange={(key, value) => setFilters(f => ({ ...f, [key]: value }))} onReset={resetFilters} productCount={filteredProducts.length} />
            </div>
          </aside>
          <section className="flex-1 order-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">PAGE_TITLE</h1>
              <p className="text-gray-600">Colección de PAGE_TITLE</p>
            </div>
            {loading ? (
              <div className={getGridClasses()}>{[...Array(6)].map((_, i) => (<div key={i} className="bg-white rounded-lg animate-pulse shadow-sm"><div className={`bg-gray-200 ${"h-56"}`}></div><div className="p-4 space-y-2"><div className="h-4 bg-gray-200 rounded"></div><div className="h-3 bg-gray-200 rounded w-2/3"></div></div></div>))}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm"><div className="text-6xl mb-4">📦</div><h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3><p className="text-gray-600">No se encontraron productos que cumplan con los filtros seleccionados.</p><button onClick={resetFilters} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Limpiar filtros</button></div>
            ) : (
              <div className={getGridClasses()}>{filteredProducts.map(renderProduct)}</div>
            )}
          </section>
        </div>
      </main>
      <FooterTienda />
    </div>
  );
}
// ...existing code...