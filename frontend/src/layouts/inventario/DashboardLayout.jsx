import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../../service/api';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { hasAllowedRole } from '../../filters/roles';

const Icon = {
  Dashboard: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-6H3v6z" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Products: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Orders: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Sales: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Movements: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 1 1-3-6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Clients: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Admins: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.5"/><path d="M17 17.5c0 .5.5.5.5.5s.5 0 .5-.5v-1a3 3 0 0 0-6 0v1z" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Add: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  View: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>,
  ChevronDown: <svg className="w-4 h-4 transition-transform" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Logout: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
};

export default function DashboardLayout() {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const acknowledgedRef = useRef(new Set());
  const pollingRef = useRef(null);
  const prevLowIdsRef = useRef(new Set());

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchMenu, setSearchMenu] = useState("");

  const [expandedMenus, setExpandedMenus] = useState({
    productos: false,
    administradores: false
  });

  const location = useLocation();

  const fetchLowStock = async () => {
    try {
      const res = await api.get('/apij/productos');
      const payload = res.data ?? {};
      const items = Array.isArray(payload.items) ? payload.items : (Array.isArray(payload.data) ? payload.data : []);
      const low = items.filter(p => {
        const stockNum = Number(p.stock ?? 0);
        const minNum = Number(p.stock_minimo ?? 0);
        return !isNaN(minNum) && stockNum <= minNum;
      });

      const lowIds = new Set(low.map(p => String(p.id_producto ?? p.id ?? p._id ?? '')));
      const prevIds = prevLowIdsRef.current || new Set();
      const newly = Array.from(lowIds).filter(id => id && !prevIds.has(id));
      if (newly.length > 0) {
        setUnseenCount(c => c + newly.length);
      }
      prevLowIdsRef.current = lowIds;
      setLowStockProducts(low);
    } catch (e) {
    }
  };

  useEffect(() => {
    fetchLowStock();
    pollingRef.current = setInterval(fetchLowStock, 5000);
    return () => clearInterval(pollingRef.current);
  }, []);

  const toggleNotifications = () => setShowNotifications(s => !s);
  const acknowledgeProduct = (id) => {
    const sid = String(id);
    if (!acknowledgedRef.current.has(sid)) {
      acknowledgedRef.current.add(sid);
      setUnseenCount(c => Math.max(0, c - 1));
      setLowStockProducts(prev => prev.slice());
    }
  };

  const { logout, token, user: authUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => {
    if (loggingOut) return;
    setIsLogoutModalOpen(false);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({})
        }).catch(() => {});
      }
    } catch (e) {
      // ignore
    } finally {
      logout();
      setLoggingOut(false);
      setIsLogoutModalOpen(false);
      navigate('/');
    }
  };

  // derive user display values (full name + role badge)
  const displayName = useMemo(() => {
    if (!authUser) return 'Usuario';
    const fn = `${authUser.nombre ?? ''}`.trim();
    const ln = `${authUser.apellido ?? ''}`.trim();
    const full = `${fn} ${ln}`.trim();
    return full || authUser.usuario || 'Usuario';
  }, [authUser]);

  const roleLabel = useMemo(() => {
    const r = (authUser?.role ?? authUser?.rol ?? '').toString().toLowerCase();
    if (!r) return '';
    if (r.includes('super')) return 'Super Admin';
    if (r.includes('admin')) return 'Administrador';
    return r.charAt(0).toUpperCase() + r.slice(1);
  }, [authUser]);

  const initials = useMemo(() => {
    if (!authUser) return 'U';
    const n = (authUser.nombre ?? '').split(' ').map(s => s[0]).join('').slice(0,1);
    const a = (authUser.apellido ?? '').split(' ').map(s => s[0]).join('').slice(0,1);
    return (n + a).toUpperCase() || (authUser.usuario || 'U').slice(0,2).toUpperCase();
  }, [authUser]);

  // Toggle submenu
  const toggleSubmenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Menu structure
  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: Icon.Dashboard,
      to: '/inventario/dashboard',
      type: 'link'
    },
    {
      key: 'productos',
      label: 'Productos',
      icon: Icon.Products,
      type: 'expandable',
      expanded: expandedMenus.productos,
      subItems: [
        {
          label: 'Añadir Producto',
          icon: Icon.Add,
          to: '/inventario/productos/nuevo'
        },
        {
          label: 'Ver Productos',
          icon: Icon.View,
          to: '/inventario/productos'
        }
      ]
    },
    {
      key: 'pedidos',
      label: 'Pedidos',
      icon: Icon.Orders,
      to: '/inventario/pedidos',
      type: 'link'
    },
    {
      key: 'ventas',
      label: 'Ventas',
      icon: Icon.Sales,
      to: '/inventario/ventas',
      type: 'link'
    },
    {
      key: 'movimientos',
      label: 'Movimientos',
      icon: Icon.Movements,
      to: '/inventario/movimientos',
      type: 'link'
    },
    {
      key: 'clientes',
      label: 'Clientes',
      icon: Icon.Clients,
      to: '/inventario/clientes',
      type: 'link'
    },
    {
      key: 'administradores',
      label: 'Administradores',
      icon: Icon.Admins,
      type: 'expandable',
      expanded: expandedMenus.administradores,
      subItems: [
        {
          label: 'Crear Administrador',
          icon: Icon.Add,
          to: '/inventario/administradores/nuevo'
        },
        {
          label: 'Ver Administradores',
          icon: Icon.View,
          to: '/inventario/administradores'
        }
      ]
    }
  ];

  // ocultar algunas opciones si el usuario es solo 'admin'
  const roleNorm = (authUser?.role ?? authUser?.rol ?? '').toString().toLowerCase();
  const isOnlyAdmin = roleNorm === 'admin';

  const filteredMenu = menuItems
    .filter(item => {
      // bloquear menú completos para admin simple
      if (isOnlyAdmin && (item.key === 'clientes' || item.key === 'administradores')) return false;

      // filtro de búsqueda (mantener comportamiento anterior)
      const labelMatch = item.label.toLowerCase().includes(searchMenu.toLowerCase().trim());
      const subMatch = item.subItems && item.subItems.some(subItem =>
        subItem.label.toLowerCase().includes(searchMenu.toLowerCase().trim())
      );
      return labelMatch || subMatch;
    });

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed z-40 left-0 top-0 h-full bg-gray-900 shadow-2xl border-r border-gray-800 transition-all duration-300 flex flex-col ${isExpanded ? 'w-72' : 'w-20'}`}>
        {/* Header */}
        <div className="px-4 py-6 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/logo.png" 
                alt="Logo Tecnico Joel" 
                className="w-24 h-24 object-contain rounded-lg bg-white/10 p-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <button 
                onClick={() => navigate('/inventario/dashboard')} 
                className="w-14 h-14 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg hidden"
              >
                <span className="text-white font-bold text-lg">TJ</span>
              </button>
            </div>
            {isExpanded && (
              <div>
                <div className="text-lg font-bold text-white">Tecnico Joel</div>
                <div className="text-xs text-gray-400">Panel Administrativo</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button title="Expandir" onClick={() => setIsExpanded(e => !e)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d={isExpanded ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        {isExpanded && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                value={searchMenu}
                onChange={(e) => setSearchMenu(e.target.value)}
                placeholder="Buscar menú..."
                className="bg-transparent w-full text-sm text-white placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 overflow-auto space-y-2">
          {filteredMenu.map(item => {
            if (item.type === 'link') {
              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/20' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center justify-center">
                    {item.icon}
                  </div>
                  {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            }

            if (item.type === 'expandable') {
              const isAnySubActive = item.subItems?.some(subItem => location.pathname === subItem.to);
              const shouldExpand = item.expanded || isAnySubActive;

              return (
                <div key={item.key} className="space-y-1">
                  {/* Parent menu item */}
                  <button
                    onClick={() => toggleSubmenu(item.key)}
                    className={`w-full group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      isAnySubActive 
                        ? 'bg-blue-900/30 text-blue-400 border border-blue-800' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      {item.icon}
                    </div>
                    {isExpanded && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                        <div className={`transform transition-transform duration-200 ${shouldExpand ? 'rotate-180' : ''}`}>
                          {Icon.ChevronDown}
                        </div>
                      </>
                    )}
                    {!isExpanded && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </button>

                  {/* Submenu items */}
                  {isExpanded && (
                    <div className={`overflow-hidden transition-all duration-300 ${shouldExpand ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="ml-6 space-y-1 border-l border-gray-700 pl-4">
                        {item.subItems?.map(subItem => (
                          <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                              `group flex items-center gap-3 p-2 rounded-md transition-all duration-200 ${
                                isActive 
                                  ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md' 
                                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                              }`
                            }
                          >
                            <div className="flex items-center justify-center">
                              {subItem.icon}
                            </div>
                            <span className="text-xs font-medium">{subItem.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg">
              {initials}
            </div>
            {isExpanded && (
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{displayName}</div>
                <div className="text-xs text-blue-400">{roleLabel}</div>
              </div>
            )}
            {isExpanded && (
              <div className="flex items-center gap-1">
                <button onClick={() => toggleTheme()} title="Tema" className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                  <span className="text-sm">{isDark ? '🌙' : '☀️'}</span>
                </button>
                <button onClick={() => openLogoutModal()} title="Cerrar sesión" className="p-2 rounded-lg hover:bg-red-800 text-red-400 hover:text-red-300 transition-colors">
                  {Icon.Logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isExpanded ? 'ml-72' : 'ml-20'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white shadow-lg border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="md:hidden p-2 rounded-lg bg-gray-100 shadow-sm hover:bg-gray-200" onClick={() => setSidebarOpen(s => !s)}>
                <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Hola, {displayName.split(' ')[0] ?? 'Usuario'}
                </h2>
                <div className="text-base text-gray-600 mt-1">
                  Bienvenido al panel administrativo
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Notifications */}
              <div className="relative">
                <button onClick={toggleNotifications} className="relative p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v0.68C7.64 5.36 6 7.93 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z" stroke="currentColor" strokeWidth="1.4"/>
                  </svg>
                  {unseenCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full min-w-[1.25rem] text-center font-semibold">
                      {unseenCount > 99 ? '99+' : unseenCount}
                    </span>
                  )}
                </button>
              </div>

              {/* User info */}
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl shadow-sm">
                <div className="text-right">
                  <div className="text-base font-semibold text-gray-900">{displayName}</div>
                  <div className="text-sm text-blue-600 font-medium">{roleLabel}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                  {initials}
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={openLogoutModal}
                className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium"
              >
                {Icon.Logout}
                <span className="text-sm">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeLogoutModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none">
                  <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">¿Cerrar sesión?</h3>
              <p className="text-sm text-gray-600">Al cerrar sesión saldrás del panel administrativo.</p>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={closeLogoutModal} disabled={loggingOut} className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium">
                Cancelar
              </button>
              <button onClick={handleConfirmLogout} disabled={loggingOut} className="px-6 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium">
                {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed right-6 top-24 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Alertas de stock bajo</h4>
              <button 
                onClick={() => { 
                  acknowledgedRef.current = new Set(); 
                  setUnseenCount(0); 
                  setShowNotifications(false); 
                }} 
                className="text-xs text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                Marcar todas
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-auto p-4">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <p className="text-sm text-gray-500">No hay productos con stock bajo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map(p => {
                  const id = p.id_producto ?? p.id ?? p._id;
                  const name = p.nombre || p.nombre_producto || 'Sin nombre';
                  const seen = acknowledgedRef.current.has(String(id));
                  return (
                    <div key={String(id)} className="flex items-start gap-4 p-4 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Stock actual: <span className="font-semibold text-red-700">{p.stock}</span> • 
                          Mínimo: <span className="font-semibold">{p.stock_minimo}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {!seen && <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-semibold">Nuevo</span>}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => acknowledgeProduct(id)} 
                            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => { 
                              navigate('/inventario/productos'); 
                              setShowNotifications(false); 
                            }} 
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Ver
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}