import React from "react";

export default function FiltersPanel({
  values = {},
  onChange = () => {},
  onReset = () => {},
  className = "",
  productCount = 0
}) {
  return (
    <div className={`space-y-6 ${className}`}> 
      <div className="bg-white rounded-lg shadow-sm p-6"> 
        <div className="flex items-center justify-between mb-4"> 
          <h3 className="text-sm font-semibold text-gray-900 tracking-wide leading-6">Filtros</h3>
          <span className="text-sm font-medium text-gray-600 ml-2">{productCount} productos</span>
        </div>

        
        <div className="mb-5">
          <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide leading-6">Vista</h4>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onChange("view", "grid")}
              className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sm text-left ${
                (values.view === "grid" || !values.view)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-800 hover:bg-gray-100"
              }`}
              title="Grilla"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
              </svg>
              <span>Grilla</span>
            </button>

            <button
              onClick={() => onChange("view", "list")}
              className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sm text-left ${
                values.view === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-800 hover:bg-gray-100"
              }`}
              title="Lista"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Lista</span>
            </button>

            <button
              onClick={() => onChange("view", "grid-large")}
              className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sm text-left ${
                values.view === "grid-large"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-800 hover:bg-gray-100"
              }`}
              title="Grande"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M3 12h18M3 19h18" />
              </svg>
              <span>Grande</span>
            </button>
          </div>
        </div>

        {/* Ordenamiento */}
        <div className="mb-5">
          <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Ordenar por</label>
          <select
            id="sort-select"
            value={values.sort || "relevance"}
            onChange={(e) => onChange("sort", e.target.value)}
            className="w-full rounded-md px-3 py-3 text-sm bg-white text-gray-800 border-0 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="relevance">Relevancia</option>
            <option value="name_asc">Nombre, A a Z</option>
            <option value="name_desc">Nombre, Z a A</option>
            <option value="price_asc">Precio: de menor a mayor</option>
            <option value="price_desc">Precio: de mayor a menor</option>
            <option value="sales_desc">Más vendidos</option>
          </select>
        </div>

        {/* Precio */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Precio</h4>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Min"
              value={values.min || ""}
              onChange={(e) => onChange("min", e.target.value)}
              className="w-1/2 px-3 py-3 rounded-md text-sm bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <input
              type="number"
              placeholder="Max"
              value={values.max || ""}
              onChange={(e) => onChange("max", e.target.value)}
              className="w-1/2 px-3 py-3 rounded-md text-sm bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => onChange("applyPrice", true)}
              className="px-4 py-3 text-sm rounded-md bg-gray-900 text-white hover:bg-yellow-600 transition"
            >
              Aplicar
            </button>
            <button
              onClick={onReset}
              className="px-4 py-3 text-sm rounded-md bg-transparent text-gray-700 hover:text-black"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}