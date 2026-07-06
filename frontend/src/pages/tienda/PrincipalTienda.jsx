import { useEffect } from "react";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";
import CarruselPrincipal from "../../components/tienda/CarruselPrincipal";
import Novedades from "../../components/tienda/Novedades";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import CategoriasCarrusel from "../../components/tienda/CategoriasCarrusel";
import PromoDoble from "../../components/tienda/PromoDoble";
import PromoMosaic from "../../components/tienda/PromoMosaic";
import ServiciosTienda from "../../components/tienda/ServiciosTienda";
import DobleCarrusel from "../../components/tienda/DobleCarrusel";
import CarruselPromocion from "../../components/tienda/CarruselPromocion";

export default function PrincipalTienda() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".anim-section"));
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("enter");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    els.forEach((el, i) => {
      el.style.setProperty("--delay", `${i * 0.1}s`);
      obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <HeaderTienda />
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col gap-12 lg:gap-20 py-8">
        <section className="anim-section"><CarruselPrincipal /></section>
        <section className="anim-section"><CategoriasCarrusel /></section>
        <section className="anim-section"><CarruselPromocion /></section>
        <section className="anim-section"><PromoDoble /></section>
        <section className="anim-section"><Novedades /></section>
        <section className="anim-section"><PromoMosaic /></section>
        <section className="anim-section"><DobleCarrusel /></section>
        <section className="anim-section"><ServiciosTienda /></section>
      </main>
      <FooterTienda />

      <style jsx>{`
        .anim-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--delay, 0s);
          will-change: opacity, transform;
        }
        .anim-section.enter {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}