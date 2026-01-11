import { useEffect, useMemo, useState } from "react";
import { FiShoppingCart, FiUsers, FiPackage, FiRefreshCw, FiDollarSign, FiTrendingUp, FiTrendingDown, FiUserCheck } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL;

// Símbolo de soles peruanos
const SolesIcon = () => (
  <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L20 8L19 7V9C19 10.1 19.9 11 21 11V13C19.9 13 19 13.9 19 15V17L20 16L21 17V15C21 13.9 20.1 13 19 13V11C20.1 11 21 10.1 21 9ZM3 9C3 10.1 3.9 11 5 11V13C3.9 13 3 13.9 3 15V17L4 16L5 17V15C5 13.9 4.1 13 3 13V11C4.1 11 5 10.1 5 9V7L4 8L3 7V9ZM12 7C15.3 7 18 9.7 18 13S15.3 19 12 19S6 16.3 6 13S8.7 7 12 7ZM12 9C9.8 9 8 10.8 8 13S9.8 17 12 17S16 15.2 16 13S14.2 9 12 9ZM12 11C13.1 11 14 11.9 14 13S13.1 15 12 15S10 14.1 10 13S10.9 11 12 11Z"/>
  </svg>
);

function StatCard({ title, value, accent, icon, trend }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-102">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 truncate">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.up ? <FiTrendingUp className="w-4 h-4 text-green-500" /> : <FiTrendingDown className="w-4 h-4 text-red-500" />}
              <span className={`text-xs font-medium ${trend.up ? 'text-green-600' : 'text-red-600'}`}>
                {trend.text}
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white ${accent} shadow-lg flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProductosChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="w-full h-56 md:h-80 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
        Sin datos de productos vendidos
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.total_vendido), 1);

  return (
    <div className="w-full">
      <div className="space-y-4">
        {data.map((producto, idx) => {
          const percentage = (producto.total_vendido / max) * 100;
          const barColor =
            idx === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
            idx === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
            idx === 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
            idx === 3 ? 'bg-gradient-to-r from-pink-500 to-pink-600' :
            idx === 4 ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
            idx === 5 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
            idx === 6 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
            idx === 7 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
            idx === 8 ? 'bg-gradient-to-r from-lime-500 to-lime-600' :
            'bg-gradient-to-r from-green-500 to-green-600';

          return (
            <div key={producto.id ?? idx} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-gray-900 w-6">{idx + 1}.</span>
                  <span className="text-sm font-medium text-gray-800 truncate">{producto.nombre}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">{producto.total_vendido} uds</span>
                  {producto.precio > 0 && (
                    <span className="text-xs text-gray-500">S/. {Number(producto.precio).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 overflow-hidden">
                <div
                  className={`h-2 md:h-3 ${barColor} rounded-full transition-all duration-500 ease-out shadow-sm`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EstadosChart({ data = [] }) {
  if (data.length === 0) return <div className="text-sm text-gray-400 text-center py-4">Sin datos</div>;

  const total = data.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="space-y-3">
      {data.map((estado, idx) => {
        const percentage = total > 0 ? (estado.cantidad / total) * 100 : 0;
        const colorClass =
          estado.estado.toLowerCase().includes('complet') || estado.estado.toLowerCase().includes('entregado') ? 'bg-green-500' :
          estado.estado.toLowerCase().includes('pendiente') || estado.estado.toLowerCase().includes('proceso') ? 'bg-yellow-500' :
          estado.estado.toLowerCase().includes('cancel') ? 'bg-red-500' :
          estado.estado.toLowerCase().includes('enviado') ? 'bg-blue-500' :
          'bg-gray-500';

        return (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 capitalize truncate">{estado.estado}</span>
              <span className="text-sm font-bold text-gray-900">{estado.cantidad}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${colorClass} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopProductsList({ items = [] }) {
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="text-sm text-gray-400 text-center py-6">Sin datos</div>
      )}
      {items.map((it, idx) => (
        <div key={it.id ?? idx} className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-gray-100 transition-all">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold shadow-md text-sm ${
              idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
              idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
              idx === 2 ? 'bg-gradient-to-br from-orange-500 to-orange-700' :
              'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
              {idx + 1}
            </div>
            <div className="max-w-xs">
              <div className="text-sm font-semibold text-gray-800 truncate">{it.nombre}</div>
              {it.precio > 0 && (
                <div className="text-xs text-gray-500">S/. {Number(it.precio).toLocaleString()}</div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">{it.total_vendido}</div>
            <div className="text-xs text-gray-500">unidades</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New: categories state
  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  async function cargarEstadisticas() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/admins/estadisticas`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || json?.message || "Error al cargar estadísticas");
      }
      const payload = (json && (json.data ?? json)) || null;
      setStats(payload);
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
      setError(err.message || "Error al cargar estadísticas");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  // New: load categories for dashboard display (fallback to endpoint /apij/categorias)
  useEffect(() => {
    async function loadCategorias() {
      setLoadingCategorias(true);
      try {
        // Preferir categorias incluidas en stats
        if (stats && Array.isArray(stats.categorias) && stats.categorias.length > 0) {
          setCategorias(stats.categorias);
        } else {
          const res = await fetch(`${API}/apij/categorias`);
          const data = await res.json().catch(() => ([]));
          setCategorias(Array.isArray(data) ? data : (data.rows || []));
        }
      } catch (err) {
        console.error("Error cargando categorías:", err);
        setCategorias([]);
      } finally {
        setLoadingCategorias(false);
      }
    }
    loadCategorias();
  }, [stats]);

  useEffect(() => { cargarEstadisticas(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-8 font-['Inter','system-ui',sans-serif]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-black text-black mb-1 md:mb-2 truncate">
              Panel Administrativo - Tecnico Joel
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-medium truncate">Panel de control y estadísticas en tiempo real</p>
          </div>

          <div className="w-full md:w-auto">
            <button
              onClick={cargarEstadisticas}
              className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              <span>{loading ? "Actualizando..." : "Actualizar"}</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-lg">
            {error}
          </div>
        )}

        {/* 8 Estadísticas Principales */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <StatCard
            title="Total Clientes"
            value={stats ? stats.total_clientes.toLocaleString() : "—"}
            accent="bg-gradient-to-br from-blue-500 to-blue-700"
            icon={<FiUsers className="w-6 h-6 md:w-8 md:h-8" />}
          />
          <StatCard
            title="Total Productos"
            value={stats ? stats.total_productos.toLocaleString() : "—"}
            accent="bg-gradient-to-br from-purple-500 to-purple-700"
            icon={<FiPackage className="w-6 h-6 md:w-8 md:h-8" />}
          />
          <StatCard
            title="Total Movimientos"
            value={stats ? stats.total_movimientos.toLocaleString() : "—"}
            accent="bg-gradient-to-br from-blue-500 to-blue-700"
            icon={<FiTrendingUp className="w-6 h-6 md:w-8 md:h-8" />}
          />
          <StatCard
            title="Total Ventas"
            value={stats ? stats.total_ventas.toLocaleString() : "—"}
            accent="bg-gradient-to-br from-green-500 to-green-700"
            icon={<FiShoppingCart className="w-6 h-6 md:w-8 md:h-8" />}
          />
          <StatCard
            title="Usuarios Activos"
            value={stats ? stats.total_usuarios.toLocaleString() : "—"}
            accent="bg-gradient-to-br from-cyan-500 to-cyan-700"
            icon={<FiUserCheck className="w-6 h-6 md:w-8 md:h-8" />}
          />
          <StatCard
            title="Total Pedidos"
            value={stats ? stats.total_pedidos.toLocaleString() : "—"}
            accent="bg-gradient-to-br from-orange-500 to-orange-700"
            icon={<FiShoppingCart className="w-6 h-6 md:w-8 md:h-8" />}
          />
          <StatCard
            title="Ingresos Totales"
            value={stats ? `S/. ${stats.total_ingresos.toLocaleString()}` : "—"}
            accent="bg-gradient-to-br from-emerald-500 to-emerald-700"
            icon={<SolesIcon />}
            trend={stats?.promedioDiario ? { up: true, text: `S/. ${Math.round(stats.promedioDiario)}/día` } : null}
          />
          <StatCard
            title="Entradas / Salidas"
            value={stats ? `${stats.total_entradas} / ${stats.total_salidas}` : "—"}
            accent="bg-gradient-to-br from-rose-500 to-rose-700"
            icon={<FiTrendingDown className="w-6 h-6 md:w-8 md:h-8" />}
          />
        </section>

        {/* Productos Más Vendidos */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-900">Productos Más Vendidos</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Top productos por unidades vendidas</p>
              </div>
            </div>
            <ProductosChart data={stats?.productosMasVendidos || []} />
          </div>
        </section>

        {/* Secciones inferiores */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border border-gray-100">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Estados de Pedidos</h3>
            <EstadosChart data={stats?.pedidosPorEstado || []} />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border border-gray-100">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Top Ventas</h3>
            <TopProductsList items={stats?.topProductos || []} />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border border-gray-100">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Producto Estrella</h3>
            {stats?.productoEstrella ? (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 md:p-6 rounded-2xl border-2 border-yellow-200">
                <div className="text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg">
                    <span className="text-2xl md:text-3xl">🏆</span>
                  </div>
                  <h4 className="text-md md:text-lg font-bold text-gray-900 mb-2 truncate">
                    {stats.productoEstrella.nombre}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-600">
                      <span className="font-semibold">{stats.productoEstrella.veces_pedido}</span> veces pedido
                    </div>
                    <div className="text-gray-600">
                      <span className="font-semibold">{stats.productoEstrella.total_unidades}</span> unidades
                    </div>
                    {stats.productoEstrella.precio > 0 && (
                      <div className="text-md md:text-lg font-bold text-green-600 mt-2">
                        S/. {Number(stats.productoEstrella.precio).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-6">
                Sin producto destacado
              </div>
            )}
          </div>
        </section>

        {/* Resumen de Actividad */}
        <section className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border border-gray-100 mb-6">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-4">Resumen de Actividad</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-2xl">
              <div className="text-xs md:text-sm text-gray-600 mb-1">Stock Bajo</div>
              <div className="text-xl md:text-2xl font-bold text-blue-800">{stats?.stockBajo || 0}</div>
              <div className="text-xs text-gray-500 mt-1">productos</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-2xl">
              <div className="text-xs md:text-sm text-gray-600 mb-1">Promedio Diario</div>
              <div className="text-xl md:text-2xl font-bold text-green-800">
                S/. {stats?.promedioDiario ? Math.round(stats.promedioDiario).toLocaleString() : 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">últimos 30 días</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-2xl">
              <div className="text-xs md:text-sm text-gray-600 mb-1">Movimientos</div>
              <div className="text-xl md:text-2xl font-bold text-purple-800">{stats?.total_movimientos || 0}</div>
              <div className="text-xs text-gray-500 mt-1">total registros</div>
            </div>

            {/* Categorías responsivas */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-gray-600 mb-1">Categorías</div>
                  <div className="text-xl md:text-2xl font-bold text-orange-800">{loadingCategorias ? '…' : (categorias.length || 0)}</div>
                </div>
              </div>

              <div className="mt-3">
                {loadingCategorias ? (
                  <div className="text-sm text-gray-500">Cargando categorías...</div>
                ) : categorias.length === 0 ? (
                  <div className="text-sm text-gray-400">No hay categorías</div>
                ) : (
                  <div className="flex gap-2 flex-wrap overflow-x-auto py-1">
                    {categorias.map((c) => (
                      <span
                        key={c.id_categoria}
                        className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-full whitespace-nowrap"
                      >
                        {c.nombre_categoria}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 text-center text-sm text-gray-500">
          <div>© {new Date().getFullYear()} Tecnico Joel — Sistema de Gestión</div>
          <div className="text-xs text-gray-400">Última actualización: {new Date().toLocaleString('es-PE')}</div>
        </div>
      </div>
    </div>
  );
}