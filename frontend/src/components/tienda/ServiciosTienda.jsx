// ...existing code...
import { FiCpu, FiTool, FiVideo, FiCode, FiPrinter } from "react-icons/fi";

const SERVICES = [
  {
    id: "venta",
    title: "Venta de computadoras",
    text: "Venta de equipos de escritorio y portátiles.",
    Icon: FiCpu,
    color: "blue",
  },
  {
    id: "reparacion",
    title: "Reparación de computadoras",
    text: "Servicio técnico, diagnóstico y reparación.",
    Icon: FiTool,
    color: "orange",
  },
  {
    id: "publicidad",
    title: "Publicidad gráfica y audiovisual",
    text: "Diseño, producción y edición de material publicitario.",
    Icon: FiVideo,
    color: "purple",
  },
  {
    id: "desarrollo",
    title: "Desarrollo de videojuegos, web y aplicativos",
    text: "Soluciones a medida: videojuegos, web y apps móviles.",
    Icon: FiCode,
    color: "green",
  },
  {
    id: "impresiones",
    title: "Impresiones",
    text: "Impresiones digitales, offset y gran formato.",
    Icon: FiPrinter,
    color: "teal",
  },
];

export default function ServiciosTienda() {
  return (
    <section className="w-full py-6">
      {/* reduce lateral padding so container stretches more */}
      <div className="w-full mx-0 px-2 sm:px-4 lg:px-6">
        {/* Gradient container (same as CarruselPromocion) with noticeable shadow, border-radius and font-family */}
        <div
          className="rounded-2xl overflow-hidden bg-gradient-to-r from-black via-gray-800 to-black/90 text-white py-6 px-4 sm:px-6"
          style={{
            boxShadow: "0 34px 90px rgba(2,6,23,0.28)", // shadow más notorio
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-4">Servicios que ofrecemos</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {SERVICES.map(({ id, title, text, Icon, color }) => {
              const bg = {
                blue: "bg-blue-50",
                green: "bg-green-50",
                purple: "bg-purple-50",
                orange: "bg-yellow-50",
                teal: "bg-teal-50",
              }[color] || "bg-gray-50";

              const iconColor = {
                blue: "text-blue-600",
                green: "text-green-600",
                purple: "text-purple-600",
                orange: "text-yellow-600",
                teal: "text-teal-600",
              }[color] || "text-gray-600";

              return (
                <div
                  key={id}
                  className="bg-white rounded-xl shadow-xl p-5 flex gap-4 items-start"
                  role="group"
                  aria-label={title}
                  style={{ minHeight: 96 }}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bg}`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
// ...existing code...
