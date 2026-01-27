import { useState, useEffect, useRef } from "react";

const slides = [
  {
    id: 1,
    image: "/assets/laptops-carrusel2.webp",
    link: "/laptops",
  },
  {
    id: 2,
    image: "/assets/pc-carrusel.webp",
    link: "/computadoras",
  },
  {
    id: 3,
    image: "/assets/tarjeta-carrusel.webp",
    link: "/tarjetas-graficas",
  },
];

export default function CarruselPrincipal() {
  const [index, setIndex] = useState(0);
  const autoplayRef = useRef(null);

  useEffect(() => {
    autoplayRef.current = () => setIndex((i) => (i + 1) % slides.length);
  });
  
  useEffect(() => {
    const play = () => autoplayRef.current();
    const id = setInterval(play, 5000);
    return () => clearInterval(id);
  }, []); 

  function goTo(i) {
    setIndex((i + slides.length) % slides.length);
  }

  return (
    <section className="w-full overflow-hidden relative">
      <div className="w-full mx-0 px-2 sm:px-4 lg:px-6">
        {/* Contenedor full-width con altura controlada */}
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[550px] overflow-hidden bg-gray-900 rounded-2xl">
          <div
            className="flex h-full w-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((s, i) => (
              <article
                key={s.id}
                className="w-full h-full flex-shrink-0 relative"
                aria-hidden={index !== i}
              >
                <a
                  href={s.link}
                  className="block w-full h-full relative overflow-hidden group"
                  aria-label={`Ver productos ${s.link}`}
                >
                  <img
                    src={s.image}
                    alt={`Slide ${s.id}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center center'
                    }}
                  />
                  {/* Overlay sutil en hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </a>
              </article>
            ))}
          </div>

          {/* Arrows - Diseño limpio y profesional */}
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Anterior"
            className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full shadow-lg z-20 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 transition-all hover:scale-110 backdrop-blur-sm"
          >
            ‹
          </button>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Siguiente"
            className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full shadow-lg z-20 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 transition-all hover:scale-110 backdrop-blur-sm"
          >
            ›
          </button>

          {/* Dots - Indicadores minimalistas */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-2.5 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className="group p-1 focus:outline-none"
              >
                <span
                  className={`block w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                    i === index 
                      ? "bg-white scale-125 shadow-lg" 
                      : "bg-white/50 hover:bg-white/80 scale-100"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
