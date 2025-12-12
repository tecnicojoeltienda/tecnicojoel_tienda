export function normalizeRole(r = "") {
  return String(r || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function hasAllowedRole(userRole = "", allowed = []) {
  const u = normalizeRole(userRole);
  if (!u) return false;
  if (!Array.isArray(allowed) || allowed.length === 0) return true; 
  const allowedNorm = (allowed || []).map(a => normalizeRole(a));
  return allowedNorm.includes(u);
}