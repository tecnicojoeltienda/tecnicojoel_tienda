import React from "react";
import { FiAlertCircle } from "react-icons/fi";

export default function NotAuthorized404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md text-center bg-white rounded-2xl p-8 shadow">
        <FiAlertCircle className="mx-auto w-12 h-12 text-red-600 mb-4" />
        <h1 className="text-2xl font-bold mb-4">NO TIENES ACCESO A ESTA PAGINA</h1>
      </div>
    </div>
  );
}