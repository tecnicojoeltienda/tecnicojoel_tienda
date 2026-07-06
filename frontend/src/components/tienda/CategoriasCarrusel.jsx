import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const categories = [
    { id: "accesorios", label: "Accesorios", img: "/assets/accesorios.webp" },
    { id: "componentes", label: "Componentes", img: "/assets/componente.png" },
    { id: "computadoras", label: "Computadoras", img: "/assets/computadora.webp" },
    { id: "discos-solidos", label: "Discos Solidos", img: "/assets/discos-solidos.webp" },
    { id: "estabilizadores", label: "Estabilizadores", img: "/assets/estabilizador.jfif" },
    { id: "impresoras", label: "Impresoras", img: "/assets/impresora.jpg" },
    { id: "laptops", label: "Laptops", img: "/assets/laptop.webp" },
    { id: "licencia", label: "Licencia", img: "/assets/licencias.avif" },
    { id: "monitores", label: "Monitores", img: "/assets/monitor.jfif" },
    { id: "mouse", label: "Mouse", img: "/assets/mouse.jpg" },
    { id: "preacondicionados", label: "Preacondicionados", img: "/assets/reacondicionado.webp" },
    { id: "redes", label: "Redes", img: "/assets/redes.jfif" },
    { id: "repuestos", label: "Repuestos", img: "/assets/repuestos.png" },
    { id: "sonido", label: "Sonido", img: "/assets/sonido.webp" },
    { id: "tarjetas-graficas", label: "Tarjetas Graficas", img: "/assets/componente.png" },
    { id: "teclados", label: "Teclados", img: "/assets/teclado.jpg" },
    { id: "tintas", label: "Tintas", img: "/assets/tintas.jfif" },
];

function slugify(name = "") {
    return name
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-");
}

export default function CategoriasCarrusel() {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(7);
    const containerRef = useRef(null);

    useEffect(() => {
        function update() {
            const w = window.innerWidth;
            if (w >= 1536) setVisible(8);
            else if (w >= 1280) setVisible(7);
            else if (w >= 1024) setVisible(5); 
            else if (w >= 768) setVisible(4);
            else if (w >= 640) setVisible(3);
            else if (w >= 480) setVisible(3);
            else setVisible(2);
        }
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    function goToCategory(cat) {
        navigate(`/${slugify(cat)}`);
    }

    const scrollByWidth = (direction = 1) => {
        const el = containerRef.current;
        if (!el) return;
        const amount = Math.round(el.clientWidth * 0.75);
        el.scrollBy({ left: amount * direction, behavior: "smooth" });
    };

    return (
        <section className="w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
                <div className="p-6 md:p-8 lg:p-10">
                    
                    {/* Header Limpio */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                                Nuestras Categorías
                            </h3>
                            <p className="text-slate-500 font-medium mt-1">
                                Explora nuestra variedad de productos
                            </p>
                        </div>

                        <div className="hidden sm:flex items-center gap-3">
                            <button onClick={() => scrollByWidth(-1)} className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-slate-600 shadow-sm">
                                <FiChevronLeft className="w-6 h-6" />
                            </button>
                            <button onClick={() => scrollByWidth(1)} className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-slate-600 shadow-sm">
                                <FiChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none hidden lg:block" />
                        <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none hidden lg:block" />

                        <div ref={containerRef} className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-6 pt-2 px-2 custom-scrollbar snap-x snap-mandatory">
                            {categories.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => goToCategory(c.label)}
                                    className="group flex flex-col items-center flex-shrink-0 w-[120px] sm:w-[140px] lg:w-[160px] snap-start outline-none"
                                >
                                    {/* Contenedores más grandes: w-28 h-28 -> w-32 h-32 -> w-36 h-36 */}
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-4 sm:p-5 lg:p-6 transition-all duration-300 group-hover:bg-blue-50/50 group-hover:scale-105 group-hover:border-blue-100 group-hover:shadow-[0_10px_30px_-10px_rgba(37,99,235,0.2)]">
                                        <img
                                            src={c.img}
                                            alt={c.label}
                                            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    </div>
                                    <span className="mt-4 text-sm sm:text-[15px] font-bold text-slate-600 group-hover:text-blue-700 transition-colors text-center leading-tight">
                                        {c.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </section>
    );
}