import { useState, useEffect, useRef } from "react";
import { FiSearch, FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut, FiChevronDown, FiPackage } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api, { resolveImageUrl } from "../../service/api"; 

function HeaderTienda() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  let searchDebounce = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const extractRows = (res) => {
    if (!res) return [];
    const d = res.data ?? res;
    if (Array.isArray(d)) return d;
    return d.rows || d.data || d.results || [];
  };

  const pickImageUrl = (p) => {
    if (!p) return "/assets/placeholder.png";
    const candidate =
      p.imagen_url ||
      p.imagen ||
      p.imagenes?.[0] ||
      p.image ||
      (Array.isArray(p.images) ? p.images[0] : null) ||
      p.foto ||
      p.photo ||
      p.thumbnail ||
      "";
    try {
      return resolveImageUrl ? resolveImageUrl(candidate) : (candidate || "/assets/placeholder.png");
    } catch {
      return candidate || "/assets/placeholder.png";
    }
  };

  
  const getCategoryAndSlug = (product) => {
    const slugify = (s = "") =>
      s
        .toString()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

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

   
    let categoryRaw =
      product.categoria ||
      product.category ||
      product.categoria_nombre ||
      product.tipo ||
      null;


    if ((!categoryRaw || categoryRaw === "") && (product.id_categoria || product.idCategoria || product.categoryId)) {
      const id = Number(product.id_categoria ?? product.idCategoria ?? product.categoryId);
      if (!Number.isNaN(id) && idToSlug[id]) {
        categoryRaw = idToSlug[id];
      }
    }

 
    if (!categoryRaw || String(categoryRaw).trim() === "") {
      return null;
    }

    const categorySlug = slugify(categoryRaw);
    const productSlug = slugify(product.nombre_producto || product.title || product.nombre || String(product.id_producto || product.id || ""));

    return { categorySlug, productSlug };
  };

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!searchQuery || searchQuery.trim().length < 1) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    const q = searchQuery.trim();
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await api.get(`/apij/productos?search=${encodeURIComponent(q)}`);
        let rows = extractRows(res) || [];

        const qLower = q.toLowerCase();
        rows = rows.filter((p) => {
          const name = (p.nombre_producto || p.title || p.name || "").toString().toLowerCase();
          return name.includes(qLower);
        });

      
        rows = rows.filter(p => !!getCategoryAndSlug(p));

        setSearchResults((rows || []).slice(0, 8));
      } catch (err) {
        console.warn("Search error", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
        setShowSearchDropdown(true);
      }
    }, 250);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery]);

  const { getTotalItems } = useCart();
  const cartCount = getTotalItems ? getTotalItems() : 0;
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const categorias = [
    "Computadoras",
    "Laptops", 
    "Impresoras",
    "Monitores",
    "Mouse",
    "Accesorios",
    "Componentes",
    "Sonido",
    "Tintas",
    "Licencia",
    "Reacondicionados",
    "Redes",
    "Estabilizadores"
  ];

  const slugify = (str = "") =>
    str
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")
      .replace(/\-+/g, "-");

  const routeMap = {
    computadoras: "/computadoras",
    laptops: "/laptops",
    impresoras: "/impresoras",
    monitores: "/monitores",
    mouse: "/mouse",
    accesorios: "/accesorios",
    componentes: "/componentes",
    sonido: "/sonido",
    tintas: "/tintas",
    licencia: "/licencia",
    reacondicionados: "/reacondicionados",
    redes: "/redes",
    estabilizadores: "/estabilizadores"
  };

  const getRoute = (name) => {
    const slug = slugify(name);
    return routeMap[slug] || `/${slug}`;
  };

  useEffect(() => {
    document.body.style.overflow = isCategoryMenuOpen || isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCategoryMenuOpen, isMenuOpen]);

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
      await logout();
      setIsLogoutModalOpen(false);
      navigate("/");
    } catch (e) {
      // opcional: mostrar notificación de error
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-screen bg-gray-900 shadow-xl border-b border-gray-800">
        <nav className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header principal */}
          <div className="flex items-center justify-between h-14 lg:h-16 gap-2 lg:gap-3">
            {/* Logo y marca - siempre visible */}
            <div className="flex items-center gap-2 lg:gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 lg:gap-3 p-1 lg:p-2 rounded-lg hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transform translate-y-1"
                aria-label="Ir a inicio - TecnicoJoel"
                title="Ir a inicio"
              >
                <div className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-full flex items-center justify-center overflow-hidden shadow-lg bg-white p-0">
                  <img src="/assets/logo-navidad.jfif" alt="Logo Tecnico Joel" className="w-full h-full object-contain bg-white rounded-lg" loading="lazy" />
                </div>
                <span className="hidden sm:inline-block text-lg lg:text-xl xl:text-2xl font-extrabold text-white">
                  Tecnico Joel      
                </span>
              </button>

              {/* Botón categorías - desktop */}
              <button
                onClick={() => setIsCategoryMenuOpen(true)}
                className="hidden lg:flex px-2 lg:px-4 py-1 lg:py-2 rounded-lg text-base lg:text-lg font-medium text-gray-200 hover:text-white hover:bg-gray-800 transition-all duration-200 items-center gap-2"
                aria-label="Abrir categorías"
              >
                <FiMenu className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="uppercase">Categorías</span>
              </button>
            </div>

            {/* Buscador - desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-2xl mx-4">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                </div>
                <div ref={searchRef} className="w-full">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); }}
                    onFocus={() => { if (searchResults.length) setShowSearchDropdown(true); }}
                    className="w-full pl-10 lg:pl-12 pr-4 py-1 lg:py-2 rounded-xl text-base lg:text-lg bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-md"
                  />

                  {/* Dropdown de resultados */}
                  {showSearchDropdown && (searchResults.length > 0 || searchLoading) && (
                    <div className="absolute left-0 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                      {searchLoading ? (
                        <div className="p-4 text-sm text-gray-600 flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          Buscando...
                        </div>
                      ) : (
                        <ul className="max-h-72 overflow-auto">
                          {searchResults.map((p) => {
                            const id = p.id_producto ?? p.id ?? p.codigo ?? p._id ?? "";
                            const title = (p.nombre_producto || p.title || p.name || "").toString();
                            const img = pickImageUrl(p);

                            const info = getCategoryAndSlug(p);
                            if (!info) return null; // ignorar productos sin categoría vinculada

                            const { categorySlug, productSlug } = info;
                            const detailPath = `/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productSlug)}`;

                            return (
                              <li
                                key={String(id) + "-" + productSlug}
                                className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  setSearchQuery("");
                                  setSearchResults([]);
                                  navigate(detailPath);
                                }}
                              >
                                <img src={img} alt={title || "Producto"} className="w-12 h-12 object-contain rounded-lg border border-gray-200 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">{title || "Producto"}</div>
                                  <div className="text-xs text-gray-500 capitalize">{categorySlug.replace(/-/g, ' ')}</div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controles de la derecha */}
            <div className="flex items-center gap-1 lg:gap-2">
              {/* Botón menú móvil */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-1 lg:p-2 rounded-lg text-gray-200 hover:text-white hover:bg-gray-800 transition-all duration-200"
                aria-label="Menú móvil"
              >
                {isMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>

              {/* Mis pedidos - desktop */}
              <button
                onClick={() => (user ? navigate("/pedidos") : navigate("/login"))}
                className="hidden lg:flex px-2 lg:px-4 py-1 lg:py-2 rounded-lg text-base lg:text-lg font-medium text-gray-200 hover:text-white hover:bg-gray-800 transition-all duration-200 items-center gap-2"
                title={user ? "Mis pedidos" : "Debes iniciar sesión para ver tus pedidos"}
                aria-label="Historial de pedidos"
              >
                <FiPackage className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden xl:inline font-bold uppercase">Mis pedidos</span>
                <span className="xl:hidden font-bold uppercase">Pedidos</span>
              </button>

              {/* Usuario */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen((s) => !s)}
                    className="px-2 lg:px-4 py-1 lg:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 lg:gap-2 transition-all duration-200 shadow-lg"
                    aria-haspopup="true"
                    aria-expanded={isUserMenuOpen}
                    title="Mi cuenta"
                  >
                    <FiUser className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="hidden sm:inline text-sm lg:text-lg leading-none">
                      {`${user.nombre ?? user.name ?? ''} ${user.apellido ?? ''}`.trim() || "Usuario"}
                    </span>
                    <FiChevronDown className={`w-3 h-3 lg:w-5 lg:h-5 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div
                    role="menu"
                    aria-hidden={!isUserMenuOpen}
                    style={{ top: "calc(100% + 8px)", right: 0, zIndex: 100000 }}
                    className={`absolute w-44 lg:w-48 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 transform transition-all duration-200 origin-top-right ${
                      isUserMenuOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                    }`}
                  >
                    <button
                      onClick={() => { setIsUserMenuOpen(false); navigate("/perfil"); }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-2 rounded-t-xl transition-colors text-sm lg:text-base"
                      role="menuitem"
                    >
                      <FiUser className="w-4 h-4" /> 
                      <span>Ver mi perfil</span>
                    </button>
                    <div className="border-t border-gray-200" />
                    <button
                      onClick={() => { setIsUserMenuOpen(false); openLogoutModal(); }}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-2 text-red-600 rounded-b-xl transition-colors text-sm lg:text-base"
                      role="menuitem"
                    >
                      <FiLogOut className="w-4 h-4" /> 
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="px-2 lg:px-4 py-1 lg:py-2 rounded-lg font-semibold text-gray-200 hover:text-white hover:bg-gray-800 transition-all duration-200 flex items-center gap-1 lg:gap-2"
                  aria-label="Iniciar sesión"
                >
                  <FiUser className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline text-sm lg:text-lg">Ingresar</span>
                </button>
              )}

              {/* Carrito */}
              <button
                className="relative inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-1 lg:py-2 rounded-lg text-gray-200 hover:text-white hover:bg-gray-800 transition-all duration-200"
                aria-label="Carrito"
                onClick={() => navigate("/carrito")}
              >
                <FiShoppingCart className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:inline text-sm lg:text-lg font-medium">Carrito</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 lg:h-6 lg:w-6 flex items-center justify-center font-bold shadow-lg">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Línea divisoria - solo desktop */}
          <div className="hidden lg:block w-full h-px bg-gray-700 my-0" />

          {/* Navegación secundaria - solo desktop */}
          <div className="hidden lg:flex justify-center">
            <nav className="flex gap-4 xl:gap-8 py-2">
              {["Computadoras", "Laptops", "Monitores", "Impresoras"].map((c) => (
                <button
                  key={c}
                  onClick={() => navigate(getRoute(c))}
                  className="text-gray-200 hover:text-white text-sm lg:text-base xl:text-base font-bold uppercase tracking-tight px-2 lg:px-3 py-1 rounded-lg hover:bg-gray-800 transition-all duration-200 focus:outline-none"
                >
                  {c}
                </button>
              ))}
            </nav>
          </div>
        </nav>

        {/* Menu móvil */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-800 border-t border-gray-700">
            <div className="px-4 pt-4 pb-6 space-y-4">
              {/* Buscador móvil */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 text-base rounded-lg bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
              </div>

              {/* Resultados de búsqueda móvil */}
              {searchResults.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((p) => {
                    const id = p.id_producto ?? p.id ?? p.codigo ?? p._id ?? "";
                    const title = (p.nombre_producto || p.title || p.name || "").toString();
                    const img = pickImageUrl(p);
                    const { categorySlug, productSlug } = getCategoryAndSlug(p);
                    const detailPath = `/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productSlug)}`;

                    return (
                      <div
                        key={String(id) + "-mobile"}
                        className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                          setIsMenuOpen(false);
                          navigate(detailPath);
                        }}
                      >
                        <img src={img} alt={title} className="w-10 h-10 object-contain rounded" />
                        <span className="text-sm text-gray-900 truncate">{title}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botones de acceso rápido móvil */}
              <div className="flex gap-2">
                <button
                  onClick={() => { 
                    setIsMenuOpen(false);
                    user ? navigate("/pedidos") : navigate("/login");
                  }}
                  className="flex-1 px-2 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <FiPackage className="w-4 h-4" />
                  Pedidos
                </button>
                <button
                  onClick={() => setIsCategoryMenuOpen(true)}
                  className="flex-1 px-2 py-2 bg-gray-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <FiMenu className="w-4 h-4" />
                  Categorías
                </button>
              </div>

              {/* Grid de categorías principales móvil */}
              <div className="grid grid-cols-2 gap-2">
                {["Laptops", "Monitores", "Impresoras", "Computadoras"].map((categoria) => {
                  const route = getRoute(categoria);
                  return (
                    <button
                      key={categoria}
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate(route);
                      }}
                      className="text-gray-900 font-semibold px-4 py-3 text-sm w-full text-center bg-white rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm"
                    >
                      {categoria}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Espaciado para el header fijo */}
      <div className="h-14 lg:h-16" />

      {/* Panel lateral de categorías */}
      <div
        className={`fixed inset-0 z-60 transition-opacity duration-300 ${isCategoryMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className="absolute inset-0 transition-colors duration-300"
          style={{
            backgroundColor: isCategoryMenuOpen ? "rgba(0,0,0,0.5)" : "transparent",
            pointerEvents: isCategoryMenuOpen ? "auto" : "none",
          }}
          onClick={() => setIsCategoryMenuOpen(false)}
          aria-hidden="true"
        />

        <aside
          className={`absolute top-0 left-0 h-full w-full sm:w-80 bg-white shadow-2xl transform transition-transform duration-300 ${isCategoryMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Panel de categorías"
        >
          {/* Header del panel */}
          <div className="flex items-center gap-3 p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <img src="/assets/logo.png" alt="Logo Tecnico Joel" className="w-10 h-10 object-contain" loading="lazy" />
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Categorías</h2>
              <p className="text-sm text-gray-600 mt-0.5">Explora por secciones</p>
            </div>

            <button
              onClick={() => setIsCategoryMenuOpen(false)}
              className="ml-auto p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              aria-label="Cerrar categorías"
            >
              <FiX className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Lista de categorías */}
          <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 170px)' }}>
            <div className="flex flex-col gap-2">
              {categorias.map((categoria, index) => {
                const route = getRoute(categoria);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setIsCategoryMenuOpen(false);
                      setIsMenuOpen(false);
                      navigate(route);
                    }}
                    className="flex items-center px-4 py-4 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-200 group w-full text-left"
                  >
                    <span className="w-3 h-3 bg-gradient-to-r from-blue-600 to-red-500 rounded-full mr-4 flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow" />
                    <span className="truncate font-medium">{categoria}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

   
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" onClick={closeLogoutModal} />
          <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-sm z-10">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none">
                  <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Cerrar sesión?</h3>
              <p className="text-sm text-gray-600 mb-4">¿Estás seguro de que deseas cerrar sesión? Tu carrito y preferencias se guardarán.</p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={closeLogoutModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                  aria-label="Cancelar cierre de sesión"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2"
                  aria-label="Confirmar cierre de sesión"
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <FiLogOut className="w-4 h-4" />
                  )}
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-6" />
    </>
  );
}

export default HeaderTienda;