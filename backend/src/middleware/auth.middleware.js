import pool from '../config/db.js';
import { verifyJWT } from '../services/jwt.service.js';

export default async function authMiddleware(req, res, next) {
  try {
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      return res.status(401).json({ error: 'No autorizado: token ausente' });
    }

    let decoded;
    try {
      decoded = verifyJWT(token);
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const data = decoded?.data || decoded;
    if (!data?.id) return res.status(401).json({ error: 'Token inválido: datos incompletos' });

    // Buscar en la tabla correspondiente (puede ser cliente o administrador)
    // Primero cliente
    const [cRows] = await pool.query('SELECT id_cliente AS id, nombre, apellido, email, estado FROM cliente WHERE id_cliente = ? LIMIT 1', [data.id]);
    if (cRows && cRows.length > 0) {
      const user = cRows[0];
      const estado = (user.estado || '').toString().toLowerCase();
      if (!['activo', '1', 'true'].includes(estado)) return res.status(403).json({ error: 'Cuenta desactivada' });

      req.user = {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: 'cliente'
      };
      return next();
    }

    // Si no es cliente, verificar administrador
    const [aRows] = await pool.query('SELECT id_admin AS id, nombre, usuario, rol, estado FROM administrador WHERE id_admin = ? LIMIT 1', [data.id]);
    if (aRows && aRows.length > 0) {
      const admin = aRows[0];
      const estado = (admin.estado || '').toString().toLowerCase();
      if (!['activo', '1', 'true'].includes(estado)) return res.status(403).json({ error: 'Cuenta de administrador desactivada' });

      req.user = {
        id: admin.id,
        nombre: admin.nombre,
        usuario: admin.usuario,
        role: 'admin'
      };
      return next();
    }

    return res.status(401).json({ error: 'Usuario no encontrado' });
  } catch (err) {
    console.error('[AUTH MIDDLEWARE]', err);
    return res.status(401).json({ error: 'No autorizado' });
  }
}