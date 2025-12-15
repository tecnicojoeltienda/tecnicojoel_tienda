import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { hasAllowedRole } from "../filters/roles";
import NotAuthorized404 from "../pages/NotAuthorized404.jsx";

export default function ProtectedRoute({ children, allowedRoles = [], redirectToLogin = true }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  const isInventory = location.pathname.startsWith("/inventario");

  if (!user) {
    if (redirectToLogin) {
      const loginPath = isInventory ? "/login" : "/login";
      return <Navigate to={loginPath} state={{ from: location }} replace />;
    } else {
      
      return children;
    }
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = user.role ?? user.rol ?? user?.roleName ?? "";
    if (!hasAllowedRole(role, allowedRoles)) {
      return <NotAuthorized404 />;
    }
  }

  return children;
}