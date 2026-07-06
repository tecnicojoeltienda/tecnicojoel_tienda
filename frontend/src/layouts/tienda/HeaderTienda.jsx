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
    const candidate = p.imagen_url || p.imagen || p.imagenes?.[0] || p.image || (Array.isArray(p.images) ? p.images[0] : null) || p.foto || p.photo || p.thumbnail || "";
    try { return resolveImageUrl ? resolveImageUrl(candidate) : (candidate || "/assets/placeholder.png"); } 
    catch { return candidate || "/assets/placeholder.png"; }
  };
  
  const getCategoryAndSlug = (product) => {
    const slugify = (s = "") => s.toString().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
    const idToSlug = { 1: "pcs", 2: "laptops", 3: "monitores", 4: "mouse", 5: "accesorios", 6: "sonido", 7: "tintas", 8: "licencia", 9: "reacondicionados", 10: "redes", 11: "impresoras", 12: "componentes", 13: "estabilizadores" };
    let categoryRaw = product.categoria || product.category || product.categoria_nombre || product.tipo || null;

    if ((!categoryRaw || categoryRaw === "") && (product.id_categoria || product.idCategoria || product.categoryId)) {
      const id = Number(product.id_categoria ?? product.idCategoria ?? product.categoryId);
      if (!Number.isNaN(id) && idToSlug[id]) { categoryRaw = idToSlug[id]; }
    }
    if (!categoryRaw || String(categoryRaw).trim() === "") return null;

    const categorySlug = slugify(categoryRaw);
    const productSlug = slugify(product.nombre_producto || product.title || product.nombre || String(product.id_producto || product.id || ""));
    return { categorySlug, productSlug };
  };

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!searchQuery || searchQuery.trim().length < 1) {
      setSearchResults([]); setSearchLoading(false); return;
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
        console.warn("Search error", err); setSearchResults([]);
      } finally {
        setSearchLoading(false); setShowSearchDropdown(true);
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const categorias = ["Accesorios", "Componentes", "Computadoras", "Discos solidos", "Estabilizadores", "Impresoras", "Laptops", "Licencias", "Monitores", "Mouses", "Redes", "Repuestos", "Segunda mano", "Sonidos", "Tarjetas graficas", "Teclados", "Tintas"];

  const slugify = (str = "") => str.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").replace(/\-+/g, "-");

  const routeMap = {
    computadoras: "/computadoras", laptops: "/laptops", impresoras: "/impresoras", monitores: "/monitores",
    mouse: "/mouse", mouses: "/mouse", accesorios: "/accesorios", componentes: "/componentes",
    sonido: "/sonido", sonidos: "/sonido", tintas: "/tintas", licencia: "/licencia", licencias: "/licencia",
    "segunda-mano": "/segunda-mano", redes: "/redes", estabilizadores: "/estabilizadores",
    "tarjetas-graficas": "/tarjetas-graficas", tarjetas: "/tarjetas-graficas", teclados: "/teclados",
    repuestos: "/repuestos", "discos-solidos": "/discos-solidos", discos: "/discos-solidos"
  };

  const getRoute = (name) => {
    const slug = slugify(name); return routeMap[slug] || `/${slug}`;
  };

  useEffect(() => {
    document.body.style.overflow = isCategoryMenuOpen || isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isCategoryMenuOpen, isMenuOpen]);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => { if (!loggingOut) setIsLogoutModalOpen(false); };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try { await logout(); setIsLogoutModalOpen(false); navigate("/"); } 
    catch (e) {} 
    finally { setLoggingOut(false); }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-screen bg-slate-900 border-b border-slate-800 shadow-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <nav className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            
            <div className="flex items-center gap-4 lg:gap-8">
              <Link 
                to="/" 
                className="flex items-center gap-2.5 outline-none group"
                onClick={() => { setIsMenuOpen(false); setIsCategoryMenuOpen(false); }}
              >
                <div className="bg-white rounded-xl p-1 shadow-inner">
                  <img src="/assets/logo.png" alt="Logo TecnicoJoel" className="h-9 lg:h-11 w-auto object-contain transition-transform group-hover:scale-105" />
                </div>
                <span className="hidden lg:block text-xl font-extrabold text-white tracking-tight">
                  TecnicoJoel
                </span>
              </Link>

              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-semibold text-sm"
              >
                <FiMenu className="w-5 h-5" />
                <span>Categorías</span>
              </button>
            </div>

            <div className="hidden md:flex items-center flex-1 max-w-2xl mx-4">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-slate-400" />
                </div>
                <div ref={searchRef} className="w-full">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if (searchResults.length) setShowSearchDropdown(true); }}
                    className="w-full pl-12 pr-4 py-2.5 rounded-full text-sm bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none"
                  />

                  {showSearchDropdown && (searchResults.length > 0 || searchLoading) && (
                    <div className="absolute left-0 mt-3 w-full bg-white rounded-2xl shadow-[0_16px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-50 overflow-hidden">
                      {searchLoading ? (
                        <div className="p-6 text-sm font-medium text-slate-500 flex items-center justify-center gap-3">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                          Buscando...
                        </div>
                      ) : (
                        <ul className="max-h-80 overflow-auto custom-scrollbar p-2">
                          {searchResults.map((p) => {
                            const id = p.id_producto ?? p.id ?? p.codigo ?? p._id ?? "";
                            const title = (p.nombre_producto || p.title || p.name || "").toString();
                            const img = pickImageUrl(p);
                            const info = getCategoryAndSlug(p);
                            if (!info) return null;
                            const { categorySlug, productSlug } = info;
                            const detailPath = `/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productSlug)}`;

                            return (
                              <li
                                key={String(id) + "-" + productSlug}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                                onClick={() => {
                                  setShowSearchDropdown(false); setSearchQuery(""); setSearchResults([]); navigate(detailPath);
                                }}
                              >
                                <div className="w-12 h-12 bg-white border border-slate-100 rounded-lg p-1.5 flex-shrink-0">
                                  <img src={img} alt={title} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-slate-900 truncate">{title || "Producto"}</div>
                                  <div className="text-xs font-medium text-slate-500 capitalize mt-0.5">{categorySlug.replace(/-/g, ' ')}</div>
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

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
              </button>

              <button
                onClick={() => (user ? navigate("/pedidos") : navigate("/login"))}
                className="hidden lg:flex items-center gap-2 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-semibold text-sm"
                title={user ? "Mis pedidos" : "Iniciar sesión"}
              >
                <FiPackage className="w-5 h-5" />
                <span className="hidden xl:inline">Pedidos</span>
              </button>

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen((s) => !s)}
                    className="pl-3 pr-2 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:border-slate-600 hover:bg-slate-700 text-white font-medium flex items-center gap-2 transition-all shadow-sm"
                  >
                    <span className="hidden sm:inline text-sm font-semibold">
                      {`${user.nombre ?? user.name ?? ''}`.trim() || "Usuario"}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <FiUser className="w-4 h-4" />
                    </div>
                  </button>

                  <div
                    className={`absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 transform transition-all duration-200 origin-top-right overflow-hidden ${
                      isUserMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <button
                      onClick={() => { setIsUserMenuOpen(false); navigate("/perfil"); }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors text-sm font-semibold text-slate-700"
                    >
                      <FiUser className="w-4 h-4 text-slate-400" /> Mi perfil
                    </button>
                    <div className="h-px bg-slate-100 w-full" />
                    <button
                      onClick={() => { setIsUserMenuOpen(false); openLogoutModal(); }}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors text-sm font-semibold"
                    >
                      <FiLogOut className="w-4 h-4" /> Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-all font-semibold text-sm shadow-md shadow-blue-900/50"
                >
                  <FiUser className="w-4 h-4" />
                  <span>Ingresar</span>
                </button>
              )}

              <button
                onClick={() => navigate("/carrito")}
                className="relative p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                <FiShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-slate-900 shadow-sm">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="hidden lg:flex justify-center border-t border-slate-800">
            <nav className="flex gap-8 py-3">
              {["Computadoras", "Laptops", "Monitores", "Impresoras"].map((c) => (
                <button
                  key={c}
                  onClick={() => navigate(getRoute(c))}
                  className="text-slate-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors"
                >
                  {c}
                </button>
              ))}
            </nav>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 shadow-xl absolute w-full left-0">
            <div className="p-4 space-y-4">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800 border-transparent focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 text-white transition-all outline-none text-sm placeholder-slate-400"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-100 max-h-60 overflow-auto">
                  {searchResults.map((p) => {
                    const id = p.id_producto ?? p.id ?? p.codigo ?? p._id ?? "";
                    const title = (p.nombre_producto || p.title || p.name || "").toString();
                    const img = pickImageUrl(p);
                    const { categorySlug, productSlug } = getCategoryAndSlug(p);
                    return (
                      <div
                        key={String(id) + "-mobile"}
                        className="flex items-center gap-3 p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50"
                        onClick={() => {
                          setSearchQuery(""); setSearchResults([]); setIsMenuOpen(false);
                          navigate(`/${encodeURIComponent(categorySlug)}/${encodeURIComponent(productSlug)}`);
                        }}
                      >
                        <img src={img} alt={title} className="w-10 h-10 object-contain rounded-md" />
                        <span className="text-sm font-medium text-slate-900 truncate">{title}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {["Laptops", "Monitores", "Impresoras", "Computadoras"].map((categoria) => (
                  <button
                    key={categoria}
                    onClick={() => { setIsMenuOpen(false); navigate(getRoute(categoria)); }}
                    className="bg-slate-800 text-slate-200 font-semibold py-3 rounded-xl hover:bg-slate-700 transition-colors text-sm"
                  >
                    {categoria}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="h-16 lg:h-[110px]" />

      {/* Sidebar Categorías Premium */}
      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isCategoryMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCategoryMenuOpen(false)} />
        
        <aside className={`absolute top-0 left-0 h-full w-[85%] max-w-[320px] bg-white shadow-2xl transform transition-transform duration-300 ${isCategoryMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Categorías</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Explora nuestro catálogo</p>
            </div>
            <button onClick={() => setIsCategoryMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto custom-scrollbar" style={{ height: 'calc(100vh - 100px)' }}>
            <div className="flex flex-col space-y-1">
              {categorias.map((categoria, index) => (
                <button
                  key={index}
                  onClick={() => { setIsCategoryMenuOpen(false); navigate(getRoute(categoria)); }}
                  className="flex items-center px-4 py-3 text-[15px] font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all group"
                >
                  <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors mr-4" />
                  {categoria}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Modal Logout Elegante */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeLogoutModal} />
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm z-10 scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <FiLogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">¿Cerrar sesión?</h3>
              <p className="text-sm font-medium text-slate-500 mb-8">Tu carrito y preferencias quedarán guardados de forma segura.</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmLogout}
                  disabled={loggingOut}
                  className="w-full py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all flex items-center justify-center shadow-sm"
                >
                  {loggingOut ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : "Sí, cerrar sesión"}
                </button>
                <button
                  onClick={closeLogoutModal}
                  className="w-full py-3 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </>
  );
}

export default HeaderTienda;