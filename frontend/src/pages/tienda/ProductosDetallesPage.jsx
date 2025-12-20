import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { resolveImageUrl } from "../../service/api";
import ProductDetail from "../../components/tienda/ProductDetail";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import { useCart } from "../../context/CartContext";
import TwoCarrusel from "../../components/tienda/TwoCarrusel";
import { FiPackage, FiAlertCircle, FiChevronLeft, FiChevronRight, FiStar, FiShoppingCart } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const slugify = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

export default function ProductosDetallesPage() {
  
  const params = useParams();
  const { id, category, slug } = params;
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productosRelacionados, setProductosRelacionados] = useState([]);
  const [loadingRelacionados, setLoadingRelacionados] = useState(false);
  const carruselRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        let data = null;

        if (slug && category) {
          
          try {
            const res = await api.get(`/apij/productos/slug/${encodeURIComponent(slug)}`);
            data = Array.isArray(res.data) ? res.data[0] : (res.data.rows ? res.data.rows[0] : res.data);
          } catch (errSlug) {
            
            const res2 = await api.get(`/apij/productos/categoria/nombre/${encodeURIComponent(category)}`);
            const rows = Array.isArray(res2.data) ? res2.data : (res2.data.rows || []);
            data = rows.find((p) => slugify(p.nombre_producto || p.title || "") === slug);
            
            if (!data) {
              data = rows.find((p) => String(p.id_producto || p.id) === slug);
            }
          }
        } else if (id) {
          
          const res = await api.get(`/apij/productos/${encodeURIComponent(id)}`);
          data = Array.isArray(res.data) ? res.data[0] : (res.data.rows ? res.data.rows[0] : res.data);
        }

        if (mounted) {
          setProduct(data || null);
          
          // Cargar productos relacionados
          if (data?.id_producto) {
            cargarProductosRelacionados(data.id_producto);
          }
        }
      } catch (err) {
        console.error("Error cargando producto:", err);
        if (mounted) setError("No se encontró el producto");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, category, slug]);

  async function cargarProductosRelacionados(productoId) {
    setLoadingRelacionados(true);
    try {
      const storedRelated = localStorage.getItem(`productos_relacionados_${productoId}`);
      
      console.log("🔍 Buscando productos relacionados para ID:", productoId);
      console.log("🔍 LocalStorage value:", storedRelated);
      
      if (storedRelated) {
        const relatedIds = JSON.parse(storedRelated);
        console.log("✅ IDs encontrados:", relatedIds);
        
        if (relatedIds && relatedIds.length > 0) {
          const res = await api.get("/apij/productos");
          const todosLosProductos = Array.isArray(res.data) ? res.data : [];
          const relacionados = todosLosProductos.filter(p => relatedIds.includes(p.id_producto));
          
          console.log("✅ Productos relacionados cargados:", relacionados.length);
          setProductosRelacionados(relacionados);
        }
      } else {
        console.log("⚠️ No hay productos relacionados guardados");
        setProductosRelacionados([]);
      }
    } catch (err) {
      console.error("❌ Error cargando productos relacionados:", err);
      setProductosRelacionados([]);
    } finally {
      setLoadingRelacionados(false);
    }
  }

  function scrollCarrusel(direction) {
    if (carruselRef.current) {
      const scrollAmount = 300;
      carruselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  function handleProductoRelacionadoClick(productoRelacionado) {
    const categorySlug = getCategorySlug(productoRelacionado);
    const productSlug = slugify(productoRelacionado.nombre_producto);
    navigate(`/${categorySlug}/${productSlug}`);
  }

  function getCategorySlug(prod) {
    const idToSlug = {
      1: "pcs", 2: "laptops", 3: "monitores", 4: "mouse", 5: "accesorios",
      6: "sonido", 7: "tintas", 8: "licencia", 9: "reacondicionados",
      10: "redes", 11: "impresoras", 12: "componentes", 13: "estabilizadores"
    };
    
    if (prod.id_categoria && idToSlug[prod.id_categoria]) {
      return idToSlug[prod.id_categoria];
    }
    
    return "productos";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <HeaderTienda />
        <main className="max-w-screen-xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-96 bg-gray-200 rounded-xl"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <FooterTienda />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <HeaderTienda />
        <main className="max-w-screen-xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h1>
            <p className="text-gray-600 mb-8">{error || "El producto que buscas no está disponible o ha sido eliminado."}</p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Volver atrás
              </button>
              <button 
                onClick={() => navigate("/")} 
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </main>
        <FooterTienda />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <HeaderTienda />
      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Breadcrumb mejorado */}
        <nav className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button onClick={() => navigate("/")} className="hover:text-blue-600 transition-colors">Inicio</button>
            <span>›</span>
            <button onClick={() => navigate(-1)} className="hover:text-blue-600 transition-colors">
              {product.categoria || "Productos"}
            </button>
            <span>›</span>
            <span className="text-gray-900 font-medium truncate">{product.nombre_producto}</span>
          </div>
        </nav>

        <ProductDetail
          product={product}
          onAdd={(p, qty) => addToCart({ ...p, quantity: qty })}
        />
        
        {/* Sección de productos relacionados */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <FiPackage className="w-6 h-6 text-blue-600" />
              Productos relacionados
            </h2>
            <p className="text-gray-600">Descubre otros productos que podrían interesarte</p>
          </div>

          {/* Mostrar productos relacionados personalizados */}
          {loadingRelacionados ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : productosRelacionados.length > 0 ? (
            <div className="relative mb-12">
              {/* Botones de navegación */}
              {productosRelacionados.length > 3 && (
                <>
                  <button
                    onClick={() => scrollCarrusel('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <FiChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>
                  <button
                    onClick={() => scrollCarrusel('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <FiChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                </>
              )}

              <div
                ref={carruselRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide py-4 px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {productosRelacionados.map((p) => {
                  const imgUrl = p.imagen_url?.startsWith('/') ? `${API}${p.imagen_url}` : p.imagen_url;
                  
                  return (
                    <div
                      key={p.id_producto}
                      onClick={() => handleProductoRelacionadoClick(p)}
                      className="group w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                        {imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt={p.nombre_producto} 
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <FiPackage className="w-16 h-16 text-gray-400" />
                        )}
                        
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                            <FiPackage className="w-4 h-4" />
                            Ver producto
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem] leading-tight">
                          {p.nombre_producto}
                        </h3>

                        <div className="flex items-center gap-1 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 ml-1">(0)</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-blue-600">
                            S/. {Number(p.precio_venta || 0).toFixed(2)}
                          </div>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 ${p.stock > 0 ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                          </div>
                        </div>

                        <button className="w-full mt-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-700 flex items-center justify-center gap-2">
                          <FiShoppingCart className="w-4 h-4" />
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* TwoCarrusel original (se muestra siempre) */}
          <TwoCarrusel 
            currentProductId={product?.id_producto || product?.id}
            useRelated={true}
          />
        </div>
      </main>
      <FooterTienda />
    </div>
  );
}