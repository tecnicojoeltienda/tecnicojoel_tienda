import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSave, FiArrowLeft } from "react-icons/fi";

const API = import.meta.env.VITE_API_BASE_URL;

export default function CrearCategoriaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    nombre_categoria: "",
    descripcion: "",
  });
  const [touched, setTouched] = useState({});

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function onBlur(e) {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
  }

  const validate = () => {
    const errors = {};
    if (!form.nombre_categoria || form.nombre_categoria.trim().length < 2) {
      errors.nombre_categoria = "Ingrese un nombre (mín. 2 caracteres).";
    }
    return errors;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const errors = validate();
    setTouched({
      nombre_categoria: true,
      descripcion: true,
    });
    if (Object.keys(errors).length > 0) {
      setError("Por favor corrija los campos en rojo.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/apij/categorias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Error creando categoría");

      alert("Categoría creada correctamente");
      navigate("/inventario/categorias");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al crear categoría");
    } finally {
      setLoading(false);
    }
  }

  const errors = validate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 font-['Inter','system-ui',sans-serif]">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 sm:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Crear Nueva Categoría</h1>
                <p className="text-blue-100 text-sm sm:text-lg">Completa la información de la categoría</p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-all duration-300"
              >
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Volver</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-3 sm:p-4 text-sm sm:text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="nombre_categoria" className="block text-base sm:text-lg font-bold text-gray-800 mb-2">
                Nombre de la categoría <span className="text-red-600">*</span>
              </label>
              <input
                id="nombre_categoria"
                name="nombre_categoria"
                value={form.nombre_categoria}
                onChange={onChange}
                onBlur={onBlur}
                className={`w-full rounded-xl px-4 py-3 sm:py-4 text-base sm:text-lg border-2 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  touched.nombre_categoria && errors.nombre_categoria
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-200 focus:ring-blue-200 focus:border-blue-300"
                }`}
                required
                placeholder="Ej.: Laptops, Monitores, Accesorios"
              />
              {touched.nombre_categoria && errors.nombre_categoria && (
                <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.nombre_categoria}</p>
              )}
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-base sm:text-lg font-bold text-gray-800 mb-2">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={onChange}
                onBlur={onBlur}
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-4 text-base sm:text-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all duration-300"
                placeholder="Describe brevemente esta categoría..."
              />
              <p className="mt-2 text-xs sm:text-sm text-gray-600">
                💡 Opcional: Añade una breve descripción para identificar mejor la categoría.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 rounded-xl text-base sm:text-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Creando..."
                ) : (
                  <>
                    <FiSave className="w-4 h-4 sm:w-5 sm:h-5" />
                    Crear categoría
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}