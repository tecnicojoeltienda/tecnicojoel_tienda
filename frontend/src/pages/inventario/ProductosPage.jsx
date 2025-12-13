import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductoCard from "../../components/inventario/ProductoCard.jsx";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function DashboardPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filtros
  const [q, setQ] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [estado, setEstado] = useState("");

  const navigate = useNavigate();

  async function cargarProductos() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/productos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al obtener productos");
      const data = await res.json();
      setProductos(data || []);
    } catch (err) {
      setError("No se pudieron cargar los productos");
    } finally {
      setLoading(false);
    }
  }

  async function cargarCategorias() {
    try {
      const res = await fetch(`${API}/apij/categorias`);
      if (!res.ok) return;
      const data = await res.json();
      setCategorias(data || []);
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filtrado cliente
  const productosFiltrados = productos.filter((p) => {
    if (q && !String(p.nombre_producto || "").toLowerCase().includes(q.toLowerCase())) return false;
    if (categoriaId && String(p.id_categoria) !== String(categoriaId)) return false;
    if (estado && String(p.estado) !== String(estado)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                <span>Inventario</span>
                <span className="inline-block ml-2 px-2 py-1 text-xs font-semibold rounded bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow">Admin</span>
              </h1>
              <p className="mt-1 text-sm text-gray-600">Administra productos — crea, edita y filtra fácilmente.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => cargarProductos()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow hover:from-blue-700 hover:to-blue-800 transition"
                title="Actualizar lista"
              >
                Actualizar
              </button>

              <button
                onClick={() => navigate("/inventario/productos/nuevo")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-lg shadow hover:from-rose-500 hover:to-rose-600 transition"
                title="Crear nuevo producto"
              >
                + Crear producto
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Buscar por nombre</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej. Laptop Lenovo"
                className="w-full border rounded-lg px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria || c.id} value={c.id_categoria || c.id}>
                    {c.nombre_categoria || c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">Todos</option>
                <option value="disponible">Disponible</option>
                <option value="no disponible">No disponible</option>
                <option value="agotado">Agotado</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="px-3 py-2 bg-white rounded-lg border shadow-sm">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-lg font-semibold text-gray-900">{productos.length}</div>
              </div>
              <div className="px-3 py-2 bg-white rounded-lg border shadow-sm">
                <div className="text-xs text-gray-500">Filtrados</div>
                <div className="text-lg font-semibold text-blue-600">{productosFiltrados.length}</div>
              </div>
            </div>

            <div className="text-sm text-gray-500">Sugerencia: usa el buscador para encontrar productos rápido.</div>
          </div>
        </header>

        {loading && <div className="text-center py-16 text-gray-500">Cargando productos...</div>}
        {error && <div className="text-center py-6 text-rose-500">{error}</div>}

        {!loading && !error && (
          <>
            {productosFiltrados.length === 0 ? (
              <div className="py-20 text-center text-gray-500">
                No se encontraron productos con esos filtros.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productosFiltrados.map((p) => (
                  <div key={p.id_producto || p.id} className="relative group">
                    <ProductoCard producto={p} onUpdated={cargarProductos} />
                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/inventario/productos/${p.id_producto || p.id}/editar`)}
                        className="px-3 py-1 bg-white border rounded-md text-sm text-blue-600 shadow hover:bg-gray-50"
                        aria-label={`Editar ${p.nombre_producto || ""}`}
                      >
                        Editar
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className={`text-xs font-medium px-2 py-1 rounded ${p.estado === "disponible" ? "bg-green-50 text-green-700" : p.estado === "agotado" ? "bg-yellow-50 text-yellow-700" : "bg-rose-50 text-rose-700"}`}>
                        {p.estado || "sin estado"}
                      </div>
                      <div className="text-sm font-semibold text-gray-800">{p.precio_venta ? `S/. ${Number(p.precio_venta).toLocaleString()}` : "Consultar"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}