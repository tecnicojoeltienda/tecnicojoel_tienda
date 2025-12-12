import { useState, useEffect, useRef } from "react";

const slides = [
  {
    id: 1,
    title: "LO MEJOR EN",
    highlight: "TARJETAS GRAFICAS",
    brands: ["RTX", "RYZEN"],
    cta: "DESCÚBRELAS",
    image: "/assets/tarjetas_video.png",
  },
  {
    id: 2,
    title: "OFERTAS EN",
    highlight: "MONITORES",
    brands: ["TEROS", "HP"],
    cta: "VER OFERTAS",
    image: "/assets/monitores.png",
  },
  {
    id: 3,
    title: "ACCESORIOS PARA",
    highlight: "GAMING",
    brands: ["Logitech", "Razer"],
    cta: "COMPRA AHORA",
    image: "/assets/audifonos.png",
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
      <div className="relative w-full sm:h-[360px] md:h-[420px] lg:h-[520px]">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <article
              key={s.id}
              className="w-full flex-shrink-0"
              aria-hidden={index !== i}
            >
              {/* Slide full-image background with overlay text inside the image */}
              <div
                className="w-full h-full bg-center bg-cover relative flex items-center"
                style={{
                  backgroundImage: `url(${s.image})`,
                }}
              >
                {/* dim overlay for text readability */}
                <div className="absolute inset-0 bg-black/25" />

                {/* text content inside the image */}
                <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6 py-6 md:py-12">
                    <div className="w-full md:w-1/2 text-center md:text-left">
                      <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-medium">
                        {s.title}
                      </h3>
                      <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
                        {s.highlight}
                      </h2>

                      <div className="mt-4 inline-flex items-center gap-3 justify-center md:justify-start">
                        <div className="flex items-center gap-3 bg-white/90 rounded-full px-3 py-2 shadow-sm">
                          {s.brands.map((b) => (
                            <span
                              key={b}
                              className="text-sm font-medium text-gray-700 px-2 py-0.5"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5">
                        <button
                          className="inline-block bg-gradient-to-r from-blue-600 to-red-500 text-white font-semibold px-5 py-2.5 rounded-full text-sm sm:text-base shadow-md"
                          aria-label={s.cta}
                        >
                          {s.cta}
                        </button>
                      </div>
                    </div>

                    {/* optional smaller visual / decorative block on the right when wide */}
                    <div className="hidden md:flex md:w-1/2 justify-end">
                      <div className="w-40 h-40 bg-white/30 rounded-lg flex items-center justify-center text-white/90">
                        {/* can leave blank or place a small badge / logo */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={() => goTo(index - 1)}
          aria-label="Anterior"
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 sm:p-3 rounded-full shadow-md z-20"
        >
          ‹
        </button>
        <button
          onClick={() => goTo(index + 1)}
          aria-label="Siguiente"
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 sm:p-3 rounded-full shadow-md z-20"
        >
          ›
        </button>

        {/* Dots (kept as is) */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className="p-1 rounded-full focus:outline-none"
            >
              <span
                className={`block w-3 h-3 rounded-full transition-colors transform ${
                  i === index ? "bg-blue-600 scale-110" : "bg-gray-300 scale-100"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
