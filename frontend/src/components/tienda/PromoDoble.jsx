import React from "react";
import { useNavigate } from "react-router-dom";

export default function PromoDoble({
  leftImage = "/assets/paratienda1.png",
  rightImage = "/assets/imagen2.png",
  leftLink = "#",
  rightLink = "#",
  altLeft = "Promoción izquierda",
  altRight = "Promoción derecha",
}) {
  const navigate = useNavigate();

  return (
    <section className="w-full py-6">
      {/* wrapper full width: eliminar max-w-screen-xl mx-auto */}
      <div className="w-full mx-0 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() =>
              leftLink.startsWith("/") || leftLink.startsWith("http")
                ? navigate(leftLink)
                : window.open(leftLink, "_self")
            }
            className="w-full focus:outline-none"
            aria-label={altLeft}
          >
            {/* contenedor con border-radius y overflow-hidden para que la img ocupe todo y se recorte */}
            <div className="w-full h-56 sm:h-72 md:h-80 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
              <img
                src={leftImage}
                alt={altLeft}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
                style={{ display: "block", borderRadius: 0 }}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              rightLink.startsWith("/") || rightLink.startsWith("http")
                ? navigate(rightLink)
                : window.open(rightLink, "_self")
            }
            className="w-full focus:outline-none"
            aria-label={altRight}
          >
            <div className="w-full h-56 sm:h-72 md:h-80 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
              <img
                src={rightImage}
                alt={altRight}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
                style={{ display: "block", borderRadius: 0 }}
              />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}