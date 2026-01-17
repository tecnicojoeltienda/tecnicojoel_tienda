import React from "react";

export default function PromoDoble({
  leftImage = "/assets/monitores-grid.webp",
  rightImage = "/assets/licencia-grid.png",
  leftLink = "/monitores",
  rightLink = "/licencias",
  altLeft = "Promoción monitores",
  altRight = "Promoción licencias",
}) {
  return (
    <section className="w-full py-6">
      <div className="w-full mx-0 px-2 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Imagen izquierda */}
          <a
            href={leftLink}
            className="block w-full focus:outline-none group"
            aria-label={altLeft}
          >
            <div className="w-full rounded-xl overflow-hidden shadow-lg bg-gray-100 h-48 sm:h-56 md:h-64 lg:h-72">
              <img
                src={leftImage}
                alt={altLeft}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </a>

          {/* Imagen derecha */}
          <a
            href={rightLink}
            className="block w-full focus:outline-none group"
            aria-label={altRight}
          >
            <div className="w-full rounded-xl overflow-hidden shadow-lg bg-gray-100 h-48 sm:h-56 md:h-64 lg:h-72">
              <img
                src={rightImage}
                alt={altRight}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}