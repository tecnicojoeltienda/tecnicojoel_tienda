import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// IMPORTACION GLOBAL
import CarritoPage from "./pages/tienda/CarritoPage.jsx";
import NotAuthorized404 from "./pages/NotAuthorized404.jsx";

// IMPORTACIONES DEL INVENTARIO
import DashboardLayout from "./layouts/inventario/DashboardLayout.jsx";
import ProductosPage from "./pages/inventario/ProductosPage.jsx";
import PedidosPage from "./pages/inventario/PedidosPage.jsx";
import ClientePage from "./pages/inventario/ClientePage.jsx";
import VentasPage from "./pages/inventario/VentasPage.jsx";
import MovimientosPage from "./pages/inventario/MovimientosPage.jsx";
import AdministradoresPage from "./pages/inventario/AdministradoresPage.jsx";
import CreateAdminPage from "./pages/inventario/CreateAdminPage.jsx";

// IMPORTACIONES PARA REGISTRO E INICIO DE SESIÓN
import LoginTiendaPage from "./pages/tienda/LoginTiendaPage.jsx";
import RegisterTiendaPage from "./pages/tienda/RegisterTiendaPage.jsx";

// IMPORTACIONES PARA EL INVENTARIO
import Dashboard from "./pages/inventario/DashboardPage.jsx";
import ProductCreatePage from "./pages/inventario/ProductCreatePage.jsx";
import ProductEditPage from "./pages/inventario/ProductEditPage.jsx";
import PrincipalTienda from "./pages/tienda/PrincipalTienda.jsx";
import ComputadorasPage from "./pages/tienda/ComputadorasPage.jsx";
import LaptopsPage from "./pages/tienda/LaptosPage.jsx";
import ImpresorasPage from "./pages/tienda/ImpresorasPage.jsx";
import MonitoresPage from "./pages/tienda/MonitoresPage.jsx";
import MousePage from "./pages/tienda/MousePage.jsx";
import AccesoriosPage from "./pages/tienda/AccesoriosPage.jsx";
import LicenciaPage from "./pages/tienda/LicenciaPage.jsx";
import ComponentesPage from "./pages/tienda/ComponentesPage.jsx";
import SonidoPage from "./pages/tienda/SonidoPage.jsx";
import RedesPage from "./pages/tienda/RedesPage.jsx";
import TintasPage from "./pages/tienda/TintasPage.jsx";
import EstabilizadoresPage from "./pages/tienda/EstabilizadoresPage.jsx";
import PreacondicionadosPage from "./pages/tienda/PreacondicionadosPage.jsx";
import ProductosDetallesPage from "./pages/tienda/ProductosDetallesPage.jsx";
import HistorialPedidoPage from "./pages/tienda/HistorialPedidoPage.jsx";
import PerfilTiendaPage from "./pages/tienda/PerfilTiendaPage.jsx";



import "./index.css";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* redirigir /inventario a login */}
            <Route path="/inventario" element={<Navigate to="/inventario/login" replace />} />

           

            {/* Rutas del inventario protegidas y anidadas dentro de DashboardLayout */}
            <Route
              path="/inventario/*"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="productos" element={<ProductosPage />} />
              <Route path="pedidos" element={<PedidosPage />} />
              <Route path="ventas" element={<VentasPage />} />
              <Route path="movimientos" element={<MovimientosPage />} />
              <Route path="productos/nuevo" element={<ProductCreatePage />} />
              <Route path="productos/:id/editar" element={<ProductEditPage />} />

              {/* Solo super_admin puede acceder a clientes, lista y creación de administradores */}
              <Route
                path="clientes"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <ClientePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="administradores"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdministradoresPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="administradores/nuevo"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <CreateAdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Tienda pública / autenticación */}
            <Route path="/" element={<PrincipalTienda />} />
            <Route path="/login" element={<LoginTiendaPage />} />
            <Route path="/registro" element={<RegisterTiendaPage />} />
            <Route path="/computadoras" element={<ComputadorasPage />} />
            <Route path="/laptops" element={<LaptopsPage />} />
            <Route path="/impresoras" element={<ImpresorasPage />} />
            <Route path="/monitores" element={<MonitoresPage />} />
            <Route path="/mouse" element={<MousePage />} />
            <Route path="/accesorios" element={<AccesoriosPage />} />
            <Route path="/licencia" element={<LicenciaPage />} />
            <Route path="/componentes" element={<ComponentesPage />} />
            <Route path="/sonido" element={<SonidoPage />} />
            <Route path="/redes" element={<RedesPage />} />
            <Route path="/tintas" element={<TintasPage />} />
            <Route path="/estabilizadores" element={<EstabilizadoresPage />} />
            <Route path="/reacondicionados" element={<PreacondicionadosPage />} />
            <Route path="/carrito" element={<CarritoPage />} />
            <Route path="/:category/:slug" element={<ProductosDetallesPage />} />

            {/* Rutas que requieren estar autenticado (tienda) */}
            <Route
              path="/pedidos"
              element={
                <ProtectedRoute>
                  <HistorialPedidoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <PerfilTiendaPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;