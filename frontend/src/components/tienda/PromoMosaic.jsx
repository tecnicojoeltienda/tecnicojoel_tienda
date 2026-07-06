import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

export default function PromoMosaic({
  leftImage = "/assets/laptopgamer.png", topRightImage = "/assets/setup2.avif",
  midRightImage = "/assets/audifonos.png", bottomRightImage = "/assets/imagen2.png",
}) {
  const navigate = useNavigate();

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 lg:gap-6 md:h-[550px]">
        
        {/* Bento Grande */}
        <div className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden group bg-slate-900 cursor-pointer">
          <img src={leftImage} alt="Promo" className="w-full h-full object-cover transition-transform duration-700 opacity-80 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-10 flex flex-col justify-end">
            <span className="text-blue-400 font-bold tracking-widest text-[11px] uppercase mb-3">Oferta Exclusiva</span>
            <h3 className="text-white text-3xl md:text-5xl font-extrabold leading-tight mb-6">
              Domina el juego con nueva tecnología.
            </h3>
            <button className="w-fit flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors">
              Descubrir más <FiArrowRight />
            </button>
          </div>
        </div>

        {/* Superiores & Inferiores usando la misma receta: relative, rounded-3xl, flex-col, bg-slate-900 */}
        <div className="md:col-span-2 md:row-span-1 relative rounded-3xl overflow-hidden group bg-slate-900 cursor-pointer">
          <img src={topRightImage} alt="Setup" className="w-full h-full object-cover transition-transform duration-700 opacity-70 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent p-8 flex flex-col justify-center">
            <h4 className="text-white font-extrabold text-2xl mb-2">Arma tu Setup</h4>
            <p className="text-slate-300 text-sm max-w-[200px]">Componentes de última generación.</p>
          </div>
        </div>

        <div className="md:col-span-1 md:row-span-1 relative rounded-3xl overflow-hidden group bg-slate-900 cursor-pointer">
          <img src={midRightImage} alt="Accesorios" className="w-full h-full object-cover transition-transform duration-700 opacity-70 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-6 flex flex-col justify-end">
            <h4 className="text-white font-bold text-lg">Accesorios</h4>
          </div>
        </div>

        <div className="md:col-span-1 md:row-span-1 relative rounded-3xl overflow-hidden group bg-slate-900 cursor-pointer">
          <img src={bottomRightImage} alt="Audio" className="w-full h-full object-cover transition-transform duration-700 opacity-60 group-hover:scale-105" />
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            <h4 className="text-white font-bold text-lg leading-tight">Servicio Técnico</h4>
            <button onClick={() => navigate("/servicios/instalacion")} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-white hover:text-slate-900 transition-colors w-fit">
              Reservar
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}