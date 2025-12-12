import { useState } from "react";

export default function CategoriasGrid() {
  const [categorias] = useState([
    {
      id: 1,
      titulo: "Mejora tu juego",
      items: [
        { nombre: "Mouse Gaming", imagen: "/assets/mouse1.png" },
        { nombre: "Accesorios", imagen: "/assets/mouse1.png" }
      ],
      enlace: "Compra lo último en gaming",
      color: "bg-purple-500"
    },
    {
      id: 2,
      titulo: "Ofertas en categorías top",
      items: [
        { nombre: "Sonido", imagen: "/assets/mouse1.png" },
        { nombre: "Tintas", imagen: "/assets/mouse1.png" }
      ],
      enlace: "Ver más",
      color: "bg-gray-100"
    },
    {
      id: 3,
      titulo: "Hallazgos fantásticos para el hogar",
      items: [
        { nombre: "Cocina", imagen: "/assets/mouse1.png" },
        { nombre: "Decoración del hogar", imagen: "/assets/mouse1.png" }
      ],
      enlace: "Más información",
      color: "bg-gray-50"
    },
    {
      id: 4,
      titulo: "Descubre estos productos de belleza para ti",
      items: [
        { nombre: "Cuidado de la piel", imagen: "/assets/mouse1.png" },
        { nombre: "Maquillaje", imagen: "/assets/mouse1.png" }
      ],
      enlace: "Explora todo en Belleza",
      color: "bg-gray-50"
    }
  ]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categorias.map((categoria, index) => (
          <div
            key={categoria.id}
            className={`${index === 0 ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-white'} border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
          >
            {/* Header */}
            <div className={`p-4 ${index === 0 ? 'text-white' : 'text-gray-900'}`}>
              <h3 className="text-sm font-semibold leading-tight">
                {categoria.titulo}
              </h3>
            </div>

            {/* Grid de productos 2x2 */}
            <div className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-2">
                {categoria.items.map((item, itemIndex) => (
                  <a
                    key={itemIndex}
                    href="#"
                    className="group block"
                  >
                    <div className={`${index === 0 ? 'bg-purple-400' : 'bg-gray-50'} rounded-lg p-3 hover:opacity-90 transition-opacity`}>
                      <div className="aspect-square flex items-center justify-center mb-2">
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-full h-full object-contain max-w-16 max-h-16"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500 hidden">
                          {item.nombre.charAt(0)}
                        </div>
                      </div>
                      <p className={`text-xs font-medium text-center ${index === 0 ? 'text-white' : 'text-gray-700'}`}>
                        {item.nombre}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Footer con enlace */}
            <div className="px-4 pb-4">
              <a
                href="#"
                className={`text-xs font-medium hover:underline ${
                  index === 0 ? 'text-white' : 'text-blue-600'
                }`}
              >
                {categoria.enlace}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}