import conexion from "../config/db.js";
import bcrypt from "bcryptjs";
import { createJWT, verifyJWT, getExpiryMs } from "../services/jwt.service.js";
import { revokeToken, isTokenRevoked } from "../services/auth.service.js";

/* helper para obtener conexión (compatible con tu config/db.js) */
async function getConn() {
  if (!conexion) throw new Error("Conexión a la BD no inicializada");
  if (typeof conexion.then === "function") return await conexion;
  return conexion;
}

/**
 * Login para cliente (email+password) o admin (usuario+clave).
 * Responde con cookie httpOnly + json { success: true, token, user }
 */
export async function login(req, res) {
  const db = await getConn();
  const email = (req.body.email || "").toString().trim();
  const password = req.body.password ?? req.body.clave ?? null;
  const usuario = req.body.usuario ?? null;
  const clave = req.body.clave ?? null;
  const debug = process.env.DEBUG_AUTH === "1";

  try {
    // 1) Cliente (email + password/clave)
    if (email && password) {
      const [rows] = await db.query("SELECT * FROM cliente WHERE email = ? LIMIT 1", [email]);
      if (rows && rows.length > 0) {
        const cliente = rows[0];
        const match = await bcrypt.compare(String(password), cliente.clave);
        if (!match) return res.status(401).json({ success: false, data: null, message: "Credenciales inválidas" });

        const payload = { id: cliente.id_cliente, role: "cliente", nombre: cliente.nombre };
        const token = createJWT(payload);
        res.cookie('access_token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: getExpiryMs() });

        const user = {
          id: cliente.id_cliente,
          id_cliente: cliente.id_cliente,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          email: cliente.email,
          dni: cliente.dni,
          telefono: cliente.telefono,
          direccion: cliente.direccion,
          fecha_registro: cliente.fecha_registro,
          role: "cliente"
        };

        return res.status(200).json({ success: true, token, data: user });
      }

      // Si no es cliente, intentar administrador por email (permitir admin login con email+clave)
      const [aByEmail] = await db.query("SELECT * FROM administrador WHERE email = ? LIMIT 1", [email]);
      if (aByEmail && aByEmail.length > 0) {
        const admin = aByEmail[0];
        const matchAdmin = await bcrypt.compare(String(password), admin.clave);
        if (!matchAdmin) return res.status(401).json({ success: false, data: null, message: "Credenciales inválidas" });

        const estadoAdmin = (admin.estado || 'activo').toString().toLowerCase();
        if (!['activo', '1', 'true', ''].includes(estadoAdmin)) {
          return res.status(401).json({ success: false, data: null, message: "Cuenta de administrador desactivada" });
        }

        const roleFromDb = admin.rol ?? admin.role ?? "admin";
        const payload = { id: admin.id_admin, role: roleFromDb, nombre: admin.nombre };
        const token = createJWT(payload);

        res.cookie('access_token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: getExpiryMs() });

        const user = { id: admin.id_admin, nombre: admin.nombre, usuario: admin.usuario, email: admin.email, role: roleFromDb };
        return res.status(200).json({ success: true, token, data: user });
      }

      // no encontrado ni en cliente ni admin
      return res.status(401).json({ success: false, data: null, message: "Credenciales inválidas" });
    }

    // 2) Administrador
    if (usuario && clave) {
      const [rows] = await db.query("SELECT * FROM administrador WHERE usuario = ? LIMIT 1", [usuario]);
      if (!rows || rows.length === 0) return res.status(401).json({ success: false, data: null, message: "Credenciales inválidas" });
      const admin = rows[0];

      const match = await bcrypt.compare(clave, admin.clave);
      if (!match) return res.status(401).json({ success: false, data: null, message: "Credenciales inválidas" });

      const estadoAdmin = (admin.estado || 'activo').toString().toLowerCase();
      if (!['activo', '1', 'true', ''].includes(estadoAdmin)) {
        return res.status(401).json({ success: false, data: null, message: "Cuenta de administrador desactivada" });
      }

      // usar el rol guardado en la BD (campo 'rol')
      const roleFromDb = admin.rol ?? admin.role ?? "admin";
      const payload = { id: admin.id_admin, role: roleFromDb, nombre: admin.nombre };

      const token = createJWT(payload);

      res.cookie('access_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: getExpiryMs()
      });

      const user = { id: admin.id_admin, nombre: admin.nombre, usuario: admin.usuario, role: roleFromDb };
      return res.status(200).json({ success: true, token, data: user });
    }

    return res.status(400).json({ success: false, data: null, message: "Faltan credenciales" });
  } catch (err) {
    console.error("Login error:", err && (err.stack || err.message || err));
    return res.status(500).json({ success: false, data: null, message: "Error interno" });
  }
}

/**
 * Logout: revoca token (in-memory) y limpia cookie.
 */
export function logout(req, res) {
  try {
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = tokenFromHeader || req.body?.token || req.query?.token || req.cookies?.access_token;
    if (token) {
      revokeToken(token);
      console.log('[LOGOUT] token revocado');
    }

    res.clearCookie('access_token', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', httpOnly: true });
    return res.status(200).json({ success: true, message: 'Cierre de sesión OK' });
  } catch (err) {
    console.error('Logout error', err);
    return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
  }
}

/**
 * Refresh: valida token, verifica revocación, recupera usuario desde BD y devuelve info actualizada.
 * Si rol cambió, devuelve role_changed = true y renueva cookie.
 */
export async function refresh(req, res) {
  try {
    const token = req.cookies?.access_token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (!token) {
      res.clearCookie('access_token', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', httpOnly: true });
      return res.status(401).json({ success: false, error: 'Token no válido', forceLogout: true });
    }

    if (isTokenRevoked(token)) {
      res.clearCookie('access_token');
      return res.status(401).json({ success: false, error: 'Token revocado', forceLogout: true });
    }

    let decoded;
    try {
      decoded = verifyJWT(token);
    } catch (e) {
      console.error('[REFRESH] verify error', e);
      res.clearCookie('access_token');
      return res.status(401).json({ success: false, error: 'Token no válido', forceLogout: true });
    }

    const data = decoded.data || decoded;
    if (!data || !data.id) {
      res.clearCookie('access_token');
      return res.status(401).json({ success: false, error: 'Token inválido: datos incompletos', forceLogout: true });
    }

    const db = await getConn();

    // Primero determinar si es cliente o administrador según el rol en el token
    const currentRole = (data.role || '').toString().toLowerCase();

    if (currentRole === 'cliente') {
      // Buscar como cliente
      const [cRows] = await db.query('SELECT * FROM cliente WHERE id_cliente = ? LIMIT 1', [data.id]);
      if (cRows && cRows.length > 0) {
        const user = cRows[0];
        const estado = (user.estado || '').toString().toLowerCase();
        if (['inactivo'].includes(estado)) {
          res.clearCookie('access_token');
          return res.status(401).json({ success: false, error: 'Tu cuenta ha sido desactivada', forceLogout: true });
        }
        return res.status(200).json({
          success: true,
          role_changed: false,
          data: {
            id: user.id_cliente,
            id_cliente: user.id_cliente,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            dni: user.dni,
            telefono: user.telefono,
            direccion: user.direccion,
            fecha_registro: user.fecha_registro,
            role: 'cliente'
          }
        });
      }
    } else {
      // Buscar administrador (para roles como admin, super_admin, etc.)
      const [aRows] = await db.query('SELECT * FROM administrador WHERE id_admin = ? LIMIT 1', [data.id]);
      if (aRows && aRows.length > 0) {
        const admin = aRows[0];
        const estado = (admin.estado || 'activo').toString().toLowerCase();
        
        // Verificar si la cuenta está activa
        if (!['activo', '1', 'true', ''].includes(estado)) {
          res.clearCookie('access_token');
          return res.status(401).json({ success: false, error: 'Cuenta de administrador desactivada', forceLogout: true });
        }

        // Obtener el rol actual de la BD
        const roleFromDb = admin.rol ?? admin.role ?? "admin";
        
        // Verificar si el rol cambió
        const roleChanged = String(roleFromDb) !== String(data.role);
        if (roleChanged) {
          const newToken = createJWT({ id: admin.id_admin, role: roleFromDb, nombre: admin.nombre });
          res.cookie('access_token', newToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: getExpiryMs()
          });
          return res.status(200).json({
            success: true,
            role_changed: true,
            token: newToken,
            data: { 
              id: admin.id_admin, 
              id_admin: admin.id_admin,
              nombre: admin.nombre, 
              apellido: admin.apellido,
              usuario: admin.usuario, 
              email: admin.email,
              role: roleFromDb 
            }
          });
        }

        return res.status(200).json({
          success: true,
          role_changed: false,
          data: { 
            id: admin.id_admin, 
            id_admin: admin.id_admin,
            nombre: admin.nombre, 
            apellido: admin.apellido,
            usuario: admin.usuario, 
            email: admin.email,
            role: roleFromDb 
          }
        });
      }
    }

    // Si no se encuentra ni como cliente ni como administrador
    res.clearCookie('access_token');
    return res.status(401).json({ success: false, error: 'Usuario no encontrado', forceLogout: true });
    
  } catch (err) {
    console.error('[REFRESH ERROR]', err);
    res.clearCookie('access_token');
    return res.status(500).json({ success: false, error: 'Error en refresh', forceLogout: true });
  }
}