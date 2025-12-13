import React, { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext();

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Persistir cambios
  useEffect(() => {
    if (token) localStorage.setItem("token", token); else localStorage.removeItem("token");
    if (user) localStorage.setItem("user", JSON.stringify(user)); else localStorage.removeItem("user");
  }, [token, user]);

  // refresh al iniciar la app para validar token con backend
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const tok = localStorage.getItem("token") || null;
      const res = await fetch(`${API}/apij/auth/refresh`, {
        method: "GET",
        headers: tok ? { Authorization: `Bearer ${tok}` } : {}
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setUser(json.data);
        // backend puede haber renovado cookie/token; si devuelve token, actualizar
        if (json.token) setToken(json.token);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // login: acepta credenciales (puede ser {email,password} o {usuario,clave})
  async function login(credentials = {}, remember = true) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/apij/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, error: json || { message: "Error auth" } };
      }
      // backend devuelve { success, token, data }
      const tokenFromServer = json.token ?? null;
      const userFromServer = json.data ?? json.user ?? null;

      if (tokenFromServer) setToken(tokenFromServer);
      if (userFromServer) setUser(userFromServer);

      return { ok: true, data: userFromServer, token: tokenFromServer };
    } catch (err) {
      return { ok: false, error: { message: "Error de conexión" } };
    } finally {
      setLoading(false);
    }
  }

  // logout: avisa al backend y limpia estado
  async function logout() {
    try {
      const tok = token || localStorage.getItem("token");
      await fetch(`${API}/apij/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
        body: JSON.stringify({ token: tok }),
      });
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}