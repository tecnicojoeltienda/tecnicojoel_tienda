import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiGrid } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const categories = [
    { id: "accesorios", label: "Accesorios", img: "/assets/accesorios.webp" },
    { id: "componentes", label: "Componentes", img: "/assets/componente.png" },
    { id: "computadoras", label: "Computadoras", img: "/assets/computadora.webp" },
    { id: "discos-solidos", label: "Discos Solidos", img: "/assets/SSD T-FORCE VULCAN Z.jfif" },
    { id: "estabilizadores", label: "Estabilizadores", img: "/assets/estabilizadores.png" },
    { id: "impresoras", label: "Impresoras", img: "/assets/impresora.jpg" },
    { id: "laptops", label: "Laptops", img: "/assets/laptop.webp" },
    { id: "licencia", label: "Licencia", img: "/assets/licencias.avif" },
    { id: "monitores", label: "Monitores", img: "/assets/monitor.jfif" },
    { id: "mouse", label: "Mouse", img: "/assets/mouse.jpg" },
    { id: "preacondicionados", label: "Preacondicionados", img: "/assets/reacondicionado.webp" },
    { id: "redes", label: "Redes", img: "/assets/redes.png" },
    { id: "repuestos", label: "Repuestos", img: "/assets/componente.png" },
    { id: "sonido", label: "Sonido", img: "/assets/sonido.webp" },
    { id: "tarjetas-graficas", label: "Tarjetas Graficas", img: "/assets/componente.png" },
    { id: "teclados", label: "Teclados", img: "/assets/accesorios.webp" },
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
            else if (w >= 1024) setVisible(6);
            else if (w >= 768) setVisible(5);
            else if (w >= 640) setVisible(4);
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
        <section className="w-full py-4 md:py-6 lg:py-8">
            <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
                <div
                    className="bg-white rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                        boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
                        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}
                >
                    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
                            <div>
                                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                    <FiGrid className="w-8 h-8 text-blue-600" />
                                    Nuestras Categorías
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 font-medium">
                                    Explora nuestra amplia variedad de productos tecnológicos
                                </p>
                            </div>

                            {/* Flechas visibles en pantallas >= sm */}
                            <div className="hidden sm:flex items-center gap-2 self-start sm:self-auto">
                                <button
                                    onClick={() => scrollByWidth(-1)}
                                    aria-label="Anterior categorías"
                                    className="group p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200"
                                >
                                    <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                                </button>
                                <button
                                    onClick={() => scrollByWidth(1)}
                                    aria-label="Siguiente categorías"
                                    className="group p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200"
                                >
                                    <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                                </button>
                            </div>
                        </div>

                        {/* Carrusel con scroll horizontal nativo */}
                        <div className="relative">
                            {/* Fade edges (only desktop) */}
                            <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none hidden lg:block" />
                            <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none hidden lg:block" />

                            <div
                                ref={containerRef}
                                className="flex gap-4 overflow-x-auto py-2 custom-scrollbar scroll-pl-4"
                                style={{
                                    scrollSnapType: "x mandatory",
                                    WebkitOverflowScrolling: "touch",
                                    paddingBottom: 6,
                                    touchAction: "pan-x",
                                }}
                                role="list"
                            >
                                {categories.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => goToCategory(c.label)}
                                        className="group flex-shrink-0 flex flex-col items-center justify-start bg-transparent border-0 p-2 sm:p-3 md:p-4 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl min-w-[120px] sm:min-w-[140px] md:min-w-[160px]"
                                        style={{ scrollSnapAlign: "start" }}
                                        aria-label={`Ver categoría ${c.label}`}
                                        role="listitem"
                                    >
                                        <div
                                            className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 xl:w-48 xl:h-48 rounded-full relative flex items-center justify-center overflow-hidden group-hover:shadow-2xl transition-all duration-300"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                                                border: "2px solid rgba(255,255,255,0.18)",
                                                backdropFilter: "blur(12px)",
                                                WebkitBackdropFilter: "blur(12px)",
                                                boxShadow: "0 14px 30px rgba(2,6,23,0.18), inset 0 4px 10px rgba(255,255,255,0.06)",
                                            }}
                                        >
                                            <img
                                                src={c.img}
                                                alt={c.label}
                                                className="z-10 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                loading="lazy"
                                                style={{
                                                    width: "82%",
                                                    height: "82%",
                                                }}
                                            />
                                            <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
                                        </div>

                                        <span
                                            className="mt-3 sm:mt-4 md:mt-5 text-center font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-tight px-2"
                                            style={{
                                                fontSize: "clamp(0.75rem, 2vw, 1.05rem)",
                                                lineHeight: 1.2,
                                                maxWidth: "100%",
                                                wordWrap: "break-word"
                                            }}
                                        >
                                            {c.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-sm font-semibold text-gray-500">
                                <span className="text-blue-600 font-bold text-base">{categories.length}</span> categorías disponibles
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
}