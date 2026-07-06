import React from "react";
import { FiArrowRight } from "react-icons/fi";

export default function PromoDoble({
  imagenIzquierda = "/assets/espacio-trabajo3.jpg", imagenDerecha = "/assets/setup.jfif",
  linkIzquierda = "/categoria-1", linkDerecha = "/categoria-2"
}) {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <a href={linkIzquierda} className="group relative h-[350px] lg:h-[400px] rounded-3xl overflow-hidden bg-slate-900">
          <img src={imagenIzquierda} alt="Promo" className="w-full h-full object-cover transition-transform duration-700 opacity-80 group-hover:scale-105 group-hover:opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent p-10 flex flex-col justify-center">
            <span className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-3">Destacado</span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6 max-w-xs">
              Potencia tu Espacio de Trabajo
            </h3>
            <div className="flex items-center gap-2 text-white font-semibold group-hover:gap-3 transition-all">
              Ver Colección <FiArrowRight />
            </div>
          </div>
        </a>

        <a href={linkDerecha} className="group relative h-[350px] lg:h-[400px] rounded-3xl overflow-hidden bg-slate-900">
          <img src={imagenDerecha} alt="Promo" className="w-full h-full object-cover transition-transform duration-700 opacity-80 group-hover:scale-105 group-hover:opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-10 flex flex-col justify-end items-start">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-2">Setup Gamer Pro</h3>
            <p className="text-slate-300 font-medium mb-6">Equípate para la victoria</p>
            <button className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors">
              Comprar Ahora
            </button>
          </div>
        </a>
      </div>
    </section>
  );
}