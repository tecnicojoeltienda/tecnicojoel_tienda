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
    <section className="w-full py-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">Nuestros Servicios</h2>
          <p className="text-slate-500 font-medium mt-2">Soluciones completas para tus necesidades tecnológicas</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {SERVICES.map(({ id, title, text, Icon, color }) => {
            const bgHover = { blue: "hover:border-blue-200", green: "hover:border-green-200", purple: "hover:border-purple-200", orange: "hover:border-orange-200", teal: "hover:border-teal-200" }[color];
            const iconBg = { blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", purple: "bg-purple-50 text-purple-600", orange: "bg-orange-50 text-orange-600", teal: "bg-teal-50 text-teal-600" }[color];

            return (
              <div
                key={id}
                className={`bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 ${bgHover}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
// ...existing code...
