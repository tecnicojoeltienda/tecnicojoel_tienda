import React from "react";
import { resolveImageUrl } from "../service/api";
import { toast } from "sonner";

const VERCEL_HOST = "https://tiendatecnicojoel.vercel.app";

function getVercelUrl() {
  if (typeof window === "undefined") return VERCEL_HOST;
  const path = (window.location.pathname || "") + (window.location.search || "") + (window.location.hash || "");
  return `${VERCEL_HOST.replace(/\/$/, "")}${path}`;
}

export default function CompartirModal({ open, onClose, product = {} }) {
  if (!open) return null;

  const img = resolveImageUrl(product.imagen_url);
  const title = product.nombre_producto || "Producto";
  const text = product.subtitulo || product.descripcion || title;
  const url = getVercelUrl();

  const tryFetchImageFile = async () => {
    if (!img) return null;
    try {
      const res = await fetch(img, { mode: "cors" });
      const blob = await res.blob();
      const ext = (blob.type && blob.type.split("/")[1]) || "jpg";
      const filename = `${title.toString().toLowerCase().replace(/\s+/g, "-")}.${ext}`;
      return new File([blob], filename, { type: blob.type || "image/jpeg" });
    } catch (e) {
      return null;
    }
  };

  const shareWhatsApp = () => {
    const body = `${title}\n${text}\n${url}\n${img || ""}`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`;
    window.open(shareUrl, "_blank");
    onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("🔗 Enlace copiado al portapapeles");
    } catch (e) {
      toast.error("No se pudo copiar el enlace");
    }
    onClose();
  };

  const shareOther = async () => {
    try {
      if (navigator.canShare) {
        const file = await tryFetchImageFile();
        if (file && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title,
            text,
            url
          });
          toast.success("✅ Producto compartido");
          onClose();
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title, text, url });
        toast.success("✅ Producto compartido");
        onClose();
        return;
      }
    } catch (err) {
      console.warn("shareOther error:", err);
    }
    await copyLink();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      >
        <div className="w-full h-full bg-gradient-to-br from-blue-800/50 via-blue-700/30 to-transparent backdrop-blur-sm" />
      </div>

      <div className="relative max-w-md w-[92%] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-gray-900">Compartir producto</div>
              <div className="text-sm text-gray-500">{title}</div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Cerrar</button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <button
            onClick={shareWhatsApp}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3"
          >
            <span className="font-medium">WhatsApp</span>
            <span className="text-sm text-gray-500">Compartir vía WhatsApp</span>
          </button>

          <button
            onClick={copyLink}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3"
          >
            <span className="font-medium">Copiar enlace</span>
            <span className="text-sm text-gray-500">Copiar URL al portapapeles</span>
          </button>

          <button
            onClick={shareOther}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3"
          >
            <span className="font-medium">Compartir con otras apps</span>
            <span className="text-sm text-gray-500">Intentar Web Share API (imagen cuando sea posible)</span>
          </button>
        </div>

        <div className="p-3 border-t text-sm text-gray-500">
          <div className="flex items-center gap-3">
            {img ? (
              <img src={img} alt={title} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{title}</div>
              <div className="text-xs text-gray-400 truncate">{text}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}