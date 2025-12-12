import * as CodigoDescuento from "../models/codigo_descuento.model.js";

/**
 * Validar un código de descuento
 * GET /apij/codigos-descuento/validar/:codigo
 */
export async function validar(req, res) {
  try {
    const codigo = String(req.params.codigo || "").trim().toUpperCase();
    
    if (!codigo) {
      return res.status(400).json({ 
        valid: false, 
        message: "Código requerido" 
      });
    }
    
    const validation = await CodigoDescuento.validarCodigo(codigo);
    
    if (validation.valid) {
      return res.json({
        valid: true,
        message: validation.message,
        codigo: validation.data.codigo,
        porcentaje: validation.data.porcentaje,
        usos_disponibles: validation.data.max_usos - validation.data.usos_actuales
      });
    } else {
      return res.status(400).json({
        valid: false,
        message: validation.message
      });
    }
  } catch (err) {
    console.error("Error validar código:", err);
    return res.status(500).json({ 
      valid: false, 
      message: "Error al validar código" 
    });
  }
}

/**
 * Consumir un código (registrar uso)
 * POST /apij/codigos-descuento/consumir
 * Body: { codigo: "TECNICO5" }
 */
export async function consumir(req, res) {
  try {
    const codigo = String(req.body.codigo || "").trim().toUpperCase();
    
    if (!codigo) {
      return res.status(400).json({ 
        success: false, 
        message: "Código requerido" 
      });
    }
    
    const resultado = await CodigoDescuento.consumirCodigo(codigo);
    
    return res.json({
      success: true,
      message: "Código consumido exitosamente",
      codigo: resultado.codigo,
      porcentaje: resultado.porcentaje,
      usos_restantes: resultado.max_usos - resultado.usos_actuales
    });
  } catch (err) {
    console.error("Error consumir código:", err);
    return res.status(400).json({ 
      success: false, 
      message: err.message || "Error al consumir código" 
    });
  }
}

/**
 * Listar códigos (solo para admin)
 * GET /apij/codigos-descuento
 */
export async function listar(req, res) {
  try {
    const codigos = await CodigoDescuento.listarCodigos();
    return res.json(codigos);
  } catch (err) {
    console.error("Error listar códigos:", err);
    return res.status(500).json({ message: "Error al listar códigos" });
  }
}