import React from "react";
import { useNavigate } from "react-router-dom";

export default function PromoMosaic({
  leftImage = "/assets/laptopgamer.png",
  topRightImage = "/assets/imagen2.png",
  midRightImage = "/assets/mouse1.png",
  bottomRightImage = "/assets/audifonos.png",
}) {
  const navigate = useNavigate();

  return (
    <section className="w-full py-6">
      {/* wrapper full width */}
      <div className="w-full mx-0 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Large left tile */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden shadow-lg">
            <div className="relative w-full h-80 sm:h-96 lg:h-[520px] bg-gray-100">
              <img src={leftImage} alt="Promo grande" className="w-full h-full object-cover block" loading="lazy" />
              {/* Texto sobre la imagen */}
              <div className="absolute inset-0 flex flex-col justify-center items-start p-8 md:p-12 lg:p-16">
                <h3 className="text-white text-2xl md:text-3xl lg:text-4xl font-extrabold drop-shadow-lg">
                  Los miembros ganan <span className="text-yellow-300">5% de reembolso</span>
                </h3>
                <p className="mt-3 text-white/90 max-w-xl drop-shadow">
                  Beneficios exclusivos y ofertas especiales. Aprovecha hoy.
                </p>
              </div>
            </div>
          </div>

          {/* Right column with three tiles */}
          <div className="flex flex-col gap-4">
            <div className="relative rounded-xl overflow-hidden shadow-lg h-40 sm:h-48">
              <img
                src={topRightImage}
                alt="Promo superior derecha"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex flex-col justify-center items-start p-4">
                <h4 className="text-white font-bold text-lg">Apply today</h4>
                <p className="text-white/90 text-sm">Cardmembers get so many benefits</p>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-lg h-36 sm:h-44">
              <img
                src={midRightImage}
                alt="Promo intermedia derecha"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex flex-col justify-center items-start p-4">
                <h4 className="text-white font-bold text-lg">Cuidar el resfriado</h4>
                <p className="text-white/90 text-sm">Encuentra vacunas y alivio rápido</p>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-lg h-36 sm:h-44">
              <img
                src={bottomRightImage}
                alt="Promo inferior derecha"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Esta imagen tiene botón */}
              <div className="absolute inset-0 flex flex-col justify-between items-start p-4">
                <div>
                  <h4 className="text-white font-bold text-lg">Servicios de instalación</h4>
                  <p className="text-white/90 text-sm">Instalación de luces y decoración</p>
                </div>

                <div className="w-full flex justify-end">
                  <button
                    onClick={() => navigate("/servicios/instalacion")}
                    className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold shadow-md hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    Comprar ahora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}