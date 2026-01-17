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
      <div className="relative w-full sm:h-[360px] md:h-[420px] lg:h-[520px]">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <article
              key={s.id}
              className="w-full flex-shrink-0 h-full"
              aria-hidden={index !== i}
            >
              <a
                href={s.link}
                className="block w-full h-full flex items-center justify-center bg-gray-50"
                aria-label={`Ver productos ${s.link}`}
              >
                <img
                  src={s.image}
                  alt={`Slide ${s.id}`}
                  className="max-w-full max-h-full object-contain object-center"
                />
              </a>
            </article>
          ))}
        </div>

        {/* Arrows - más redondeados */}
        <button
          onClick={() => goTo(index - 1)}
          aria-label="Anterior"
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-12 h-12 rounded-full shadow-lg z-20 flex items-center justify-center text-2xl font-bold text-gray-800 transition-all hover:scale-110"
        >
          ‹
        </button>
        <button
          onClick={() => goTo(index + 1)}
          aria-label="Siguiente"
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-12 h-12 rounded-full shadow-lg z-20 flex items-center justify-center text-2xl font-bold text-gray-800 transition-all hover:scale-110"
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className="p-1 rounded-full focus:outline-none"
            >
              <span
                className={`block w-3 h-3 rounded-full transition-all ${
                  i === index ? "bg-blue-600 scale-125" : "bg-white/70 scale-100"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
