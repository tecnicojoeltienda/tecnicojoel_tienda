import { useState, useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const slides = [
  { id: 1, image: "/assets/laptop-gamer3.png", link: "/laptops", title: "Nueva Generación", subtitle: "Laptops Series" },
  { id: 2, image: "/assets/pc-carrusel4.png", link: "/computadoras", title: "Potencia Extrema", subtitle: "Workstations & Gaming" },
  { id: 3, image: "/assets/tarjeta-carrusel.png", link: "/tarjetas-graficas", title: "Gráficos RTX", subtitle: "Eleva tu nivel" },
];

export default function CarruselPrincipal() {
  const [index, setIndex] = useState(0);
  const autoplayRef = useRef(null);

  useEffect(() => {
    autoplayRef.current = () => setIndex((i) => (i + 1) % slides.length);
  });
  
  useEffect(() => {
    const play = () => autoplayRef.current();
    const id = setInterval(play, 6000);
    return () => clearInterval(id);
  }, []); 

  const goTo = (i) => setIndex((i + slides.length) % slides.length);

  return (
    <section className="w-full">
      <div className="relative w-full h-[450px] lg:h-[600px] overflow-hidden rounded-3xl bg-slate-900 group shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        
        <div
          className="flex h-full w-full transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s) => (
            <article key={s.id} className="w-full h-full flex-shrink-0 relative">
              <a href={s.link} className="block w-full h-full relative overflow-hidden group/slide">
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-full object-cover transition-transform duration-[15s] ease-out group-hover/slide:scale-105 opacity-90"
                />
                {/* Gradiente más suave */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                {/* Textos premium */}
                <div className="absolute bottom-12 sm:bottom-16 left-8 sm:left-16 z-10 max-w-2xl">
                  <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-xs font-bold tracking-widest uppercase shadow-sm">
                    {s.subtitle}
                  </span>
                  <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg leading-tight">
                    {s.title}
                  </h2>
                </div>
              </a>
            </article>
          ))}
        </div>

        {/* Controles Apple-style */}
        <button onClick={() => goTo(index - 1)} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/40 hover:scale-105">
          <FiChevronLeft className="w-6 h-6" />
        </button>
        
        <button onClick={() => goTo(index + 1)} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/40 hover:scale-105">
          <FiChevronRight className="w-6 h-6" />
        </button>

        {/* Dots minimalistas */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${i === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}