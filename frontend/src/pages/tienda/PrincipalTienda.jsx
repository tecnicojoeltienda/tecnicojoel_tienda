import { useEffect } from "react";
import HeaderTienda from "../../layouts/tienda/HeaderTienda";

import CarruselPrincipal from "../../components/tienda/CarruselPrincipal";
import Novedades from "../../components/tienda/Novedades";
//import CategoriasGrid from "../../components/tienda/CategoriasGrid";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import CategoriasCarrusel from "../../components/tienda/CategoriasCarrusel";
import PromoDoble from "../../components/tienda/PromoDoble";
import PromoMosaic from "../../components/tienda/PromoMosaic";
import ServiciosTienda from "../../components/tienda/ServiciosTienda";
import DobleCarrusel from "../../components/tienda/DobleCarrusel";
import CarruselPromocion from "../../components/tienda/CarruselPromocion";

function PrincipalTienda() {
  // IntersectionObserver to animate sections as they enter viewport
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".anim-section"));
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("enter");
            // optional: unobserve to avoid repeat
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el, i) => {
      // stagger delay per element; you can tweak multiplier
      el.style.setProperty("--delay", `${i * 0.08}s`);
      obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      <HeaderTienda />
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-16">
        {/* Each main block wrapped in .anim-section for entrance animation */}
        <section className="anim-section">
          <CarruselPrincipal />
        </section>

        <section className="anim-section">
          <CategoriasCarrusel />
        </section>

        <section className="anim-section">
          <CarruselPromocion />
        </section>

        <section className="anim-section">
          <PromoDoble />
        </section>

        <section className="anim-section">
          <Novedades />
        </section>

        <section className="anim-section">
          <PromoMosaic />
        </section>

        <section className="anim-section">
          <DobleCarrusel />
        </section>

        <section className="anim-section">
          <ServiciosTienda />
        </section>
      </main>
      <FooterTienda />

      {/* Local styles for animations — keep them here for a quick change */}
      <style jsx>{`
        .anim-section {
          opacity: 0;
          transform: translateY(18px) scale(0.995);
          transition-property: opacity, transform;
          transition-duration: 700ms;
          transition-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
          transition-delay: var(--delay, 0s);
          will-change: opacity, transform;
        }
        .anim-section.enter {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* subtle hover lift for interactive feel without breaking layout */
        .anim-section > * {
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .anim-section:hover > * {
          transform: translateY(-4px);
        }

        /* small accent: fade-in for hero images inside components */
        .anim-section img {
          transition: transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 600ms;
          opacity: 0.98;
        }

        /* tiny floating CTA feel for elements with .cta-float (if you add it later) */
        @keyframes float-y {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
        .cta-float {
          animation: float-y 4s ease-in-out infinite;
        }

        /* responsive tweak: reduce translate on small screens */
        @media (max-width: 640px) {
          .anim-section {
            transform: translateY(12px) scale(0.997);
          }
          .anim-section:hover > * {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

export default PrincipalTienda;
