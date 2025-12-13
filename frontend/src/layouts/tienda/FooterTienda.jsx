import React, { useState } from "react";
import { FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiMail, FiPhone, FiMapPin } from "react-icons/fi";

export default function FooterTienda() {
  const [email, setEmail] = useState("");
  const waPhone = "51926700418"; 

  const handleSubscribe = (e) => {
    e.preventDefault();
    const lines = [
      "Nueva suscripción desde la web:",
      `Correo: ${email || "(no proporcionado)"}`,
      "",
      "Saludos, por favor confirmar la suscripción."
    ];
    const text = lines.join("\n");
    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <footer className="bg-gray-900 text-gray-100">
      <div className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo + descripción */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-30 h-30 sm:w-30 sm:h-30 rounded-lg overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0">
                <img
                  src="/assets/logo.png"
                  alt="Logo Tecnico Joel"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>

              <div className="text-left">
                <h3 className="text-lg font-semibold" style={{ fontFamily: "Impact, Charcoal, sans-serif" }}>Tecnico Joel</h3>
                <p className="text-sm text-gray-300">La mejor tecnología al mejor precio. Envíos rápidos y atención personalizada.</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <a href="#" aria-label="Instagram" className="p-2 rounded-md bg-white/5 hover:bg-white/10">
                <FiInstagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Facebook" className="p-2 rounded-md bg-white/5 hover:bg-white/10">
                <FiFacebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Twitter" className="p-2 rounded-md bg-white/5 hover:bg-white/10">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" aria-label="YouTube" className="p-2 rounded-md bg-white/5 hover:bg-white/10">
                <FiYoutube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Contacto</h4>
            <ul className="text-sm space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <FiPhone className="mt-0.5 w-5 h-5 text-gray-300" />
                <div>
                  <div className="text-gray-100 font-medium">Línea de ventas</div>
                  <div className="text-xs">+51 01 8000 0000</div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <FiMail className="mt-0.5 w-5 h-5 text-gray-300" />
                <div>
                  <div className="text-gray-100 font-medium">Correo</div>
                  <div className="text-xs">ventas@tecnicojoel.com</div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <FiMapPin className="mt-0.5 w-5 h-5 text-gray-300" />
                <div>
                  <div className="text-gray-100 font-medium">Dirección</div>
                  <div className="text-xs">Av. Ejemplo 123, Oficina 4, Ciudad, País</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Enlaces</h4>
            <ul className="text-sm space-y-3 text-gray-300">
              <li><a href="#" className="hover:underline">Tienda</a></li>
              <li><a href="#" className="hover:underline">Ofertas</a></li>
              <li><a href="#" className="hover:underline">Soporte</a></li>
              <li><a href="#" className="hover:underline">Política de privacidad</a></li>
            </ul>
          </div>

          {/* Suscripción / horario */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Atención</h4>
            <p className="text-sm text-gray-300 mb-4">Lunes a Domingo — Todas las 24 horas</p>

            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white/5 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-80"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-red-500 text-white text-sm font-semibold"
              >
                Suscribir
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400" style={{ fontFamily: "Impact, Charcoal, sans-serif" }}>
          <div>© {new Date().getFullYear()} Tecnico Joel. Todos los derechos reservados.</div>
          <div className="mt-3 md:mt-0">Desarrollado por David Mesta · <a href="#" className="text-gray-200 hover:underline">Términos y condiciones</a></div>
        </div>
      </div>
    </footer>
  );
}