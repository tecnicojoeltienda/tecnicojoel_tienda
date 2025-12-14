import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const categories = [
    { id: "computadoras", label: "Computadoras", img: "/assets/computadora.webp" },
    { id: "laptops", label: "Laptops", img: "/assets/laptop.webp" },
    { id: "impresoras", label: "Impresoras", img: "/assets/impresora.jpg" },
    { id: "monitores", label: "Monitores", img: "/assets/monitor.jfif" },
    { id: "mouse", label: "Mouse", img: "/assets/mouse.jpg" },
    { id: "accesorios", label: "Accesorios", img: "/assets/accesorios.webp" },
    { id: "componentes", label: "Componentes", img: "/assets/componente.png" },
    { id: "sonido", label: "Sonido", img: "/assets/sonido.webp" },
    { id: "tintas", label: "Tintas", img: "/assets/tintas.jfif" },
    { id: "licencia", label: "Licencia", img: "/assets/licencias.avif" },
    { id: "reacondicionados", label: "Preacondicionados", img: "/assets/reacondicionado.webp" },
    { id: "redes", label: "Redes", img: "/assets/redes.png" },
    { id: "estabilizadores", label: "Estabilizadores", img: "/assets/estabilizadores.png" },
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
    const [index, setIndex] = useState(0);
    const [visible, setVisible] = useState(7);
    const containerRef = useRef(null);

    useEffect(() => {
        function update() {
            const w = window.innerWidth;
            if (w >= 1536) setVisible(8); // 2xl
            else if (w >= 1280) setVisible(7); // xl
            else if (w >= 1024) setVisible(6); // lg
            else if (w >= 768) setVisible(5); // md
            else if (w >= 640) setVisible(4); // sm
            else if (w >= 480) setVisible(3);
            else setVisible(2); // xs
        }
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const maxIndex = Math.max(0, categories.length - visible);
    useEffect(() => {
        setIndex((i) => Math.min(i, maxIndex));
    }, [visible, maxIndex]);

    function prev() {
        setIndex((i) => Math.max(0, i - 1));
    }
    function next() {
        setIndex((i) => Math.min(maxIndex, i + 1));
    }

    function goToCategory(cat) {
        const route = `/${slugify(cat)}`;
        navigate(route);
    }

    return (
        <section className="w-full py-4 md:py-6 lg:py-8">
            <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
                {/* Contenedor principal con border-radius y box-shadow originales */}
                <div
                    className="bg-white rounded-2xl overflow-hidden shadow-2xl"
                    style={{ 
                        boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
                        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}
                >
                    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
                        {/* Header con título y controles */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
                            <div>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-1 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text">
                                    Nuestras Categorías
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 font-medium">
                                    Explora nuestra amplia variedad de productos tecnológicos
                                </p>
                            </div>

                            {/* Controles de navegación */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <button
                                    onClick={prev}
                                    aria-label="Anterior categorías"
                                    className="group p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:hover:scale-100"
                                    disabled={index === 0}
                                >
                                    <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                                </button>
                                <button
                                    onClick={next}
                                    aria-label="Siguiente categorías"
                                    className="group p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:hover:scale-100"
                                    disabled={index >= maxIndex}
                                >
                                    <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                                </button>
                            </div>
                        </div>

                        {/* Carrusel de categorías */}
                        <div className="relative overflow-hidden">
                            {/* Indicadores de posición */}
                            {maxIndex > 0 && (
                                <div className="flex justify-center gap-2 mb-4">
                                    {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setIndex(i)}
                                            aria-label={`Ir a página ${i + 1}`}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                i === index 
                                                    ? 'w-8 bg-gradient-to-r from-blue-600 to-blue-600' 
                                                    : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}

                            <div
                                ref={containerRef}
                                className="flex transition-transform duration-500 ease-out items-stretch"
                                style={{
                                    transform: `translateX(-${(index * 100) / visible}%)`,
                                }}
                            >
                                {categories.map((c, idx) => (
                                    <button
                                        key={c.id}
                                        onClick={() => goToCategory(c.label)}
                                        className="group flex-shrink-0 flex flex-col items-center justify-start bg-transparent border-0 p-2 sm:p-3 md:p-4 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
                                        style={{ width: `${100 / visible}%` }}
                                        aria-label={`Ver categoría ${c.label}`}
                                    >
                                        {/* Círculo con efecto vidrio mejorado */}
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
                                            {/* Imagen del producto */}
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

                                            {/* Reflejo superior mejorado */}
                                            <div
                                                className="absolute rounded-full pointer-events-none"
                                                style={{
                                                    top: "-10%",
                                                    left: "-6%",
                                                    width: "70%",
                                                    height: "55%",
                                                    background: "radial-gradient(ellipse at top left, rgba(255,255,255,0.7), rgba(255,255,255,0.08))",
                                                    transform: "rotate(-12deg)",
                                                    filter: "blur(18px)",
                                                    opacity: 0.9,
                                                }}
                                            />

                                            {/* Brillo inferior */}
                                            <div
                                                className="absolute rounded-full pointer-events-none"
                                                style={{
                                                    bottom: "-4%",
                                                    right: "-4%",
                                                    width: "50%",
                                                    height: "38%",
                                                    background: "radial-gradient(ellipse at bottom right, rgba(255,255,255,0.15), rgba(255,255,255,0.02))",
                                                    filter: "blur(12px)",
                                                    opacity: 0.8,
                                                }}
                                            />

                                            {/* Sombra interior y borde */}
                                            <div
                                                className="absolute inset-0 rounded-full pointer-events-none"
                                                style={{
                                                    boxShadow: "inset 0 6px 16px rgba(255,255,255,0.05), 0 10px 25px rgba(2,6,23,0.1)",
                                                }}
                                            />

                                            {/* Overlay hover */}
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
                                        </div>

                                        {/* Etiqueta de categoría */}
                                        <span
                                            className="mt-3 sm:mt-4 md:mt-5 text-center font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-tight px-2"
                                            style={{ 
                                                fontSize: "clamp(0.75rem, 2vw, 1.25rem)",
                                                lineHeight: 1.2,
                                                maxWidth: "100%",
                                                wordWrap: "break-word"
                                            }}
                                        >
                                            {c.label}
                                        </span>

                                        {/* Indicador visual al hover */}
                                        <div className="w-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-600 group-hover:w-12 transition-all duration-300 mt-2 rounded-full" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contador de categorías */}
                        <div className="mt-6 text-center">
                            <p className="text-sm font-semibold text-gray-500">
                                <span className="text-blue-600 font-bold text-base">{categories.length}</span> categorías disponibles
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

