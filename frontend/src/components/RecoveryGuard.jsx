import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RecoveryGuard({ children }) {
  const location = useLocation();
  const allowed =
    sessionStorage.getItem("recovery_started") === "1" ||
    sessionStorage.getItem("recovery_email") ||
    sessionStorage.getItem("recovery_token");

  if (!allowed) {
    return <Navigate to="/recuperar" replace state={{ from: location }} />;
  }
  return children;
}