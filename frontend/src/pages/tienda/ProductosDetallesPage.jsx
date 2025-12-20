import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { resolveImageUrl } from "../../service/api";
import ProductDetail from "../../components/tienda/ProductDetail";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import { useCart } from "../../context/CartContext";
import TwoCarrusel from "../../components/tienda/TwoCarrusel";
import { FiPackage, FiAlertCircle } from "react-icons/fi";

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

        if (mounted) setProduct(data || null);
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